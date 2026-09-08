(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const data = window.T2GOV_OPENCC_DATA;

  const els = {
    input: $("#inputText"),
    output: $("#outputText"),
    inputCount: $("#inputCount"),
    outputCount: $("#outputCount"),
    convertButton: $("#convertButton"),
    sampleButton: $("#sampleButton"),
    clearButton: $("#clearButton"),
    copyButton: $("#copyButton"),
    downloadButton: $("#downloadButton"),
    fileInput: $("#fileInput"),
    languageSelect: $("#languageSelect"),
  };

  const sample = "落霞与孤鹜齐飞，秋水共长天一色。渔舟唱晚，响穷彭蠡之滨；雁阵惊寒，声断衡阳之浦。";
  const localeStorageKey = "mainland-standard-traditional-converter-locale";
  const messages = {
    zh: {
      title: "中国内地标准繁体转换器",
      subtitle: "将混杂不同标准的简体/繁体/异体字形转换为符合中国内地《通用规范汉字表》（2013）规范的繁体字形。",
      languageLabel: "语言",
      autoLanguage: "自动",
      zhLanguage: "中文",
      enLanguage: "English",
      inputTitle: "输入",
      outputTitle: "输出",
      inputPlaceholder: "输入或粘贴需要转换的文本",
      convertButton: "转换",
      sampleButton: "展示示例",
      importButton: "导入文件",
      clearButton: "清空",
      copyButton: "复制输出",
      downloadButton: "下载输出",
      characterCount: (count) => `${count} 字符`,
      matchCount: (count) => `${count} 处命中`,
      dictionaryLoadFailed: "字表加载失败。",
      clipboardUnavailable: "当前浏览器未开放剪贴板权限。",
    },
    en: {
      title: "Chinese Mainland Standard Traditional Converter",
      subtitle: "Convert mixed Simplified, Traditional, and variant Chinese character forms into Traditional forms that conform to China's General Standard Chinese Characters Table (2013).",
      languageLabel: "Language",
      autoLanguage: "Auto",
      zhLanguage: "中文",
      enLanguage: "English",
      inputTitle: "Input",
      outputTitle: "Output",
      inputPlaceholder: "Enter or paste Chinese text to convert",
      convertButton: "Convert",
      sampleButton: "Show Example",
      importButton: "Import File",
      clearButton: "Clear",
      copyButton: "Copy Output",
      downloadButton: "Download Output",
      characterCount: (count) => `${count} ${count === 1 ? "character" : "characters"}`,
      matchCount: (count) => `${count} ${count === 1 ? "match" : "matches"}`,
      dictionaryLoadFailed: "Dictionary data failed to load.",
      clipboardUnavailable: "Clipboard permission is unavailable in this browser.",
    },
  };
  let localePreference = getSavedLocalePreference();
  let locale = resolveLocale(localePreference);
  let text = messages[locale];

  let lastOutput = "";
  let converter = null;
  let lastHitCount = 0;

  function getSavedLocalePreference() {
    try {
      const saved = window.localStorage.getItem(localeStorageKey);
      return ["auto", "zh", "en"].includes(saved) ? saved : "auto";
    } catch (error) {
      return "auto";
    }
  }

  function saveLocalePreference(value) {
    localePreference = ["auto", "zh", "en"].includes(value) ? value : "auto";
    try {
      if (localePreference === "auto") {
        window.localStorage.removeItem(localeStorageKey);
      } else {
        window.localStorage.setItem(localeStorageKey, localePreference);
      }
    } catch (error) {
      // Some browser privacy modes disable localStorage; the selector still works for this session.
    }
  }

  function detectLocale() {
    const browserLanguages = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language,
      navigator.userLanguage,
    ].filter(Boolean);

    return browserLanguages.some((language) => /^zh(?:[-_]|$)/i.test(language))
      ? "zh"
      : "en";
  }

  function resolveLocale(preference) {
    return preference === "zh" || preference === "en" ? preference : detectLocale();
  }

  function localizeUI() {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title = text.title;

    for (const element of document.querySelectorAll("[data-i18n]")) {
      const key = element.dataset.i18n;
      if (text[key]) element.textContent = text[key];
    }

    for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
      const key = element.dataset.i18nPlaceholder;
      if (text[key]) element.setAttribute("placeholder", text[key]);
    }

    if (els.languageSelect) {
      els.languageSelect.value = localePreference;
      els.languageSelect.setAttribute("aria-label", text.languageLabel);
      for (const option of els.languageSelect.options) {
        const key = `${option.value}Language`;
        if (text[key]) option.textContent = text[key];
      }
    }
  }

  function changeLocale(value) {
    saveLocalePreference(value);
    locale = resolveLocale(localePreference);
    text = messages[locale];
    localizeUI();

    if (!data || !data.dictionaries) {
      els.output.textContent = text.dictionaryLoadFailed;
      updateCounts();
      els.outputCount.textContent = text.matchCount(0);
      return;
    }

    runConvert();
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseEntries(entries) {
    const map = new Map();
    for (const [source, target] of entries) {
      if (!map.has(source)) map.set(source, target);
    }
    return map;
  }

  function makeConverter() {
    const dicts = data.dictionaries;
    return {
      compatibility: parseEntries(dicts.compatibility),
      stages: [
        {
          name: "s2t",
          tries: [
            buildTrie(dicts.s2tPhrases),
            buildTrie(dicts.s2tCharacters),
          ],
        },
        {
          name: "t2gov",
          tries: [
            buildTrie(dicts.t2govPhrases),
            buildTrie(dicts.t2govCharacters),
          ],
        },
      ],
      stats: {
        compatibility: dicts.compatibility.length,
        s2tPhrases: dicts.s2tPhrases.length,
        s2tCharacters: dicts.s2tCharacters.length,
        t2govPhrases: dicts.t2govPhrases.length,
        t2govCharacters: dicts.t2govCharacters.length,
      },
    };
  }

  function buildTrie(entries) {
    const root = { next: new Map(), value: null };
    for (const [source, target] of entries) {
      if (!source) continue;
      const chars = Array.from(source);
      let node = root;
      for (const char of chars) {
        let child = node.next.get(char);
        if (!child) {
          child = { next: new Map(), value: null };
          node.next.set(char, child);
        }
        node = child;
      }
      if (!node.value) node.value = { source, target, length: chars.length };
    }
    return root;
  }

  function findLongest(trie, chars, start) {
    let node = trie;
    let best = null;
    for (let index = start; index < chars.length; index += 1) {
      node = node.next.get(chars[index]);
      if (!node) break;
      if (node.value) best = node.value;
    }
    return best;
  }

  function makeTokens(input) {
    return Array.from(input, (char) => ({ text: char, changed: false }));
  }

  function normalizeCompatibility(tokens) {
    const output = [];
    let hits = 0;

    for (const token of tokens) {
      const target = converter.compatibility.get(token.text);
      if (target && target !== token.text) {
        hits += 1;
        for (const char of Array.from(target)) {
          output.push({ text: char, changed: true });
        }
      } else {
        output.push(token);
      }
    }

    return { tokens: output, hits };
  }

  function applyDictionaryStage(tokens, tries) {
    const chars = tokens.map((token) => token.text);
    const output = [];
    let hits = 0;
    let index = 0;

    while (index < chars.length) {
      let match = null;
      for (const trie of tries) {
        match = findLongest(trie, chars, index);
        if (match) break;
      }

      if (!match) {
        output.push(tokens[index]);
        index += 1;
        continue;
      }

      const sourceTokens = tokens.slice(index, index + match.length);
      const source = chars.slice(index, index + match.length).join("");
      const targetChanged = match.target !== source;
      const changed = targetChanged || sourceTokens.some((token) => token.changed);
      if (targetChanged) hits += 1;

      for (const char of Array.from(match.target)) {
        output.push({ text: char, changed });
      }
      index += match.length;
    }

    return { tokens: output, hits };
  }

  function applyStage(tokens, stage) {
    const normalized = normalizeCompatibility(tokens);
    const converted = applyDictionaryStage(normalized.tokens, stage.tries);
    return {
      tokens: converted.tokens,
      hits: normalized.hits + converted.hits,
    };
  }

  function mergeParts(tokens) {
    const parts = [];
    for (const token of tokens) {
      const last = parts[parts.length - 1];
      if (last && last.changed === token.changed) {
        last.text += token.text;
      } else {
        parts.push({ text: token.text, changed: token.changed });
      }
    }
    return parts;
  }

  function convertText(input) {
    let tokens = makeTokens(input);
    let hits = 0;

    for (const stage of converter.stages) {
      const result = applyStage(tokens, stage);
      tokens = result.tokens;
      hits += result.hits;
    }

    return {
      output: tokens.map((token) => token.text).join(""),
      parts: mergeParts(tokens),
      hits,
    };
  }

  function renderOutput(parts) {
    if (!parts.length) {
      els.output.textContent = "";
      return;
    }
    els.output.innerHTML = parts.map((part) => {
      const text = escapeHtml(part.text);
      return part.changed ? `<mark>${text}</mark>` : text;
    }).join("");
  }

  function updateCounts() {
    els.inputCount.textContent = text.characterCount(Array.from(els.input.value).length);
  }

  function runConvert() {
    const input = els.input.value;
    updateCounts();
    if (!input) {
      lastOutput = "";
      lastHitCount = 0;
      renderOutput([]);
      els.outputCount.textContent = text.matchCount(0);
      return;
    }

    const result = convertText(input);
    lastOutput = result.output;
    lastHitCount = result.hits;
    renderOutput(result.parts);
    els.outputCount.textContent = text.matchCount(result.hits);
  }

  async function copyOutput() {
    if (!lastOutput) return;
    try {
      await navigator.clipboard.writeText(lastOutput);
    } catch (error) {
      window.alert(text.clipboardUnavailable);
    }
  }

  function downloadOutput() {
    if (!lastOutput) return;
    const blob = new Blob([lastOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "standard-traditional-converted.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function loadSample() {
    els.input.value = sample;
    runConvert();
    els.input.focus();
  }

  function clearAll() {
    els.input.value = "";
    lastOutput = "";
    lastHitCount = 0;
    renderOutput([]);
    updateCounts();
    els.outputCount.textContent = text.matchCount(0);
    els.input.focus();
  }

  function importTextFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      els.input.value = String(reader.result || "");
      runConvert();
    };
    reader.readAsText(file, "utf-8");
  }

  function init() {
    localizeUI();
    els.languageSelect.addEventListener("change", () => changeLocale(els.languageSelect.value));

    if (!data || !data.dictionaries) {
      els.output.textContent = text.dictionaryLoadFailed;
      return;
    }

    converter = makeConverter();

    els.input.addEventListener("input", runConvert);
    els.input.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") runConvert();
    });
    els.convertButton.addEventListener("click", runConvert);
    els.sampleButton.addEventListener("click", loadSample);
    els.clearButton.addEventListener("click", clearAll);
    els.copyButton.addEventListener("click", copyOutput);
    els.downloadButton.addEventListener("click", downloadOutput);
    els.fileInput.addEventListener("change", () => importTextFile(els.fileInput.files[0]));

    loadSample();
  }

  init();
})();

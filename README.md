<p align="right">
  <strong>Multi-language:</strong>
  English | <a href="./README.zh-CN.md">简体中文</a>
</p>

# Chinese Mainland Standard Traditional Converter

A fully offline browser-based converter for Chinese Mainland standard Traditional character forms.

It converts mixed Simplified Chinese, Traditional Chinese, and variant character forms into Traditional forms that conform to China's General Standard Chinese Characters Table (2013). The app runs entirely in the browser and does not upload text to any server.

![Preview](./assets/preview.png)

## Features

- Converts mixed Simplified, Traditional, and variant Chinese text into Chinese Mainland standard Traditional forms.
- Uses an OpenCC-style deterministic pipeline: phrase dictionaries first, character dictionaries as fallback.
- Runs fully offline after download.
- Requires no server, account, CDN, build step, or package installation.
- Automatically switches the UI language: Chinese for any `zh` browser locale, English for all other locales.
- Supports text file import, output copy, and output download.

## Use Online

After GitHub Pages is enabled, the online version will be available at:

```text
https://fionviber.github.io/XiaoHammerChineseConverter/
```

## Use Offline

Download the release ZIP, extract it, and open `index.html` in a browser.

The app references only local files:

```text
index.html
app.js
vendor/t2gov-data.js
```

## Conversion Pipeline

The converter is implemented in plain JavaScript and follows the structure of the upstream OpenCC configuration:

```text
CJK Compatibility Ideographs normalization
-> s2t: STPhrases.txt first, STCharacters.txt fallback
-> CJK Compatibility Ideographs normalization
-> t2gov: TGPhrases.txt first, TGCharacters.txt fallback
```

The bundled data is generated into `vendor/t2gov-data.js` so the browser can run everything locally.

## Data Source

Dictionary data is derived from:

```text
TerryTian-tech/OpenCC-Traditional-Chinese-characters-according-to-Chinese-government-standards
```

Repository:

https://github.com/TerryTian-tech/OpenCC-Traditional-Chinese-characters-according-to-Chinese-government-standards

The upstream dictionaries are licensed under Apache License 2.0. See `THIRD_PARTY_NOTICES.md` and the license copy in `licenses/`.

## Disclaimer

This project is provided "as is", without warranty of any kind. Character conversion can involve ambiguous linguistic choices, so important publication, legal, archival, or academic use should still be reviewed manually.

## License

This project's original code and documentation are licensed under the Zero-Clause BSD License (`0BSD`).

Bundled third-party dictionary data remains under its original Apache-2.0 license.

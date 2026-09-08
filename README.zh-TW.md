<p align="right">
  <strong>多語言：</strong>
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a> | 繁體中文
</p>

# 中國內地標準繁體轉換器

一個純前端、純離線的中國內地標準繁體字形轉換工具。

它可以將混雜不同標準的簡體、繁體、異體字形轉換為符合中國內地《通用規範漢字表》（2013）規範的繁體字形。工具完全在瀏覽器本地運行，不會上傳文字到伺服器。

![繁體中文介面截圖](./assets/screenshot-zh-TW.png)

## 功能

- 將簡體、繁體、異體字形混雜文字轉換為中國內地標準繁體。
- 採用 OpenCC 風格的確定性轉換邏輯：短語詞典優先，單字詞典兜底。
- 下載後可純離線使用。
- 不需要伺服器、帳號、CDN、構建步驟或依賴安裝。
- 支援自動、简体中文、繁體中文、English 介面模式。
- 支援匯入文字檔案、複製輸出、下載輸出。

## 線上使用

線上版本發布在：

```text
https://fionviber.github.io/XiaoHammerChineseConverter/
```

## 離線使用

下載 Release ZIP，解壓後用瀏覽器打開 `index.html` 即可。

工具只引用本地檔案：

```text
index.html
app.js
vendor/t2gov-data.js
```

## 轉換流程

轉換器用原生 JavaScript 實現，並遵循上游 OpenCC 配置結構：

```text
CJK 相容漢字歸一化
-> s2t：STPhrases.txt 優先，STCharacters.txt 兜底
-> CJK 相容漢字歸一化
-> t2gov：TGPhrases.txt 優先，TGCharacters.txt 兜底
```

字表資料已經打包到 `vendor/t2gov-data.js`，瀏覽器可以直接本地運行。

## 資料來源

字表資料來自：

```text
TerryTian-tech/OpenCC-Traditional-Chinese-characters-according-to-Chinese-government-standards
```

倉庫：

https://github.com/TerryTian-tech/OpenCC-Traditional-Chinese-characters-according-to-Chinese-government-standards

上游字表使用 Apache License 2.0。詳見 `THIRD_PARTY_NOTICES.md` 和 `licenses/` 中的授權副本。

## 免責聲明

本專案按「現狀」提供，不作任何形式的保證。繁簡/異體字形轉換可能涉及歧義；用於出版、法律、檔案、學術等重要場景時，仍建議人工校對。

## 授權條款

本專案原創程式碼和文件使用 Zero-Clause BSD License（`0BSD`）。

內置的第三方字表資料繼續遵循其原始 Apache-2.0 授權。

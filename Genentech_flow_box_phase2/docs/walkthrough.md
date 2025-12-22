# Due Date 變更歷史追蹤功能 - 實作完成 (v7.0)

## 功能概述

實作**方案 B：完整變更歷史 JSON 記錄**，當任務的完成日被調整時，系統會自動記錄變更時間、新日期與變更原因，並於甘特圖上以半透明淺色區塊顯示原始規劃時程。

---

## 變更檔案

### 1. [GoogleAppsScripts.gs](file:///d:/code/cytesi/project_tracking_HTML_githgb/Genentech_flow_box_phase2/GoogleAppsScripts.gs)

**後端邏輯修改：**
- 新增 `dateHistory` 欄位處理
- 當 `date` 與最後記錄不同時，自動追加變更記錄
- 支援 `dateChangeReason` 參數儲存變更原因

render_diffs(file:///d:/code/cytesi/project_tracking_HTML_githgb/Genentech_flow_box_phase2/GoogleAppsScripts.gs)

---

### 2. [index.html](file:///d:/code/cytesi/project_tracking_HTML_githgb/Genentech_flow_box_phase2/index.html)

**前端變更：**

| 區塊 | 變更內容 |
|------|---------|
| 資料載入 | 初始化 `dateHistory` 陣列，現有任務自動建立首筆記錄 |
| `handleSave` | 偵測日期變更，追加歷史記錄 |
| 表單 UI | 新增「日期變更原因」輸入欄位與歷史顯示 |
| 甘特圖 | 顯示原始時程（半透明灰色虛線邊框）與延期天數標籤 |
| 版本號 | 更新至 v7.0 |

render_diffs(file:///d:/code/cytesi/project_tracking_HTML_githgb/Genentech_flow_box_phase2/index.html)

---

## 新功能展示

### 📋 表單：日期變更原因輸入

編輯任務時，若完成日有調整，可填寫變更原因（如「等待零件」、「人力調度」）。

### 📊 表單：變更歷史顯示

表單底部顯示完整的日期變更歷史，包含版本號、日期與變更原因。

### 📈 甘特圖：視覺化呈現

- **半透明灰色區塊** (虛線邊框)：原始規劃時程
- **實色區塊**：目前時程
- **紅底標籤**：顯示延期天數 「+N天」

---

## 後續步驟

### Google Sheets 設定

請在 Google Sheets 新增以下欄位（標題列）：

| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| `dateHistory` | 文字 | 儲存 JSON 格式的變更歷史 |

### 部署 Google Apps Script

1. 開啟 Apps Script 編輯器
2. 將 `GoogleAppsScripts.gs` 的內容貼上覆蓋
3. 點擊「部署」→「新增部署」
4. 選擇「網頁應用程式」，存取權限設為「所有人」
5. 複製新的 Web App URL 並更新 `index.html` 中的 `API_URL`

### 測試驗證

1. **新增任務**：確認 `dateHistory` 自動建立首筆記錄
2. **修改完成日**：確認歷史記錄新增
3. **甘特圖**：確認原始時程區塊與延期標籤顯示正確

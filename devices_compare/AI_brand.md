# **機台規格與風險分析看板 \- 開發指引 (AI Brand Guidelines)**

## **1\. 專案概述 (Project Overview)**

本專案是一個 **單一檔案 (Single-File)** 的網頁應用程式，旨在將複雜、高密度的機台規格 Excel 表格，轉化為視覺化的「風險熱圖」與「差異比對」儀表板。

* **核心價值**：將「文字資料」轉化為「決策訊號」。  
* **目標用戶**：機台研發工程師、PM、管理層。  
* **核心功能**：  
  1. **Excel 匯入**：支援動態欄位解析。  
  2. **風險熱圖**：自動關鍵字判讀，標示紅/黃/綠燈。  
  3. **差異比對**：雙機台 PK，自動高亮顯示差異規格。

## **2\. 技術架構與限制 (Technical Architecture)**

為了確保檔案極易分享與使用（無需環境設定），本專案有嚴格的技術限制：

* **格式**：**Standalone HTML File** (單一 .html 檔)。  
* **依賴管理**：必須透過 CDN 引入，**禁止使用 npm/yarn 或建置工具**。  
* **核心庫**：  
  * React 18 (via UMD CDN)  
  * Tailwind CSS (via Script CDN)  
  * Babel Standalone (用於瀏覽器內編譯 JSX)  
  * SheetJS (xlsx) (用於前端解析 Excel)  
* **圖標庫**：使用 **Inline SVG** (如 Lucide icons 的 SVG path)，不引入外部 Font Icon 以減少請求與破圖風險。

## **3\. 資料處理邏輯 (Data Logic)**

### **3.1 Excel 解析規則**

原始 Excel 通常為「矩陣式」且可能包含多餘的 Header。

* **轉置邏輯**：程式預設 Excel 的 **第一欄 (Column A)** 為「規格項目 (Header)」，**後續欄位 (Column B\~N)** 為各台機台的數值。  
* **動態欄位**：不寫死欄位名稱（如「光學」、「熱模組」），而是動態讀取 Excel 第一欄的所有值作為 Key。  
* **型別安全**：Excel 讀入的數值可能是 number，在處理 split 或 includes 前務必強制轉型 String(value)。

### **3.2 風險判讀引擎 (analyzeRisk)**

這這是本專案的靈魂，透過關鍵字匹配來決定顏色。

| 等級 | 顏色代碼 (Tailwind) | 觸發關鍵字 (Keywords) |
| :---- | :---- | :---- |
| **Critical (高風險)** | red-50 / red-700 | 不均勻, 嚴重, 手動微調, 對位不易, 失效, high risk |
| **Warning (需注意)** | yellow-50 / yellow-700 | 殘留, 影響, 暗角, 需注意, warning |
| **Stable (穩定)** | green-50 / green-700 | 無(無殘留/無異常), 均勻, 自動, 標準, 優化, pass |
| **Info (一般)** | slate-50 / slate-600 | (無上述關鍵字時) |

## **4\. UI/UX 設計規範 (Design System)**

### **4.1 視覺原則**

* **清爽降噪**：原始 Excel 文字量大，UI 必須大量留白。  
* **顏色語意**：紅/黃/綠僅用於表達風險狀態，其餘結構線條使用 slate-200 等中性色。

### **4.2 關鍵元件：RiskCard (風險卡片)**

* **原子化顯示**：不可將一整段文字直接渲染。  
* **分割邏輯**：必須依據 \\n (換行) 或 1., 2\. (編號) 將長文切分為獨立的 div。  
* **獨立判讀**：切分後的每一行文字，需**獨立**重新跑一次 analyzeRisk。  
  * *目的*：同一格內可能第一點是「光照不均(紅燈)」，第二點是「機構正常(綠燈)」，需分開顯示。

### **4.3 檢視模式 (View Modes)**

為了避免資訊過載，提供兩種模式：

1. **Summary Mode (精簡重點)**：  
   * 邏輯：只顯示標題包含 \['熱', '光', '殘留', '清潔', 'Risk', '問題'\] 的欄位。  
   * 預設：開啟此模式。  
2. **Full Mode (完整規格)**：  
   * 邏輯：顯示 Excel 解析出的所有欄位。

## **5\. 版本演進與決策紀錄 (History & Decisions)**

* **V1 \-\> V2 的教訓**：  
  * V1 硬寫死欄位，導致新機台有「流道模組」時無法顯示。  
  * V2 改為全動態顯示，但畫面太亂，像直接看 Excel。  
* **V3 (Current) 的解決方案**：  
  * 採用 **"Hybrid View"**：底層是全動態抓取 (V2)，但表層預設只顯示重點欄位 (Summary Mode)，並加回 V1 備受好評的 Diff 功能。  
  * **Diff 優化**：比對時，若兩邊文字不相等，直接在該卡片背景上色 (bg-yellow-50) 並標示 DIFFERENT。

## **6\. 未來開發建議 (Future Roadmap)**

若協作 AI 接手開發，建議優先考慮以下方向，但**務必保持單一檔案特性**：

1. **匯出功能**：利用 html2canvas 或 jspdf (需 CDN 引入) 將目前的分析結果截圖匯出為 PDF 報告。  
2. **趨勢圖表**：若 Excel 包含數值型資料（如良率、殘留量數據），可引入 Recharts 或 Chart.js 繪製趨勢圖。  
3. **AI 摘要 (進階)**：若能串接 LLM API，可增加「一鍵生成機台比較總結」的功能（需考量 API Key 安全性，建議採 Bring Your Own Key 模式）。

**給協作 AI 的提示 (Prompt for Collaboration):**

"請基於 ai\_brand.md 中的 V3 架構進行修改。請注意保持 RiskCard 的獨立渲染邏輯，並確保所有新增的依賴都來自 CDN，不要破壞單一 HTML 檔案的完整性。"
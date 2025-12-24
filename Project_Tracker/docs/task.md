# 方案A: 單檔模組化重構任務清單

## 階段 1: 專案結構建立
- [x] 建立 src/ 目錄
- [x] 建立 build/ 目錄
- [x] 建立 scripts/ 目錄
- [x] 複製現有檔案到 src/

## 階段 2: 構建腳本開發
- [x] 建立 build.js 腳本 (已加入 script inlining)
- [x] 建立 package.json
- [x] 測試構建流程 (已驗證單檔部署大小與路徑解析)
- [x] 檔案結構重整 (將 js/ 移動至 src/js/)

## 階段 3: 代碼拆分遷移
- [x] 拆分 App.jsx (已提取 useTaskData 與 useFilters)
- [x] 建立 hooks/useAuth.js
- [x] 建立 hooks/useTaskData.js
- [x] 建立 hooks/useFilters.js
- [ ] 建立 contexts/AppContext.jsx (可選：降低 Prop Drilling)

## 階段 4: 測試與驗證
- [x] 構建產物測試 (build/index.html 正常執行)
- [x] 功能驗證 (使用者確認 OK)
- [x] 與原版本對比 (總量持平，單檔因內聯而變大)

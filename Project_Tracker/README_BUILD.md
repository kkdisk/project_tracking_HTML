# Project Tracker - 模組化構建系統

## 📁 目錄結構

```
Project_Tracker/
├── src/                    # 開發原始碼（模組化）
│   ├── index.template.html # HTML 模板
│   ├── App.jsx            # 主應用組件
│   ├── hooks/             # 自定義 Hooks
│   │   ├── useAuth.js
│   │   ├── useTaskData.js
│   │   └── useFilters.js
│   ├── contexts/          # React Contexts
│   │   └── AppContext.jsx
│   └── (其他模組...)
│
├── build/                 # 構建產物
│   └── index.html        # 合併後的單一 HTML
│
├── scripts/              # 構建腳本
│   └── build.js
│
├── js/                   # 現有組件（保持不變）
│   ├── components/
│   ├── utils/
│   └── config.js
│
└── package.json
```

## 🚀 快速開始

### 1. 構建專案

```bash
# 單次構建
npm run build

# Watch 模式（自動重建）
npm run watch
```

### 2. 開發模式

```bash
# 啟動本地伺服器
npm run dev

# 在另一個終端啟動 watch
npm run watch
```

訪問: `http://localhost:8000/build/index.html`

## 📝 開發流程

### 新增模組

1. 在 `src/hooks/` 或 `src/contexts/` 建立新檔案
2. 在 `scripts/build.js` 的 `CONFIG.modules` 中註冊
3. 執行 `npm run build`

### 修改現有代碼

1. 編輯 `src/` 目錄中的檔案
2. 如果啟用了 watch 模式，會自動重建
3. 刷新瀏覽器查看變更

## 🎯 構建原理

1. **模板系統**: `index.template.html` 包含佔位符
2. **模組注入**: 構建腳本讀取各模組並注入到模板
3. **單檔輸出**: 產生單一 `build/index.html`

### 模板佔位符

```html
<!-- INJECT_HOOKS -->     → 注入自定義 Hooks
<!-- INJECT_CONTEXTS -->  → 注入 React Contexts  
<!-- INJECT_APP -->       → 注入 App 組件
```

## 📦 部署

### Apps Script 部署

```bash
# 1. 構建生產版本
npm run build

# 2. 上傳 build/index.html 到 Apps Script
# 3. 部署為 Web App
```

### 靜態託管

```bash
# build/index.html 可直接部署到:
# - GitHub Pages
# - Netlify
# - Vercel
# - Google Drive (靜態檔案)
```

## ⚙️ 配置

編輯 `scripts/build.js` 中的 `CONFIG`:

```javascript
const CONFIG = {
  srcDir: 'src',
  buildDir: 'build',
  modules: {
    hooks: ['hooks/useAuth.js', ...],
    contexts: ['contexts/AppContext.jsx'],
    app: 'App.jsx'
  }
};
```

## 🔄 遷移指南

### 從 index.html 遷移到模組化

1. **提取 Hooks**: 將 `useState` 邏輯移到 `src/hooks/`
2. **提取 Context**: 將共享狀態移到 `src/contexts/`
3. **簡化 App**: `App.jsx` 只負責組合組件
4. **測試**: 確保構建產物功能正常

## 🐛 故障排除

### 構建失敗

```bash
# 檢查 Node.js 版本
node --version  # 需要 >= 14.0.0

# 清理並重建
rm -rf build
npm run build
```

### 檔案找不到

確認檔案路徑與 `CONFIG.modules` 中的設定一致

## 📊 效能優化

- ✅ 減少 index.html 大小 (模組化分離)
- ✅ 開發時程式碼清晰
- ✅ 保持單檔部署優勢
- ✅ 支援程式碼重用

## 🎓 最佳實踐

1. **一個檔案一個責任**: 每個 hook 只處理一個功能
2. **命名清晰**: `useXxx` for hooks, `XxxContext` for contexts
3. **註解完整**: 模組頂部說明用途
4. **測試後提交**: 確保構建產物正常運作

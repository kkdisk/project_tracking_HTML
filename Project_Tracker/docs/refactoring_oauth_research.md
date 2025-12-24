# 代碼重構與 OAuth CORS 技術研究報告

**研究日期**: 2025-12-16  
**當前版本**: v6.8  
**研究目標**: 
1. 分析代碼重構方案
2. 解決 OAuth CORS 問題

---

## 📊 一、代碼重構方案研究

### 1.1 當前問題分析

#### index.html 複雜度量化

| 指標 | 數值 | 評估 |
|------|------|------|
| 總行數 | 1,764 行 | 🔴 過大 |
| 檔案大小 | 101 KB | 🔴 過大 |
| 內嵌 JavaScript | ~1,300 行 | 🔴 過多 |
| React 組件 | 5+ 個 | 🟡 中等 |
| State 變數 | 20+ 個 | 🔴 過多 |
| 外部組件 | 7 個 JS 檔案 | 🟢 良好 |

#### 主要問題

1. **維護困難** 🔴
   - App 組件過於龐大 (~600行)
   - 狀態管理分散
   - 難以定位特定功能

2. **開發效率低** 🟡
   - 修改需要捲動大量代碼
   - 缺少模組邊界
   - Hot reload 不可用

3. **測試困難** 🔴
   - 無法單獨測試組件
   - 狀態耦合嚴重
   - 難以 mock 依賴

4. **協作困難** 🟡
   - 多人編輯衝突風險高
   - Code review 困難
   - Git diff 難以閱讀

---

### 1.2 重構方案對比

#### 方案 A: 單檔部署 + 組件模組化 ⭐⭐⭐⭐⭐

**概念**: 保持 Apps Script 的單檔部署優勢，但在開發時使用模組化結構

**技術棧**:
```
開發環境: 分離的 JSX/JS 檔案
構建工具: 簡單的 concat 腳本或 esbuild
部署產物: 單個 index.html
```

**檔案結構**:
```
src/
├── index.html (template)
├── App.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useTaskData.js
│   ├── useFilters.js
│   └── useExcelUpload.js
├── contexts/
│   └── AppContext.jsx
├── components/ (現有)
│   ├── Dashboard.js
│   ├── GanttView.js
│   └── SettingsView.js
├── utils/ (現有)
│   ├── helpers.js
│   └── icons.js
└── config.js

build/
└── index.html (合併後的單檔)

scripts/
└── build.js (合併腳本)
```

**構建腳本範例** (build.js):
```javascript
const fs = require('fs');
const path = require('path');

// 讀取 template
const template = fs.readFileSync('src/index.html', 'utf-8');

// 讀取所有 JS 檔案
const appJs = fs.readFileSync('src/App.jsx', 'utf-8');
const hooks = [
  'useAuth.js',
  'useTaskData.js',
  'useFilters.js'
].map(f => fs.readFileSync(`src/hooks/${f}`, 'utf-8')).join('\n');

// 合併
const output = template
  .replace('<!-- INJECT_HOOKS -->', `<script type="text/babel">${hooks}</script>`)
  .replace('<!-- INJECT_APP -->', `<script type="text/babel">${appJs}</script>`);

// 輸出
fs.writeFileSync('build/index.html', output);
console.log('✅ Build complete!');
```

**優點**:
- ✅ 保持 Apps Script 部署簡單性
- ✅ 開發時模組化清晰
- ✅ 無需複雜構建工具
- ✅ 學習成本低
- ✅ 快速實施 (1-2天)

**缺點**:
- ⚠️ 需要手動執行構建
- ⚠️ 仍依賴 Babel Standalone (運行時編譯)

**工作量**: 2-3 天
**推薦指數**: ⭐⭐⭐⭐⭐

---

#### 方案 B: Vite + React 完整構建 ⭐⭐⭐⭐

**概念**: 使用現代化構建工具，預編譯所有代碼

**技術棧**:
```
構建工具: Vite
框架: React 18
狀態管理: Zustand 或 Context API
CSS: Tailwind CSS (PostCSS)
部署: 產生靜態 HTML + JS bundle
```

**專案結構**:
```
project-tracker/
├── index.html (Vite template)
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   ├── hooks/
│   ├── store/
│   ├── utils/
│   └── styles/
└── dist/ (構建產物)
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
```

**vite.config.js**:
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // 可選: 內聯所有資源到單個 HTML
        inlineDynamicImports: true,
      }
    }
  }
});
```

**Apps Script 部署**:
```
選項 1: 上傳 dist/ 目錄到 Google Drive
選項 2: 使用 clasp 部署為 Web App
選項 3: 手動內聯 bundle 到單個 HTML
```

**優點**:
- ✅ 完整的現代化開發體驗
- ✅ Hot Module Replacement (HMR)
- ✅ 預編譯，運行時性能更好
- ✅ Tree shaking (減小包體積)
- ✅ TypeScript 支援
- ✅ 成熟的生態系統

**缺點**:
- ⚠️ Apps Script 部署複雜化
- ⚠️ 需要額外的構建步驟
- ⚠️ 團隊成員需要學習 Vite
- ⚠️ 可能需要調整 CORS 設定

**工作量**: 5-7 天
**推薦指數**: ⭐⭐⭐⭐

---

#### 方案 C: 漸進式重構 (推薦作為起點) ⭐⭐⭐⭐⭐

**概念**: 逐步優化，不做大規模架構變更

**階段 1: 狀態管理重構 (1天)**
```javascript
// 建立 AppContext.jsx
const AppContext = React.createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// 在 App 組件中使用
const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};
```

**階段 2: 自定義 Hooks 提取 (1-2天)**
```javascript
// hooks/useAuth.js
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  
  const handleLogin = (apiKey) => {
    // login logic
  };
  
  const handleLogout = () => {
    // logout logic
  };
  
  return { isAuthenticated, userApiKey, handleLogin, handleLogout };
};

// hooks/useTaskData.js
const useTaskData = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchTasks = async () => {
    // fetch logic
  };
  
  return { tasks, isLoading, fetchTasks };
};
```

**階段 3: App 組件拆分 (1天)**
```javascript
// App.jsx 簡化為
const App = () => {
  const auth = useAuth();
  const taskData = useTaskData();
  const filters = useFilters();
  
  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={auth.handleLogin} />;
  }
  
  return (
    <div>
      <Header {...headerProps} />
      <MainContent {...contentProps} />
      <TaskModal {...modalProps} />
    </div>
  );
};
```

**優點**:
- ✅ 風險最低
- ✅ 可以隨時停止
- ✅ 學習曲線平緩
- ✅ 不影響部署流程
- ✅ 立即獲得改善

**缺點**:
- ⚠️ 仍在單檔中
- ⚠️ 開發體驗改善有限

**工作量**: 3-4 天
**推薦指數**: ⭐⭐⭐⭐⭐ (作為第一步)

---

### 1.3 推薦實施路線

#### 短期 (本週): 方案 C - 漸進式重構

**第一天**: 狀態管理重構
- 建立 Context API
- 遷移認證狀態

**第二天**: Hooks 提取
- useAuth
- useTaskData
- useFilters

**第三天**: App 組件簡化
- 拆分為子組件
- 減少嵌套層級

#### 中期 (下週): 方案 A - 模組化構建

**第四天**: 設置構建流程
- 建立 src/ 目錄結構
- 撰寫 build 腳本

**第五天**: 遷移代碼
- 移動 hooks 到獨立檔案
- 移動 contexts 到獨立檔案

**第六天**: 測試與優化
- 驗證構建產物
- 調整構建腳本

#### 長期 (下個月): 方案 B - Vite 構建 (可選)

只在以下情況考慮:
- ✅ 團隊成員都熟悉 Vite
- ✅ 專案規模持續擴大
- ✅ 需要 TypeScript
- ✅ 有時間投入遷移

---

## 🔐 二、OAuth CORS 問題研究

### 2.1 問題根源分析

#### Apps Script 的 CORS 特性

**問題**: Apps Script Web App 不支援 `OPTIONS` preflight 請求

```
Browser → [OPTIONS] → Apps Script
                    ← 404 Not Found (❌ 失敗)

Browser → [POST] → Apps Script
                 ← CORS Error (因為 preflight 失敗)
```

**觸發 Preflight 的條件**:
1. 使用 `POST`, `PUT`, `DELETE` 方法
2. `Content-Type` 為 `application/json`
3. 包含自定義 Header (如 `Authorization`)

---

### 2.2 CORS 問題解決方案

#### 方案 A: 使用簡單請求 (Simple Request) ⭐⭐⭐⭐⭐

**原理**: 避免觸發 preflight，瀏覽器直接發送請求

**實施方法**:
```javascript
// ❌ 會觸發 preflight (Complex Request)
fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ action: 'upsert', data: taskData })
});

// ✅ 不會觸發 preflight (Simple Request)
fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8'
  },
  body: JSON.stringify({ action: 'upsert', data: taskData })
});
```

**Apps Script 端**:
```javascript
function doPost(e) {
  // Content-Type 是 text/plain，但內容仍是 JSON
  const data = JSON.parse(e.postData.contents);
  // ... 處理邏輯
}
```

**優點**:
- ✅ 最簡單的解法
- ✅ 無需修改 Apps Script
- ✅ 完全兼容現有代碼
- ✅ 已驗證可行 (很多專案使用)

**缺點**:
- ⚠️ 技巧性做法，不夠直觀
- ⚠️ 團隊成員需要理解原理

**實施難度**: 極低 (修改 1-2 個函數)
**推薦指數**: ⭐⭐⭐⭐⭐

---

#### 方案 B: OAuth2 for Apps Script Library ⭐⭐⭐⭐

**適用場景**: 需要整合第三方 OAuth (如 GitHub, Slack)

**概念**: 使用專用的 OAuth2 library 處理授權流程

**安裝**:
```javascript
// Apps Script 編輯器 → 資源 → Library
// Library ID: 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
```

**使用範例**:
```javascript
// Apps Script 端
function getOAuthService() {
  return OAuth2.createService('github')
    .setAuthorizationBaseUrl('https://github.com/login/oauth/authorize')
    .setTokenUrl('https://github.com/login/oauth/access_token')
    .setClientId('YOUR_CLIENT_ID')
    .setClientSecret('YOUR_CLIENT_SECRET')
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties());
}

function authCallback(request) {
  var service = getOAuthService();
  var authorized = service.handleCallback(request);
  // ...
}
```

**前端觸發**:
```javascript
// 打開授權 URL
window.location.href = 'YOUR_APPS_SCRIPT_URL?action=authorize';
```

**優點**:
- ✅ 適合整合第三方服務
- ✅ 成熟的 library
- ✅ 文件完善

**缺點**:
- ⚠️ 對於 Google 帳號登入過於複雜
- ⚠️ 需要設置 Cloud Console
- ⚠️ Redirect 流程影響 UX

**實施難度**: 中等 (需要理解 OAuth2 flow)
**推薦指數**: ⭐⭐⭐⭐ (僅當需要第三方整合時)

---

#### 方案 C: Apps Script 內建使用者驗證 ⭐⭐⭐⭐⭐

**概念**: 使用 Apps Script 的內建 Session API

**Apps Script 端**:
```javascript
function doGet(e) {
  // 取得當前登入的 Google 使用者
  const user = Session.getActiveUser();
  const email = user.getEmail();
  
  // 檢查白名單
  const allowedUsers = getSettingsSheet('AllowedUsers')
    .getDataRange()
    .getValues()
    .map(row => row[0]);
  
  if (!allowedUsers.includes(email)) {
    return createJsonResponse({
      success: false,
      error: '無權限存取'
    });
  }
  
  // 繼續處理
  if (e.parameter.action === 'read') {
    return createJsonResponse({
      success: true,
      data: getAllTasks(),
      user: {
        email: email,
        name: user.getName()
      }
    });
  }
}
```

**部署設定**:
```
Apps Script → 部署 → 新增部署
類型: Web App
執行身分: 使用者
存取權限: 限制為「組織內部」或指定網域
```

**前端**:
```javascript
// 無需特殊處理，GET 請求會自動帶上 Google 登入狀態
fetch(API_URL + '?action=read')
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('Current user:', data.user.email);
      setTasks(data.data);
    }
  });
```

**優點**:
- ✅ 最簡單的實施
- ✅ 無需 CORS 處理
- ✅ Google 原生驗證
- ✅ 自動管理 Session
- ✅ 無需前端代碼變更

**缺點**:
- ⚠️ 僅限 Google Workspace 使用者
- ⚠️ 無法自定義登入頁面
- ⚠️ 依賴使用者已登入 Google

**實施難度**: 極低
**推薦指數**: ⭐⭐⭐⭐⭐ (企業內部使用)

---

### 2.3 Google Identity Services (GIS) 整合方案

**最新推薦**: Google 已將 OAuth 遷移到 Google Identity Services

#### 實施步驟

**1. 前端載入 GIS SDK**:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

**2. 初始化登入按鈕**:
```javascript
function handleCredentialResponse(response) {
  // response.credential 是 JWT token
  const userInfo = parseJwt(response.credential);
  console.log('User:', userInfo.email);
  
  // 將 token 傳給 Apps Script 驗證
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // 避免 preflight
    body: JSON.stringify({
      action: 'verifyToken',
      token: response.credential
    })
  });
}

window.onload = function() {
  google.accounts.id.initialize({
    client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    callback: handleCredentialResponse
  });
  
  google.accounts.id.renderButton(
    document.getElementById('googleSignInButton'),
    { theme: 'outline', size: 'large' }
  );
  
  google.accounts.id.prompt(); // One-tap 登入
};

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
}
```

**3. Apps Script 驗證 Token**:
```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  if (data.action === 'verifyToken') {
    // 使用 Google API 驗證 JWT
    const tokenInfo = UrlFetchApp.fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${data.token}`
    );
    const userInfo = JSON.parse(tokenInfo.getContentText());
    
    // 檢查白名單
    if (isAllowedUser(userInfo.email)) {
      return createJsonResponse({
        success: true,
        user: userInfo
      });
    }
  }
}
```

**優點**:
- ✅ 現代化的 OAuth 實現
- ✅ One-tap 登入體驗
- ✅ 自動處理 token 刷新
- ✅ 支援多種登入方式

**缺點**:
- ⚠️ 需要 Google Cloud Console 設定
- ⚠️ 需要 Client ID

**實施難度**: 中等
**推薦指數**: ⭐⭐⭐⭐

---

### 2.4 推薦方案總結

| 場景 | 推薦方案 | 原因 |
|------|---------|------|
| **企業內部使用** | 方案 C: Apps Script 內建驗證 | 最簡單，無需設定 |
| **公開網站** | 方案 A (簡單請求) + GIS | 避免 CORS，現代化登入 |
| **第三方整合** | 方案 B: OAuth2 Library | 支援多種 OAuth Provider |
| **快速修復** | 方案 A: 簡單請求 | 修改 2 行代碼即可 |

---

## 🎯 三、今日實施建議

### 選項A: 開始漸進式重構 (推薦)

**時間**: 3-4 小時

**步驟**:
1. 建立 `hooks/useAuth.js`
2. 建立 `hooks/useTaskData.js`
3. 修改 App 組件使用這些 hooks
4. 測試功能正常

**產出**:
- 代碼更清晰
- 為後續重構打基礎

---

### 選項B: 修復 CORS 問題

**時間**: 1 小時

**步驟**:
1. 找到所有 `fetch` 呼叫
2. 將 `Content-Type: application/json` 改為 `text/plain`
3. 測試 API 呼叫

**產出**:
- CORS 問題解決
- API 呼叫更穩定

---

### 選項C: 實施 GIS 登入

**時間**: 3-4 小時

**步驟**:
1. Google Cloud Console 設定 Client ID
2. 整合 GIS SDK
3. 修改登入流程
4. 測試登入功能

**產出**:
- 現代化登入體驗
- One-tap 登入

---

## ✅ 結論與建議

### 今日優先順序

**上午 (10:30-12:30)**: 
- 📋 **任務A**: 開始漸進式重構
  - 提取 `useAuth` hook
  - 提取 `useTaskData` hook

**下午 (14:00-16:00)**:
- 📋 **任務B**: 修復 CORS 問題
  - 修改 fetch Content-Type
  - 測試所有 API 呼叫

**傍晚 (16:00-17:30)**:
- 📋 **任務C** (可選): 開始 GIS 整合準備
  - Google Cloud Console 設定
  - 閱讀 GIS 文件

### 本週完成目標

- ✅ 漸進式重構完成第一階段
- ✅ CORS 問題完全解決
- ✅ GIS 登入 POC 完成

---

**文件版本**: 1.0  
**產生時間**: 2025-12-16 10:20 AM

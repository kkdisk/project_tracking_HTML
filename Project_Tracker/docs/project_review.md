# Project Tracker 專案分析報告

**日期**: 2025-12-16  
**當前版本**: v6.8  
**分析時間**: 09:57 AM

---

## 📊 一、當前進度統整

### ✅ 已完成功能 (v6.8)

#### 核心功能
- ✅ **任務管理系統**
  - CRUD 操作 (新增/讀取/更新/刪除)
  - 任務狀態管理 (待辦/進行中/完成/Closed)
  - 任務依賴關係 (Dependencies)
  - 里程碑標記 (Checkpoint)
  
- ✅ **結構化 Task ID** (Phase 0 已完成)
  - 格式: `DEPT-YEAR-MONTH-SEQUENCE` (如: MECH-2025-12-0001)
  - 部門代碼對應: 9個部門 (晶片/機構/軟體/電控/流道/生醫/QA/管理/issue)
  - 自動序號生成機制
  - 新舊格式共存支援

- ✅ **三種視圖模式**
  - **Dashboard**: 狀態卡片、任務列表、圖表統計
  - **Gantt Chart**: 甘特圖時間軸、依賴關係可視化
  - **Calendar**: 月曆視圖 (基礎實現)

- ✅ **認證與權限系統**
  - API Key 認證機制
  - 三層權限 (Admin/Editor/Viewer)
  - localStorage 持久化登入狀態

- ✅ **動態主資料載入** (Phase 1 部分完成)
  - 動態載入 Teams/Projects/Owners
  - Fallback 機制 (API失敗時使用硬編碼清單)
  - 從 Google Sheets 設定工作表讀取

- ✅ **資料來源支援**
  - Google Sheets API 整合
  - Excel 離線上傳 (.xlsx, .xls, .csv)
  - UnifiedTaskManager 格式轉換器
  - 本地備份機制 (localStorage)

- ✅ **進階篩選功能**
  - Team 篩選 (多選按鈕)
  - Project 篩選
  - 狀態篩選 (點擊卡片)
  - 關鍵字搜尋 (任務名稱、負責人)
  - 隱藏已完成任務 (勾選框，預設隱藏)

- ✅ **任務標記功能**
  - 標記延遲任務 (Delayed)
  - 標記延遲開始 (Late Start)
  - 高亮緊急任務 (可切換，預設開啟)

### 📁 專案結構

```
Project_Tracker/
├── index.html (v6.8) - 主應用程式 (101KB, 1764行)
├── apps_script_complete.gs - 後端API (32KB, 1067行)
├── UPGRADE_ROADMAP.md - 升級路線圖
├── migrate.html / migrate_v2.html - 資料遷移工具
├── js/
│   ├── config.js - API配置、權限定義
│   ├── data_converter.js - UTM格式轉換器
│   ├── components/
│   │   ├── Dashboard.js (274行)
│   │   ├── GanttView.js (317行)
│   │   ├── CalendarView.js
│   │   ├── TaskModal.js
│   │   └── LoginScreen.js
│   └── utils/
│       ├── helpers.js
│       └── icons.js
└── temp_data/ - 臨時資料
```

### 🗺️ UPGRADE_ROADMAP 規劃

根據 `UPGRADE_ROADMAP.md`，專案規劃了 8 個主要升級階段：

| Phase | 項目 | 優先級 | 狀態 | 工作量 |
|-------|------|--------|------|--------|
| 0 | Task ID 格式升級 | P0 | ✅ 已完成 | - |
| 1 | 系統管理介面 (CRUD) | P0 | ⏳ 規劃中 | 3-5天 |
| 2 | Google OAuth + 權限管理 | P1 | 📋 待實施 | 5-7天 |
| 3 | 舊資料遷移工具 | P1 | 📋 待實施 | 2-3天 |
| 4 | UI/UX 增強 | P2 | 📋 待實施 | 4-6天 |
| 5 | 報表與統計 | P2 | 📋 待實施 | 4-5天 |
| 6 | 效能優化 | P2 | 📋 待實施 | 5天 |
| 7 | 通知系統 | P3 | 📋 待實施 | 3-4天 |
| 8 | 外部整合 (GitHub/Slack) | P3 | 📋 待實施 | 8-11天 |

**總預估工作量**: 34-46 天

---

## 🔍 二、Code Review - 優缺點分析

### ✅ 優點

#### 1. **架構設計** ⭐⭐⭐⭐
- **React 組件化**: 使用 React 18 + Babel Standalone，組件分離清晰
- **單一 HTML 部署**: 適合 Google Apps Script 環境，部署簡單
- **模組化檔案結構**: JS 檔案按功能分類 (components/utils)
- **狀態管理**: 使用 React Hooks，狀態流向清晰

#### 2. **功能完整性** ⭐⭐⭐⭐⭐
- **多資料來源**: 支援 Google Sheets + Excel 離線
- **格式轉換器**: UTM → Tracker 自動轉換
- **Fallback 機制**: API失敗時的備份策略完善
- **任務依賴**: 支援 DAG 依賴關係可視化

#### 3. **用戶體驗** ⭐⭐⭐⭐
- **三種視圖**: Dashboard/Gantt/Calendar 滿足不同需求
- **進階篩選**: Team/Project/Status/Search 組合篩選
- **視覺化標記**: 延遲/緊急任務高亮顯示
- **響應式設計**: 使用 Tailwind CSS，支援行動裝置

#### 4. **安全性** ⭐⭐⭐
- **API Key 認證**: 三層權限控制
- **CORS 配置**: Apps Script 正確處理 CORS
- **權限檢查**: 前端 + 後端雙重驗證

#### 5. **資料處理** ⭐⭐⭐⭐⭐
- **日期正規化**: 支援 Excel 序列號 + ISO 字串
- **強制覆寫機制**: 解決日期轉換問題
- **本地備份**: 自動儲存到 localStorage
- **錯誤處理**: 完善的 try-catch 和用戶提示

### ⚠️ 缺點與改善方向

#### 1. **代碼結構問題** 🔴

##### 問題:
- **index.html 過大** (1764行, 101KB)
  - 包含大量內嵌 JavaScript 代碼
  - 混合了 HTML/CSS/JS，難以維護
  - 搜尋和修改特定功能困難

##### 改善建議:
```javascript
// 當前: 所有邏輯都在 index.html 的 <script> 區塊
// 建議: 拆分為獨立模組

// js/App.js - 主應用邏輯
// js/hooks/useAuth.js - 認證邏輯
// js/hooks/useTaskData.js - 任務資料管理
// js/hooks/useFilters.js - 篩選邏輯
// js/constants.js - 常數定義 (DEPT_CODES, STATUS等)
```

**工作量**: 2-3天  
**優先級**: 🟡 中 (不影響功能但提升可維護性)

---

#### 2. **重複代碼** 🟡

##### 問題:
- `normalizeDate` 函數在多處定義
  - `index.html` 內嵌覆寫版本 (42-122行)
  - `data_converter.js` 原始版本
  - 可能導致不一致

##### 改善建議:
```javascript
// utils/dateUtils.js - 統一日期工具函數
export const normalizeDate = (dateInput) => {
    // 統一實現
};

export const formatDate = (date) => { /* ... */ };
export const parseDate = (str) => { /* ... */ };
```

**工作量**: 0.5天  
**優先級**: 🟢 低 (目前功能正常)

---

#### 3. **狀態管理複雜度** 🟠

##### 問題:
- **過多的獨立 state**:
  ```javascript
  // App 組件中有 20+ 個 useState
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTeam, setFilterTeam] = useState('All');
  const [filterProject, setFilterProject] = useState('All');
  // ... 還有 16+ 個
  ```

- **Props drilling**: 需要傳遞多層組件

##### 改善建議:
使用 **React Context API** 或 **Zustand** 狀態管理:

```javascript
// contexts/AppContext.js
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

// 組件中使用
const { state, dispatch } = useContext(AppContext);
```

**工作量**: 3-4天  
**優先級**: 🟡 中 (可等到 Phase 4 UI/UX 增強時一併處理)

---

#### 4. **後端架構問題** 🟠

##### 問題:
- **apps_script_complete.gs** 缺乏分層架構
  - 所有功能都在一個檔案 (1067行)
  - 路由、業務邏輯、資料存取混在一起
  - 測試困難

##### 現狀:
```javascript
function doGet(e) {
  // 路由邏輯
  if (action === 'read') return getAllTasks();
  if (action === 'getTeams') return getTeams();
  // ... 10+ 條件判斷
}

function getAllTasks() {
  // 直接操作 Sheet
  const sheet = SpreadsheetApp.openById(SHEET_ID);
  // ...
}
```

##### 改善建議:
採用分層架構 (需要 Apps Script 專案模式):

```javascript
// router.gs - 路由層
function doGet(e) {
  const router = {
    'read': () => TaskService.getAll(),
    'getTeams': () => SettingsService.getTeams(),
    // ...
  };
  return router[action]();
}

// services/TaskService.gs - 業務邏輯層
const TaskService = {
  getAll: () => {
    const data = TaskRepository.findAll();
    return createJsonResponse({ success: true, data });
  }
};

// repositories/TaskRepository.gs - 資料存取層
const TaskRepository = {
  findAll: () => {
    return SheetHelper.getSheet(SHEET_NAME).getDataRange().getValues();
  }
};
```

**工作量**: 4-5天  
**優先級**: 🟡 中 (可納入 Phase 6 效能優化)

---

#### 5. **測試覆蓋不足** 🔴

##### 問題:
- **無單元測試**: 前端、後端都沒有自動化測試
- **僅有手動測試函數**: `testGenerateTaskId()`, `testGetNextSequence()`
- **回歸風險高**: 修改代碼時容易破壞現有功能

##### 改善建議:

**前端測試** (使用 Vitest + React Testing Library):
```javascript
// __tests__/components/Dashboard.test.jsx
describe('Dashboard', () => {
  it('應正確顯示任務統計', () => {
    const tasks = [/* mock data */];
    render(<Dashboard tasks={tasks} />);
    expect(screen.getByText('待辦')).toBeInTheDocument();
  });
});
```

**後端測試** (Apps Script 單元測試):
```javascript
// tests/TaskService.test.gs
function testGenerateTaskId_ValidInput() {
  const result = generateTaskId('晶片', new Date('2025-12-01'));
  Logger.log(result); // CHIP-2025-12-0001
  assertEquals('CHIP-2025-12', result.substring(0, 12));
}
```

**工作量**: 5-7天  
**優先級**: 🟡 中 (建議在 Phase 2 開始前建立測試基礎)

---

#### 6. **效能問題** 🟡

##### 潛在瓶頸:
1. **大量任務時的渲染效能**
   - Dashboard 表格無虛擬滾動
   - Gantt Chart 全量渲染

2. **重複的 API 請求**
   - 每次切換視圖可能重新載入資料
   - 無快取機制

3. **依賴關係計算**
   - Gantt 視圖每次都重新計算 SVG 路徑

##### 改善建議:
```javascript
// 1. 使用 React.memo 避免不必要的重新渲染
const TaskRow = React.memo(({ task, onEdit }) => {
  // ...
});

// 2. 虛擬滾動 (react-window)
import { FixedSizeList } from 'react-window';

// 3. useMemo 快取計算結果
const dependencyPaths = useMemo(() => {
  return calculateDependencies(filteredTasks);
}, [filteredTasks]);
```

**工作量**: 3-5天  
**優先級**: 🟢 低 (當任務數 > 100 時才需要)

---

#### 7. **UI/UX 改善空間** 🟡

##### 問題:
1. **操作效率**
   - 編輯任務需要多次點擊
   - 缺少快捷鍵
   - 無批次操作

2. **視覺設計**
   - 部門顏色未充分利用
   - Task ID 顯示較平淡
   - 缺少加載骨架屏

3. **行動裝置體驗**
   - Gantt Chart 在小螢幕上不易操作
   - Modal 在手機上過大

##### 改善建議:
參考 `UPGRADE_ROADMAP.md` Phase 4:
- 右鍵選單
- 任務快速操作
- 部門顏色標籤
- 優先級視覺化 (🔴🟡🟢)

**工作量**: 4-6天  
**優先級**: 🟡 中 (Phase 4)

---

#### 8. **資料遷移風險** 🔴

##### 問題:
- **舊 Task ID 遷移工具尚未實現**
  - UPGRADE_ROADMAP 中的 Phase 3
  - 現有資料庫可能混合新舊格式
  - 遷移失敗無回滾機制

##### 改善建議:
立即實施 Phase 3:
1. 備份機制
2. 遷移預覽
3. 批次處理
4. 回滾功能

**工作量**: 2-3天  
**優先級**: 🔴 高 (建議優先處理)

---

### 🎯 優先改善排序

1. 🔴 **P0 - 立即處理**
   - ✅ 已完成: Task ID 升級
   - ⏳ 實施中: 無
   
2. 🔴 **P1 - 高優先級** (本週)
   - Phase 1: 系統管理介面 (3-5天)
   - Phase 3: 資料遷移工具 (2-3天)
   
3. 🟡 **P2 - 中優先級** (下週)
   - 測試覆蓋建立
   - 代碼拆分重構
   - Phase 2: Google OAuth

4. 🟢 **P3 - 低優先級** (下個月)
   - 效能優化
   - UI/UX 增強
   - 通知系統

---

## 📅 三、今日工作規劃 (2025-12-16)

### 🎯 目標: 實施 Phase 1 - 系統管理介面

#### 為什麼選擇 Phase 1?
1. ✅ **最實用**: 讓使用者自行管理下拉選單，無需修改代碼
2. ✅ **降低維護成本**: 不再需要更新硬編碼清單
3. ✅ **為後續功能打基礎**: Phase 2 權限管理需要用戶管理功能

---

### 📋 今日具體工作項目

#### 任務 1: 後端 API 實現 (上午 3小時)

**1.1 Google Sheets 設定工作表初始化**
- [x] 檢視現有 `apps_script_complete.gs` 中的設定工作表函數
- [ ] 確認三個工作表已正確初始化:
  - `系統設定_Teams`
  - `系統設定_Projects`
  - `系統設定_Owners`

**1.2 完善 CRUD API**
目前 `apps_script_complete.gs` 已有基礎實現 (338-636行)，需要:
- [ ] 測試 `getTeams()` / `addTeam()` / `updateTeam()` / `deleteTeam()`
- [ ] 測試 `getProjects()` / `addProject()` / `updateProject()` / `deleteProject()`
- [ ] 測試 `getOwners()` / `addOwner()` / `updateOwner()` / `deleteOwner()`
- [ ] 修復任何發現的 bug
- [ ] 新增資料驗證 (避免重複、空值)

**預期產出**:
- 完整的 12 個 API 端點正常運作
- API 測試函數確認功能正確

---

#### 任務 2: 前端設定頁面 (下午 4小時)

**2.1 建立 SettingsView 組件**

新增檔案: `js/components/SettingsView.js`

**功能需求**:
```javascript
const SettingsView = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('teams'); // teams / projects / owners
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [owners, setOwners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // CRUD 操作
  const handleAdd = async (type, data) => { /* ... */ };
  const handleUpdate = async (type, id, data) => { /* ... */ };
  const handleDelete = async (type, id) => { /* ... */ };

  return (
    <div className="settings-modal">
      {/* Tab 切換 */}
      {/* Teams 列表 + CRUD */}
      {/* Projects 列表 + CRUD */}
      {/* Owners 列表 + CRUD */}
    </div>
  );
};
```

**UI 設計**:
```
┌────────────────────────────────────────────┐
│  🔧 系統設定                     [✕ 關閉]   │
├────────────────────────────────────────────┤
│  [Teams] [Projects] [Owners]               │
├────────────────────────────────────────────┤
│                                            │
│  Teams 管理                                 │
│  ┌──────────────────────────────────────┐ │
│  │ 部門名稱  │ 代碼   │ 狀態 │ 操作     │ │
│  ├──────────────────────────────────────┤ │
│  │ 晶片      │ CHIP   │ ✓    │ ✏️ 🗑️   │ │
│  │ 機構      │ MECH   │ ✓    │ ✏️ 🗑️   │ │
│  │ ...                                  │ │
│  └──────────────────────────────────────┘ │
│  [+ 新增部門]                              │
└────────────────────────────────────────────┘
```

**2.2 整合到 App 主組件**
- [ ] 在 `index.html` 的 App 組件中新增設定按鈕
- [ ] 新增 `showSettings` state
- [ ] 載入 `SettingsView.js`

**預期產出**:
- 完整的設定介面 UI
- 可新增/編輯/刪除 Teams/Projects/Owners
- 資料即時同步到 Google Sheets

---

#### 任務 3: 測試與驗證 (晚上 1小時)

**3.1 功能測試**
- [ ] 新增部門 → 檢查下拉選單更新
- [ ] 編輯專案 → 檢查任務模組顯示
- [ ] 刪除負責人 → 確認無法刪除還有任務的負責人
- [ ] 停用部門 → 檢查篩選按鈕消失

**3.2 資料驗證**
- [ ] 測試重複名稱檢查
- [ ] 測試空值驗證
- [ ] 測試部門代碼格式 (大寫英文)

**3.3 錯誤處理**
- [ ] 網路斷線時的提示
- [ ] API 失敗時的 Fallback
- [ ] 操作確認對話框

**預期產出**:
- 測試報告 (通過/失敗項目清單)
- Bug 清單 (如有)

---

### ⏰ 時間分配

| 時段 | 任務 | 預估時間 |
|------|------|----------|
| 10:00-13:00 | 後端 API 測試與修復 | 3小時 |
| 14:00-18:00 | 前端 SettingsView 開發 | 4小時 |
| 19:00-20:00 | 整合測試與驗證 | 1小時 |

**總計**: 8 小時

---

### 🎯 今日成功標準

#### ✅ 必須完成 (Must Have)
1. 後端 12 個 API 端點測試通過
2. SettingsView 基礎 UI 完成
3. 至少一個 Tab (Teams) 功能完整

#### 🟡 盡量完成 (Should Have)
1. 三個 Tab 全部完成
2. 資料驗證完善
3. 錯誤提示友善

#### 🟢 加分項 (Nice to Have)
1. 批次操作功能
2. 匯入/匯出 CSV
3. 操作歷史記錄

---

### 📝 實施步驟詳細說明

#### Step 1: 後端 API 驗證 (10:00-13:00)

```javascript
// 1. 開啟 Apps Script 編輯器
// 2. 執行測試函數

function testSettingsAPI() {
  // Test 1: Get Teams
  const teams = getTeams();
  Logger.log('Teams:', teams);
  
  // Test 2: Add Team
  const newTeam = addTeam({
    teamName: '測試部門',
    deptCode: 'TEST',
    isActive: true
  });
  Logger.log('Added:', newTeam);
  
  // Test 3: Update Team
  const updated = updateTeam({
    id: newTeam.id,
    teamName: '測試部門(已修改)',
    deptCode: 'TEST2'
  });
  Logger.log('Updated:', updated);
  
  // Test 4: Delete Team
  const deleted = deleteTeam(newTeam.id);
  Logger.log('Deleted:', deleted);
}
```

**驗證檢查清單**:
- [ ] API 回傳格式正確 `{ success: true, data: [...] }`
- [ ] CORS 標頭設定正確
- [ ] 錯誤處理完善
- [ ] 資料寫入 Sheets 成功

---

#### Step 2: 前端組件開發 (14:00-18:00)

**2.1 建立檔案結構** (14:00-14:30)
```bash
# 建立新檔案
js/components/SettingsView.js
js/components/settings/TeamSettings.js
js/components/settings/ProjectSettings.js
js/components/settings/OwnerSettings.js
```

**2.2 實現 SettingsView 主框架** (14:30-16:00)
```javascript
// js/components/SettingsView.js
const SettingsView = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('teams');
  
  const renderTabContent = () => {
    switch(activeTab) {
      case 'teams': return <TeamSettings />;
      case 'projects': return <ProjectSettings />;
      case 'owners': return <OwnerSettings />;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-4/5 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">🔧 系統設定</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <Tab active={activeTab === 'teams'} onClick={() => setActiveTab('teams')}>Teams</Tab>
          <Tab active={activeTab === 'projects'} onClick={() => setActiveTab('projects')}>Projects</Tab>
          <Tab active={activeTab === 'owners'} onClick={() => setActiveTab('owners')}>Owners</Tab>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
```

**2.3 實現 TeamSettings 組件** (16:00-18:00)
```javascript
// js/components/settings/TeamSettings.js
const TeamSettings = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ teamName: '', deptCode: '', isActive: true });
  
  useEffect(() => {
    loadTeams();
  }, []);
  
  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=getTeams`);
      const data = await res.json();
      if (data.success) setTeams(data.data);
    } catch (err) {
      alert('載入失敗');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdd = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addTeam', data: formData })
      });
      const result = await res.json();
      if (result.success) {
        await loadTeams();
        setFormData({ teamName: '', deptCode: '', isActive: true });
      }
    } catch (err) {
      alert('新增失敗');
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('確定刪除?')) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteTeam', id })
      });
      if ((await res.json()).success) loadTeams();
    } catch (err) {
      alert('刪除失敗');
    }
  };
  
  return (
    <div>
      {/* 列表 */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">部門名稱</th>
            <th className="p-2 border">代碼</th>
            <th className="p-2 border">狀態</th>
            <th className="p-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <tr key={team.id}>
              <td className="p-2 border">{team.teamName}</td>
              <td className="p-2 border">{team.deptCode}</td>
              <td className="p-2 border">{team.isActive ? '✓' : '✗'}</td>
              <td className="p-2 border">
                <button onClick={() => handleEdit(team.id)}>✏️</button>
                <button onClick={() => handleDelete(team.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* 新增表單 */}
      <div className="mt-4 p-4 border rounded">
        <h3 className="font-bold mb-2">新增部門</h3>
        <div className="flex gap-2">
          <input
            placeholder="部門名稱"
            value={formData.teamName}
            onChange={e => setFormData({...formData, teamName: e.target.value})}
            className="border p-2 rounded"
          />
          <input
            placeholder="代碼 (大寫)"
            value={formData.deptCode}
            onChange={e => setFormData({...formData, deptCode: e.target.value.toUpperCase()})}
            className="border p-2 rounded"
            maxLength={4}
          />
          <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded">
            ➕ 新增
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

#### Step 3: 整合與測試 (19:00-20:00)

**3.1 整合到 App**
```javascript
// 在 index.html 的 App 組件中

const App = () => {
  // ... 現有 state
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <>
      {/* Header 新增設定按鈕 */}
      <button onClick={() => setShowSettings(true)}>⚙️ 設定</button>
      
      {/* 設定 Modal */}
      {showSettings && (
        <SettingsView onClose={() => setShowSettings(false)} />
      )}
      
      {/* 其他內容 */}
    </>
  );
};
```

**3.2 載入組件檔案**
```html
<!-- 在 index.html 的 <head> 中新增 -->
<script type="text/babel" src="js/components/SettingsView.js"></script>
<script type="text/babel" src="js/components/settings/TeamSettings.js"></script>
<script type="text/babel" src="js/components/settings/ProjectSettings.js"></script>
<script type="text/babel" src="js/components/settings/OwnerSettings.js"></script>
```

**3.3 測試清單**

| 測試項目 | 預期結果 | 實際結果 | 狀態 |
|---------|---------|---------|------|
| 開啟設定頁面 | Modal 正確顯示 | | ⏳ |
| 載入 Teams 清單 | 顯示現有部門 | | ⏳ |
| 新增部門 | 成功新增並重新載入 | | ⏳ |
| 編輯部門 | 資料更新正確 | | ⏳ |
| 刪除部門 | 確認對話框 → 刪除成功 | | ⏳ |
| 重複名稱驗證 | 顯示錯誤提示 | | ⏳ |
| 空值驗證 | 無法提交 | | ⏳ |
| 切換 Tab | Projects/Owners 正常 | | ⏳ |

---

### 📊 驗證方案

#### 自動化驗證
```javascript
// tests/settingsAPI.test.gs (Apps Script)
function runAllSettingsTests() {
  testGetTeams();
  testAddTeam();
  testUpdateTeam();
  testDeleteTeam();
  // ... Projects, Owners
  Logger.log('✅ 所有測試通過');
}
```

#### 手動驗證
1. **使用者流程測試**:
   ```
   1. 點擊頂部 "⚙️ 設定" 按鈕
   2. 檢查 Modal 正確彈出
   3. 點擊 "Teams" Tab
   4. 點擊 "➕ 新增" 按鈕
   5. 輸入部門名稱 "測試部門" 和代碼 "TEST"
   6. 確認新增成功，列表更新
   7. 點擊編輯按鈕，修改名稱
   8. 確認修改成功
   9. 點擊刪除按鈕，確認刪除
   10. 關閉 Modal，開啟新任務 Modal
   11. 檢查 Team 下拉選單是否包含新部門
   ```

2. **資料一致性驗證**:
   ```
   1. 在設定頁面新增部門 "行銷"
   2. 開啟 Google Sheets 確認寫入
   3. 重新載入網頁
   4. 檢查 "行銷" 仍然存在
   ```

---

### 🚨 風險與應對

#### 風險 1: API 權限問題
**症狀**: CORS 錯誤或 403 Forbidden  
**應對**: 檢查 Apps Script 部署設定 → "任何人都可存取"

#### 風險 2: 資料格式不一致
**症狀**: 前端顯示錯誤  
**應對**: 在 Apps Script 中強制回傳格式驗證

#### 風險 3: 時間不足
**症狀**: 無法完成三個 Tab  
**應對**: 優先完成 Teams，其他兩個複製貼上修改即可

---

### 📈 進度追蹤

#### 今日結束前檢查清單

**後端** (10:00-13:00)
- [ ] `getTeams()` 測試通過
- [ ] `addTeam()` 測試通過
- [ ] `updateTeam()` 測試通過
- [ ] `deleteTeam()` 測試通過
- [ ] Projects API 測試通過
- [ ] Owners API 測試通過

**前端** (14:00-18:00)
- [ ] `SettingsView.js` 建立完成
- [ ] `TeamSettings.js` 功能完整
- [ ] `ProjectSettings.js` 功能完整
- [ ] `OwnerSettings.js` 功能完整
- [ ] 整合到 App 組件
- [ ] CSS 樣式美化

**測試** (19:00-20:00)
- [ ] 功能測試全部通過
- [ ] 資料驗證正確
- [ ] 錯誤處理友善
- [ ] 無明顯 Bug

---

### 🎯 明日計劃 (2025-12-17)

如果今日順利完成，明日可進行:

1. **Phase 1 收尾** (2小時)
   - 批次操作功能
   - 匯入/匯出 CSV
   - UI 美化調整

2. **Phase 3 準備** (6小時)
   - 設計資料遷移 UI
   - 實作遷移預覽功能
   - 備份機制開發

---

## 📌 總結

### 當前狀態
- ✅ **v6.8 功能完整**: Task ID 升級、認證、多視圖、篩選、離線支援
- ⚠️ **改善空間**: 代碼結構、測試覆蓋、效能優化

### 今日重點
- 🎯 **Phase 1 - 系統管理介面**: 讓使用者自行管理 Teams/Projects/Owners
- ⏰ **8小時**: 後端測試(3h) + 前端開發(4h) + 驗證(1h)

### 下一步
- 📅 **本週**: 完成 Phase 1 + Phase 3 (資料遷移)
- 📅 **下週**: Phase 2 (Google OAuth + 權限管理)
- 📅 **本月**: Phase 4 (UI/UX 增強) + Phase 5 (報表統計)

---

**文件版本**: 1.0  
**產生時間**: 2025-12-16 09:57 AM  
**產生者**: Antigravity Code Review Assistant

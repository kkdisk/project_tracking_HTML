# 甘特圖組件規格文件

> 用於移植到其他專案的技術規格說明

---

## 1. 全域常數

```javascript
const PX_PER_DAY = 40;   // 每天寬度（像素）
const ROW_HEIGHT = 40;   // 每行高度（像素）
```

---

## 2. 資料結構

### 任務 (Task) 物件

```javascript
{
  id: number,              // 任務 ID
  task: string,            // 任務名稱
  project: string,         // 專案名稱 (用於顏色區分)
  status: string,          // 狀態: 'Todo' | 'Doing' | 'Done' | 'Closed'
  date: string,            // 完成日期 (YYYY-MM-DD)
  duration: number,        // 工時天數
  owner: string,           // 負責人
  dependency: string,      // 相依任務 ID (逗號分隔多個)
  dateHistory: [           // 日期變更歷史 (用於顯示原始時程)
    { date: string, changedAt: string, reason: string, version: number }
  ]
}
```

### 輔助函式

```javascript
// 根據完成日期和工時計算開始日期
const getStartDate = (endDateStr, duration) => {
    if (!duration || !endDateStr) return '';
    const end = new Date(endDateStr);
    const start = new Date(end);
    start.setDate(end.getDate() - duration);
    return start.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
};

// 計算任務在時間軸上的左側位置
const getLeftPos = (dateStr, minDate) => {
    const d = new Date(dateStr);
    const diff = Math.ceil((d - minDate) / (1000 * 60 * 60 * 24));
    return diff * PX_PER_DAY;
};
```

---

## 3. 視覺規格

### 3.1 任務條顏色

| 狀態 | 背景顏色 | 邊框 | 特效 |
|------|----------|------|------|
| **正常執行** | 專案對應色 | 無 | 無 |
| **Done (已完成)** | 專案對應色 | 無 | `opacity: 50%` + `grayscale` |
| **Closed (不執行)** | `rgba(148, 163, 184, 0.3)` | `3px dashed ${borderColor}` | 無 |
| **相依性衝突** | 專案對應色 | `3px solid #dc2626` | `box-shadow: 0 0 8px rgba(220, 38, 38, 0.5)` |

### 3.2 專案顏色定義 (通用配置)

```javascript
// ============================================
// 專案顏色配置 - 依需求自行擴充
// ============================================
const PROJECT_COLORS = {
  // 格式: '專案名稱': { bg: 'Tailwind背景類', border: '十六進位色碼' }
  'ProjectA': { bg: 'bg-emerald-500', border: '#10b981' },  // 綠色
  'ProjectB': { bg: 'bg-purple-500',  border: '#a855f7' },  // 紫色
  'ProjectC': { bg: 'bg-blue-500',    border: '#3b82f6' },  // 藍色
  'ProjectD': { bg: 'bg-orange-500',  border: '#f97316' },  // 橘色
  'ProjectE': { bg: 'bg-pink-500',    border: '#ec4899' },  // 粉紅
  // ... 可繼續新增
};

// 預設顏色 (當專案不在配置中時使用)
const DEFAULT_COLOR = { bg: 'bg-slate-500', border: '#64748b' };

// 取得專案顏色的函式
const getProjectColor = (projectName) => {
  return PROJECT_COLORS[projectName] || DEFAULT_COLOR;
};

// 使用範例
const color = getProjectColor(task.project);
const colorClass = color.bg;        // 'bg-emerald-500'
const borderColor = color.border;   // '#10b981'
```

#### 常用顏色參考表

| 顏色名稱 | Tailwind Class | Hex 色碼 | 建議用途 |
|----------|----------------|----------|----------|
| 綠色 | `bg-emerald-500` | `#10b981` | 主要/進行中 |
| 紫色 | `bg-purple-500` | `#a855f7` | 次要專案 |
| 藍色 | `bg-blue-500` | `#3b82f6` | 一般專案 |
| 橘色 | `bg-orange-500` | `#f97316` | 警示/優先 |
| 粉紅 | `bg-pink-500` | `#ec4899` | 特殊專案 |
| 青色 | `bg-cyan-500` | `#06b6d4` | 輔助專案 |
| 黃色 | `bg-amber-500` | `#f59e0b` | 待處理 |
| 紅色 | `bg-red-500` | `#ef4444` | 緊急/問題 |
| 灰色 | `bg-slate-500` | `#64748b` | 預設/暫停 |

### 3.3 其他視覺元素

| 元素 | 樣式 |
|------|------|
| **今日線** | 紅色 `#ef4444`, 寬度 2px, 透明度 50% |
| **原始時程 (有延期時)** | 背景 `rgba(148, 163, 184, 0.4)`, 灰色虛線框 `2px dashed #64748b` |
| **相依連線 (正常)** | 灰色 `#94a3b8`, 1.5px |
| **相依連線 (衝突)** | 紅色 `#dc2626`, 2.5px |
| **週末格線** | 淺灰背景 `bg-slate-50` |

---

## 4. CSS 樣式

```css
/* === 容器結構 === */
.gantt-wrapper {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
}

.gantt-header-row {
    display: flex;
    position: sticky;
    top: 0;
    z-index: 50;
    background: #f8fafc;
}

.gantt-body {
    overflow: auto;
    flex: 1;
}

/* === 表頭 === */
.gantt-header-task {
    position: sticky;
    left: 0;
    z-index: 40;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-weight: bold;
    padding: 8px;
    height: 60px;
    width: 200px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    border-right: 1px solid #e2e8f0;
}

.gantt-header-timeline {
    position: sticky;
    top: 0;
    z-index: 30;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    height: 60px;
    display: flex;
    flex-direction: column;
}

.gantt-month-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    color: #475569;
    border-right: 1px solid #e2e8f0;
}

.gantt-day-cell {
    border-right: 1px solid #f1f5f9;
    height: 100%;
    text-align: center;
    font-size: 0.7rem;
    padding-top: 4px;
    color: #64748b;
}

/* === 資料列 === */
.gantt-row {
    display: flex;
    height: 40px;
    border-bottom: 1px solid #f1f5f9;
    background-color: #fff;
    position: relative;
}

.gantt-row:hover {
    background-color: #f8fafc;
}

.gantt-task-col {
    width: 200px;
    flex-shrink: 0;
    padding: 8px;
    border-right: 1px solid #e2e8f0;
    font-size: 0.875rem;
    background: #fff;
    position: sticky;
    left: 0;
    z-index: 35;
    height: 40px;
    display: flex;
    align-items: center;
    box-shadow: 1px 0 3px rgba(0, 0, 0, 0.05);
}

.gantt-timeline-col {
    position: relative;
    flex: 1;
    height: 40px;
}

/* === 格線 === */
.gantt-grid-lines {
    position: absolute;
    top: 0;
    left: 200px;
    bottom: 0;
    display: flex;
    pointer-events: none;
    z-index: 0;
}

.gantt-grid-col {
    border-right: 1px solid #f1f5f9;
    height: 100%;
}

/* === 任務條 === */
.gantt-bar {
    position: absolute;
    height: 24px;
    top: 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    color: white;
    display: flex;
    align-items: center;
    padding: 0 8px;
    white-space: nowrap;
    overflow: hidden;
    transition: all 0.3s;
    cursor: pointer;
    z-index: 20;
}

.gantt-bar:hover {
    opacity: 0.9;
    transform: scaleY(1.05);
    z-index: 25;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* === 今日線 === */
.today-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #ef4444;
    z-index: 15;
    pointer-events: none;
    opacity: 0.5;
}

/* === 相依連線 SVG === */
.dependency-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
}

/* === 週末 === */
.is-weekend {
    background-color: #f8fafc;
}
```

---

## 5. 任務條渲染邏輯

```jsx
{sortedTasks.map(t => {
    const start = getStartDate(t.date, t.duration);
    const left = getLeftPos(start);
    const width = t.duration * PX_PER_DAY;
    
    // 專案對應的顏色
    const colorClass = t.project === 'PlanB' ? 'bg-emerald-500' 
        : t.project === 'Machine' ? 'bg-purple-500' : 'bg-blue-500';
    const borderColor = t.project === 'PlanB' ? '#10b981' 
        : t.project === 'Machine' ? '#a855f7' : '#3b82f6';
    
    // 檢查相依性衝突
    const hasConflict = /* ... */;
    
    return (
        <div className={`gantt-bar 
            ${t.status === 'Closed' ? '' : colorClass} 
            ${t.status === 'Done' ? 'opacity-50 grayscale' : ''}`}
            style={{
                left: `${left}px`,
                width: `${width}px`,
                // Closed 狀態：透明背景 + 專案顏色虛線外框
                ...(t.status === 'Closed' ? {
                    backgroundColor: 'rgba(148, 163, 184, 0.3)',
                    border: `3px dashed ${borderColor}`,
                    boxShadow: 'none'
                } : {}),
                // 相依性衝突時加紅色粗框 (優先級較高)
                ...(hasConflict ? {
                    border: '3px solid #dc2626',
                    boxShadow: '0 0 8px rgba(220, 38, 38, 0.5)'
                } : {})
            }}
        >
            {/* 任務內容 */}
        </div>
    );
})}
```

---

## 6. 相依連線繪製

```jsx
// SVG 箭頭標記定義
<defs>
    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
        <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
    </marker>
    <marker id="arrowhead-red" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
        <polygon points="0 0, 6 2, 0 4" fill="#dc2626" />
    </marker>
</defs>

// 曲線路徑 (Bezier Curve)
const path = `M ${parentX} ${parentY} C ${parentX + 20} ${parentY}, ${childX - 20} ${childY}, ${childX} ${childY}`;
<path d={path} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" markerEnd={markerEnd} />
```

---

## 7. 功能特性

| 功能 | 說明 |
|------|------|
| ✅ 固定任務名稱欄 | 水平捲動時任務名稱固定在左側 |
| ✅ 固定表頭 | 垂直捲動時月份/日期表頭固定在頂部 |
| ✅ 同步捲動 | 表頭與內容區水平捲動同步 |
| ✅ 今日標記線 | 紅色垂直線標示今天位置 |
| ✅ 相依連線 | 可切換顯示任務間相依關係 |
| ✅ 相依衝突警告 | 自動偵測並標示時程衝突 |
| ✅ 日期變更歷史 | 顯示原始規劃時程 (虛線框) |
| ✅ 專案篩選 | 可按專案篩選顯示任務 |
| ✅ 行動版偵測 | 在小螢幕上提示使用桌面版 |

---

## 8. z-index 層級

| 層級 | 元素 |
|------|------|
| 50 | 表頭列 (gantt-header-row) |
| 40 | 任務名稱表頭 (gantt-header-task) |
| 35 | 任務名稱欄 (gantt-task-col) |
| 30 | 時間軸表頭 (gantt-header-timeline) |
| 25 | 任務條 hover 狀態 |
| 20 | 任務條 (gantt-bar) |
| 15 | 今日線 (today-line) |
| 10 | 相依連線 SVG / 原始時程條 |
| 0 | 格線 (gantt-grid-lines) |

---

## 9. 移植檢查清單

- [ ] 複製 CSS 樣式到專案
- [ ] 設定 `PX_PER_DAY` 和 `ROW_HEIGHT` 常數
- [ ] 調整專案顏色對應 (`colorClass`, `borderColor`)
- [ ] 調整狀態值對應 (`Done`, `Closed` 等)
- [ ] 實作 `getStartDate()` 和 `getLeftPos()` 函式
- [ ] 設定資料來源與排序邏輯
- [ ] (選用) 實作相依連線功能
- [ ] (選用) 實作日期歷史功能

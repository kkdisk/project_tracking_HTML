# Hook Extraction Implementation Plan

## Goal Description
Refactor `src/App.jsx` by extracting data management and filtering logic into custom hooks. This will improve code readability, maintainability, and follows the "Single File Deployment + Modularization" strategy (Phase 3).

## Proposed Changes

### Hooks Layer (New)

#### [NEW] [useTaskData.js](file:///d:/code/cytesi/project_tracking_HTML_githgb/Project_Tracker/src/hooks/useTaskData.js)
Encapsulate task data management:
- State: `tasks`, `isLoading`, `isOffline`, `apiError`, `dataSource`, `uploadProgress`.
- Logic:
    - Initial data fetching (Google Sheets / Offline backup).
    - `handleFileUpload`: Excel file parsing and conversion.
    - `handleSave`: Update logic (API + Local).
    - `handleDelete`: Delete logic (API + Local).
- Return: `{ tasks, isLoading, isOffline, apiError, dataSource, uploadProgress, fileInputRef, handleFileUpload, handleSave, handleDelete, setTasks }`.

#### [NEW] [useFilters.js](file:///d:/code/cytesi/project_tracking_HTML_githgb/Project_Tracker/src/hooks/useFilters.js)
Encapsulate filtering and statistics logic:
- State: `filterTeam`, `filterProject`, `filterStat`, `searchQuery`, `hideCompleted`, `highlightUrgent`, `viewMode`, `ganttFilterTeam`.
- Logic:
    - `filteredTasks` (useMemo): Complex filtering logic including search and status filters.
    - `stats` (useMemo): Statistics calculation based on tasks and filters.
    - `chartData` (useMemo): Data preparation for charts.
    - `alerts` (useMemo): System alerts generation.
- Return: `{ filterTeam, setFilterTeam, filterProject, setFilterProject, ..., filteredTasks, stats, chartData, alerts }`.

### Component Layer (Modify)

#### [MODIFY] [App.jsx](file:///d:/code/cytesi/project_tracking_HTML_githgb/Project_Tracker/src/App.jsx)
- Import `useTaskData` and `useFilters`.
- Remove extracted state and useEffects.
- Use returned values from hooks to render UI.
- Focus on Layout and View switching logic.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify that `scripts/build.js` correctly bundles the new hooks and `App.jsx` without errors.
- Verify `build/index.html` size increased slightly due to modular code structure but remains valid.

### Manual Verification
- **User Action**: Open `build/index.html` in browser.
- **Verify**:
    1.  **Data Loading**: Confirm tasks load from API or LocalStorage.
    2.  **Filtering**: Test Team, Project, and Search filters.
    3.  **Statistics**: Check if the top dashboard cards update correctly.
    4.  **Editing/Saving**: Try adding a new task and check if it persists.

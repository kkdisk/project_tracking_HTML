/**
 * App Component
 * 重構後使用 hooks 管理資料與篩選
 */

// 確保 React Hooks 可用
const { useState, useEffect, useMemo, useRef } = React;
// 確保 Recharts 組件可用
const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = window.Recharts || {};

const App = () => {
    // ✅ 使用 useAuth hook 管理認證
    const { isAuthenticated, userApiKey, handleLogin, handleLogout } = useAuth();

    // ✅ UI 相關狀態
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [todayStr, setTodayStr] = useState('');
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [isMobile, setIsMobile] = useState(false);

    // ✅ Phase 1: 動態主資料
    const [dynamicTeams, setDynamicTeams] = useState([]);
    const [dynamicProjects, setDynamicProjects] = useState([]);
    const [dynamicOwners, setDynamicOwners] = useState([]);

    // 備份列表
    const TEAMS_FALLBACK = ['晶片', '機構', '軟體', '電控', '流道', '生醫', 'QA', '管理', 'issue'];
    const PROJECTS_FALLBACK = ['CKSX', 'Jamstec', 'Genentech', '5880 Chip', 'Internal', 'TBD', 'Other'];
    const OWNERS_FALLBACK = ['Anting', '宗轅', 'Jerry', '子宗', 'Jun', '慶德', 'HW', 'EE', 'RD', 'QA', 'SW', 'All', 'Unassigned'];

    const TEAMS = dynamicTeams.length > 0 ? dynamicTeams : TEAMS_FALLBACK;
    const PROJECTS = dynamicProjects.length > 0 ? dynamicProjects : PROJECTS_FALLBACK;
    const OWNERS = dynamicOwners.length > 0 ? dynamicOwners : OWNERS_FALLBACK;

    // ✅ 使用 useTaskData hook
    const {
        tasks,
        setTasks,
        isLoading,
        isOffline,
        apiError,
        dataSource,
        uploadProgress,
        fileInputRef,
        handleFileUpload,
        handleSave: taskDataHandleSave,
        handleDelete
    } = useTaskData(isAuthenticated);

    // ✅ 使用 useFilters hook
    const {
        filterTeam,
        setFilterTeam,
        filterProject,
        setFilterProject,
        filterStat,
        searchQuery,
        setSearchQuery,
        ganttFilterTeam,
        setGanttFilterTeam,
        showDependencies,
        setShowDependencies,
        viewMode,
        setViewMode,
        highlightUrgent,
        setHighlightUrgent,
        hideCompleted,
        setHideCompleted,
        stats,
        filteredTasks,
        alerts,
        chartData,
        toggleStatFilter
    } = useFilters(tasks, todayStr, apiError, dynamicTeams, TEAMS);

    // ==================== Effects ====================

    // 偵測行動裝置
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 初始化日期
    useEffect(() => {
        setTodayStr(getTaiwanToday());
        setCalendarMonth(new Date());
    }, []);

    // ✅ Phase 1: 載入動態主資料
    useEffect(() => {
        const loadMasterData = async () => {
            try {
                const teamsRes = await fetch(`${API_URL}?action=getTeams`);
                const teamsData = await teamsRes.json();
                if (teamsData.success) {
                    setDynamicTeams(teamsData.data.filter(t => t.isActive).map(t => t.teamName));
                    console.log('✅ 動態載入 Teams:', teamsData.data.length);
                }

                const projectsRes = await fetch(`${API_URL}?action=getProjects`);
                const projectsData = await projectsRes.json();
                if (projectsData.success) {
                    setDynamicProjects(projectsData.data.map(p => p.projectName));
                    console.log('✅ 動態載入 Projects:', projectsData.data.length);
                }

                const ownersRes = await fetch(`${API_URL}?action=getOwners`);
                const ownersData = await ownersRes.json();
                if (ownersData.success) {
                    setDynamicOwners(ownersData.data.filter(o => o.isActive).map(o => o.ownerName));
                    console.log('✅ 動態載入 Owners:', ownersData.data.length);
                }
            } catch (error) {
                console.error('❌ 載入主資料失敗:', error);
            }
        };
        if (isAuthenticated && !isOffline) {
            loadMasterData();
        }
    }, [isAuthenticated, isOffline]);

    // ==================== 事件處理函數 ====================

    // 包裝 handleSave 以關閉 modal
    const handleSave = (e) => {
        const success = taskDataHandleSave(e, editingTask, todayStr);
        if (success) {
            setIsModalOpen(false);
        }
    };

    // 解析相依性字串
    const parseDependencies = (depStr) => {
        if (!depStr || typeof depStr !== 'string') return [];
        return depStr.split(',').map(id => id.trim()).filter(id => id);
    };

    const changeMonth = (delta) => {
        const d = new Date(calendarMonth);
        d.setMonth(d.getMonth() + delta);
        setCalendarMonth(d);
    };

    // ==================== 渲染視圖 ====================

    if (!isAuthenticated) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-sm px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white p-2 rounded-lg"><Icon path={paths.list} /></div>
                    <h1 className="text-xl font-bold text-slate-800">Project Tracker <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">v6.9</span></h1>
                    {isLoading && <div className="flex items-center text-sm text-slate-500 gap-2 ml-4"><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full spinner"></div> 載入中...</div>}
                    {uploadProgress && <div className="flex items-center text-sm text-indigo-600 gap-2 ml-4 bg-indigo-50 px-2 py-1 rounded"><Icon path={paths.file} size={14} /> {uploadProgress}</div>}
                    {isOffline && dataSource === 'excel' && <div className="flex items-center text-sm text-emerald-600 gap-2 ml-4 bg-emerald-50 px-2 py-1 rounded"><Icon path={paths.file} size={14} /> Excel 模式</div>}
                    {isOffline && dataSource === 'google' && <div className="flex items-center text-sm text-red-500 gap-2 ml-4 bg-red-50 px-2 py-1 rounded"><Icon path={paths.alert} size={14} /> 離線</div>}
                    <div className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full hidden sm:block ml-4 flex items-center gap-1">
                        <Icon path={paths.clock} size={12} /> {todayStr}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* 視圖切換按鈕組 */}
                    <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                        <button onClick={() => setViewMode('dashboard')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`} title="列表"><Icon path={paths.list} size={16} /><span className="hidden sm:inline">列表</span></button>
                        <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`} title="日曆"><Icon path={paths.calendar} size={16} /><span className="hidden sm:inline">日曆</span></button>
                        <button onClick={() => setViewMode('gantt')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${viewMode === 'gantt' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`} title="甘特圖"><Icon path={paths.gantt} size={16} /><span className="hidden sm:inline">甘特圖</span></button>
                        {hasPermission('admin') && (
                            <button onClick={() => setViewMode('settings')} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${viewMode === 'settings' ? 'bg-indigo-100 text-indigo-700 shadow-sm ring-2 ring-indigo-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`} title="設定"><Icon path={paths.settings} size={16} /><span className="hidden sm:inline">設定</span></button>
                        )}
                    </div>
                    <div className="w-px h-8 bg-slate-300"></div>
                    {/* Excel 上傳按鈕 */}
                    <button onClick={() => fileInputRef.current?.click()} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"><Icon path={paths.file} size={16} /><span className="hidden sm:inline">上傳 Excel</span></button>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                    {/* 登出按鈕 */}
                    <button onClick={handleLogout} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200" title="登出"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg><span className="hidden sm:inline">登出</span></button>
                    <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"><Icon path={paths.plus} size={16} /><span className="hidden sm:inline">新增</span></button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Alerts */}
                {alerts.length > 0 && (
                    <div className="mb-6 grid gap-2">
                        {alerts.map((a, i) => (
                            <div key={i} className={`p-3 rounded-md border flex items-center gap-2 text-sm font-medium ${a.type === 'danger' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                                <Icon path={paths.alert} size={16} /> {a.msg}
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Content */}
                {viewMode === 'gantt' ? (
                    <>
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3 mb-6">
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><Icon path={paths.search} size={16} /></div>
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜尋任務或負責人..." className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><Icon path={paths.x} size={16} /></button>}
                            </div>
                        </div>
                        <GanttView tasks={tasks} ganttFilterTeam={ganttFilterTeam} searchQuery={searchQuery} setGanttFilterTeam={setGanttFilterTeam} setEditingTask={setEditingTask} setIsModalOpen={setIsModalOpen} setViewMode={setViewMode} isMobile={isMobile} todayStr={todayStr} showDependencies={showDependencies} setShowDependencies={setShowDependencies} TEAMS={TEAMS} />
                    </>
                ) : viewMode === 'settings' ? (
                    <SettingsView apiUrl={API_URL} />
                ) : viewMode === 'calendar' ? (
                    <CalendarView tasks={tasks} calendarMonth={calendarMonth} setCalendarMonth={setCalendarMonth} setEditingTask={setEditingTask} setIsModalOpen={setIsModalOpen} searchQuery={searchQuery} />
                ) : (
                    <Dashboard
                        tasks={tasks}
                        filteredTasks={filteredTasks}
                        stats={stats}
                        chartData={chartData}
                        isLoading={isLoading}
                        TEAMS={TEAMS}
                        PROJECTS={PROJECTS}
                        todayStr={todayStr}
                        filterTeam={filterTeam}
                        setFilterTeam={setFilterTeam}
                        filterProject={filterProject}
                        setFilterProject={setFilterProject}
                        filterStat={filterStat}
                        toggleStatFilter={toggleStatFilter}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        hideCompleted={hideCompleted}
                        setHideCompleted={setHideCompleted}
                        highlightUrgent={highlightUrgent}
                        setHighlightUrgent={setHighlightUrgent}
                        setEditingTask={setEditingTask}
                        setIsModalOpen={setIsModalOpen}
                        handleDelete={handleDelete}
                        alerts={alerts}
                    />
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <TaskModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    editingTask={editingTask}
                    onSubmit={handleSave}
                    TEAMS={TEAMS}
                    PROJECTS={PROJECTS}
                    OWNERS={OWNERS}
                    CATEGORIES={['Frontend', 'Backend', 'Database', 'DevOps', 'Testing', 'Design', 'Other']}
                />
            )}
        </div>
    );
};

// GanttView Component
// 需確保引入: React, Recharts(雖然此組件沒用), helpers.js, icons.js
// Props: tasks, ganttFilterTeam, searchQuery, setGanttFilterTeam, setEditingTask, setIsModalOpen, setViewMode, isMobile, todayStr, showDependencies, setShowDependencies (if managed externally, but here it manages its own state for showDependencies unless lifted) 

// Note: In original code, showDependencies was state in App? 
// Let's check App: line 573: const [showDependencies, setShowDependencies] = useState(false);
// So it is passed as props or context.
// In the original GanttView definition in index.html, it used showDependencies from App scope.
// So I must add showDependencies and setShowDependencies to props.

const GanttView = ({
    tasks = [],  // ✅ 添加默認空陣列，防止 undefined
    ganttFilterTeam = 'All',  // ✅ 默認值
    searchQuery = '',  // ✅ 默認空字串，防止 trim() 錯誤
    setGanttFilterTeam = () => { },
    setEditingTask = () => { },
    setIsModalOpen = () => { },
    setViewMode = () => { },
    isMobile = false,
    todayStr = new Date().toISOString().split('T')[0],
    // dependencies related
    showDependencies = false,
    setShowDependencies = () => { },
    // Constants or Data
    TEAMS = [],  // ✅ 默認空陣列
    PX_PER_DAY = 40,
    ROW_HEIGHT = 40
}) => {
    const { useState, useEffect, useMemo, useRef } = React;

    const { sortedTasks, minDate, totalDays } = useMemo(() => {
        // 先依據 Team 篩選
        let ganttTasks = tasks.filter(t => ganttFilterTeam === 'All' || (t.team && t.team === ganttFilterTeam));

        // 再依據搜尋條件篩選（支援前綴詞搜尋）
        if (searchQuery.trim()) {
            const query = searchQuery.trim();

            // 檢查是否使用前綴詞搜尋 (例如: "project:Genentech" 或 "pic:James")
            const prefixMatch = query.match(/^(project|owner|pic|team|task|note):(.*)/i);

            if (prefixMatch) {
                // 前綴詞搜尋模式
                const field = prefixMatch[1].toLowerCase();
                const searchValue = prefixMatch[2].toLowerCase();

                ganttTasks = ganttTasks.filter(t => {
                    switch (field) {
                        case 'project':
                            return t.project && String(t.project).toLowerCase().includes(searchValue);
                        case 'owner':
                        case 'pic':
                            return t.owner && String(t.owner).toLowerCase().includes(searchValue);
                        case 'team':
                            return t.team && String(t.team).toLowerCase().includes(searchValue);
                        case 'task':
                            return t.task && String(t.task).toLowerCase().includes(searchValue);
                        case 'note':
                            return t.notes && String(t.notes).toLowerCase().includes(searchValue);
                        default:
                            return false;
                    }
                });
            } else {
                // 一般搜尋模式（搜尋所有欄位）
                const lowerQuery = query.toLowerCase();
                ganttTasks = ganttTasks.filter(t => {
                    const matchTask = t.task && String(t.task).toLowerCase().includes(lowerQuery);
                    const matchOwner = t.owner && String(t.owner).toLowerCase().includes(lowerQuery);
                    const matchTeam = t.team && String(t.team).toLowerCase().includes(lowerQuery);
                    const matchProject = t.project && String(t.project).toLowerCase().includes(lowerQuery);
                    const matchNotes = t.notes && String(t.notes).toLowerCase().includes(lowerQuery);
                    return matchTask || matchOwner || matchTeam || matchProject || matchNotes;
                });
            }
        }

        const sorted = ganttTasks.sort((a, b) => new Date(getStartDate(a.date, a.duration)) - new Date(getStartDate(b.date, b.duration)));
        let min = new Date();
        let max = new Date();
        if (sorted.length > 0) {
            const dates = sorted.flatMap(t => [new Date(getStartDate(t.date, t.duration)), new Date(t.date)]);
            min = new Date(Math.min(...dates));
            max = new Date(Math.max(...dates));
        }
        min.setDate(min.getDate() - 5);
        max.setDate(max.getDate() + 15);
        const days = Math.ceil((max - min) / (1000 * 60 * 60 * 24));
        return { sortedTasks: sorted, minDate: min, totalDays: days };
    }, [tasks, ganttFilterTeam, searchQuery]);

    const getLeftPos = (dStr) => {
        const d = new Date(dStr);
        const diff = Math.ceil((d - minDate) / (1000 * 60 * 60 * 24));
        return diff * PX_PER_DAY;
    };

    const todayPos = getLeftPos(todayStr);

    const drawDependencies = () => {
        if (!showDependencies) return null;
        const lines = [];

        sortedTasks.forEach((task, taskIndex) => {
            if (!task.dependency) return;

            // 解析多個相依性
            const depIds = parseDependencies(task.dependency);

            depIds.forEach(depId => {
                const parent = sortedTasks.find(p => String(p.id) === String(depId));
                const parentIndex = sortedTasks.indexOf(parent);
                if (!parent || parentIndex === -1) return;

                const parentStartStr = getStartDate(parent.date, parent.duration);
                const parentX = getLeftPos(parentStartStr) + (parent.duration * PX_PER_DAY);
                const parentY = parentIndex * ROW_HEIGHT + 20;
                const childStartStr = getStartDate(task.date, task.duration);
                const childX = getLeftPos(childStartStr);
                const childY = taskIndex * ROW_HEIGHT + 20;

                const path = `M ${parentX} ${parentY} C ${parentX + 20} ${parentY}, ${childX - 20} ${childY}, ${childX} ${childY}`;
                lines.push(
                    <path key={`${parent.id}-${task.id}`} d={path} stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
                );
            });
        });

        return lines;
    };

    // Group days by month for the month header
    const monthHeaders = useMemo(() => {
        const headers = [];
        let currentMonth = -1;
        let monthStartDay = 0;

        for (let i = 0; i < totalDays; i++) {
            const d = new Date(minDate);
            d.setDate(d.getDate() + i);
            const month = d.getMonth();

            if (month !== currentMonth) {
                if (currentMonth !== -1) {
                    headers.push({
                        month: currentMonth,
                        year: new Date(minDate.getTime() + (monthStartDay * 24 * 60 * 60 * 1000)).getFullYear(),
                        startDay: monthStartDay,
                        daysCount: i - monthStartDay
                    });
                }
                currentMonth = month;
                monthStartDay = i;
            }
        }
        // Add last month segment
        headers.push({
            month: currentMonth,
            year: new Date(minDate.getTime() + (monthStartDay * 24 * 60 * 60 * 1000)).getFullYear(),
            startDay: monthStartDay,
            daysCount: totalDays - monthStartDay
        });

        return headers;
    }, [minDate, totalDays]);

    // Grid lines for timeline
    const gridLines = Array.from({ length: totalDays }).map((_, i) => (
        <div key={i} className={`gantt-grid-col ${i % 7 === 0 || i % 7 === 6 ? 'bg-slate-50' : ''}`} style={{ width: `${PX_PER_DAY}px` }}></div>
    ));

    // Timeline day header cells
    const timelineDayHeaders = Array.from({ length: totalDays }).map((_, i) => {
        const d = new Date(minDate);
        d.setDate(d.getDate() + i);
        return <div key={i} className={`gantt-day-cell ${d.getDay() === 0 || d.getDay() === 6 ? 'is-weekend' : ''}`} style={{ width: `${PX_PER_DAY}px` }}>{d.getDate()}</div>
    });

    // 同步滾動 refs
    const headerRef = useRef(null);
    const bodyRef = useRef(null);

    // 同步水平滾動
    useEffect(() => {
        const bodyEl = bodyRef.current;
        const headerEl = headerRef.current;

        if (!bodyEl || !headerEl) return;

        const handleBodyScroll = () => {
            if (headerEl) {
                headerEl.scrollLeft = bodyEl.scrollLeft;
            }
        };

        bodyEl.addEventListener('scroll', handleBodyScroll);
        return () => bodyEl.removeEventListener('scroll', handleBodyScroll);
    }, []);

    // 行動版友善提示
    if (isMobile) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-8 text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">建議使用桌面版瀏覽</h3>
                <p className="text-slate-600 mb-4">
                    甘特圖在大螢幕上有更好的使用體驗。<br />
                    建議您在桌上型電腦或平板橫向模式下查看。
                </p>
                <button
                    onClick={() => setViewMode('dashboard')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                    返回列表視圖
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">專案甘特圖 (Gantt)</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-2 py-1 rounded border shadow-sm">
                        <input type="checkbox" id="toggleDeps" checked={showDependencies} onChange={(e) => setShowDependencies(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="toggleDeps" className="cursor-pointer select-none">顯示連線 (Beta)</label>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {console.log('📊 Gantt TEAMS:', TEAMS) || TEAMS.map(t => (
                            <button
                                key={t}
                                onClick={() => {
                                    console.log('🔘 點擊 Team:', t, '目前篩選:', ganttFilterTeam);
                                    setGanttFilterTeam(prev => prev === t ? 'All' : t);
                                }}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${ganttFilterTeam === 'All' || ganttFilterTeam === t
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {t || '(無名稱)'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="gantt-wrapper">
                {/* Header Row */}
                <div className="gantt-header-row" ref={headerRef} style={{ overflowX: 'hidden' }}>
                    <div className="gantt-header-wrapper">
                        <div className="gantt-header-task">任務名稱</div>
                        <div className="gantt-header-timeline" style={{ width: `${totalDays * PX_PER_DAY}px` }}>
                            <div className="gantt-header-month-row">
                                {monthHeaders.map((m, idx) => (
                                    <div key={idx} className={`gantt-month-cell ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`} style={{ width: `${m.daysCount * PX_PER_DAY}px` }}>
                                        {m.year}年{m.month + 1}月
                                    </div>
                                ))}
                            </div>
                            <div className="gantt-header-day-row">
                                {timelineDayHeaders}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="gantt-body" ref={bodyRef}>
                    <div className="gantt-body-content" style={{ width: `${200 + totalDays * PX_PER_DAY}px` }}>
                        {/* Grid Background */}
                        <div className="gantt-grid-lines" style={{ width: `${totalDays * PX_PER_DAY}px` }}>{gridLines}</div>

                        {/* Today Line */}
                        {todayPos > 0 && <div className="today-line" style={{ left: `${200 + todayPos}px`, height: '100%' }}></div>}

                        {/* SVG Lines */}
                        <svg className="dependency-svg" style={{ left: '200px', width: `${totalDays * PX_PER_DAY}px`, height: `${sortedTasks.length * ROW_HEIGHT}px` }}>
                            <defs>
                                <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                    <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                                </marker>
                            </defs>
                            {drawDependencies()}
                        </svg>

                        {/* Task Rows */}
                        {sortedTasks.map(t => {
                            const start = getStartDate(t.date, t.duration);
                            const left = getLeftPos(start);
                            const width = t.duration * PX_PER_DAY;
                            const colorClass = t.project === 'PlanB' ? 'bg-emerald-500' : t.project === 'Machine' ? 'bg-purple-500' : 'bg-blue-500';

                            return (
                                <div key={t.id} className="gantt-row">
                                    <div className="gantt-task-col truncate" title={t.task}>{t.task}</div>
                                    <div className="gantt-timeline-col">
                                        <div
                                            className={`gantt-bar ${colorClass} ${t.status === 'Done' ? 'opacity-50 grayscale' : ''}`}
                                            style={{ left: `${left}px`, width: `${width}px` }}
                                            onClick={() => { setEditingTask(t); setIsModalOpen(true); }}
                                            title={`${t.task} (${t.duration}天)`}
                                        >
                                            {t.duration > 2 && <span className="text-[10px] pl-1">{t.owner}</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.GanttView = GanttView;

// Dashboard Component
// Props: tasks, filteredTasks, stats, filterTeam, setFilterTeam, filterProject, setFilterProject, filterStat, toggleStatFilter, searchQuery, setSearchQuery, hideCompleted, setHideCompleted, highlightUrgent, setHighlightUrgent, setEditingTask, setIsModalOpen, handleDelete, TEAMS, PROJECTS, chartData, isLoading, todayStr
// 需引入: React, Recharts, Icon, paths, helpers.js

const Dashboard = ({
    // Data
    tasks,
    filteredTasks,
    stats,
    chartData,
    isLoading,
    TEAMS,
    PROJECTS,
    todayStr,

    // State / Setters
    filterTeam,
    setFilterTeam,
    filterProject,
    setFilterProject, // 目前 Dashboard 沒直接用 Project Filter，但可以保留擴充
    filterStat,
    toggleStatFilter, // 從 App 傳入
    searchQuery,
    setSearchQuery,
    hideCompleted,
    setHideCompleted,
    highlightUrgent,
    setHighlightUrgent,
    setEditingTask,
    setIsModalOpen,
    handleDelete, // 需從 App 傳入

    // Alerts
    alerts
}) => {
    const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = window.Recharts || {};

    return (
        <div className="space-y-4">
            {/* Stat Cards - 1行緊湊版 */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
                {[
                    { label: '總任務', val: stats.total, color: 'text-slate-800', bgGradient: 'from-slate-50 to-slate-100', icon: '📊', type: null },
                    { label: '檢查點', val: stats.checkpoints, color: 'text-indigo-600', bgGradient: 'from-indigo-50 to-indigo-100', icon: '📍', type: 'Checkpoints' },
                    { label: '待辦急件', val: stats.pendingHigh, color: 'text-orange-600', bgGradient: 'from-orange-50 to-orange-100', icon: '⚡', type: 'Urgent' },
                    { label: '應開工未動', val: stats.lateStart, color: 'text-red-600', bgGradient: 'from-red-50 to-red-100', icon: '⏰', type: 'LateStart' },
                    { label: '已逾期', val: stats.delayed, color: 'text-rose-600', bgGradient: 'from-rose-50 to-rose-100', icon: '❌', type: 'Delayed' },
                    { label: '已完成', val: stats.completed, color: 'text-green-600', bgGradient: 'from-green-50 to-green-100', icon: '✓', type: 'Completed' }
                ].map((s, i) => (
                    <button
                        key={i}
                        onClick={() => s.type !== undefined && toggleStatFilter(s.type)}
                        className={`bg-gradient-to-br ${s.bgGradient} p-4 rounded-lg border-2 shadow-md text-left transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:scale-105 ${filterStat === s.type
                            ? 'ring-2 ring-indigo-500 border-indigo-300'
                            : 'border-transparent hover:border-slate-200'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="text-xs text-slate-600 font-medium">{s.label}</div>
                            <div className="text-xl">{s.icon}</div>
                        </div>
                        <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
                    </button>
                ))}
            </div>

            {/* 篩選與搜尋區 - 優化布局 */}
            <div className="space-y-3">
                {/* 第一行: Team 篩選按鈕 */}
                <div className="flex flex-wrap gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    {['All', ...TEAMS].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilterTeam(t)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filterTeam === t
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100 hover:shadow-sm'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* 第二行: 功能控制列 (搜尋 + 開關) */}
                <div className="flex flex-col md:flex-row gap-3">
                    {/* 搜尋框 */}
                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                            <Icon path={paths.search} size={16} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜尋任務、負責人、備註..."
                            className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm h-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <Icon path={paths.x} size={16} />
                            </button>
                        )}
                    </div>

                    {/* 控制開關群組 */}
                    <div className="flex gap-3">
                        {/* 隱藏已完成 */}
                        <label className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg border shadow-sm cursor-pointer whitespace-nowrap h-10 hover:bg-slate-50">
                            <input
                                type="checkbox"
                                checked={hideCompleted}
                                onChange={(e) => setHideCompleted(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2"
                            />
                            <span className="font-medium">隱藏已完成</span>
                        </label>

                        {/* 高亮開關 */}
                        <div className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg border shadow-sm h-10 hover:bg-slate-50">
                            <input
                                type="checkbox"
                                id="highlightUrgent"
                                checked={highlightUrgent}
                                onChange={(e) => setHighlightUrgent(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="highlightUrgent" className="text-slate-600 cursor-pointer select-none whitespace-nowrap font-medium">
                                強調延遲/應開工
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* 搜尋結果提示 */}
            {searchQuery && (
                <div className="px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-indigo-700 flex items-center gap-2">
                        <Icon path={paths.search} size={14} />
                        搜尋「<strong>{searchQuery}</strong>」找到 <strong>{filteredTasks.length}</strong> 個結果
                    </span>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                    >
                        清除搜尋
                    </button>
                </div>
            )}

            {filteredTasks.length === 0 && !isLoading ? (
                <div className="p-12 text-center bg-white rounded-xl border shadow-sm">
                    <div className="text-slate-300 mb-4"><Icon path={paths.list} size={48} className="mx-auto" /></div>
                    <h3 className="text-lg font-bold text-slate-600 mb-2">沒有符合條件的任務</h3>
                    <p className="text-slate-400">請調整篩選條件或新增任務</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                                <tr>
                                    <th className="px-4 py-4 text-left font-semibold text-slate-700 w-44">ID</th>
                                    <th className="px-4 py-4 text-left font-semibold text-slate-700 w-32">狀態</th>
                                    <th className="px-4 py-4 text-left font-semibold text-slate-700">任務</th>
                                    <th className="px-4 py-4 text-left font-semibold text-slate-700 w-36">工時/建議開始</th>
                                    <th className="px-4 py-4 text-left font-semibold text-slate-700 w-28">完成日</th>
                                    <th className="px-4 py-4 text-left font-semibold text-slate-700 w-20">負責人</th>
                                    <th className="px-4 py-4 text-right font-semibold text-slate-700 w-24">動作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date)).map(t => (
                                    <tr
                                        key={t.id}
                                        className={`hover:bg-slate-50 group transition-all duration-150 ${t.isCheckpoint ? 'bg-indigo-50/50' : ''} ${getRowHighlight(t, highlightUrgent, todayStr)}`}
                                        tabIndex={0}
                                    >
                                        <td className="px-4 py-4">
                                            <div className="font-mono text-xs text-slate-600 font-semibold">#{t.id}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {getStatusBadge(t, todayStr)}
                                            <div className={`text-[10px] mt-1.5 px-2 py-0.5 w-fit rounded-full border font-medium ${getTeamBadgeClass(t.team)}`}>{t.team}</div>
                                            {t.project && <div className={`text-[10px] mt-1 px-2 py-0.5 w-fit rounded-md border font-medium ${getProjectColor(t.project)}`}>{t.project}</div>}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-slate-900 flex items-center gap-2">
                                                {t.isCheckpoint && <Icon path={paths.flag} size={14} className="text-indigo-600 fill-indigo-100 flex-shrink-0" />}
                                                <span className="line-clamp-2">{t.task}</span>
                                                {t.dependency && <div className="tooltip-container flex-shrink-0"><Icon path={paths.link} size={12} className="text-slate-400" /><span className="tooltip-text">前置任務: {parseDependencies(t.dependency).map(id => `#${id}`).join(', ')}</span></div>}
                                                {t.notes && <div className="tooltip-container flex-shrink-0"><Icon path={paths.file} size={12} className="text-slate-400" /><span className="tooltip-text">{t.notes}</span></div>}
                                            </div>
                                            {t.priority === 'High' && <span className="text-[10px] text-orange-600 font-bold mt-1 inline-block">⚡ 急件</span>}
                                        </td>
                                        <td className="px-4 py-4 text-slate-600">
                                            <div className="flex items-center gap-1.5"><Icon path={paths.timer} size={14} className="text-slate-400" /> <span className="font-medium">{t.duration}</span> 天</div>
                                            <div className="text-[10px] text-slate-400 mt-1">Start: {getStartDate(t.date, t.duration)}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-slate-700">{t.date}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm">
                                                {t.owner ? t.owner[0] : '?'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                <button
                                                    onClick={() => { setEditingTask(t); setIsModalOpen(true); }}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    title="編輯"
                                                >
                                                    <Icon path={paths.edit} size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="刪除"
                                                >
                                                    <Icon path={paths.trash} size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 圓餅圖 - 移到任務列表下方 */}
            <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <span>📊</span>
                        專案分布
                    </h3>
                    <div className="text-xs text-slate-500">
                        依Team分類統計
                    </div>
                </div>
                <div className="h-80">
                    {window.Recharts && (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                >
                                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

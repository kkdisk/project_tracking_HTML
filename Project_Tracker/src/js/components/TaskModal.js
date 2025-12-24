// TaskModal Component
// Props: isOpen, onClose, editingTask, onSubmit, TEAMS, PROJECTS, OWNERS, CATEGORIES
// 需要引入: React (if needed for refs), icons.js

const TaskModal = ({
    isOpen,
    onClose,
    editingTask,
    onSubmit,
    TEAMS,
    PROJECTS,
    OWNERS,
    CATEGORIES
}) => {
    const { useState, useEffect } = React;
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] animate-fade-in overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50 flex-shrink-0">
                    <h3 id="modal-title" className="font-bold text-slate-800">{editingTask ? '編輯任務' : '新增任務'}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                        aria-label="關閉對話框"
                    >
                        <Icon path={paths.x} />
                    </button>
                </div>
                {/* 可滾動內容區 */}
                <div className="overflow-y-auto flex-1">
                    <form onSubmit={onSubmit} id="task-form" className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">任務內容 <span className="text-red-500">*</span></label>
                            <input name="task" defaultValue={editingTask?.task} required className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>

                        {/* 基本資訊區塊 */}
                        <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                            <h4 className="text-xs font-semibold text-slate-600 uppercase">基本資訊</h4>

                            {/* Project */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    專案 (Project) <span className="text-red-500">*</span>
                                </label>
                                <select name="project" defaultValue={editingTask?.project || PROJECTS[0]} required className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500">
                                    {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            {/* Team */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Team <span className="text-red-500">*</span></label>
                                <select name="team" defaultValue={editingTask?.team || '晶片'} className="w-full border rounded-lg p-2 text-sm">
                                    {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">負責人 <span className="text-red-500">*</span></label>
                                    <input list="owners" name="owner" defaultValue={editingTask?.owner} required className="w-full border rounded-lg p-2 text-sm" />
                                    <datalist id="owners">{OWNERS.map(o => <option key={o} value={o} />)}</datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">預計工時 (天)</label>
                                    <input type="number" name="duration" defaultValue={editingTask?.duration || 1} min="0" className="w-full border rounded-lg p-2 text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* 時間規劃區塊 */}
                        <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                            <h4 className="text-xs font-semibold text-slate-600 uppercase">時間規劃</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">開始日期</label>
                                    <input type="date" name="startDate" defaultValue={editingTask?.startDate || ''} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">完成日 <span className="text-red-500">*</span></label>
                                    <input type="date" name="date" defaultValue={editingTask?.date || todayStr} required className="w-full border rounded-lg p-2 text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* 狀態與優先級區塊 */}
                        <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                            <h4 className="text-xs font-semibold text-slate-600 uppercase">狀態與優先級</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">狀態</label>
                                    <select name="status" defaultValue={editingTask?.status || 'Todo'} className="w-full border rounded-lg p-2 text-sm">
                                        <option value="Todo">待執行</option>
                                        <option value="InProgress">進行中</option>
                                        <option value="Pending">暫停/等待</option>
                                        <option value="Done">完成</option>
                                        <option value="Closed">不執行/取消</option>
                                        <option value="Delayed">延誤</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">優先級</label>
                                    <select name="priority" defaultValue={editingTask?.priority || 'Medium'} className="w-full border rounded-lg p-2 text-sm">
                                        <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 關聯資訊區塊 */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">前置任務 / 相依性 (Dependency)</label>
                                <input name="dependency" defaultValue={editingTask?.dependency} placeholder="輸入前置任務 ID，多個請用逗號分隔 (例如: 5,12,18)" className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                <p className="text-xs text-slate-500 mt-1">💡 提示:可填寫多個 ID,用逗號分隔,最多 10 個</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">驗證方式 (Verification)</label>
                                <textarea name="verification" defaultValue={editingTask?.verification} rows="2" placeholder="如何驗證此任務已完成? 例如: 通過測試、客戶簽收、文件審核..." className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">備註 (Notes)</label>
                                <textarea name="notes" defaultValue={editingTask?.notes} rows="2" placeholder="詳細說明..." className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                            </div>
                        </div>

                        {/* 特殊標記區塊 */}
                        <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
                            <h4 className="text-xs font-semibold text-slate-600 uppercase">特殊標記</h4>

                            {/* Checkpoint複選框 */}
                            <div className="flex items-center gap-3">
                                <div className="checkbox-container">
                                    <input type="checkbox" name="isCheckpoint" id="chk" defaultChecked={editingTask?.isCheckpoint} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 transition-all" />
                                    <label htmlFor="chk" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer transition-all"></label>
                                </div>
                                <label htmlFor="chk" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1">設為檢查點 (Checkpoint) <Icon path={paths.flag} size={14} /></label>
                            </div>

                            {/* Issue Pool複選框 */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="issuePool"
                                    id="issuePool"
                                    defaultChecked={editingTask?.issuePool || false}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                />
                                <label htmlFor="issuePool" className="text-sm font-medium text-slate-700 cursor-pointer">
                                    🔖 加入Issue認領區
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* 固定按鈕區 */}
                <div className="p-4 border-t bg-white flex justify-end gap-2 flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm">取消</button>
                    <button type="submit" form="task-form" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm">儲存</button>
                </div>
            </div>
        </div>
    );
};

window.TaskModal = TaskModal;

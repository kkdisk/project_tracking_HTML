/**
 * useTaskData Hook
 * 管理任務資料的載入、上傳、儲存和刪除
 */

function useTaskData(isAuthenticated) {
    // State
    const [tasks, setTasks] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isOffline, setIsOffline] = React.useState(false);
    const [apiError, setApiError] = React.useState(null);
    const [dataSource, setDataSource] = React.useState('google');
    const [uploadProgress, setUploadProgress] = React.useState('');
    const fileInputRef = React.useRef(null);

    // 載入任務資料
    React.useEffect(() => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        const fetchData = async () => {
            try {
                setApiError(null);
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 8000);
                const response = await fetch(API_URL + '?action=read', { signal: controller.signal });
                clearTimeout(id);
                if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
                const result = await response.json();

                console.log('===== Google Sheets 資料除錯 =====');
                console.log('API完整回應:', result);

                const data = result.data || result;

                console.log('資料筆數:', data.length);
                if (data.length > 0) {
                    console.log('第一筆資料:', data[0]);
                    console.log('欄位名稱:', Object.keys(data[0]));
                }

                if (Array.isArray(data) && data.length > 0) {
                    const firstItem = data[0];
                    const isUTMFormat = firstItem.hasOwnProperty('ID') || firstItem.hasOwnProperty('Task');

                    console.log('資料格式:', isUTMFormat ? 'UnifiedTaskManager' : 'Project Tracker');

                    let formatted;
                    if (isUTMFormat) {
                        const convertResult = convertUTMToTracker(data);
                        formatted = convertResult.data;
                        console.log('轉換結果:', convertResult.stats);
                    } else {
                        formatted = data.map(item => ({
                            ...item,
                            id: item.id,
                            duration: Number(item.duration),
                            isCheckpoint: item.isCheckpoint === true || item.isCheckpoint === "TRUE",
                            date: normalizeDate(item.date),
                            dependency: item.dependency || '',
                            notes: item.notes || '',
                            category: item.category || item.team || 'Mechanism'
                        }));
                    }
                    setTasks(formatted);
                    setDataSource('google');
                    setIsOffline(false);
                } else {
                    setTasks(INITIAL_DATA);
                    setIsOffline(false);
                }

            } catch (err) {
                console.error("API Error:", err);
                let errorMsg = '未知錯誤';

                if (err.name === 'AbortError') {
                    errorMsg = '連線逾時 (超過8秒)';
                } else if (err.message.includes('Failed to fetch')) {
                    errorMsg = '網路連線失敗，請檢查網路';
                } else if (err.message.includes('HTTP Error')) {
                    errorMsg = `伺服器錯誤: ${err.message}`;
                } else {
                    errorMsg = err.message;
                }

                setApiError(errorMsg);

                const backup = localStorage.getItem('tasks_backup');
                if (backup) {
                    try {
                        const backupTasks = JSON.parse(backup);
                        const backupTime = localStorage.getItem('tasks_backup_time');
                        setTasks(backupTasks);
                        setApiError(`${errorMsg} - 使用本地備份 (${new Date(backupTime).toLocaleString('zh-TW')})`);
                    } catch (e) {
                        setTasks(INITIAL_DATA);
                    }
                } else {
                    setTasks(INITIAL_DATA);
                }
                setIsOffline(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [isAuthenticated]);

    // Excel 檔案上傳處理
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
            alert('檔案格式不支援！請上傳 Excel (.xlsx, .xls) 或 CSV (.csv) 檔案');
            return;
        }

        setIsLoading(true);
        setUploadProgress(`正在讀取 ${file.name}...`);

        try {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    setUploadProgress('正在解析檔案...');

                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });

                    setUploadProgress('正在轉換資料格式...');

                    const result = convertUTMToTracker(jsonData);

                    if (!result.success) {
                        const errorMsg = result.errors.join('\n');
                        if (result.data.length > 0) {
                            alert(`部分資料轉換失敗:\n${errorMsg}\n\n已成功載入 ${result.stats.converted} / ${result.stats.total} 筆任務`);
                        } else {
                            throw new Error(`資料轉換失敗:\n${errorMsg}`);
                        }
                    }

                    if (result.data.length === 0) {
                        throw new Error('檔案中沒有有效的任務資料');
                    }

                    setTasks(result.data);
                    setDataSource('excel');
                    setIsOffline(true);
                    setApiError(null);

                    try {
                        localStorage.setItem('tasks_backup', JSON.stringify(result.data));
                        localStorage.setItem('tasks_backup_time', new Date().toISOString());
                        localStorage.setItem('tasks_backup_source', file.name);
                    } catch (e) {
                        console.warn('本地儲存失敗:', e);
                    }

                    setUploadProgress(`✓ 成功載入 ${result.data.length} 筆任務 (來自 ${file.name})`);
                    setTimeout(() => setUploadProgress(''), 3000);

                } catch (parseError) {
                    console.error('解析錯誤:', parseError);
                    alert(`檔案解析失敗: ${parseError.message}`);
                    setUploadProgress('');
                } finally {
                    setIsLoading(false);
                }
            };

            reader.onerror = (error) => {
                console.error('檔案讀取錯誤:', error);
                alert('檔案讀取失敗，請重試');
                setUploadProgress('');
                setIsLoading(false);
            };

            reader.readAsArrayBuffer(file);

        } catch (error) {
            console.error('上傳錯誤:', error);
            alert(`上傳失敗: ${error.message}`);
            setUploadProgress('');
            setIsLoading(false);
        }
    };

    // 處理儲存
    const handleSave = (e, editingTask, todayStr) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const defaultDate = getTaiwanToday();

        const isEditing = !!editingTask;
        const newItem = {
            ...(isEditing && { id: editingTask.id }),
            project: fd.get('project'),
            team: fd.get('team'),
            task: fd.get('task'),
            owner: fd.get('owner'),
            startDate: fd.get('startDate') || '',
            date: fd.get('date') || defaultDate,
            duration: parseInt(fd.get('duration') || 0),
            isCheckpoint: fd.get('isCheckpoint') === 'on',
            issuePool: fd.get('issuePool') === 'on',
            priority: fd.get('priority'),
            status: fd.get('status'),
            dependency: fd.get('dependency'),
            verification: fd.get('verification'),
            notes: fd.get('notes')
        };

        const validationErrors = validateTask(newItem);
        if (validationErrors.length > 0) {
            alert('驗證失敗:\n' + validationErrors.join('\n'));
            return;
        }

        if (isEditing) {
            const depErrors = validateDependencies(newItem.dependency, newItem.id, tasks);
            if (depErrors.length > 0) {
                alert('相依性驗證失敗:\n' + depErrors.join('\n'));
                return;
            }
            if (newItem.dependency && detectCircularDependency(newItem.id, newItem.dependency, tasks)) {
                alert('錯誤：偵測到循環相依性！');
                return;
            }
        }

        let updatedTasks = tasks;
        if (isEditing) {
            updatedTasks = tasks.map(t => t.id === newItem.id ? newItem : t);
            setTasks(updatedTasks);
        }

        if (isEditing) {
            try {
                localStorage.setItem('tasks_backup', JSON.stringify(updatedTasks));
                localStorage.setItem('tasks_backup_time', new Date().toISOString());
            } catch (e) {
                console.warn('本地儲存失敗:', e);
            }
        }

        if (!isOffline) {
            const payload = {
                action: isEditing ? 'update' : 'upsert',
                data: newItem
            };

            fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payload)
            })
                .then(() => {
                    console.log('✅ 已發送至 Google Sheets');
                    if (!isEditing) {
                        setIsLoading(true);
                        setTimeout(() => {
                            fetch(API_URL + '?action=read')
                                .then(res => res.json())
                                .then(result => {
                                    const data = result.data || result;
                                    if (Array.isArray(data) && data.length > 0) {
                                        const formatted = data.map(item => ({
                                            ...item,
                                            id: item.id,
                                            duration: Number(item.duration),
                                            isCheckpoint: item.isCheckpoint === true || item.isCheckpoint === "TRUE",
                                            date: normalizeDate(item.date),
                                            dependency: item.dependency || '',
                                            notes: item.notes || '',
                                            category: item.category || item.team || 'Mechanism'
                                        }));
                                        setTasks(formatted);
                                    }
                                })
                                .finally(() => setIsLoading(false));
                        }, 1000);
                    }
                })
                .catch(err => {
                    console.error("❌ 發送失敗:", err);
                    alert('儲存到 Google Sheets 時發生錯誤，但本地已更新');
                });
        }

        return true; // 表示儲存成功，由 App 關閉 modal
    };

    const handleDelete = (id) => {
        if (!confirm('確定要刪除此任務嗎？(將同步刪除 Google Sheet 資料)')) return;
        setTasks(prev => prev.filter(x => x.id !== id));

        if (!isOffline) {
            fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'delete', data: { id: id } })
            })
                .then(() => console.log('✅ 刪除成功'))
                .catch(err => console.error("❌ Delete Error:", err));
        }
    };

    return {
        tasks,
        setTasks,
        isLoading,
        setIsLoading,
        isOffline,
        apiError,
        dataSource,
        uploadProgress,
        fileInputRef,
        handleFileUpload,
        handleSave,
        handleDelete
    };
}

// 導出到 window
window.useTaskData = useTaskData;

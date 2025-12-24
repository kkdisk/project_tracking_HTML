/**
 * LoginScreen 組件
 * 用於 API Key 驗證的登入畫面
 */

const LoginScreen = ({ onLogin }) => {
    const [inputKey, setInputKey] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!inputKey.trim()) {
            setError('請輸入訪問密鑰');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // 驗證 API Key（通過發送測試請求）
            const response = await fetch(`${API_URL}?action=ping`);
            const result = await response.json();

            if (result.success) {
                // API Key 格式驗證
                const validKeys = [
                    'cytesi-admin-2025-Q1',
                    'cytesi-editor-2025-Q1',
                    'cytesi-viewer-2025-Q1'
                ];

                if (validKeys.includes(inputKey.trim())) {
                    // 儲存到 localStorage
                    localStorage.setItem('apiKey', inputKey.trim());
                    onLogin(inputKey.trim());
                } else {
                    setError('無效的訪問密鑰，請檢查後重試');
                }
            } else {
                setError('無法連接到伺服器，請稍後重試');
            }
        } catch (err) {
            console.error('登入錯誤:', err);
            setError('驗證失敗，請檢查網路連線');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
            {/* 背景裝飾 */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* 登入卡片 */}
            <div className="relative bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
                {/* Logo 區域 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Project Tracker</h1>
                    <p className="text-slate-600 text-sm">請輸入訪問密鑰以繼續</p>
                </div>

                {/* 表單 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 輸入框 */}
                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-2">
                            訪問密鑰
                        </label>
                        <input
                            id="apiKey"
                            type="password"
                            value={inputKey}
                            onChange={(e) => {
                                setInputKey(e.target.value);
                                setError('');
                            }}
                            placeholder="請輸入您的 API Key"
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder-slate-400"
                            disabled={isLoading}
                            autoFocus
                        />
                    </div>

                    {/* 錯誤訊息 */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-shake">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* 登入按鈕 */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-100 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>驗證中...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                <span>登入</span>
                            </>
                        )}
                    </button>
                </form>

                {/* 提示訊息 */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-600 text-center">
                        <span className="font-medium">提示：</span> 如需訪問權限，請聯繫系統管理員獲取 API Key
                    </p>
                </div>

                {/* 版本資訊 */}
                <div className="mt-4 text-center text-xs text-slate-400">
                    v6.9 | Powered by CyteSi
                </div>
            </div>

            {/* CSS 動畫 */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
};

window.LoginScreen = LoginScreen;

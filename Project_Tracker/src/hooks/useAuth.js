/**
 * useAuth Hook
 * 管理使用者認證狀態
 */

// 確保 React Hooks 可用
const { useState, useEffect } = React;

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userApiKey, setUserApiKey] = useState('');

    // 檢查是否已登入（從 localStorage）
    useEffect(() => {
        const savedKey = localStorage.getItem('apiKey');
        if (savedKey) {
            setUserApiKey(savedKey);
            setIsAuthenticated(true);
        }
    }, []);

    // 登入處理
    const handleLogin = (apiKey) => {
        setUserApiKey(apiKey);
        setIsAuthenticated(true);
        // 重新整理以載入資料
        window.location.reload();
    };

    // 登出處理
    const handleLogout = () => {
        localStorage.removeItem('apiKey');
        setIsAuthenticated(false);
        setUserApiKey('');
    };

    return {
        isAuthenticated,
        userApiKey,
        handleLogin,
        handleLogout
    };
};

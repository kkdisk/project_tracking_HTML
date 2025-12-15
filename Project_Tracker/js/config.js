/**
 * 配置檔案
 * config.js
 */

// API 配置
const API_URL = "https://script.google.com/macros/s/AKfycbxXrSwPBhGcyGhWc8Q4zAeCcugafQhunMX7tWAZHA73gUUzBiRIp95s2ZfWAV4ppkJK/exec";

// 🔐 API Key 驗證（動態從 localStorage 讀取）
// 用戶登入後會儲存到 localStorage
const getApiKey = () => {
    return localStorage.getItem('apiKey') || '';
};

// 為了向後相容，保留 API_KEY 變數
const API_KEY = getApiKey();

// 🔐 權限檢查工具函數
const API_KEY_PERMISSIONS = {
    'cytesi-admin-2025-Q1': 'admin',
    'cytesi-editor-2025-Q1': 'editor',
    'cytesi-viewer-2025-Q1': 'viewer'
};

/**
 * 獲取當前用戶的權限層級
 * @returns {string} 'admin' | 'editor' | 'viewer' | 'guest'
 */
const getUserPermission = () => {
    const apiKey = getApiKey();
    return API_KEY_PERMISSIONS[apiKey] || 'guest';
};

/**
 * 檢查是否滿足所需權限
 * @param {string} requiredPermission - 所需權限層級
 * @returns {boolean}
 */
const hasPermission = (requiredPermission) => {
    const hierarchy = {
        'admin': 3,
        'editor': 2,
        'viewer': 1,
        'guest': 0
    };

    const userPermission = getUserPermission();
    const required = hierarchy[requiredPermission] || 0;
    const current = hierarchy[userPermission] || 0;

    return current >= required;
};




// 常數
const PX_PER_DAY = 40;
const ROW_HEIGHT = 40;

// 預設資料 (Fallback)
const TEAMS = ['晶片', '機構', '軟體', '電控', '流道', '生醫', 'QA', '管理', 'issue'];
const PROJECTS = ['CKSX', 'Jamstec', 'Genentech', '5880 Chip', 'Internal', 'TBD', 'Other'];
const OWNERS = ['Anting', 'James', 'Weber', 'Allen', 'Yoyo', 'Dean']; // 預設名單，會被 API 覆蓋

const CATEGORIES = ['Mechanism', 'Electrical', 'Software', 'QA', 'Design', 'Flow'];

// 初始資料（可選）
const INITIAL_DATA = [];

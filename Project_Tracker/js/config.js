/**
 * 配置檔案
 * config.js
 */

// API 配置
const API_URL = "https://script.google.com/macros/s/AKfycbxXrSwPBhGcyGhWc8Q4zAeCcugafQhunMX7tWAZHA73gUUzBiRIp95s2ZfWAV4ppkJK/exec";

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

/**
 * 任務管理系統 - Google Apps Script API (v2.0)
 * 新增: Phase 1 系統管理介面
 */

// ==================== 設定區 ====================
const SHEET_NAME = '工作表1';  // ⚠️ 請改為您實際的Sheet名稱
const SEQUENCE_SHEET_NAME = '序號管理';
const SETTINGS_TEAMS_SHEET = '系統設定_Teams';
const SETTINGS_PROJECTS_SHEET = '系統設定_Projects';
const SETTINGS_OWNERS_SHEET = '系統設定_Owners';

const HEADER_ROW = 1;
const DATA_START_ROW = 2;

const COLUMNS = {
  ID: 1, Legacy_ID: 2, Team: 3, Project: 4, Purpose: 5,
  Task: 6, PIC: 7, Issue_Date: 8, Start_Date: 9,
  Due_Date: 10, Workday: 11, Status: 12, Priority: 13,
  Dependencies: 14, Verification: 15, Notes: 16,
  Is_Checkpoint: 17, Issue_Pool: 18, Impact: 19,
  Risk: 20, Urgency: 21, Last_Updated: 22
};

// ==================== 觸發器函數 ====================

/**
 * 自動更新 Last_Updated 時間戳
 * 當任何儲存格被編輯時觸發
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  
  // 只在主工作表上觸發
  if (sheetName !== SHEET_NAME) return;
  
  const range = e.range;
  const row = range.getRow();
  
  // 跳過表頭列
  if (row === 1) return;
  
  // 如果編輯的不是Last_Updated欄位本身
  if (range.getColumn() !== COLUMNS.Last_Updated) {
    const timestamp = new Date();
    sheet.getRange(row, COLUMNS.Last_Updated).setValue(timestamp);
  }
}

// ==================== 🔐 API Key 驗證與授權 ====================

/**
 * 有效的 API Keys
 * 定期更換以確保安全性
 */
const VALID_API_KEYS = [
    'cytesi-admin-2025-Q1',      // Admin Key - 完整權限
    'cytesi-editor-2025-Q1',     // Editor Key - 可編輯任務
    'cytesi-viewer-2025-Q1'      // Viewer Key - 僅查看
];

/**
 * API Key 對應的權限層級
 */
const API_KEY_PERMISSIONS = {
    'cytesi-admin-2025-Q1': 'admin',
    'cytesi-editor-2025-Q1': 'editor',
    'cytesi-viewer-2025-Q1': 'viewer'
};

/**
 * 驗證 API Key
 * @param {string} apiKey - 從請求中傳來的 API Key
 * @returns {Object} {valid: boolean, permission: string}
 */
function validateApiKey(apiKey) {
    if (!apiKey) {
        Logger.log('⚠️ API Key missing');
        return { valid: false, permission: 'guest' };
    }
    
    if (VALID_API_KEYS.indexOf(apiKey) !== -1) {
        const permission = API_KEY_PERMISSIONS[apiKey] || 'viewer';
        Logger.log('✅ API Key valid: ' + permission);
        return {
            valid: true,
            permission: permission
        };
    }
    
    Logger.log('❌ API Key invalid: ' + apiKey);
    return { valid: false, permission: 'guest' };
}

/**
 * 權限檢查
 * @param {string} requiredPermission - 所需權限層級
 * @param {string} userPermission - 用戶當前權限
 * @returns {boolean}
 */
function hasPermission(requiredPermission, userPermission) {
    const hierarchy = {
        'admin': 3,
        'editor': 2,
        'viewer': 1,
        'guest': 0
    };
    
    const required = hierarchy[requiredPermission] || 0;
    const current = hierarchy[userPermission] || 0;
    
    return current >= required;
}




// ==================== Task ID 生成 ====================
const DEPT_CODES = {
  '晶片': 'CHIP',
  '機構': 'MECH',
  '軟體': 'SW',
  '電控': 'EC',
  '流道': 'FLOW',
  '生醫': 'BIO',
  'QA': 'QA',
  '管理': 'MGT',
  'issue': 'ISS'
};

function generateTaskId(team, createdDate) {
  try {
    const deptCode = DEPT_CODES[team];
    if (!deptCode) {
      throw new Error(`無效的Team: ${team}`);
    }
    
    const date = createdDate ? new Date(createdDate) : new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const sequence = getNextSequence(deptCode, year, month);
    
    const taskId = `${deptCode}-${year}-${String(month).padStart(2, '0')}-${String(sequence).padStart(4, '0')}`;
    
    Logger.log(`✅ 生成Task ID: ${taskId}`);
    return taskId;
    
  } catch (error) {
    Logger.log(`❌ generateTaskId錯誤: ${error}`);
    throw error;
  }
}

function getNextSequence(deptCode, year, month) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let seqSheet = ss.getSheetByName(SEQUENCE_SHEET_NAME);
  
  if (!seqSheet) {
    seqSheet = ss.insertSheet(SEQUENCE_SHEET_NAME);
    seqSheet.appendRow(['Dept_Code', 'Year', 'Month', 'Last_Sequence']);
    seqSheet.getRange('A1:D1').setFontWeight('bold');
    Logger.log(`🆕 建立序號管理工作表: ${SEQUENCE_SHEET_NAME}`);
  }
  
  const data = seqSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === deptCode && 
        data[i][1] === year && 
        data[i][2] === month) {
      const newSeq = data[i][3] + 1;
      seqSheet.getRange(i + 1, 4).setValue(newSeq);
      Logger.log(`📈 ${deptCode}-${year}-${month} 序號: ${newSeq}`);
      return newSeq;
    }
  }
  
  seqSheet.appendRow([deptCode, year, month, 1]);
  Logger.log(`🆕 創建新序號記錄: ${deptCode}-${year}-${month}`);
  return 1;
}

// ==================== 輔助函數 ====================

/**
 * 創建帶有 CORS 標頭的 JSON 響應
 * @param {Object} data - 響應數據
 * @param {number} statusCode - HTTP 狀態碼（可選）
 * @returns {TextOutput} ContentService 輸出對象
 */
function createJsonResponse(data, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 可選：設置 HTTP 狀態碼（但 Apps Script 對此支援有限）
  if (statusCode) {
    Logger.log(`⚠️ HTTP Status Code ${statusCode} (僅供記錄，Apps Script 無法直接設置)`);
  }
  
  return output;
}

// ==================== API端點 ====================


/**
 * 處理 CORS Preflight 請求
 * 瀏覽器在發送 POST 請求前會先發送 OPTIONS 請求
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    .setHeader('Access-Control-Max-Age', '86400'); // 24小時
}

function doGet(e) {
  try {
    const action = e.parameter.action || 'read';
    
    // 系統設定 API
    if (action === 'getTeams') {
      return createJsonResponse({ success: true, data: getTeams() });
    }
    if (action === 'getProjects') {
      return createJsonResponse({ success: true, data: getProjects() });
    }
    if (action === 'getOwners') {
      return createJsonResponse({ success: true, data: getOwners() });
    }
    
    // 原有 API
    if (action === 'read') {
      const data = getAllTasks();
      return createJsonResponse({ 
        success: true, 
        data: data, 
        count: data.length,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'ping') {
      return createJsonResponse({ 
        success: true, 
        message: '✅ API運作正常', 
        timestamp: new Date().toISOString() 
      });
    }
    
    return createJsonResponse({ 
      success: false, 
      error: `未知的action參數: ${action}` 
    }, 400);
    
  } catch (error) {
    Logger.log('doGet Error: ' + error);
    return createJsonResponse({ 
      success: false, 
      error: error.toString(),
      stack: error.stack 
    }, 500);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.data;
    
    Logger.log('📥 收到請求: ' + action);
    Logger.log('📦 資料: ' + JSON.stringify(payload));
    
    // Teams API
    if (action === 'addTeam') {
      return createJsonResponse(addTeam(payload));
    }
    if (action === 'updateTeam') {
      return createJsonResponse(updateTeam(payload));
    }
    if (action === 'deleteTeam') {
      return createJsonResponse(deleteTeam(payload));  // ✅ 傳遞整個 payload（含 id 和 apiKey）
    }
    
    // Projects API
    if (action === 'addProject') {
      return createJsonResponse(addProject(payload));
    }
    if (action === 'updateProject') {
      return createJsonResponse(updateProject(payload));
    }
    if (action === 'deleteProject') {
      return createJsonResponse(deleteProject(payload.id));
    }
    
    // Owners API
    if (action === 'addOwner') {
      return createJsonResponse(addOwner(payload));
    }
    if (action === 'updateOwner') {
      return createJsonResponse(updateOwner(payload));
    }
    if (action === 'deleteOwner') {
      return createJsonResponse(deleteOwner(payload.id));
    }
    
    // 原有任務 API
    if (action === 'create' || action === 'update' || action === 'upsert') {
      const message = upsertTask(payload);
      Logger.log('✅ ' + message);
      return createJsonResponse({ success: true, message: message });
    }
    
    if (action === 'delete') {
      const message = deleteTask(payload.id || data.id);
      return createJsonResponse({ success: true, message: message });
    }
    
    Logger.log('❌ 未知action: ' + action);
    return createJsonResponse({ success: false, error: `未知的action: ${action}` }, 400);
    
  } catch (error) {
    Logger.log('❌ doPost錯誤: ' + error.toString());
    return createJsonResponse({ success: false, error: error.toString() }, 500);
  }
}

// ==================== 系統設定 - Teams ====================
function getTeams() {
  const sheet = getSettingsSheet(SETTINGS_TEAMS_SHEET);
  const data = sheet.getDataRange().getValues();
  const teams = [];
  
  for (let i = 1; i < data.length; i++) {
    teams.push({
      id: data[i][0],
      teamName: data[i][1],
      deptCode: data[i][2],
      isActive: data[i][3],
      createdDate: formatDate(data[i][4]),
      updatedDate: formatDate(data[i][5])
    });
  }
  
  Logger.log(`✅ 讀取 ${teams.length} 個 Teams`);
  return teams;
}

function addTeam(teamData) {
  // 🔐 權限檢查
  const apiKey = teamData.apiKey;
  const auth = validateApiKey(apiKey);
  
  if (!hasPermission('admin', auth.permission)) {
    return {
      success: false,
      error: '權限不足：需要管理員權限才能新增 Team'
    };
  }
  
  const sheet = getSettingsSheet(SETTINGS_TEAMS_SHEET);
  const lastRow = sheet.getLastRow();
  const newId = lastRow > 0 ? lastRow : 1;
  const now = new Date();
  
  // Debug 日誌
  Logger.log(`📝 addTeam 收到參數類型: ${typeof teamData}`);
  Logger.log(`📝 teamData: ${JSON.stringify(teamData)}`);
  Logger.log(`📝 teamName 值: ${teamData.teamName}, 類型: ${typeof teamData.teamName}`);
  Logger.log(`📝 deptCode 值: ${teamData.deptCode}, 類型: ${typeof teamData.deptCode}`);
  
  // 檢查是否重複
  const existing = getTeams();
  if (existing.some(t => t.teamName === teamData.teamName)) {
    throw new Error('部門名稱已存在');
  }
  if (existing.some(t => t.deptCode === teamData.deptCode)) {
    throw new Error('部門代碼已存在');
  }
  
  // 明確提取值
  const teamName = String(teamData.teamName);
  const deptCode = String(teamData.deptCode);
  const isActive = teamData.isActive !== false;
  
  Logger.log(`📝 準備寫入: ID=${newId}, TeamName=${teamName}, DeptCode=${deptCode}, IsActive=${isActive}`);
  
  const rowData = [newId, teamName, deptCode, isActive, now, now];
  Logger.log(`📝 rowData 陣列: ${JSON.stringify(rowData)}`);
  
  sheet.appendRow(rowData);
  
  Logger.log(`✅ 新增 Team: ${teamName} (${deptCode})`);
  return { success: true, message: '新增成功', id: newId };
}

function updateTeam(teamData) {
  // 🔐 權限檢查
  const apiKey = teamData.apiKey;
  const auth = validateApiKey(apiKey);
  
  if (!hasPermission('admin', auth.permission)) {
    return {
      success: false,
      error: '權限不足：需要管理員權限才能更新 Team'
    };
  }
  
  const sheet = getSettingsSheet(SETTINGS_TEAMS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  // Debug: 顯示要查找的 ID
  Logger.log(`🔍 updateTeam 查找 ID: ${teamData.id}, 類型: ${typeof teamData.id}`);
  Logger.log(`📊 工作表共有 ${data.length} 列資料`);
  
  for (let i = 1; i < data.length; i++) {
    const sheetId = data[i][0];
    const teamName = data[i][1];
    const deptCode = data[i][2];
    
    Logger.log(`  列 ${i}: ID=${sheetId} (類型:${typeof sheetId}), Name=${teamName}, Code=${deptCode}`);
    Logger.log(`    比對: Number(${sheetId}) === Number(${teamData.id}) => ${Number(sheetId)} === ${Number(teamData.id)} => ${Number(sheetId) === Number(teamData.id)}`);
    
    if (Number(data[i][0]) === Number(teamData.id)) {
      Logger.log(`  ✅ 找到匹配！開始更新...`);
      
      sheet.getRange(i + 1, 2).setValue(teamData.teamName);
      sheet.getRange(i + 1, 3).setValue(teamData.deptCode);
      sheet.getRange(i + 1, 4).setValue(teamData.isActive !== false);
      sheet.getRange(i + 1, 6).setValue(new Date());
      
      Logger.log(`✅ 更新 Team ID ${teamData.id}: ${teamData.teamName}`);
      return { success: true, message: '更新成功' };
    }
  }
  
  Logger.log(`❌ 未找到匹配的 ID: ${teamData.id}`);
  throw new Error('找不到指定的 Team');
}

function deleteTeam(data) {
  // 🔐 權限檢查
  const apiKey = data.apiKey;
  const auth = validateApiKey(apiKey);
  
  if (!hasPermission('admin', auth.permission)) {
    return {
      success: false,
      error: '權限不足：需要管理員權限才能刪除 Team'
    };
  }
  
  const id = data.id;
  const sheet = getSettingsSheet(SETTINGS_TEAMS_SHEET);
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (Number(dataRange[i][0]) === Number(id)) {
      sheet.deleteRow(i + 1);
      Logger.log(`✅ 刪除 Team ID: ${id}`);
      return { success: true, message: '刪除成功' };
    }
  }
  
  throw new Error('找不到指定的 Team');
}

// ==================== 系統設定 - Projects ====================
function getProjects() {
  const sheet = getSettingsSheet(SETTINGS_PROJECTS_SHEET);
  const data = sheet.getDataRange().getValues();
  const projects = [];
  
  for (let i = 1; i < data.length; i++) {
    projects.push({
      id: data[i][0],
      projectName: data[i][1],
      status: data[i][2],
      description: data[i][3] || '',
      createdDate: formatDate(data[i][4]),
      updatedDate: formatDate(data[i][5])
    });
  }
  
  Logger.log(`✅ 讀取 ${projects.length} 個 Projects`);
  return projects;
}

function addProject(projectData) {
  const sheet = getSettingsSheet(SETTINGS_PROJECTS_SHEET);
  const lastRow = sheet.getLastRow();
  const newId = lastRow > 0 ? lastRow : 1;
  const now = new Date();
  
  // 檢查是否重複
  const existing = getProjects();
  if (existing.some(p => p.projectName === projectData.projectName)) {
    throw new Error('專案名稱已存在');
  }
  
  sheet.appendRow([
    newId,
    projectData.projectName,
    projectData.status || 'Active',
    projectData.description || '',
    now,
    now
  ]);
  
  Logger.log(`✅ 新增 Project: ${projectData.projectName}`);
  return { success: true, message: '新增成功', id: newId };
}

function updateProject(projectData) {
  const sheet = getSettingsSheet(SETTINGS_PROJECTS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(projectData.id)) {
      sheet.getRange(i + 1, 2).setValue(projectData.projectName);
      sheet.getRange(i + 1, 3).setValue(projectData.status);
      sheet.getRange(i + 1, 4).setValue(projectData.description || '');
      sheet.getRange(i + 1, 6).setValue(new Date());
      
      Logger.log(`✅ 更新 Project ID ${projectData.id}: ${projectData.projectName}`);
      return { success: true, message: '更新成功' };
    }
  }
  
  throw new Error('找不到指定的 Project');
}

function deleteProject(id) {
  const sheet = getSettingsSheet(SETTINGS_PROJECTS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(id)) {
      sheet.deleteRow(i + 1);
      Logger.log(`✅ 刪除 Project ID: ${id}`);
      return { success: true, message: '刪除成功' };
    }
  }
  
  throw new Error('找不到指定的 Project');
}

// ==================== 系統設定 - Owners ====================
function getOwners() {
  const sheet = getSettingsSheet(SETTINGS_OWNERS_SHEET);
  const data = sheet.getDataRange().getValues();
  const owners = [];
  
  for (let i = 1; i < data.length; i++) {
    owners.push({
      id: data[i][0],
      ownerName: data[i][1],
      email: data[i][2] || '',
      isActive: data[i][3],
      createdDate: formatDate(data[i][4]),
      updatedDate: formatDate(data[i][5])
    });
  }
  
  Logger.log(`✅ 讀取 ${owners.length} 個 Owners`);
  return owners;
}

function addOwner(ownerData) {
  const sheet = getSettingsSheet(SETTINGS_OWNERS_SHEET);
  const lastRow = sheet.getLastRow();
  const newId = lastRow > 0 ? lastRow : 1;
  const now = new Date();
  
  // 檢查是否重複
  const existing = getOwners();
  if (existing.some(o => o.ownerName === ownerData.ownerName)) {
    throw new Error('負責人名稱已存在');
  }
  
  sheet.appendRow([
    newId,
    ownerData.ownerName,
    ownerData.email || '',
    ownerData.isActive !== false,
    now,
    now
  ]);
  
  Logger.log(`✅ 新增 Owner: ${ownerData.ownerName}`);
  return { success: true, message: '新增成功', id: newId };
}

function updateOwner(ownerData) {
  const sheet = getSettingsSheet(SETTINGS_OWNERS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(ownerData.id)) {
      sheet.getRange(i + 1, 2).setValue(ownerData.ownerName);
      sheet.getRange(i + 1, 3).setValue(ownerData.email || '');
      sheet.getRange(i + 1, 4).setValue(ownerData.isActive !== false);
      sheet.getRange(i + 1, 6).setValue(new Date());
      
      Logger.log(`✅ 更新 Owner ID ${ownerData.id}: ${ownerData.ownerName}`);
      return { success: true, message: '更新成功' };
    }
  }
  
  throw new Error('找不到指定的 Owner');
}

function deleteOwner(id) {
  const sheet = getSettingsSheet(SETTINGS_OWNERS_SHEET);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (Number(data[i][0]) === Number(id)) {
      sheet.deleteRow(i + 1);
      Logger.log(`✅ 刪除 Owner ID: ${id}`);
      return { success: true, message: '刪除成功' };
    }
  }
  
  throw new Error('找不到指定的 Owner');
}

// ==================== 資料讀取 ====================
function getAllTasks() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < DATA_START_ROW) {
    return [];
  }
  
  const dataRange = sheet.getRange(DATA_START_ROW, 1, lastRow - HEADER_ROW, Object.keys(COLUMNS).length);
  const values = dataRange.getValues();
  
  const tasks = [];
  let skipped = 0;
  
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    
    const idValue = row[COLUMNS.ID - 1];
    const taskValue = row[COLUMNS.Task - 1];
    
    if (!idValue || String(idValue).trim() === '' || 
        !taskValue || String(taskValue).trim() === '') {
      skipped++;
      continue;
    }
    
    try {
      const task = rowToTask(row);
      tasks.push(task);
    } catch (err) {
      Logger.log(`Row ${i + DATA_START_ROW} 轉換失敗: ${err}`);
      skipped++;
    }
  }
  
  Logger.log(`✅ 讀取: ${tasks.length} 有效任務, ${skipped} 空白列已跳過`);
  return tasks;
}

function rowToTask(row) {
  return {
    id: row[COLUMNS.ID - 1] || '',
    legacy_id: row[COLUMNS.Legacy_ID - 1] || '',
    team: row[COLUMNS.Team - 1] || '',
    project: row[COLUMNS.Project - 1] || '',
    purpose: row[COLUMNS.Purpose - 1] || '',
    task: row[COLUMNS.Task - 1] || '',
    owner: row[COLUMNS.PIC - 1] || '',
    issueDate: formatDate(row[COLUMNS.Issue_Date - 1]),
    startDate: formatDate(row[COLUMNS.Start_Date - 1]),
    date: formatDate(row[COLUMNS.Due_Date - 1]),
    duration: parseFloat(row[COLUMNS.Workday - 1]) || 0,
    status: row[COLUMNS.Status - 1] || 'Todo',
    priority: row[COLUMNS.Priority - 1] || 'Medium',
    dependency: row[COLUMNS.Dependencies - 1] || '',
    verification: row[COLUMNS.Verification - 1] || '',
    notes: row[COLUMNS.Notes - 1] || '',
    isCheckpoint: row[COLUMNS.Is_Checkpoint - 1] === true || row[COLUMNS.Is_Checkpoint - 1] === 'TRUE',
    issuePool: row[COLUMNS.Issue_Pool - 1] === true || row[COLUMNS.Issue_Pool - 1] === 'TRUE',
    impact: parseInt(row[COLUMNS.Impact - 1]) || 0,
    risk: parseInt(row[COLUMNS.Risk - 1]) || 0,
    urgency: parseInt(row[COLUMNS.Urgency - 1]) || 0,
    category: row[COLUMNS.Team - 1] || 'Unassigned'
  };
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  if (dateValue === 'TBD') return 'TBD';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
}

// ==================== 資料寫入 ====================
function upsertTask(taskData) {
  const sheet = getSheet();
  
  let taskId = taskData.id;
  
  if (!taskId || !isNaN(taskId)) {
    taskId = generateTaskId(taskData.team, taskData.date || new Date());
    taskData.id = taskId;
    Logger.log(`🆕 新任務，生成 ID: ${taskId}`);
  }
  
  const existingRow = findRowById(sheet, taskId);
  
  if (existingRow > 0) {
    updateRow(sheet, existingRow, taskData);
    Logger.log(`✅ 更新任務: ${taskId}`);
    return `任務 ${taskId} 已更新`;
  } else {
    const newRow = sheet.getLastRow() + 1;
    updateRow(sheet, newRow, taskData);
    Logger.log(`✅ 新增任務: ${taskId} (第${newRow}列)`);
    return `任務 ${taskId} 已新增`;
  }
}

function deleteTask(taskId) {
  const sheet = getSheet();
  const rowToDelete = findRowById(sheet, taskId);
  
  if (rowToDelete > 0) {
    sheet.deleteRow(rowToDelete);
    Logger.log(`✅ 刪除任務: ${taskId}`);
    return `任務 ${taskId} 已刪除`;
  } else {
    throw new Error(`找不到ID為 ${taskId} 的任務`);
  }
}

function findRowById(sheet, taskId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return -1;
  
  const idColumn = sheet.getRange(DATA_START_ROW, COLUMNS.ID, lastRow - HEADER_ROW, 1);
  const ids = idColumn.getValues();
  
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(taskId)) {
      return DATA_START_ROW + i;
    }
  }
  return -1;
}

function updateRow(sheet, rowNumber, taskData) {
  const rowData = new Array(Object.keys(COLUMNS).length).fill('');
  
  rowData[COLUMNS.ID - 1] = taskData.id || '';
  rowData[COLUMNS.Legacy_ID - 1] = taskData.legacy_id || '';
  rowData[COLUMNS.Team - 1] = taskData.team || '';
  rowData[COLUMNS.Project - 1] = taskData.project || '';
  rowData[COLUMNS.Purpose - 1] = taskData.purpose || '';
  rowData[COLUMNS.Task - 1] = taskData.task || '';
  rowData[COLUMNS.PIC - 1] = taskData.owner || '';
  rowData[COLUMNS.Issue_Date - 1] = parseDate(taskData.issueDate);
  rowData[COLUMNS.Start_Date - 1] = parseDate(taskData.startDate);
  rowData[COLUMNS.Due_Date - 1] = parseDate(taskData.date);
  rowData[COLUMNS.Workday - 1] = parseFloat(taskData.duration) || 0;
  rowData[COLUMNS.Status - 1] = taskData.status || 'Todo';
  rowData[COLUMNS.Priority - 1] = taskData.priority || 'Medium';
  rowData[COLUMNS.Dependencies - 1] = taskData.dependency || '';
  rowData[COLUMNS.Verification - 1] = taskData.verification || '';
  rowData[COLUMNS.Notes - 1] = taskData.notes || '';
  rowData[COLUMNS.Is_Checkpoint - 1] = taskData.isCheckpoint || false;
  rowData[COLUMNS.Issue_Pool - 1] = taskData.issuePool || false;
  rowData[COLUMNS.Impact - 1] = parseInt(taskData.impact) || 0;
  rowData[COLUMNS.Risk - 1] = parseInt(taskData.risk) || 0;
  rowData[COLUMNS.Urgency - 1] = parseInt(taskData.urgency) || 0;
  rowData[COLUMNS.Last_Updated - 1] = new Date();
  
  Logger.log(`📝 更新第${rowNumber}列: ${taskData.task}`);
  sheet.getRange(rowNumber, 1, 1, rowData.length).setValues([rowData]);
}

function parseDate(dateStr) {
  if (!dateStr || dateStr === 'TBD') return dateStr || '';
  try {
    return new Date(dateStr);
  } catch (e) {
    return '';
  }
}

// ==================== 輔助函數 ====================
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error(`找不到工作表 "${SHEET_NAME}"`);
  }
  return sheet;
}

function getSettingsSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log(`🆕 建立工作表: ${sheetName}`);
    sheet = ss.insertSheet(sheetName);
    initializeSettingsSheet(sheet, sheetName);
  }
  
  return sheet;
}

function initializeSettingsSheet(sheet, sheetName) {
  if (sheetName === SETTINGS_TEAMS_SHEET) {
    sheet.appendRow(['ID', 'Team_Name', 'Dept_Code', 'Is_Active', 'Created_Date', 'Updated_Date']);
    sheet.getRange('A1:F1').setFontWeight('bold');
  } else if (sheetName === SETTINGS_PROJECTS_SHEET) {
    sheet.appendRow(['ID', 'Project_Name', 'Status', 'Description', 'Created_Date', 'Updated_Date']);
    sheet.getRange('A1:F1').setFontWeight('bold');
  } else if (sheetName === SETTINGS_OWNERS_SHEET) {
    sheet.appendRow(['ID', 'Owner_Name', 'Email', 'Is_Active', 'Created_Date', 'Updated_Date']);
    sheet.getRange('A1:F1').setFontWeight('bold');
  }
}

function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  
  if (statusCode !== 200) {
    data.statusCode = statusCode;
  }
  return output;
}

// ==================== 測試函數 ====================
function testGenerateTaskId() {
  Logger.log('===== 測試 generateTaskId =====');
  
  try {
    const testCases = [
      { team: 'QA', date: '2026-01-15' },
      { team: '晶片', date: '2026-01-20' },
      { team: '機構', date: '2026-02-01' }
    ];
    
    testCases.forEach(tc => {
      const taskId = generateTaskId(tc.team, tc.date);
      Logger.log(`✅ Team: ${tc.team}, Date: ${tc.date} → ID: ${taskId}`);
    });
    
    Logger.log('✅ 所有測試通過');
    return true;
    
  } catch (error) {
    Logger.log(`❌ 測試失敗: ${error}`);
    return false;
  }
}

function testGetNextSequence() {
  Logger.log('===== 測試 getNextSequence =====');
  
  try {
    const seq1 = getNextSequence('QA', 2026, 1);
    Logger.log(`✅ QA-2026-01 序號: ${seq1}`);
    
    const seq2 = getNextSequence('QA', 2026, 1);
    Logger.log(`✅ QA-2026-01 序號: ${seq2} (應該是 ${seq1 + 1})`);
    
    const seq3 = getNextSequence('CHIP', 2026, 1);
    Logger.log(`✅ CHIP-2026-01 序號: ${seq3} (應該是 1)`);
    
    Logger.log('✅ 所有測試通過');
    return true;
    
  } catch (error) {
    Logger.log(`❌ 測試失敗: ${error}`);
    return false;
  }
}

function runAllTests() {
  Logger.log('🧪 開始執行所有測試...\n');
  
  const results = {
    generateTaskId: testGenerateTaskId(),
    getNextSequence: testGetNextSequence()
  };
  
  Logger.log('\n===== 測試結果總結 =====');
  Object.keys(results).forEach(test => {
    Logger.log(`${results[test] ? '✅' : '❌'} ${test}`);
  });
  
  return results;
}

// ==================== Phase 1 測試函數 ====================

function testGetTeams() {
  Logger.log('===== 測試 getTeams =====');
  try {
    const teams = getTeams();
    Logger.log(`✅ 成功讀取 ${teams.length} 個 Teams`);
    teams.forEach(t => {
      Logger.log(`  - ${t.teamName} (${t.deptCode})`);
    });
    return true;
  } catch (error) {
    Logger.log(`❌ 測試失敗: ${error}`);
    return false;
  }
}

function testAddTeam() {
  Logger.log('===== 測試 addTeam =====');
  try {
    const result = addTeam({
      teamName: '測試部門',
      deptCode: 'TEST',
      isActive: true
    });
    Logger.log(`✅ 新增成功: ID = ${result.id}`);
    return true;
  } catch (error) {
    Logger.log(`❌ 測試失敗: ${error}`);
    return false;
  }
}

function testUpdateTeam() {
  Logger.log('===== 測試 updateTeam =====');
  try {
    // 先取得第一個 Team 的 ID
    const teams = getTeams();
    if (teams.length === 0) {
      throw new Error('沒有 Teams 可測試');
    }
    
    const firstTeam = teams[0];
    Logger.log(`使用 Team ID: ${firstTeam.id}, 原名稱: ${firstTeam.teamName}`);
    
    const result = updateTeam({
      id: firstTeam.id,
      teamName: firstTeam.teamName + '_已更新',
      deptCode: firstTeam.deptCode,
      isActive: true
    });
    
    Logger.log(`✅ 更新成功`);
    
    // 恢復原名稱
    updateTeam({
      id: firstTeam.id,
      teamName: firstTeam.teamName,
      deptCode: firstTeam.deptCode,
      isActive: true
    });
    Logger.log(`✅ 已恢復原名稱`);
    
    return true;
  } catch (error) {
    Logger.log(`❌ 測試失敗: ${error}`);
    return false;
  }
}

function testDeleteTeam() {
  Logger.log('===== 測試 deleteTeam =====');
  try {
    // 先新增一個測試用的
    const addResult = addTeam({
      teamName: '待刪除部門',
      deptCode: 'DEL',
      isActive: true
    });
    
    // 然後刪除
    const result = deleteTeam(addResult.id);
    Logger.log(`✅ 刪除成功`);
    return true;
  } catch (error) {
    Logger.log(`❌ 測試失敗: ${error}`);
    return false;
  }
}

function testGetProjects() {
  Logger.log('===== 測試 getProjects =====');
  try {
    const projects = getProjects();
    Logger.log(`✅ 成功讀取 ${projects.length} 個 Projects`);
    projects.forEach(p => {
      Logger.log(`  - ${p.projectName} (${p.status})`);
    });
    return true;
  } catch (error) {
    Logger.log(`❌ 測試失敗: ${error}`);
    return false;
  }
}

function testGetOwners() {
  Logger.log('===== 測試 getOwners =====');
  try {
    const owners = getOwners();
    Logger.log(`✅ 成功讀取 ${owners.length} 個 Owners`);
    owners.forEach(o => {
      Logger.log(`  - ${o.ownerName}`);
    });
    return true;
  } catch (error) {
    Logger.log(`❌ 測試失敗: ${error}`);
    return false;
  }
}

function runPhase1Tests() {
  Logger.log('🧪 開始執行 Phase 1 測試...\n');
  
  const results = {
    getTeams: testGetTeams(),
    addTeam: testAddTeam(),
    updateTeam: testUpdateTeam(),
    deleteTeam: testDeleteTeam(),
    getProjects: testGetProjects(),
    getOwners: testGetOwners()
  };
  
  Logger.log('\n===== Phase 1 測試結果 =====');
  Object.keys(results).forEach(test => {
    Logger.log(`${results[test] ? '✅' : '❌'} ${test}`);
  });
  
  const allPassed = Object.values(results).every(r => r === true);
  Logger.log(`\n${allPassed ? '🎉 所有測試通過！' : '⚠️ 部分測試失敗，請檢查'}`);
  
  return results;
}

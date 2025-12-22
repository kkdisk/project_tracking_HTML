// ----------------------------------------------------------------
// 1. 讀取資料 (GET) - 給前端 useEffect 抓取初始資料用
// ----------------------------------------------------------------
function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // 避免讀寫衝突

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // 取得所有資料 (包含標題列)
    var data = sheet.getDataRange().getValues();
    
    // 如果只有標題列或沒資料，回傳空陣列
    if (data.length <= 1) {
      return response([]);
    }

    var headers = data[0]; // 第一列是標題: id, project, task...
    var rows = data.slice(1); // 第二列之後是內容
    
    var result = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(header, i) {
        // 特別處理 Checkpoint (Boolean)
        if (header === 'isCheckpoint') {
          obj[header] = (String(row[i]).toUpperCase() === 'TRUE');
        } else {
          obj[header] = row[i];
        }
      });
      return obj;
    });
    
    return response(result);

  } catch (e) {
    return response({status: 'error', message: e.toString()});
  } finally {
    lock.releaseLock();
  }
}

// ----------------------------------------------------------------
// 2. 寫入資料 (POST) - 支援 新增/修改 (upsert) 與 刪除 (delete)
// ----------------------------------------------------------------
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // 鎖定以避免多人同時寫入導致資料錯亂

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // 解析前端傳來的 JSON 資料
    var params = JSON.parse(e.postData.contents);
    var action = params.action; 
    
    // 取得所有資料與 ID 欄位位置
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIndex = headers.indexOf('id'); // 假設標題列中有一個欄位叫 'id'
    
    if (idIndex === -1) {
      return response({status: 'error', message: '找不到 "id" 欄位，請檢查試算表標題列。'});
    }

    // === 狀況 A: 刪除 (Delete) ===
    if (action === 'delete') {
      var idToDelete = params.id;
      for (var i = 1; i < data.length; i++) {
        // 比對 ID (轉成字串比對較保險)
        if (String(data[i][idIndex]) === String(idToDelete)) {
          sheet.deleteRow(i + 1); // deleteRow 是 1-based index，所以要 +1
          return response({status: 'success', action: 'deleted', id: idToDelete});
        }
      }
      return response({status: 'error', message: '找不到此 ID，無法刪除'});
    }

    // === 狀況 B: 新增或修改 (Upsert) ===
    if (action === 'upsert') {
      var item = params.data;
      var rowIndex = -1;
      var existingDateHistory = '[]';
      var dateHistoryIndex = headers.indexOf('dateHistory');

      // 1. 先掃描有沒有這個 ID (判斷是修改還是新增)
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][idIndex]) === String(item.id)) {
          rowIndex = i + 1; // 找到了，記錄列號 (1-based)
          // 如果有 dateHistory 欄位，取得現有值
          if (dateHistoryIndex !== -1) {
            existingDateHistory = data[i][dateHistoryIndex] || '[]';
          }
          break;
        }
      }

      // 2. 處理 dateHistory 欄位 (方案 B: 完整變更歷史)
      // 修正：優先使用前端傳來的 dateHistory，避免覆蓋原始記錄
      if (dateHistoryIndex !== -1) {
        // 如果前端有傳 dateHistory，直接使用（前端已正確處理）
        if (item.dateHistory && item.dateHistory !== '[]') {
          // 驗證是否為有效 JSON
          try {
            JSON.parse(item.dateHistory);
            // 有效，直接使用前端傳來的值（不做任何修改）
          } catch (e) {
            // 無效 JSON，fallback 到後端處理
            item.dateHistory = existingDateHistory || '[]';
          }
        } else {
          // 前端沒傳 dateHistory，使用現有值或初始化
          var history = [];
          try {
            history = JSON.parse(existingDateHistory);
          } catch (e) {
            history = [];
          }
          
          // 如果沒有歷史記錄，建立初始記錄
          if (history.length === 0 && item.date) {
            history.push({
              date: item.date,
              changedAt: new Date().toISOString(),
              reason: '初始規劃',
              version: 1
            });
          }
          
          item.dateHistory = JSON.stringify(history);
        }
      }

      // 準備要寫入的整列資料 (依照 header 順序填入)
      var rowData = headers.map(function(header) {
        var val = item[header];
        // 確保布林值存成 TRUE/FALSE 字串，方便閱讀與讀取
        if (header === 'isCheckpoint') return val ? 'TRUE' : 'FALSE';
        // dateChangeReason 是暫時欄位，不需要儲存 (已經寫入 dateHistory)
        if (header === 'dateChangeReason') return '';
        return val !== undefined ? val : '';
      });

      if (rowIndex > 0) {
        // 2. 更新現有列 (Update)
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
        return response({status: 'success', action: 'updated', id: item.id});
      } else {
        // 3. 沒找到 ID，直接新增到最後一列 (Create)
        sheet.appendRow(rowData);
        return response({status: 'success', action: 'created', id: item.id});
      }
    }

    return response({status: 'error', message: '未知的操作 (Unknown action)'});

  } catch(error) {
    return response({status: 'error', message: error.toString()});
  } finally {
    lock.releaseLock();
  }
}

// ----------------------------------------------------------------
// 輔助函式：回傳 JSON 格式
// ----------------------------------------------------------------
function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------------------
// 批量初始化 dateHistory (手動執行一次即可)
// 功能：為所有現有任務建立「初始規劃」記錄
// 使用方式：在 Apps Script 編輯器中選擇此函式後按「執行」
// ----------------------------------------------------------------
function initializeDateHistory() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var dateIndex = headers.indexOf('date');
  var dateHistoryIndex = headers.indexOf('dateHistory');
  var taskIndex = headers.indexOf('task');
  
  if (dateHistoryIndex === -1) {
    Logger.log('錯誤：找不到 dateHistory 欄位');
    return;
  }
  
  var updatedCount = 0;
  var skippedCount = 0;
  
  for (var i = 1; i < data.length; i++) {
    var currentDate = data[i][dateIndex];
    var currentHistory = data[i][dateHistoryIndex];
    var taskName = data[i][taskIndex];
    
    // 跳過空行
    if (!currentDate) continue;
    
    // 格式化日期為 YYYY-MM-DD
    var formattedDate = currentDate;
    if (currentDate instanceof Date) {
      formattedDate = Utilities.formatDate(currentDate, 'Asia/Taipei', 'yyyy-MM-dd');
    }
    
    var history = [];
    try {
      if (currentHistory && currentHistory.trim() !== '') {
        history = JSON.parse(currentHistory);
      }
    } catch (e) {
      history = [];
    }
    
    // 如果沒有歷史記錄，建立初始記錄
    if (history.length === 0) {
      history = [{
        date: formattedDate,
        changedAt: new Date().toISOString(),
        reason: '初始規劃',
        version: 1
      }];
      
      sheet.getRange(i + 1, dateHistoryIndex + 1).setValue(JSON.stringify(history));
      Logger.log('已初始化: ' + taskName + ' -> ' + formattedDate);
      updatedCount++;
    } 
    // 如果只有 1 筆記錄，且該日期與當前不同，在開頭插入「原始規劃」
    else if (history.length === 1 && history[0].date !== formattedDate) {
      // 在開頭插入原始規劃記錄
      var originalRecord = {
        date: formattedDate,
        changedAt: new Date().toISOString(),
        reason: '原始規劃 (系統補建)',
        version: 0
      };
      
      // 重新編號
      history.forEach(function(h, idx) {
        h.version = idx + 2;
      });
      history.unshift(originalRecord);
      originalRecord.version = 1;
      
      sheet.getRange(i + 1, dateHistoryIndex + 1).setValue(JSON.stringify(history));
      Logger.log('已補建原始記錄: ' + taskName);
      updatedCount++;
    }
    else {
      skippedCount++;
    }
  }
  
  Logger.log('===== 完成 =====');
  Logger.log('已更新: ' + updatedCount + ' 筆');
  Logger.log('已跳過: ' + skippedCount + ' 筆');
  
  // 顯示彈出訊息
  SpreadsheetApp.getUi().alert(
    '初始化完成！\n\n已更新: ' + updatedCount + ' 筆\n已跳過: ' + skippedCount + ' 筆\n\n詳細資訊請查看執行記錄。'
  );
}
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
    const result = updateTeam({
      id: 1,
      teamName: '晶片設計',
      deptCode: 'CHIP',
      isActive: true
    });
    Logger.log(`✅ 更新成功`);
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

// ============================================================
// Installer_additions.gs
// 기존 Installer.gs 의 setupAll_() / ensureSheets_() 안에
// 아래 호출을 추가하세요.
//
//   ensureWorklogSheet_();
//   ensureReportSheet_();
//   ensureCalcSheet_();
//   ensureNewFieldMaps_();
// ============================================================

function ensureWorklogSheet_() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var name = "업무일지";
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, SCHEMA_WORKLOG_HEADERS.length)
      .setValues([SCHEMA_WORKLOG_HEADERS])
      .setFontWeight("bold")
      .setBackground("#d9e1f2");
    sh.setFrozenRows(1);
  }
}

function ensureReportSheet_() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var name = "보고서";
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, SCHEMA_REPORT_HEADERS.length)
      .setValues([SCHEMA_REPORT_HEADERS])
      .setFontWeight("bold")
      .setBackground("#d9e1f2");
    sh.setFrozenRows(1);
  }
}

function ensureCalcSheet_() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var name = "인당량";
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, SCHEMA_CALC_HEADERS.length)
      .setValues([SCHEMA_CALC_HEADERS])
      .setFontWeight("bold")
      .setBackground("#d9e1f2");
    sh.setFrozenRows(1);
  }
}

function ensureNewFieldMaps_() {
  var allMaps = [].concat(FIELDMAP_WORKLOG, FIELDMAP_REPORT, FIELDMAP_CALC);
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sh = ss.getSheetByName("FIELDMAP");
  if (!sh) return;
  var existing = sh.getDataRange().getValues();
  var existingKeys = {};
  existing.forEach(function(r) { existingKeys[r[0] + "|" + r[2]] = true; });
  var toAdd = allMaps.filter(function(r) {
    return !existingKeys[r[0] + "|" + r[2]];
  });
  if (toAdd.length > 0) {
    sh.getRange(existing.length + 1, 1, toAdd.length, 4).setValues(toAdd);
  }
}

// 전역 실행 함수 (GAS 에디터에서 직접 실행 가능)
function setupNewSheets() {
  ensureWorklogSheet_();
  ensureReportSheet_();
  ensureCalcSheet_();
  ensureNewFieldMaps_();
  Logger.log("신규 시트 3개 생성 완료");
}

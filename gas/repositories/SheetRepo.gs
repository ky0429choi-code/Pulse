var SheetRepo = (function(){
  function ss_(){
    if (CONFIG.SPREADSHEET_ID) return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    return SpreadsheetApp.getActiveSpreadsheet();
  }
  function sheet_(name){
    var sh = ss_().getSheetByName(name);
    if(!sh) throw new Error("Sheet not found: " + name);
    return sh;
  }
  function ensureSheet_(name){
    var sh = ss_().getSheetByName(name);
    if(!sh) sh = ss_().insertSheet(name);
    return sh;
  }
  function readAll_(name){
    var sh = sheet_(name);
    var v = sh.getDataRange().getValues();
    if(!v || v.length < 1) return { header: [], rows: [] };
    var header = v[0] || [];
    var rows = v.length > 1 ? v.slice(1) : [];
    return { header: header, rows: rows };
  }
  function setHeaderIfEmpty_(name, header){
    var sh = ensureSheet_(name);
    var lastRow = sh.getLastRow();
    if (lastRow >= 1) return; // 데이터/헤더 있으면 보존
    sh.getRange(1,1,1,header.length).setValues([header]);
  }
  function appendRow_(name, row){
    var sh = ensureSheet_(name);
    sh.appendRow(row);
  }
  function appendByIndexMap_(name, headerRow, indexMap, obj){
    var row = new Array(headerRow.length).fill("");
    Object.keys(obj).forEach(function(logical){
      var pos = indexMap[logical];
      if (typeof pos === "number" && pos >= 0) row[pos] = obj[logical];
    });
    appendRow_(name, row);
  }
  return {
    ss_: ss_, sheet_: sheet_, ensureSheet_: ensureSheet_,
    readAll_: readAll_, setHeaderIfEmpty_: setHeaderIfEmpty_,
    appendRow_: appendRow_, appendByIndexMap_: appendByIndexMap_
  };
})();

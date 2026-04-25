// ============================================================
// WorklogRepository.gs
// ============================================================

var WorklogRepository = (function () {

  var SHEET = "업무일지";

  function _idx(data) {
    return buildIndexMap_(SHEET, data.headers);
  }

  function list_(siteId, opts) {
    opts = opts || {};
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var rows = data.rows.filter(function (r) {
      if (siteId && String(r[idx.siteId] || "") !== String(siteId)) return false;
      if (opts.date && String(r[idx.date] || "") !== String(opts.date)) return false;
      if (opts.dateFrom && String(r[idx.date] || "") < String(opts.dateFrom)) return false;
      if (opts.dateTo && String(r[idx.date] || "") > String(opts.dateTo)) return false;
      if (opts.category && String(r[idx.category] || "") !== String(opts.category)) return false;
      return true;
    });
    return rows.map(function (r) { return _toObj(r, idx); })
               .reverse()
               .slice(0, opts.limit || 100);
  }

  function get_(logId) {
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var row = data.rows.filter(function (r) {
      return String(r[idx.logId] || "") === String(logId);
    })[0];
    return row ? _toObj(row, idx) : null;
  }

  function save_(rec) {
    var row = [
      rec.logId, rec.siteId, rec.date, rec.category,
      rec.content, rec.isDone ? "TRUE" : "FALSE",
      Array.isArray(rec.tags) ? rec.tags.join(",") : (rec.tags || ""),
      rec.createdAt
    ];
    appendRow_(SHEET, row);
    return rec;
  }

  function update_(logId, patch) {
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sh = ss.getSheetByName(SHEET);
    for (var i = 0; i < data.rows.length; i++) {
      if (String(data.rows[i][idx.logId] || "") === String(logId)) {
        var rowNum = i + 2;
        if (patch.content  !== undefined) sh.getRange(rowNum, idx.content  + 1).setValue(patch.content);
        if (patch.isDone   !== undefined) sh.getRange(rowNum, idx.isDone   + 1).setValue(patch.isDone ? "TRUE" : "FALSE");
        if (patch.category !== undefined) sh.getRange(rowNum, idx.category + 1).setValue(patch.category);
        if (patch.tags     !== undefined) sh.getRange(rowNum, idx.tags     + 1).setValue(
          Array.isArray(patch.tags) ? patch.tags.join(",") : (patch.tags || "")
        );
        return true;
      }
    }
    return false;
  }

  function delete_(logId) {
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sh = ss.getSheetByName(SHEET);
    for (var i = data.rows.length - 1; i >= 0; i--) {
      if (String(data.rows[i][idx.logId] || "") === String(logId)) {
        sh.deleteRow(i + 2);
        return true;
      }
    }
    return false;
  }

  function _toObj(r, idx) {
    var tagsRaw = String(r[idx.tags] || "");
    return {
      logId    : String(r[idx.logId]     || ""),
      siteId   : String(r[idx.siteId]    || ""),
      date     : String(r[idx.date]      || ""),
      category : String(r[idx.category]  || ""),
      content  : String(r[idx.content]   || ""),
      isDone   : String(r[idx.isDone]    || "").toUpperCase() === "TRUE",
      tags     : tagsRaw ? tagsRaw.split(",").map(function(t){ return t.trim(); }) : [],
      createdAt: String(r[idx.createdAt] || "")
    };
  }

  return { list_: list_, get_: get_, save_: save_, update_: update_, delete_: delete_ };
})();

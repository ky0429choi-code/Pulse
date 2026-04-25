// ============================================================
// ReportRepository.gs
// ============================================================

var ReportRepository = (function () {

  var SHEET = "보고서";

  function _idx(data) {
    return buildIndexMap_(SHEET, data.headers);
  }

  function list_(siteId, opts) {
    opts = opts || {};
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var rows = data.rows.filter(function (r) {
      if (siteId && String(r[idx.siteId] || "") !== String(siteId)) return false;
      if (opts.category && String(r[idx.category] || "") !== String(opts.category)) return false;
      if (opts.dateFrom && String(r[idx.date] || "") < String(opts.dateFrom)) return false;
      if (opts.dateTo   && String(r[idx.date] || "") > String(opts.dateTo))   return false;
      return true;
    });
    return rows.map(function (r) { return _toObj(r, idx); })
               .reverse()
               .slice(0, opts.limit || 30);
  }

  function get_(reportId) {
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var row = data.rows.filter(function (r) {
      return String(r[idx.reportId] || "") === String(reportId);
    })[0];
    return row ? _toObj(row, idx) : null;
  }

  function save_(rec) {
    var row = [
      rec.reportId, rec.siteId, rec.date, rec.title,
      rec.category, rec.body, rec.status || "draft", rec.createdAt
    ];
    appendRow_(SHEET, row);
    return rec;
  }

  function updateStatus_(reportId, status) {
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sh = ss.getSheetByName(SHEET);
    for (var i = 0; i < data.rows.length; i++) {
      if (String(data.rows[i][idx.reportId] || "") === String(reportId)) {
        sh.getRange(i + 2, idx.status + 1).setValue(status);
        return true;
      }
    }
    return false;
  }

  function delete_(reportId) {
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sh = ss.getSheetByName(SHEET);
    for (var i = data.rows.length - 1; i >= 0; i--) {
      if (String(data.rows[i][idx.reportId] || "") === String(reportId)) {
        sh.deleteRow(i + 2);
        return true;
      }
    }
    return false;
  }

  function _toObj(r, idx) {
    return {
      reportId : String(r[idx.reportId]  || ""),
      siteId   : String(r[idx.siteId]    || ""),
      date     : String(r[idx.date]      || ""),
      title    : String(r[idx.title]     || ""),
      category : String(r[idx.category]  || ""),
      body     : String(r[idx.body]      || ""),
      status   : String(r[idx.status]    || "draft"),
      createdAt: String(r[idx.createdAt] || "")
    };
  }

  return { list_: list_, get_: get_, save_: save_, updateStatus_: updateStatus_, delete_: delete_ };
})();

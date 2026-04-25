// ============================================================
// CalcRepository.gs
// ============================================================

var CalcRepository = (function () {

  var SHEET = "인당량";

  function _idx(data) {
    return buildIndexMap_(SHEET, data.headers);
  }

  function list_(siteId, opts) {
    opts = opts || {};
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var rows = data.rows.filter(function (r) {
      if (siteId && String(r[idx.siteId] || "") !== String(siteId)) return false;
      if (opts.menuName && String(r[idx.menuName] || "") !== String(opts.menuName)) return false;
      return true;
    });
    return rows.map(function (r) { return _toObj(r, idx); })
               .reverse()
               .slice(0, opts.limit || 200);
  }

  function get_(calcId) {
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var row = data.rows.filter(function (r) {
      return String(r[idx.calcId] || "") === String(calcId);
    })[0];
    return row ? _toObj(row, idx) : null;
  }

  function save_(rec) {
    var row = [
      rec.calcId,
      rec.siteId,
      rec.menuName  || "",
      rec.itemName,
      Number(rec.portionG)  || 0,
      Number(rec.usageKg)   || 0,
      Number(rec.headcount) || 0,
      Number(rec.yieldG)    || 0,
      Number(rec.baselineG) || 0,
      rec.feedback  || "",
      rec.createdAt
    ];
    appendRow_(SHEET, row);
    return rec;
  }

  function delete_(calcId) {
    var data = readAll_(SHEET);
    var idx = _idx(data);
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sh = ss.getSheetByName(SHEET);
    for (var i = data.rows.length - 1; i >= 0; i--) {
      if (String(data.rows[i][idx.calcId] || "") === String(calcId)) {
        sh.deleteRow(i + 2);
        return true;
      }
    }
    return false;
  }

  function _toObj(r, idx) {
    return {
      calcId    : String(r[idx.calcId]    || ""),
      siteId    : String(r[idx.siteId]    || ""),
      menuName  : String(r[idx.menuName]  || ""),
      itemName  : String(r[idx.itemName]  || ""),
      portionG  : Number(r[idx.portionG]  || 0),
      usageKg   : Number(r[idx.usageKg]   || 0),
      headcount : Number(r[idx.headcount] || 0),
      yieldG    : Number(r[idx.yieldG]    || 0),
      baselineG : Number(r[idx.baselineG] || 0),
      feedback  : String(r[idx.feedback]  || ""),
      createdAt : String(r[idx.createdAt] || "")
    };
  }

  return { list_: list_, get_: get_, save_: save_, delete_: delete_ };
})();

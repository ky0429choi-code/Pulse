// ============================================================
// WorklogService.gs
// ============================================================

var WorklogService = (function () {

  var CATEGORIES = ["조리", "위생", "운영", "행정", "기타"];

  function getWorklogList(req) {
    Validator.required_("getWorklogList", req, ["siteId"]);
    var opts = {
      date    : req.date     || "",
      dateFrom: req.dateFrom || "",
      dateTo  : req.dateTo   || "",
      category: req.category || "",
      limit   : Number(req.limit) || 100
    };
    var items = WorklogRepository.list_(req.siteId, opts);
    return { items: items, total: items.length };
  }

  function saveWorklog(req) {
    Validator.required_("saveWorklog", req, ["siteId", "date", "content"]);
    var now = new Date().toISOString();
    var logId = "LOG_" + req.siteId + "_" + now.replace(/[-:.TZ]/g, "").slice(0, 14);
    var tags = [];
    if (req.tags) {
      tags = Array.isArray(req.tags)
        ? req.tags.map(function(t){ return t.trim(); }).filter(Boolean)
        : String(req.tags).split(",").map(function(t){ return t.trim(); }).filter(Boolean);
    }
    var rec = {
      logId    : logId,
      siteId   : req.siteId,
      date     : req.date,
      category : CATEGORIES.indexOf(req.category) >= 0 ? req.category : "기타",
      content  : req.content,
      isDone   : req.isDone === true || req.isDone === "true" || req.isDone === "TRUE",
      tags     : tags,
      createdAt: now
    };
    WorklogRepository.save_(rec);
    
    // \uAD6C\uAE00 \uCE98\uB9B0\uB354 \uC790\uB3D9 \uB3D9\uAE30\uD654 \uD638\uCD9C
    try {
      CalendarService.syncWorklogToCalendar(rec);
    } catch(e) {
      Logger.log("Calendar auto-sync skipped: " + e.toString());
    }

    return rec;
  }

  function updateWorklog(req) {
    Validator.required_("updateWorklog", req, ["logId"]);
    var patch = {};
    if (req.content  !== undefined) patch.content  = req.content;
    if (req.isDone   !== undefined) patch.isDone   = req.isDone === true || req.isDone === "true" || req.isDone === "TRUE";
    if (req.category !== undefined) patch.category = CATEGORIES.indexOf(req.category) >= 0 ? req.category : "기타";
    if (req.tags     !== undefined) {
      patch.tags = Array.isArray(req.tags)
        ? req.tags.map(function(t){ return t.trim(); }).filter(Boolean)
        : String(req.tags).split(",").map(function(t){ return t.trim(); }).filter(Boolean);
    }
    var ok = WorklogRepository.update_(req.logId, patch);
    if (!ok) throw new Error("logId not found: " + req.logId);
    return { logId: req.logId, updated: true };
  }

  function deleteWorklog(req) {
    Validator.required_("deleteWorklog", req, ["logId"]);
    var ok = WorklogRepository.delete_(req.logId);
    if (!ok) throw new Error("logId not found: " + req.logId);
    return { logId: req.logId, deleted: true };
  }

  return {
    getWorklogList: getWorklogList,
    saveWorklog   : saveWorklog,
    updateWorklog : updateWorklog,
    deleteWorklog : deleteWorklog,
    syncFromCalendar: function(req) {
      Validator.required_("syncFromCalendar", req, ["siteId", "date"]);
      var events = CalendarService.getEventsFromCalendar(req.date);
      // \uD604\uC7AC \uC2DC\uD2B8\uC5D0 \uC774\uBBF8 \uB4F1\uB85D\uB41C \uC77C\uC815\uC774\uC9C0 \uD655\uC778 \uD644 \uC5C6\uB294 \uAC83\uB9CC \uC81C\uC548 \uB610\uB294 \uC790\uB3D9 \uC800\uC7A5 \uB85C\uC9C1 \uCD94\uAC00 \uAC00\uB2A5
      return { events: events };
    }
  };
})();

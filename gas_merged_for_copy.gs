function ok_(action, data, message) {
  return {
    success: true,
    version: CONFIG.API_VERSION,
    action: action,
    message: message || "",
    data: data || {},
    meta: { timestamp: new Date().toISOString() }
  };
}

function fail_(action, errorCode, message) {
  return {
    success: false,
    version: CONFIG.API_VERSION,
    action: action,
    message: message || "",
    data: null,
    meta: { timestamp: new Date().toISOString(), errorCode: errorCode || "INTERNAL_ERROR" }
  };
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
var CONFIG = (function(){
  var props = PropertiesService.getScriptProperties();

  return {
    API_VERSION: "v1",
    API_KEY: props.getProperty("API_KEY") || "",
    ADMIN_API_KEY: props.getProperty("ADMIN_API_KEY") || "",
    SPREADSHEET_ID: props.getProperty("SPREADSHEET_ID") || "",
    TZ: props.getProperty("APP_TIMEZONE") || "Asia/Seoul",
    SESSION_TTL_MINUTES: Number(props.getProperty("SESSION_TTL_MINUTES") || 480),
    DEFAULTS: {
      DEFAULT_SITE_ID: "H2",
      SITE_LIST_JSON: JSON.stringify([
        { siteId: "H1", siteName: "Site H1" },
        { siteId: "H2", siteName: "Site H2" }
      ]),
      FEATURE_FLAGS_JSON: JSON.stringify({
        memoSync: true,
        insightAudit: true,
        templateAutoFill: true,
        auditPersist: true,
        weeklySummary: true,
        systemStatus: true
      })
    },
    SHEETS: {
      HEADCOUNT: "\uC778\uC6D0\uC6B4\uC601",
      MEMO: "\uC5C5\uBB34\uBA54\uBAA8\uB85C\uADF8",
      TEMPLATES: "\uBC18\uBCF5\uC9C8\uC758\uC0AC\uC804",
      INSIGHTS: "\uC810\uAC80\uB370\uC774\uD130\uACB0\uACFC",
      SETTINGS: "\uC124\uC815",
      FIELDMAP: "\uD544\uB4DC\uB9E4\uD551",
      LOG: "\uB85C\uADF8",
      USERS: "\uAD8C\uD55C\uAD00\uB9AC",
      SESSIONS: "\uC138\uC158",
      ACCESS_LOG: "\uC811\uC18D\uB85C\uADF8"
    }
  };
})();
var Installer = (function(){
  function setupAll(){
    ensureSheet_(CONFIG.SHEETS.HEADCOUNT);
    ensureSheet_(CONFIG.SHEETS.MEMO);
    ensureSheet_(CONFIG.SHEETS.TEMPLATES);
    ensureSheet_(CONFIG.SHEETS.INSIGHTS);
    ensureSheet_(CONFIG.SHEETS.SETTINGS);
    ensureSheet_(CONFIG.SHEETS.FIELDMAP);
    ensureSheet_(CONFIG.SHEETS.LOG);
    ensureSheet_(CONFIG.SHEETS.USERS);
    ensureSheet_(CONFIG.SHEETS.SESSIONS);
    ensureSheet_(CONFIG.SHEETS.ACCESS_LOG);

    seedFieldMapIfEmpty_();
    ensureSettingsDefaults_();
    ensureTemplates_();

    LogService.log_("INFO", "INSTALL", "setupAll", "complete", null);
    return ok_("setupAll", { ok:true }, "setup complete");
  }

  function setupTriggers(){
    removeManagedTriggers_();

    ScriptApp.newTrigger("globalDailyAudit")
      .timeBased()
      .everyDays(1)
      .atHour(7)
      .nearMinute(30)
      .create();

    ScriptApp.newTrigger("globalWeeklyAudit")
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(7)
      .nearMinute(40)
      .create();

    ScriptApp.newTrigger("globalCleanSessions")
      .timeBased()
      .everyHours(4)
      .create();

    LogService.log_("INFO", "INSTALL", "setupTriggers", "created", null);
    return ok_("setupTriggers", { ok:true }, "triggers created");
  }

  function removeManagedTriggers_(){
    var all = ScriptApp.getProjectTriggers();
    var fns = ["Jobs.runDailyAudit", "Jobs.runWeeklyAudit", "globalDailyAudit", "globalWeeklyAudit", "globalCleanSessions"];
    all.forEach(function(t){
      if (fns.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
    });
  }

  function ensureSheet_(name){
    SheetRepo.ensureSheet_(name);
    var header = Schema.defaultHeaders_(name);
    SheetRepo.setHeaderIfEmpty_(name, header);
  }

  function seedFieldMapIfEmpty_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.FIELDMAP, ["sheet","logical","header","enabled","note"]);
    var sh = SheetRepo.sheet_(CONFIG.SHEETS.FIELDMAP);
    if (sh.getLastRow() > 1) return;

    var rows = [];
    [CONFIG.SHEETS.HEADCOUNT, CONFIG.SHEETS.MEMO, CONFIG.SHEETS.TEMPLATES, CONFIG.SHEETS.INSIGHTS, CONFIG.SHEETS.SETTINGS, CONFIG.SHEETS.LOG, CONFIG.SHEETS.USERS, CONFIG.SHEETS.SESSIONS, CONFIG.SHEETS.ACCESS_LOG].forEach(function(sname){
      Schema.getSchema_(sname).forEach(function(f){
        rows.push([sname, f.logical, f.header, "TRUE", "default"]);
      });
    });

    rows.push([CONFIG.SHEETS.FIELDMAP, "sheet", "sheet", "TRUE", "self"]);
    rows.push([CONFIG.SHEETS.FIELDMAP, "logical", "logical", "TRUE", "self"]);
    rows.push([CONFIG.SHEETS.FIELDMAP, "header", "header", "TRUE", "self"]);
    rows.push([CONFIG.SHEETS.FIELDMAP, "enabled", "enabled", "TRUE", "self"]);
    rows.push([CONFIG.SHEETS.FIELDMAP, "note", "note", "TRUE", "self"]);

    sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  function ensureTemplates_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.TEMPLATES, Schema.defaultHeaders_(CONFIG.SHEETS.TEMPLATES));
    var sh = SheetRepo.sheet_(CONFIG.SHEETS.TEMPLATES);
    var data = SheetRepo.readAll_(CONFIG.SHEETS.TEMPLATES);
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.TEMPLATES, data.header);
    var existing = {};

    data.rows.forEach(function(r){
      var tid = String(r[idx.templateId] || "");
      if (tid) existing[tid] = true;
    });

    var toAppend = [];

    function addIfMissing(row){
      var tid = row[0];
      if (!existing[tid]) toAppend.push(row);
    }

    addIfMissing([
      "monthly_headcount_report",
      "report",
      "\uC6D4\uAC04 \uC2DD\uC218 \uBCF4\uACE0",
      "\uC99D\uAC10 \uC6D0\uC778\uACFC \uAC1C\uC120\uC548 \uC815\uB9AC",
      "[\uC6D4\uAC04 \uC2DD\uC218 \uD604\uD669 \uBCF4\uACE0]\n\n\uAE30\uC900\uC77C: {{date}}\n\uC0AC\uC5C5\uC7A5: {{siteName}} ({{siteId}})\n\n- \uC911\uC2DD DI: {{lunch_di}}\n- \uC911\uC2DD TO: {{lunch_to}}\n- \uD569\uACC4: {{lunch_total}}\n\n\uD2B9\uC774\uC0AC\uD56D:\n\uC6D0\uC778 \uBD84\uC11D:\n\uAC1C\uC120 \uBC29\uC548:",
      "TRUE",
      1
    ]);

    addIfMissing([
      "event_checklist",
      "ops",
      "\uD589\uC0AC \uC6B4\uC601 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8",
      "\uC0AC\uC804/\uB2F9\uC77C/\uC0AC\uD6C4 \uC810\uAC80",
      "[\uD589\uC0AC \uC6B4\uC601 \uCCB4\uD06C\uB9AC\uC2A4\uD2B8]\n\n\uC0AC\uC5C5\uC7A5: {{siteName}}\n\uC77C\uC790: {{date}}\n\n- \uC0AC\uC804(D-3): \uBA54\uB274/\uC218\uB7C9 \uD655\uC815, \uBC1C\uC8FC \uBC0F \uC7A5\uBE44 \uD655\uC778\n- \uB2F9\uC77C(D): \uC870\uB9AC \uC644\uB8CC, \uC138\uD305 \uC644\uB8CC, \uB3D9\uC120 \uBC30\uCE58\n- \uC0AC\uD6C4: \uC794\uC2DD \uCC98\uB9AC \uBC0F \uACB0\uACFC \uBCF4\uACE0",
      "TRUE",
      2
    ]);

    addIfMissing([
      "weekly_audit_summary",
      "insights",
      "\uC8FC\uAC04 \uC810\uAC80 \uC694\uC57D(\uC790\uB3D9)",
      "\uCD5C\uC2E0 \uC8FC\uAC04 \uBC30\uCE58 \uAE30\uBC18 \uC694\uC57D \uBB38\uC548 \uC0DD\uC131",
      "[\uC8FC\uAC04 \uC810\uAC80 \uC694\uC57D]\n\n\uAE30\uC900\uC77C: {{date}}\n\uC0AC\uC5C5\uC7A5: {{siteName}} ({{siteId}})\nweekly_runId: {{weekly_runId}}\nweekly_runAt: {{weekly_runAt}}\n\n\uD604\uD669: ERR {{weekly_err_count}} / WARN {{weekly_warn_count}} / INFO {{weekly_info_count}}\n\n{{weekly_summary}}\n\n\uCF54\uBA58\uD2B8:\n\uD6C4\uC18D \uC870\uCE58:",
      "TRUE",
      10
    ]);

    if (toAppend.length) {
      var toAppendRows = [];
      toAppend.forEach(function(row){
        var mapped = new Array(data.header.length);
        if (idx.templateId >= 0) mapped[idx.templateId] = row[0];
        if (idx.groupId >= 0) mapped[idx.groupId] = row[1];
        if (idx.label >= 0) mapped[idx.label] = row[2];
        if (idx.description >= 0) mapped[idx.description] = row[3];
        if (idx.body >= 0) mapped[idx.body] = row[4];
        if (idx.enabled >= 0) mapped[idx.enabled] = row[5];
        if (idx.sort >= 0) mapped[idx.sort] = row[6];
        toAppendRows.push(mapped);
      });
      var startRow = sh.getLastRow() + 1;
      sh.getRange(startRow, 1, toAppendRows.length, toAppendRows[0].length).setValues(toAppendRows);
      LogService.log_("INFO", "INSTALL", "ensureTemplates", "appended", { count: toAppendRows.length });
    }
  }

  function ensureSettingsDefaults_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.SETTINGS, Schema.defaultHeaders_(CONFIG.SHEETS.SETTINGS));
    var sh = SheetRepo.sheet_(CONFIG.SHEETS.SETTINGS);
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SETTINGS);
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SETTINGS, data.header);
    var existing = {};

    data.rows.forEach(function(r){
      var key = String(r[idx.key] || "");
      if (key) existing[key] = true;
    });

    var rows = [];
    addSettingIfMissing_(rows, existing, "DEFAULT_SITE_ID", CONFIG.DEFAULTS.DEFAULT_SITE_ID, "default selected site");
    addSettingIfMissing_(rows, existing, "SITE_LIST_JSON", CONFIG.DEFAULTS.SITE_LIST_JSON, "site list config");
    addSettingIfMissing_(rows, existing, "FEATURE_FLAGS_JSON", CONFIG.DEFAULTS.FEATURE_FLAGS_JSON, "frontend/backend feature flags");

    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
      LogService.log_("INFO", "INSTALL", "ensureSettingsDefaults", "appended", { count: rows.length });
    }
  }

  function addSettingIfMissing_(rows, existing, key, value, note){
    if (existing[key]) return;
    rows.push([key, value, note || ""]);
  }

  return { setupAll: setupAll, setupTriggers: setupTriggers };
})();
var Jobs = (function(){
  function runDailyAudit(){
    LogService.log_("INFO", "TRIGGER", "runDailyAudit", "start", null);
    var results = InsightService.runAuditForAllSites_("daily", "14d");
    LogService.log_("INFO", "TRIGGER", "runDailyAudit", "done", { results: results });
  }

  function runWeeklyAudit(){
    LogService.log_("INFO", "TRIGGER", "runWeeklyAudit", "start", null);
    var results = InsightService.runAuditForAllSites_("weekly", "30d");
    LogService.log_("INFO", "TRIGGER", "runWeeklyAudit", "done", { results: results });

    // Next expansion: store ALL-sites weekly summary into system memo
    var summary = WeeklyReportService.allSitesWeeklySummary_();
    var memoId = MemoService.saveSystemMemo_("ALL", "report", ["weekly","audit","summary"], summary);
    LogService.log_("INFO", "TRIGGER", "runWeeklyAudit", "saved_all_summary_memo", { memoId: memoId });
  }

  return { runDailyAudit: runDailyAudit, runWeeklyAudit: runWeeklyAudit };
})();

function globalDailyAudit() {
  Jobs.runDailyAudit();
}
function globalWeeklyAudit() {
  Jobs.runWeeklyAudit();
}
function globalCleanSessions() {
  var count = SessionRepository.deactivateExpired_();
  LogService.log_("INFO", "TRIGGER", "globalCleanSessions", "done", { expiredCount: count });
}
function doGet(e) {
  return Router.handle_("GET", (e && e.parameter) ? e.parameter : {});
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : "{}");
  } catch (err) {
    return jsonOut_(fail_("__parse__", "VALIDATION_ERROR", "Invalid JSON body"));
  }
  return Router.handle_("POST", body);
}
var Router = (function () {
  var PUBLIC_ACTIONS = {
    health: { method: "GET", handler: function(req){ return HealthService.health(req); } },
    login: { method: "POST", handler: function(req){ return AuthService.login(req); } }
  };

  var SESSION_ACTIONS = {
    logout: { method: "POST", handler: function(req){ return AuthService.logout(req); } },
    getSession: { method: "POST", handler: function(req){ return AuthService.getSession(req); } },
    getAppConfig: { method: "POST", handler: function(req){ return AppConfigService.getAppConfig(req); } },
    getDashboardSummary: { method: "POST", handler: function(req){ return HeadcountService.getDashboardSummary(req); } },
    getTemplateActions: { method: "POST", handler: function(req){ return TemplateService.getTemplateActions(req); } },
    renderTemplate: { method: "POST", handler: function(req){ return TemplateService.renderTemplate(req); } },
    getMemoList: { method: "POST", handler: function(req){ return MemoService.getMemoList(req); } },
    getInsights: { method: "POST", handler: function(req){ return InsightService.getInsights(req); } },
    saveMemo: { method: "POST", handler: function(req){ return MemoService.saveMemo(req); } },
    runAudit: { method: "POST", handler: function(req){ return InsightService.runAudit(req); } }
  };

  var ADMIN_ACTIONS = {
    getSystemStatus: { method: "POST", handler: function(req){ return SystemService.getSystemStatus(req); } },
    setupAll: { method: "POST", handler: function(req){ return Installer.setupAll(req); } },
    setupTriggers: { method: "POST", handler: function(req){ return Installer.setupTriggers(req); } }
  };

  function route_(action) {
    return PUBLIC_ACTIONS[action] || SESSION_ACTIONS[action] || ADMIN_ACTIONS[action] || null;
  }

  function sanitizeReq_(req) {
    var safeReq = {};
    Object.keys(req || {}).forEach(function(key){
      if (key !== "k" && key !== "adminKey" && key !== "password" && key !== "st") safeReq[key] = req[key];
    });
    return safeReq;
  }

  function enforceMethod_(action, expected, method) {
    if (expected === method) return null;
    return fail_(action, "METHOD_NOT_ALLOWED", "Use " + expected + " for this action");
  }

  function requireKey_(action, provided, expected, errorCode, message) {
    if (!expected) return fail_(action, "CONFIG_REQUIRED", message + " is not configured");
    if (provided === expected) return null;
    return fail_(action, errorCode, message + " is invalid");
  }

  function handle_(method, req) {
    var action = (req && req.action) ? req.action : "health";
    var route = route_(action);
    var session = null;

    LogService.log_("INFO", "API", action, method, sanitizeReq_(req));

    if (!route) {
      LogService.log_("WARN", "API", action, "UNKNOWN_ACTION", null);
      return jsonOut_(fail_(action, "UNKNOWN_ACTION", "unknown action"));
    }

    var methodError = enforceMethod_(action, route.method, method);
    if (methodError) return jsonOut_(methodError);

    if (CONFIG.API_KEY && req.k !== CONFIG.API_KEY) {
      LogService.log_("WARN", "API", action, "INVALID_API_KEY", null);
      return jsonOut_(fail_(action, "FORBIDDEN", "Invalid API key"));
    }

    if (SESSION_ACTIONS[action] || ADMIN_ACTIONS[action]) {
      var sessionResult = AuthService.requireSession_(req);
      if (!sessionResult.ok) return jsonOut_(sessionResult.error);
      session = sessionResult.session;
    }

    if (ADMIN_ACTIONS[action]) {
      var adminKeyError = requireKey_(action, req.adminKey, CONFIG.ADMIN_API_KEY, "ADMIN_AUTH_REQUIRED", "Admin API key");
      if (adminKeyError) return jsonOut_(adminKeyError);
      if (!AuthService.isAdminRole_(session.role)) {
        return jsonOut_(fail_(action, "FORBIDDEN", "Admin role is required"));
      }
    }

    try {
      if (session) {
        req._user = {
          userId: session.userId,
          displayName: session.displayName,
          role: session.role,
          expiresAt: session.expiresAt
        };
        AccessLogService.log_(ADMIN_ACTIONS[action] ? "ADMIN" : "VIEW", req._user, action, method, sanitizeReq_(req));
      }
      return jsonOut_(route.handler(req));
    } catch (err) {
      LogService.log_("ERROR", "API", action, String(err), null);
      return jsonOut_(fail_(action, "INTERNAL_ERROR", String(err)));
    }
  }

  return { handle_: handle_ };
})();
var Schema = (function(){
  var SCHEMAS = {};

  SCHEMAS[CONFIG.SHEETS.HEADCOUNT] = [
    { logical:"date",         header:"\uC77C\uC790", required:true },
    { logical:"siteId",       header:"\uC0AC\uC5C5\uC7A5ID", required:true },
    { logical:"siteName",     header:"\uC0AC\uC5C5\uC7A5\uBA85", required:false },
    { logical:"meal",         header:"\uB07C\uB2C8", required:true },
    { logical:"diCount",      header:"DI\uC2DD\uC218", required:true },
    { logical:"toCount",      header:"TO\uC2DD\uC218", required:false },
    { logical:"seatCount",    header:"\uC88C\uC11D\uC218", required:false },
    { logical:"toCornerCount",header:"TO\uCF54\uB108\uC218", required:false },
    { logical:"staffCount",   header:"\uC0AC\uC785\uC778\uC6D0", required:false },
    { logical:"note",         header:"\uBE44\uACE0", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.MEMO] = [
    { logical:"memoId",    header:"\uBA54\uBAA8ID", required:true },
    { logical:"date",      header:"\uC77C\uC790", required:true },
    { logical:"siteId",    header:"\uC0AC\uC5C5\uC7A5ID", required:true },
    { logical:"category",  header:"\uCE74\uD14C\uACE0\uB9AC", required:true },
    { logical:"tags",      header:"\uD0DC\uADF8", required:false },
    { logical:"content",   header:"\uB0B4\uC6A9", required:true },
    { logical:"createdAt", header:"\uB4F1\uB85D\uC77C\uC2DC", required:true }
  ];

  SCHEMAS[CONFIG.SHEETS.TEMPLATES] = [
    { logical:"templateId",  header:"\uD15C\uD50C\uB9BFID", required:true },
    { logical:"groupId",     header:"\uADF8\uB8F9ID", required:true },
    { logical:"label",       header:"\uD15C\uD50C\uB9BF\uBA85", required:true },
    { logical:"description", header:"\uC124\uBA85", required:false },
    { logical:"body",        header:"\uD15C\uD50C\uB9BF\uBCF8\uBB38", required:true },
    { logical:"enabled",     header:"\uC0AC\uC6A9\uC5EC\uBD80", required:false },
    { logical:"sort",        header:"\uC815\uB82C\uC21C\uC11C", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.INSIGHTS] = [
    { logical:"runId",       header:"runId", required:true },
    { logical:"runAt",       header:"runAt", required:true },
    { logical:"siteId",      header:"siteId", required:true },
    { logical:"scope",       header:"scope", required:true },
    { logical:"period",      header:"period", required:false },
    { logical:"level",       header:"level", required:true },
    { logical:"code",        header:"code", required:true },
    { logical:"title",       header:"title", required:true },
    { logical:"message",     header:"message", required:true },
    { logical:"actionGuide", header:"actionGuide", required:false },
    { logical:"status",      header:"status", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.SETTINGS] = [
    { logical:"key", header:"key", required:true },
    { logical:"value", header:"value", required:false },
    { logical:"note", header:"note", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.LOG] = [
    { logical:"ts",      header:"ts", required:true },
    { logical:"level",   header:"level", required:true },
    { logical:"source",  header:"source", required:true },
    { logical:"action",  header:"action", required:false },
    { logical:"message", header:"message", required:false },
    { logical:"payload", header:"payload", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.USERS] = [
    { logical:"userId",      header:"userId", required:true },
    { logical:"password",    header:"password", required:true },
    { logical:"displayName", header:"displayName", required:false },
    { logical:"role",        header:"role", required:false },
    { logical:"enabled",     header:"enabled", required:false },
    { logical:"note",        header:"note", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.SESSIONS] = [
    { logical:"sessionToken", header:"sessionToken", required:true },
    { logical:"userId",       header:"userId", required:true },
    { logical:"displayName",  header:"displayName", required:false },
    { logical:"role",         header:"role", required:false },
    { logical:"createdAt",    header:"createdAt", required:true },
    { logical:"expiresAt",    header:"expiresAt", required:true },
    { logical:"lastSeenAt",   header:"lastSeenAt", required:false },
    { logical:"active",       header:"active", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.ACCESS_LOG] = [
    { logical:"ts",         header:"ts", required:true },
    { logical:"eventType",  header:"eventType", required:true },
    { logical:"userId",     header:"userId", required:false },
    { logical:"displayName",header:"displayName", required:false },
    { logical:"role",       header:"role", required:false },
    { logical:"action",     header:"action", required:false },
    { logical:"siteId",     header:"siteId", required:false },
    { logical:"date",       header:"date", required:false },
    { logical:"message",    header:"message", required:false },
    { logical:"payload",    header:"payload", required:false }
  ];

  var FIELDMAP_HEADER = ["sheet","logical","header","enabled","note"];

  var _fieldMapCache = null;

  function loadFieldMap_() {
    if (_fieldMapCache) return _fieldMapCache;
    var name = CONFIG.SHEETS.FIELDMAP;
    var data;
    try { data = SheetRepo.readAll_(name); } catch(e){ return {}; }
    var header = data.header || [];
    var idx = {
      sheet: header.indexOf("sheet"),
      logical: header.indexOf("logical"),
      hdr: header.indexOf("header"),
      enabled: header.indexOf("enabled")
    };
    if (idx.sheet < 0 || idx.logical < 0 || idx.hdr < 0) return {};

    var map = {};
    data.rows.forEach(function(r){
      var sh = String(r[idx.sheet] || "");
      var lg = String(r[idx.logical] || "");
      var hd = String(r[idx.hdr] || "");
      var en = idx.enabled >= 0 ? String(r[idx.enabled] || "TRUE") : "TRUE";
      if (!sh || !lg || !hd) return;
      if (String(en).toUpperCase() === "FALSE") return;
      if (!map[sh]) map[sh] = {};
      map[sh][lg] = hd;
    });
    _fieldMapCache = map;
    return _fieldMapCache;
  }

  function buildIndexMap_(sheetName, headerRow) {
    var schema = SCHEMAS[sheetName];
    if (!schema) throw new Error("Schema not found for sheet: " + sheetName);

    var fmapAll = loadFieldMap_();
    var fmap = fmapAll[sheetName] || {};

    var idx = {};
    var missing = [];
    schema.forEach(function(f){
      var realHeader = fmap[f.logical] || f.header;
      var pos = headerRow.indexOf(realHeader);
      idx[f.logical] = pos;
      if (f.required && pos < 0) missing.push(f.logical + "->" + realHeader);
    });

    if (missing.length) throw new Error("Missing required headers in '" + sheetName + "': " + missing.join(", "));
    return idx;
  }

  function defaultHeaders_(sheetName){
    if (sheetName === CONFIG.SHEETS.FIELDMAP) return FIELDMAP_HEADER;
    var schema = SCHEMAS[sheetName] || [];
    return schema.map(function(x){ return x.header; });
  }

  function getSchema_(sheetName){ return SCHEMAS[sheetName] || []; }

  return {
    getSchema_: getSchema_,
    defaultHeaders_: defaultHeaders_,
    loadFieldMap_: loadFieldMap_,
    buildIndexMap_: buildIndexMap_
  };
})();
var HeadcountRepository = (function(){
  function listBySiteDate_(siteId, dateStr){
    var data = SheetRepo.readAll_(CONFIG.SHEETS.HEADCOUNT);
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.HEADCOUNT, data.header);

    return data.rows.map(function(r){
      return {
        date: String(r[idx.date] || ""),
        siteId: String(r[idx.siteId] || ""),
        siteName: String(idx.siteName >= 0 ? (r[idx.siteName] || "") : ""),
        meal: String(r[idx.meal] || ""),
        di: Number(r[idx.diCount] || 0),
        to: Number(idx.toCount >= 0 ? (r[idx.toCount] || 0) : 0),
        seatCount: Number(idx.seatCount >= 0 ? (r[idx.seatCount] || 0) : 0),
        toCornerCount: Number(idx.toCornerCount >= 0 ? (r[idx.toCornerCount] || 1) : 1),
        staffCount: Number(idx.staffCount >= 0 ? (r[idx.staffCount] || 0) : 0)
      };
    }).filter(function(x){ return x.siteId === String(siteId) && x.date === String(dateStr); });
  }

  function listBySiteRange_(siteId, startDate, endDate){
    var data = SheetRepo.readAll_(CONFIG.SHEETS.HEADCOUNT);
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.HEADCOUNT, data.header);

    return data.rows.map(function(r){
      return {
        date: String(r[idx.date] || ""),
        siteId: String(r[idx.siteId] || ""),
        meal: String(r[idx.meal] || ""),
        di: Number(r[idx.diCount] || 0),
        to: Number(idx.toCount >= 0 ? (r[idx.toCount] || 0) : 0)
      };
    }).filter(function(x){
      return x.siteId === String(siteId) && x.date >= startDate && x.date <= endDate;
    });
  }

  return { listBySiteDate_: listBySiteDate_, listBySiteRange_: listBySiteRange_ };
})();
var InsightRepository = (function(){
  function ensure_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.INSIGHTS, Schema.defaultHeaders_(CONFIG.SHEETS.INSIGHTS));
  }

  function insertBatch_(runMeta, items){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.INSIGHTS);
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.INSIGHTS, data.header);

    items.forEach(function(it){
      SheetRepo.appendByIndexMap_(CONFIG.SHEETS.INSIGHTS, data.header, idx, {
        runId: runMeta.runId,
        runAt: runMeta.runAt,
        siteId: runMeta.siteId,
        scope: runMeta.scope,
        period: runMeta.period || "",
        level: it.level,
        code: it.code,
        title: it.title,
        message: it.message,
        actionGuide: it.actionGuide || "",
        status: it.status || "OPEN"
      });
    });
  }

  function listLatestBatch_(siteId, scopeOpt){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.INSIGHTS);
    if (!data.rows.length) return null;
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.INSIGHTS, data.header);

    var filtered = data.rows.map(function(r){
      return {
        runId: String(r[idx.runId] || ""),
        runAt: String(r[idx.runAt] || ""),
        siteId: String(r[idx.siteId] || ""),
        scope: String(r[idx.scope] || ""),
        period: String(idx.period>=0 ? (r[idx.period]||"") : ""),
        level: String(r[idx.level] || "info"),
        code: String(r[idx.code] || ""),
        title: String(r[idx.title] || ""),
        message: String(r[idx.message] || ""),
        actionGuide: String(idx.actionGuide>=0 ? (r[idx.actionGuide]||"") : ""),
        status: String(idx.status>=0 ? (r[idx.status]||"") : "OPEN")
      };
    }).filter(function(x){
      if (x.siteId !== String(siteId) || !x.runId) return false;
      if (!scopeOpt) return true;
      return String(x.scope).toLowerCase() === String(scopeOpt).toLowerCase();
    });

    if (!filtered.length) return null;

    filtered.sort(function(a,b){ return (a.runAt < b.runAt) ? 1 : (a.runAt > b.runAt ? -1 : 0); });
    var latestRunId = filtered[0].runId;
    var latest = filtered.filter(function(x){ return x.runId === latestRunId; });

    var meta = { runId: latestRunId, runAt: latest[0].runAt, siteId: siteId, scope: latest[0].scope, period: latest[0].period };
    var items = latest.map(function(x){
      return { level:x.level, code:x.code, title:x.title, message:x.message, actionGuide:x.actionGuide, status:x.status };
    });
    return { run: meta, items: items };
  }

  return { insertBatch_: insertBatch_, listLatestBatch_: listLatestBatch_ };
})();
var MemoRepository = (function(){
  function appendMemo_(memo){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.MEMO, Schema.defaultHeaders_(CONFIG.SHEETS.MEMO));
    var data = SheetRepo.readAll_(CONFIG.SHEETS.MEMO);
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.MEMO, data.header);

    SheetRepo.appendByIndexMap_(CONFIG.SHEETS.MEMO, data.header, idx, {
      memoId: memo.memoId,
      date: memo.date,
      siteId: memo.siteId,
      category: memo.category,
      tags: memo.tags,
      content: memo.content,
      createdAt: memo.createdAt
    });
  }

  function list_(siteId, limit){
    var data = SheetRepo.readAll_(CONFIG.SHEETS.MEMO);
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.MEMO, data.header);

    var items = data.rows.map(function(r){
      var tags = (idx.tags >= 0) ? String(r[idx.tags] || "") : "";
      return {
        memoId: String(r[idx.memoId] || ""),
        date: String(r[idx.date] || ""),
        siteId: String(r[idx.siteId] || ""),
        category: String(r[idx.category] || ""),
        tags: tags ? tags.split(",").map(function(x){ return x.trim(); }).filter(Boolean) : [],
        content: String(r[idx.content] || ""),
        createdAt: String(r[idx.createdAt] || "")
      };
    }).filter(function(x){ return x.siteId === String(siteId); }).reverse();

    return items.slice(0, limit || 20);
  }

  return { appendMemo_: appendMemo_, list_: list_ };
})();
var SessionRepository = (function(){
  function ensure_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.SESSIONS, Schema.defaultHeaders_(CONFIG.SHEETS.SESSIONS));
  }

  function listAll_(){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    if (!data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);

    return data.rows.map(function(row, rowIndex){
      return {
        rowNumber: rowIndex + 2,
        sessionToken: String(row[idx.sessionToken] || ""),
        userId: String(row[idx.userId] || ""),
        displayName: String(row[idx.displayName] || ""),
        role: String(row[idx.role] || ""),
        createdAt: String(row[idx.createdAt] || ""),
        expiresAt: String(row[idx.expiresAt] || ""),
        lastSeenAt: String(row[idx.lastSeenAt] || ""),
        active: String(idx.active >= 0 ? (row[idx.active] || "TRUE") : "TRUE")
      };
    }).filter(function(item){ return item.sessionToken; });
  }

  function create_(session){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);

    SheetRepo.appendByIndexMap_(CONFIG.SHEETS.SESSIONS, data.header, idx, {
      sessionToken: session.sessionToken,
      userId: session.userId,
      displayName: session.displayName || "",
      role: session.role || "",
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastSeenAt: session.lastSeenAt || session.createdAt,
      active: "TRUE"
    });
  }

  function findValid_(sessionToken){
    if (!sessionToken) return null;
    var now = new Date();
    var items = listAll_();
    for (var i = items.length - 1; i >= 0; i--) {
      var item = items[i];
      if (item.sessionToken !== sessionToken) continue;
      if (String(item.active).toUpperCase() === "FALSE") return null;
      if (!item.expiresAt || new Date(item.expiresAt).getTime() <= now.getTime()) return null;
      return item;
    }
    return null;
  }

  function deactivate_(sessionToken){
    if (!sessionToken) return;
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    if (!data.header.length || !data.rows.length) return;
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);
    var sh = SheetRepo.sheet_(CONFIG.SHEETS.SESSIONS);

    for (var i = data.rows.length - 1; i >= 0; i--) {
      if (String(data.rows[i][idx.sessionToken] || "") !== sessionToken) continue;
      if (idx.active >= 0) sh.getRange(i + 2, idx.active + 1).setValue("FALSE");
      if (idx.lastSeenAt >= 0) sh.getRange(i + 2, idx.lastSeenAt + 1).setValue(DateUtil.nowIso_());
      return;
    }
  }

  function touch_(sessionToken, expiresAt){
    if (!sessionToken) return;
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    if (!data.header.length || !data.rows.length) return;
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);
    var sh = SheetRepo.sheet_(CONFIG.SHEETS.SESSIONS);

    for (var i = data.rows.length - 1; i >= 0; i--) {
      if (String(data.rows[i][idx.sessionToken] || "") !== sessionToken) continue;
      if (idx.lastSeenAt >= 0) sh.getRange(i + 2, idx.lastSeenAt + 1).setValue(DateUtil.nowIso_());
      if (idx.expiresAt >= 0 && expiresAt) sh.getRange(i + 2, idx.expiresAt + 1).setValue(expiresAt);
      return;
    }
  }

  function deactivateExpired_(){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    if (!data.header.length || !data.rows.length) return 0;
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);
    var sh = SheetRepo.sheet_(CONFIG.SHEETS.SESSIONS);
    var count = 0;
    var now = new Date().getTime();

    if (idx.active < 0) return 0;

    var activeColValues = sh.getRange(2, idx.active + 1, data.rows.length, 1).getValues();

    data.rows.forEach(function(row, rowIndex){
      var expiresAt = String(row[idx.expiresAt] || "");
      var active = String(activeColValues[rowIndex][0]).toUpperCase();
      if (active === "FALSE") return;
      if (!expiresAt || new Date(expiresAt).getTime() > now) return;
      activeColValues[rowIndex][0] = "FALSE";
      count += 1;
    });

    if (count > 0) {
      sh.getRange(2, idx.active + 1, data.rows.length, 1).setValues(activeColValues);
    }

    return count;
  }

  return {
    ensure_: ensure_,
    create_: create_,
    findValid_: findValid_,
    touch_: touch_,
    deactivate_: deactivate_,
    deactivateExpired_: deactivateExpired_
  };
})();
var SettingsRepository = (function(){
  function listAll_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.SETTINGS, Schema.defaultHeaders_(CONFIG.SHEETS.SETTINGS));
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SETTINGS);
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SETTINGS, data.header);

    return data.rows.map(function(r){
      return {
        key: String(r[idx.key] || ""),
        value: String(idx.value >= 0 ? (r[idx.value] || "") : ""),
        note: String(idx.note >= 0 ? (r[idx.note] || "") : "")
      };
    }).filter(function(x){ return x.key; });
  }

  function getMap_(){
    var map = {};
    listAll_().forEach(function(item){
      map[item.key] = item.value;
    });
    return map;
  }

  return { listAll_: listAll_, getMap_: getMap_ };
})();
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
    if (lastRow >= 1) return; // ?°ì´???¤ë” ?ˆìœ¼ë©?ë³´ì¡´
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
var TemplateRepository = (function(){
  function listEnabled_(){
    var data = SheetRepo.readAll_(CONFIG.SHEETS.TEMPLATES);
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.TEMPLATES, data.header);

    return data.rows.map(function(r){
      var enabled = (idx.enabled >= 0) ? String(r[idx.enabled] || "TRUE") : "TRUE";
      return {
        templateId: String(r[idx.templateId] || ""),
        groupId: String(r[idx.groupId] || ""),
        label: String(r[idx.label] || ""),
        description: String(idx.description >= 0 ? (r[idx.description] || "") : ""),
        body: String(r[idx.body] || ""),
        enabled: String(enabled).toUpperCase() !== "FALSE",
        sort: Number(idx.sort >= 0 ? (r[idx.sort] || 0) : 0)
      };
    }).filter(function(x){ return x.templateId && x.enabled; });
  }

  function exists_(templateId){
    var list = listEnabled_();
    return list.some(function(t){ return t.templateId === templateId; });
  }

  return { listEnabled_: listEnabled_, exists_: exists_ };
})();
var UserRepository = (function(){
  var DEFAULT_HEADERS = ["userId","password","displayName","role","enabled","note"];

  function ensure_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.USERS, DEFAULT_HEADERS);
  }

  function normalize_(value){
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/@samsung\.com$/i, "");
  }

  function listAll_(){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.USERS);
    if (!data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.USERS, data.header);

    return data.rows.map(function(row){
      var enabledRaw = idx.enabled >= 0 ? String(row[idx.enabled] || "TRUE") : "TRUE";
      return {
        userId: normalize_(idx.userId >= 0 ? row[idx.userId] : ""),
        password: String(idx.password >= 0 ? row[idx.password] : ""),
        displayName: String(idx.displayName >= 0 ? row[idx.displayName] : ""),
        role: String(idx.role >= 0 ? row[idx.role] : "USER"),
        enabled: String(enabledRaw).toUpperCase() !== "FALSE" && String(enabledRaw) !== "0",
        note: String(idx.note >= 0 ? row[idx.note] : "")
      };
    }).filter(function(user){ return user.userId; });
  }

  function findByUserId_(userId){
    var normalized = normalize_(userId);
    var items = listAll_();
    for (var i = 0; i < items.length; i++) {
      if (items[i].userId === normalized) return items[i];
    }
    return null;
  }

  return {
    ensure_: ensure_,
    listAll_: listAll_,
    findByUserId_: findByUserId_
  };
})();
var AccessLogService = (function(){
  function ensure_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.ACCESS_LOG, Schema.defaultHeaders_(CONFIG.SHEETS.ACCESS_LOG));
  }

  function log_(eventType, user, action, message, payload){
    try {
      ensure_();
      var data = SheetRepo.readAll_(CONFIG.SHEETS.ACCESS_LOG);
      var idx = Schema.buildIndexMap_(CONFIG.SHEETS.ACCESS_LOG, data.header);
      var safePayload = payload ? JSON.stringify(payload).slice(0, 50000) : "";

      SheetRepo.appendByIndexMap_(CONFIG.SHEETS.ACCESS_LOG, data.header, idx, {
        ts: DateUtil.nowIso_(),
        eventType: eventType || "VIEW",
        userId: user && user.userId ? user.userId : "",
        displayName: user && user.displayName ? user.displayName : "",
        role: user && user.role ? user.role : "",
        action: action || "",
        siteId: payload && payload.siteId ? payload.siteId : "",
        date: payload && payload.date ? payload.date : "",
        message: message || "",
        payload: safePayload
      });
    } catch (e) {
      // fail-safe
    }
  }

  return { log_: log_ };
})();
var AppConfigService = (function(){
  function parseJsonOr_(raw, fallback){
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function getSettingsMap_(){
    try { return SettingsRepository.getMap_(); }
    catch (e) { return {}; }
  }

  function getAppConfig(){
    var settings = getSettingsMap_();
    var sites = parseJsonOr_(settings.SITE_LIST_JSON, parseJsonOr_(CONFIG.DEFAULTS.SITE_LIST_JSON, []));
    var featureFlags = parseJsonOr_(settings.FEATURE_FLAGS_JSON, parseJsonOr_(CONFIG.DEFAULTS.FEATURE_FLAGS_JSON, {}));
    var defaultSiteId = settings.DEFAULT_SITE_ID || CONFIG.DEFAULTS.DEFAULT_SITE_ID;

    return ok_("getAppConfig", {
      defaultSiteId: defaultSiteId,
      sites: sites,
      featureFlags: featureFlags
    }, "");
  }

  function listSites_(){
    var cfg = getAppConfig();
    return cfg.success ? (cfg.data.sites || []) : [];
  }

  return { getAppConfig: getAppConfig, listSites_: listSites_ };
})();
var AuthService = (function(){
  function normalizeUserId_(value){
    return String(value || "").trim().toLowerCase().replace(/@samsung\.com$/i, "");
  }

  function roleNorm_(role){
    return String(role || "USER").trim().toUpperCase();
  }

  function isAdminRole_(role){
    var normalized = roleNorm_(role);
    return normalized === "M" || normalized === "A" || normalized === "ADMIN" || normalized === "SUPERADMIN";
  }

  function sessionExpiry_(){
    var expires = new Date();
    expires.setMinutes(expires.getMinutes() + CONFIG.SESSION_TTL_MINUTES);
    return expires.toISOString();
  }

  function buildSession_(user){
    var raw = Utilities.getUuid() + "|" + user.userId + "|" + new Date().toISOString();
    var token = Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw)
    ).replace(/=+$/g, "");

    return {
      sessionToken: token,
      userId: user.userId,
      displayName: user.displayName || user.userId,
      role: roleNorm_(user.role),
      createdAt: DateUtil.nowIso_(),
      expiresAt: sessionExpiry_(),
      lastSeenAt: DateUtil.nowIso_()
    };
  }

  function login(req){
    var action = "login";
    var bad = Validator.required_(action, req, ["userId","password"]);
    if (bad) return bad;

    var user = UserRepository.findByUserId_(req.userId);
    var normalizedUserId = normalizeUserId_(req.userId);
    if (!user || !user.enabled) {
      AccessLogService.log_("LOGIN_FAIL", { userId: normalizedUserId }, action, "user_not_found_or_disabled", null);
      return fail_(action, "AUTH_REQUIRED", "Invalid user or password");
    }

    var reqHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(req.password || "")));
    var userPw = String(user.password || "");
    if (userPw !== String(req.password || "") && userPw !== reqHash) {
      AccessLogService.log_("LOGIN_FAIL", user, action, "wrong_password", null);
      return fail_(action, "AUTH_REQUIRED", "Invalid user or password");
    }

    var session = buildSession_(user);
    SessionRepository.create_(session);
    AccessLogService.log_("LOGIN", session, action, "login_success", null);
    LogService.log_("INFO", "AUTH", action, "login_success", { userId: session.userId, role: session.role });

    return ok_(action, {
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      user: {
        userId: session.userId,
        displayName: session.displayName,
        role: session.role
      }
    }, "");
  }

  function requireSession_(req){
    var sessionToken = req && req.st ? String(req.st) : "";
    if (!sessionToken) {
      return { ok: false, error: fail_("session", "AUTH_REQUIRED", "Session is required") };
    }

    var session = SessionRepository.findValid_(sessionToken);
    if (!session) {
      return { ok: false, error: fail_("session", "SESSION_EXPIRED", "Session expired. Please login again") };
    }

    var newExpiry = sessionExpiry_();
    SessionRepository.touch_(session.sessionToken, newExpiry);
    session.expiresAt = newExpiry;
    session.role = roleNorm_(session.role);
    return { ok: true, session: session };
  }

  function logout(req){
    var action = "logout";
    var checked = requireSession_(req);
    if (!checked.ok) return checked.error;

    SessionRepository.deactivate_(checked.session.sessionToken);
    AccessLogService.log_("LOGOUT", checked.session, action, "logout", null);
    return ok_(action, { ok: true }, "");
  }

  function getSession(req){
    var action = "getSession";
    var checked = requireSession_(req);
    if (!checked.ok) return checked.error;

    return ok_(action, {
      user: {
        userId: checked.session.userId,
        displayName: checked.session.displayName,
        role: checked.session.role
      },
      expiresAt: checked.session.expiresAt
    }, "");
  }

  return {
    login: login,
    logout: logout,
    getSession: getSession,
    requireSession_: requireSession_,
    isAdminRole_: isAdminRole_
  };
})();
var HeadcountService = (function(){
  function getDashboardSummary(req){
    var action = "getDashboardSummary";
    var bad = Validator.required_(action, req, ["siteId"]);
    if (bad) return bad;

    var date = req.date || DateUtil.today_();
    var rows = HeadcountRepository.listBySiteDate_(req.siteId, date);

    if (!rows.length) {
      return ok_(action, {
        siteId: req.siteId,
        siteName: "",
        date: date,
        headcount: {},
        ops: {},
        kpi: {},
        compare: {},
        status: { rotationLevel:"ok", staffLoadLevel:"ok" }
      }, "no data");
    }

    var siteName = rows[0].siteName || "";
    var headcount = { breakfast:{}, lunch:{}, dinner:{}, late:{} };
    var ops = { seatCount: 0, toCornerCount: 1, staffCountLunch: 0 };

    rows.forEach(function(r){
      var key = mealKey_(r.meal);
      headcount[key] = { di: r.di, to: r.to };
      if (key === "lunch") {
        ops.seatCount = r.seatCount || ops.seatCount;
        ops.toCornerCount = r.toCornerCount || ops.toCornerCount;
        ops.staffCountLunch = r.staffCount || ops.staffCountLunch;
      }
    });

    var lunch = headcount.lunch || { di:0, to:0 };
    var seat = ops.seatCount || 0;
    var toc  = ops.toCornerCount || 1;
    var staff = ops.staffCountLunch || 0;

    var rotationDi = seat ? round_(lunch.di / seat, 2) : null;
    var rotationWithTo = seat ? round_((lunch.di + (lunch.to / toc)) / seat, 2) : null;
    var mealPerStaff = staff ? round_((lunch.di + lunch.to) / staff, 1) : null;

    var rotationLevel = rotationWithTo >= 3.5 ? "err" : rotationWithTo >= 2.5 ? "warn" : "ok";
    var staffLoadLevel = mealPerStaff >= 95 ? "err" : mealPerStaff >= 80 ? "warn" : "ok";

    return ok_(action, {
      siteId: req.siteId,
      siteName: siteName,
      date: date,
      headcount: headcount,
      ops: ops,
      kpi: { rotationDi: rotationDi, rotationWithTo: rotationWithTo, mealPerStaff: mealPerStaff },
      compare: buildCompare_(req.siteId, date, (lunch.di + lunch.to) || 0),
      status: { rotationLevel: rotationLevel, staffLoadLevel: staffLoadLevel }
    }, "");
  }

  function buildCompare_(siteId, date, todayTotal){
    var prev = DateUtil.addDays_(date, -1);
    var prevRows = HeadcountRepository.listBySiteDate_(siteId, prev);
    var prevTotal = lunchTotal_(prevRows);

    var wStart = DateUtil.addDays_(date, -7);
    var wEnd = DateUtil.addDays_(date, -1);
    var wRows = HeadcountRepository.listBySiteRange_(siteId, wStart, wEnd);
    var prevWeekAvg = avgLunchTotalByDate_(wRows);

    var mStart = DateUtil.monthStart_(date);
    var mEnd = DateUtil.addDays_(date, -1);
    var mRows = (mStart <= mEnd) ? HeadcountRepository.listBySiteRange_(siteId, mStart, mEnd) : [];
    var monthAvg = avgLunchTotalByDate_(mRows);

    return {
      vsPrevDay: (todayTotal === null || prevTotal === null) ? null : (todayTotal - prevTotal),
      vsPrevWeekAvg: (todayTotal === null || prevWeekAvg === null) ? null : round_(todayTotal - prevWeekAvg, 0),
      vsMonthAvg: (todayTotal === null || monthAvg === null) ? null : round_(todayTotal - monthAvg, 0),
      prevWeekAvg: prevWeekAvg === null ? null : round_(prevWeekAvg, 0),
      monthAvg: monthAvg === null ? null : round_(monthAvg, 0)
    };
  }

  function avgLunchTotalByDate_(rows){
    var byDate = {};
    rows.forEach(function(r){
      if (mealKey_(r.meal) !== "lunch") return;
      byDate[r.date] = (r.di || 0) + (r.to || 0);
    });
    var dates = Object.keys(byDate);
    if (!dates.length) return null;
    var sum = 0;
    dates.forEach(function(d){ sum += Number(byDate[d] || 0); });
    return sum / dates.length;
  }

  function lunchTotal_(rows){
    var r = rows.filter(function(x){ return mealKey_(x.meal) === "lunch"; })[0];
    if (!r) return null;
    return (r.di || 0) + (r.to || 0);
  }

  function mealKey_(meal){
    if (meal === "\uC870\uC2DD") return "breakfast";
    if (meal === "\uC911\uC2DD") return "lunch";
    if (meal === "\uC11D\uC2DD") return "dinner";
    return "late";
  }

  function round_(n, d){
    var p = Math.pow(10, d);
    return Math.round(n * p) / p;
  }

  return { getDashboardSummary: getDashboardSummary };
})();
var HealthService = (function(){
  function health(){
    return ok_("health", { ok:true, version: CONFIG.API_VERSION }, "");
  }
  return { health: health };
})();
var InsightService = (function(){
  function getInsights(req){
    var action = "getInsights";
    var bad = Validator.required_(action, req, ["siteId"]);
    if (bad) return bad;

    var latest = InsightRepository.listLatestBatch_(req.siteId, null);
    if (latest && latest.items && latest.items.length) {
      return ok_(action, { siteId:req.siteId, period:req.period || "14d", run: latest.run, items: latest.items }, "");
    }

    var items = quickAudit_(req.siteId, DateUtil.today_(), req.period || "14d");
    return ok_(action, { siteId:req.siteId, period:req.period || "14d", run: null, items: items }, "no persisted run");
  }

  function runAudit(req){
    var action = "runAudit";
    var bad = Validator.required_(action, req, ["siteId"]);
    if (bad) return bad;

    var date = DateUtil.today_();
    var runId = "AUDIT_" + Utilities.formatDate(new Date(), CONFIG.TZ, "yyyyMMdd_HHmmss");
    var runAt = DateUtil.nowIso_();
    var scope = req.scope || "recent";
    var period = req.period || "14d";
    var items = quickAudit_(req.siteId, date, period);

    InsightRepository.insertBatch_({ runId: runId, runAt: runAt, siteId:req.siteId, scope: scope, period: period }, items);
    LogService.log_("INFO", "AUDIT", action, "persisted", { runId: runId, siteId: req.siteId, count: items.length });

    return ok_(action, {
      runId: runId,
      runAt: runAt,
      siteId: req.siteId,
      scope: scope,
      period: period,
      insightCount: items.length
    }, "");
  }

  function runAuditForAllSites_(scope, period){
    var sites = AppConfigService.listSites_();
    var results = [];
    sites.forEach(function(s){
      var out = runAudit({ siteId: s.siteId, scope: scope || "daily", period: period || "14d" });
      results.push(out.success ? out.data : { siteId: s.siteId, error: out.message });
    });
    return results;
  }

  function quickAudit_(siteId, date, period){
    var dash = HeadcountService.getDashboardSummary({ siteId: siteId, date: date });
    if (!dash.success) return [];

    var d = dash.data;
    var items = [];

    if (d.status.rotationLevel === "err") {
      items.push({
        level:"err",
        code:"ROTATION_OVERLOAD",
        title:"\uD68C\uC804\uC728 \uACFC\uBD80\uD558",
        message:"\uD68C\uC804\uC728(TO \uD3EC\uD568) " + d.kpi.rotationWithTo + "\uD68C (\uC88C\uC11D " + d.ops.seatCount + ")",
        actionGuide:"T/O \uBE44\uC911 \uC810\uAC80 \uB610\uB294 \uCF54\uB108/\uC88C\uC11D \uC6B4\uC601 \uB3D9\uC120 \uC810\uAC80"
      });
    } else if (d.status.rotationLevel === "warn") {
      items.push({
        level:"warn",
        code:"ROTATION_WARN",
        title:"\uD68C\uC804\uC728 \uC8FC\uC758 \uAD6C\uAC04",
        message:"\uD68C\uC804\uC728(TO \uD3EC\uD568) " + d.kpi.rotationWithTo + "\uD68C",
        actionGuide:"\uD53C\uD06C \uC2DC\uAC04 \uBAA8\uB2C8\uD130\uB9C1 \uBC0F TO \uC720\uB3C4/\uBD84\uC0B0 \uC6B4\uC601 \uAC80\uD1A0"
      });
    }

    if (d.status.staffLoadLevel !== "ok") {
      items.push({
        level:d.status.staffLoadLevel,
        code:"STAFF_LOAD",
        title:"\uC5C5\uBB34\uAC15\uB3C4 \uC8FC\uC758/\uACFC\uBD80\uD558",
        message:"\uC778\uB2F9 \uC2DD\uC218 " + d.kpi.mealPerStaff + "\uC2DD (\uC0AC\uC785 " + d.ops.staffCountLunch + "\uBA85)",
        actionGuide:"\uC9C0\uC6D0 \uC778\uB825 \uB300\uAE30 \uB610\uB294 \uD56D\uBAA9\uBCC4 \uACF5\uC815 \uB3D9\uC120 \uAC80\uD1A0"
      });
    }

    var w = d.compare && d.compare.vsPrevWeekAvg;
    if (typeof w === "number" && w <= -30) {
      items.push({
        level:"warn",
        code:"DROP_VS_WEEKAVG",
        title:"\uC804\uC8FC \uD3C9\uADE0 \uB300\uBE44 \uAE09\uAC10",
        message:"\uC804\uC8FC \uD3C9\uADE0 \uB300\uBE44 " + w + "\uC2DD",
        actionGuide:"\uD589\uC0AC/\uBC30\uC2DD\uB3D9\uC120/\uBA54\uB274 \uBC18\uC751 \uC810\uAC80"
      });
    }

    var m = d.compare && d.compare.vsMonthAvg;
    if (typeof m === "number" && m <= -30) {
      items.push({
        level:"warn",
        code:"DROP_VS_MONTHAVG",
        title:"\uC804\uC6D4 \uD3C9\uADE0 \uB300\uBE44 \uAE09\uAC10",
        message:"\uC804\uC6D4 \uD3C9\uADE0 \uB300\uBE44 " + m + "\uC2DD",
        actionGuide:"\uCD5C\uADFC \uC774\uC288/\uB0A0\uC528/\uBA54\uBAA8 \uBC0F \uC6D0\uC778 \uC810\uAC80"
      });
    }

    if (period === "30d" && typeof m === "number" && m <= -50) {
       items.push({
         level: "err",
         code: "LONG_TERM_DROP",
         title: "30\uC77C \uAE30\uC900 \uC2EC\uAC01\uD55C \uC2DD\uC218 \uAC10\uC18C",
         message: "30\uC77C \uD3C9\uADE0\uB300\uBE44 \uC2EC\uAC01\uD55C \uAE09\uAC10",
         actionGuide: "\uC804\uBC18\uC801\uC778 \uC6B4\uC601 \uC810\uAC80 \uD544\uC694"
       });
    }

    return items;
  }

  return { getInsights: getInsights, runAudit: runAudit, runAuditForAllSites_: runAuditForAllSites_ };
})();
var LogService = (function(){
  function log_(level, source, action, message, payloadObj){
    try{
      var shName = CONFIG.SHEETS.LOG;
      SheetRepo.setHeaderIfEmpty_(shName, Schema.defaultHeaders_(shName));
      var data = SheetRepo.readAll_(shName);
      var idx = Schema.buildIndexMap_(shName, data.header);

      SheetRepo.appendByIndexMap_(shName, data.header, idx, {
        ts: DateUtil.nowIso_(),
        level: level || "INFO",
        source: source || "unknown",
        action: action || "",
        message: message || "",
        payload: payloadObj ? JSON.stringify(payloadObj).slice(0, 50000) : ""
      });
    }catch(e){
      // fail-safe: logging must never crash main flow
    }
  }
  return { log_: log_ };
})();
var MemoService = (function(){
  function saveMemo(req){
    var action = "saveMemo";
    var bad = Validator.required_(action, req, ["siteId","date","content"]);
    if (bad) return bad;

    var memoId = "MEMO_" + Utilities.formatDate(new Date(), CONFIG.TZ, "yyyyMMdd_HHmmss");
    var tags = (req.tags || []).join(",");
    var createdAt = DateUtil.nowIso_();

    MemoRepository.appendMemo_({
      memoId: memoId,
      date: req.date,
      siteId: req.siteId,
      category: req.category || "ops",
      tags: tags,
      content: req.content,
      createdAt: createdAt
    });

    LogService.log_("INFO", "MEMO", action, "saved", { memoId: memoId, siteId: req.siteId });
    return ok_(action, { memoId: memoId, saved:true }, "");
  }

  function getMemoList(req){
    var action = "getMemoList";
    var bad = Validator.required_(action, req, ["siteId"]);
    if (bad) return bad;
    var limit = Number(req.limit || 20);
    return ok_(action, { items: MemoRepository.list_(req.siteId, limit) }, "");
  }

  // internal use: system-generated memo (e.g., weekly summary)
  function saveSystemMemo_(siteId, category, tagsArr, content){
    var memoId = "SYS_" + Utilities.formatDate(new Date(), CONFIG.TZ, "yyyyMMdd_HHmmss");
    MemoRepository.appendMemo_({
      memoId: memoId,
      date: DateUtil.today_(),
      siteId: siteId,
      category: category || "report",
      tags: (tagsArr || []).join(","),
      content: content,
      createdAt: DateUtil.nowIso_()
    });
    LogService.log_("INFO", "MEMO", "saveSystemMemo", "saved", { memoId: memoId, siteId: siteId });
    return memoId;
  }

  return { saveMemo: saveMemo, getMemoList: getMemoList, saveSystemMemo_: saveSystemMemo_ };
})();
var SystemService = (function(){
  function getSystemStatus(){
    var action = "getSystemStatus";
    var app = AppConfigService.getAppConfig();
    var sites = app.success ? (app.data.sites || []) : [];
    var featureFlags = app.success ? (app.data.featureFlags || {}) : {};
    var defaultSiteId = app.success ? (app.data.defaultSiteId || "") : "";
    var ss = SheetRepo.ss_();
    var sheets = ss.getSheets().map(function(sh){
      var lastRow = sh.getLastRow();
      var lastColumn = sh.getLastColumn();
      var header = (lastRow >= 1 && lastColumn >= 1)
        ? sh.getRange(1, 1, 1, lastColumn).getValues()[0]
        : [];
      return {
        name: sh.getName(),
        rows: Math.max(0, lastRow - 1),
        columns: lastColumn,
        header: header
      };
    });

    return ok_(action, {
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      timezone: CONFIG.TZ,
      defaultSiteId: defaultSiteId,
      sites: sites,
      featureFlags: featureFlags,
      sheets: sheets
    }, "");
  }

  return { getSystemStatus: getSystemStatus };
})();
var TemplateService = (function(){
  function getTemplateActions(req){
    var action = "getTemplateActions";
    var bad = Validator.required_(action, req, ["siteId"]);
    if (bad) return bad;

    var list = TemplateRepository.listEnabled_();
    var groupsBy = {};
    list.forEach(function(t){
      if (!groupsBy[t.groupId]) groupsBy[t.groupId] = [];
      groupsBy[t.groupId].push(t);
    });

    var groups = Object.keys(groupsBy).map(function(gid){
      var items = groupsBy[gid].sort(function(a,b){ return a.sort - b.sort; }).map(function(t){
        return { id: t.templateId, label: t.label, description: t.description };
      });
      return { groupId: gid, groupName: gid, items: items };
    });

    return ok_(action, { groups: groups }, "");
  }

  function renderTemplate(req){
    var action = "renderTemplate";
    var bad = Validator.required_(action, req, ["templateId","siteId"]);
    if (bad) return bad;

    var date = req.date || DateUtil.today_();
    var tpl = TemplateRepository.listEnabled_().filter(function(x){ return x.templateId === req.templateId; })[0];
    if (!tpl) return fail_(action, "NOT_FOUND", "template not found: " + req.templateId);

    var dash = HeadcountService.getDashboardSummary({ siteId:req.siteId, date:date });
    var siteName = dash.success ? dash.data.siteName : "";
    var lunch = dash.success ? (dash.data.headcount.lunch || {di:0,to:0}) : {di:0,to:0};
    var lunchTotal = (lunch.di||0) + (lunch.to||0);

    var ctx = {
      date: date,
      siteId: req.siteId,
      siteName: siteName,
      lunch_di: String(lunch.di||0),
      lunch_to: String(lunch.to||0),
      lunch_total: String(lunchTotal)
    };

    // weekly template context injection
    if (req.templateId === "weekly_audit_summary") {
      var wr = WeeklyReportService.siteWeeklySummary_(req.siteId);
      ctx.weekly_runId = wr.run ? wr.run.runId : "";
      ctx.weekly_runAt = wr.run ? wr.run.runAt : "";
      ctx.weekly_err_count = String(wr.counts.err);
      ctx.weekly_warn_count = String(wr.counts.warn);
      ctx.weekly_info_count = String(wr.counts.info);
      ctx.weekly_summary = wr.summaryText;
    }

    var content = interpolate_(tpl.body, ctx);
    return ok_(action, { templateId: tpl.templateId, title: tpl.label, content: content }, "");
  }

  function interpolate_(text, ctx){
    var out = String(text || "");
    Object.keys(ctx).forEach(function(k){
      out = out.split("{{"+k+"}}").join(String(ctx[k]));
    });
    return out;
  }

  return { getTemplateActions: getTemplateActions, renderTemplate: renderTemplate };
})();
var WeeklyReportService = (function(){
  function siteWeeklySummary_(siteId){
    var latestWeekly = InsightRepository.listLatestBatch_(siteId, "weekly");
    var latestAny = latestWeekly || InsightRepository.listLatestBatch_(siteId, null);

    var run = latestAny ? latestAny.run : null;
    var items = latestAny ? (latestAny.items || []) : [];
    var counts = countLevels_(items);

    var top = items
      .filter(function(x){ return x.level === "err" || x.level === "warn"; })
      .slice(0, 6)
      .map(function(x){
        var ag = x.actionGuide ? (" / " + x.actionGuide) : "";
        return "- " + x.title + " (" + x.code + ")" + ag;
      });

    var dash = HeadcountService.getDashboardSummary({ siteId: siteId, date: DateUtil.today_() });
    var cmpLine = "";
    if (dash.success && dash.data && dash.data.compare) {
      var c = dash.data.compare;
      cmpLine = "\uC2DD\uC218 \uBE44\uAD50(\uC911\uC2DD \uD569\uACC4) / \uC804\uC8FC " + fmt_(c.vsPrevWeekAvg) + ", \uC804\uC6D4 " + fmt_(c.vsMonthAvg);
    }

    var lines = [];
    lines.push("[\uC8FC\uAC04 \uC810\uAC80 \uC694\uC57D]");
    lines.push("\uC0AC\uC5C5\uC7A5: " + siteId);
    if (run) lines.push("runId: " + run.runId + " / runAt: " + run.runAt + " / scope: " + run.scope);
    lines.push("\uD604\uD669: ERR " + counts.err + " / WARN " + counts.warn + " / INFO " + counts.info);
    if (cmpLine) lines.push(cmpLine);
    lines.push("");
    lines.push("[\uD575\uC2EC \uC774\uC288/\uC870\uCE58]");
    if (top.length) {
      top.forEach(function(t){ lines.push(t); });
    } else {
      lines.push("- \uD2B9\uC774\uC0AC\uD56D \uC5C6\uC74C \uB610\uB294 \uB370\uC774\uD130 \uBD80\uC871");
    }

    return {
      run: run,
      counts: counts,
      summaryText: lines.join("\n")
    };
  }

  function allSitesWeeklySummary_(){
    var sites = AppConfigService.listSites_();
    var rows = [];

    sites.forEach(function(s){
      var r = siteWeeklySummary_(s.siteId);
      var score = (r.counts.err * 2) + (r.counts.warn);
      rows.push({
        siteId: s.siteId,
        err: r.counts.err,
        warn: r.counts.warn,
        info: r.counts.info,
        score: score,
        text: r.summaryText
      });
    });

    rows.sort(function(a,b){ return b.score - a.score; });

    var lines = [];
    lines.push("[\uC8FC\uAC04 \uC810\uAC80 \uC694\uC57D - \uC804\uCCB4 \uC0AC\uC5C5\uC7A5]");
    lines.push("\uC0DD\uC131: " + DateUtil.nowIso_());
    lines.push("");
    lines.push("[\uB9AC\uC2A4\uD06C \uC0C1\uC704]");
    rows.slice(0, Math.min(5, rows.length)).forEach(function(x, i){
      lines.push((i + 1) + ". " + x.siteId + " (ERR " + x.err + " / WARN " + x.warn + ")");
    });
    lines.push("");
    lines.push("[\uC0AC\uC5C5\uC7A5\uBCC4 \uC694\uC57D]");
    rows.forEach(function(x){
      lines.push("");
      lines.push("----- " + x.siteId + " -----");
      lines.push(x.text);
    });

    return lines.join("\n");
  }

  function countLevels_(items){
    var c = { err:0, warn:0, info:0 };
    (items || []).forEach(function(x){
      if (x.level === "err") c.err++;
      else if (x.level === "warn") c.warn++;
      else c.info++;
    });
    return c;
  }

  function fmt_(n){
    if (n === null || n === undefined) return "-";
    return String(n);
  }

  return {
    siteWeeklySummary_: siteWeeklySummary_,
    allSitesWeeklySummary_: allSitesWeeklySummary_
  };
})();
var DateUtil = (function(){
  function today_() {
    return Utilities.formatDate(new Date(), CONFIG.TZ, "yyyy-MM-dd");
  }
  function addDays_(dateStr, days) {
    var parts = dateStr.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + days);
    return Utilities.formatDate(d, CONFIG.TZ, "yyyy-MM-dd");
  }
  function monthStart_(dateStr){
    var parts = dateStr.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return Utilities.formatDate(d, CONFIG.TZ, "yyyy-MM-dd");
  }
  function nowIso_(){ return new Date().toISOString(); }
  return { today_: today_, addDays_: addDays_, monthStart_: monthStart_, nowIso_: nowIso_ };
})();
var Validator = (function(){
  function required_(action, req, keys) {
    var miss = [];
    keys.forEach(function(k){ if (req[k] === undefined || req[k] === null || req[k] === "") miss.push(k); });
    if (miss.length) return fail_(action, "VALIDATION_ERROR", "required: " + miss.join(", "));
    return null;
  }
  return { required_: required_ };
})();

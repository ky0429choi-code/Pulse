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

    ScriptApp.newTrigger("Jobs.runDailyAudit")
      .timeBased()
      .everyDays(1)
      .atHour(7)
      .nearMinute(30)
      .create();

    ScriptApp.newTrigger("Jobs.runWeeklyAudit")
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(7)
      .nearMinute(40)
      .create();

    LogService.log_("INFO", "INSTALL", "setupTriggers", "created", null);
    return ok_("setupTriggers", { ok:true }, "triggers created");
  }

  function removeManagedTriggers_(){
    var all = ScriptApp.getProjectTriggers();
    all.forEach(function(t){
      var fn = t.getHandlerFunction();
      if (fn === "Jobs.runDailyAudit" || fn === "Jobs.runWeeklyAudit") ScriptApp.deleteTrigger(t);
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
      var startRow = sh.getLastRow() + 1;
      sh.getRange(startRow, 1, toAppend.length, toAppend[0].length).setValues(toAppend);
      LogService.log_("INFO", "INSTALL", "ensureTemplates", "appended", { count: toAppend.length });
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

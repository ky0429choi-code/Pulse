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

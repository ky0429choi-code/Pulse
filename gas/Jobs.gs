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

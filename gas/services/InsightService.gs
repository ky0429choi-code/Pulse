var InsightService = (function(){
  function getInsights(req){
    var action = "getInsights";
    var bad = Validator.required_(action, req, ["siteId"]);
    if (bad) return bad;

    var latest = InsightRepository.listLatestBatch_(req.siteId, null);
    if (latest && latest.items && latest.items.length) {
      return ok_(action, { siteId:req.siteId, period:req.period || "14d", run: latest.run, items: latest.items }, "");
    }

    var items = quickAudit_(req.siteId, DateUtil.today_());
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
    var items = quickAudit_(req.siteId, date);

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

  function quickAudit_(siteId, date){
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

    return items;
  }

  return { getInsights: getInsights, runAudit: runAudit, runAuditForAllSites_: runAuditForAllSites_ };
})();

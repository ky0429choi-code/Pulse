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

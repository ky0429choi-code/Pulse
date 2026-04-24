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

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

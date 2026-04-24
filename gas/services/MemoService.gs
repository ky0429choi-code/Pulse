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

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

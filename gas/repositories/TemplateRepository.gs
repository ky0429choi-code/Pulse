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

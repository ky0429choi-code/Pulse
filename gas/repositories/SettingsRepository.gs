var SettingsRepository = (function(){
  function listAll_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.SETTINGS, Schema.defaultHeaders_(CONFIG.SHEETS.SETTINGS));
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SETTINGS);
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SETTINGS, data.header);

    return data.rows.map(function(r){
      return {
        key: String(r[idx.key] || ""),
        value: String(idx.value >= 0 ? (r[idx.value] || "") : ""),
        note: String(idx.note >= 0 ? (r[idx.note] || "") : "")
      };
    }).filter(function(x){ return x.key; });
  }

  function getMap_(){
    var map = {};
    listAll_().forEach(function(item){
      map[item.key] = item.value;
    });
    return map;
  }

  return { listAll_: listAll_, getMap_: getMap_ };
})();

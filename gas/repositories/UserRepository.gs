var UserRepository = (function(){


  function ensure_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.USERS, Schema.defaultHeaders_(CONFIG.SHEETS.USERS));
  }

  function normalize_(value){
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/@samsung\.com$/i, "");
  }

  function listAll_(){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.USERS);
    if (!data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.USERS, data.header);

    return data.rows.map(function(row){
      var enabledRaw = idx.enabled >= 0 ? String(row[idx.enabled] || "TRUE") : "TRUE";
      return {
        userId: normalize_(idx.userId >= 0 ? row[idx.userId] : ""),
        password: String(idx.password >= 0 ? row[idx.password] : ""),
        displayName: String(idx.displayName >= 0 ? row[idx.displayName] : ""),
        role: String(idx.role >= 0 ? row[idx.role] : "USER"),
        enabled: String(enabledRaw).toUpperCase() !== "FALSE" && String(enabledRaw) !== "0",
        note: String(idx.note >= 0 ? row[idx.note] : "")
      };
    }).filter(function(user){ return user.userId; });
  }

  function findByUserId_(userId){
    var normalized = normalize_(userId);
    var items = listAll_();
    for (var i = 0; i < items.length; i++) {
      if (items[i].userId === normalized) return items[i];
    }
    return null;
  }

  return {
    ensure_: ensure_,
    listAll_: listAll_,
    findByUserId_: findByUserId_
  };
})();

var UserRepository = (function(){
  var DEFAULT_HEADERS = ["userId","password","displayName","role","enabled","note"];

  function ensure_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.USERS, DEFAULT_HEADERS);
  }

  function normalize_(value){
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/@samsung\.com$/i, "");
  }

  function key_(header){
    return String(header || "").replace(/[\s_\-()]/g, "").toLowerCase();
  }

  function matchIdx_(headers, names){
    var found = -1;
    headers.forEach(function(header, idx){
      var normalized = key_(header);
      names.forEach(function(name){
        if (found >= 0) return;
        if (normalized === key_(name)) found = idx;
      });
    });
    return found;
  }

  function listAll_(){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.USERS);
    var header = data.header || [];
    var idx = {
      userId: matchIdx_(header, ["userId","account","id","\uACC4\uC815","\uC811\uC18D\uAD8C\uD55C\uACC4\uC815","\uC544\uC774\uB514","\uC2F1\uAE00\uC544\uC774\uB514"]),
      password: matchIdx_(header, ["password","pw","\uBE44\uBC00\uBC88\uD638","\uAC1C\uC778\uBE44\uBC00\uBC88\uD638"]),
      displayName: matchIdx_(header, ["displayName","name","\uC774\uB984","\uC131\uBA85","\uD45C\uC2DC\uC774\uB984"]),
      role: matchIdx_(header, ["role","grade","\uAD8C\uD55C","\uB4F1\uAE09","\uAD8C\uD55C\uB4F1\uAE09"]),
      enabled: matchIdx_(header, ["enabled","active","\uC0AC\uC6A9\uC5EC\uBD80","\uD65C\uC131"]),
      note: matchIdx_(header, ["note","\uBE44\uACE0"])
    };

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

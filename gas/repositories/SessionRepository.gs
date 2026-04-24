var SessionRepository = (function(){
  function ensure_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.SESSIONS, Schema.defaultHeaders_(CONFIG.SHEETS.SESSIONS));
  }

  function listAll_(){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    if (!data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);

    return data.rows.map(function(row, rowIndex){
      return {
        rowNumber: rowIndex + 2,
        sessionToken: String(row[idx.sessionToken] || ""),
        userId: String(row[idx.userId] || ""),
        displayName: String(row[idx.displayName] || ""),
        role: String(row[idx.role] || ""),
        createdAt: String(row[idx.createdAt] || ""),
        expiresAt: String(row[idx.expiresAt] || ""),
        lastSeenAt: String(row[idx.lastSeenAt] || ""),
        active: String(idx.active >= 0 ? (row[idx.active] || "TRUE") : "TRUE")
      };
    }).filter(function(item){ return item.sessionToken; });
  }

  function create_(session){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);

    SheetRepo.appendByIndexMap_(CONFIG.SHEETS.SESSIONS, data.header, idx, {
      sessionToken: session.sessionToken,
      userId: session.userId,
      displayName: session.displayName || "",
      role: session.role || "",
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      lastSeenAt: session.lastSeenAt || session.createdAt,
      active: "TRUE"
    });
  }

  function findValid_(sessionToken){
    if (!sessionToken) return null;
    var now = new Date();
    var items = listAll_();
    for (var i = items.length - 1; i >= 0; i--) {
      var item = items[i];
      if (item.sessionToken !== sessionToken) continue;
      if (String(item.active).toUpperCase() === "FALSE") return null;
      if (!item.expiresAt || new Date(item.expiresAt).getTime() <= now.getTime()) return null;
      return item;
    }
    return null;
  }

  function deactivate_(sessionToken){
    if (!sessionToken) return;
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    if (!data.header.length || !data.rows.length) return;
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);
    var sh = SheetRepo.sheet_(CONFIG.SHEETS.SESSIONS);

    for (var i = data.rows.length - 1; i >= 0; i--) {
      if (String(data.rows[i][idx.sessionToken] || "") !== sessionToken) continue;
      if (idx.active >= 0) sh.getRange(i + 2, idx.active + 1).setValue("FALSE");
      if (idx.lastSeenAt >= 0) sh.getRange(i + 2, idx.lastSeenAt + 1).setValue(DateUtil.nowIso_());
      return;
    }
  }

  function touch_(sessionToken, expiresAt){
    if (!sessionToken) return;
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    if (!data.header.length || !data.rows.length) return;
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);
    var sh = SheetRepo.sheet_(CONFIG.SHEETS.SESSIONS);

    for (var i = data.rows.length - 1; i >= 0; i--) {
      if (String(data.rows[i][idx.sessionToken] || "") !== sessionToken) continue;
      if (idx.lastSeenAt >= 0) sh.getRange(i + 2, idx.lastSeenAt + 1).setValue(DateUtil.nowIso_());
      if (idx.expiresAt >= 0 && expiresAt) sh.getRange(i + 2, idx.expiresAt + 1).setValue(expiresAt);
      return;
    }
  }

  function deactivateExpired_(){
    ensure_();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.SESSIONS);
    if (!data.header.length || !data.rows.length) return 0;
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SESSIONS, data.header);
    var sh = SheetRepo.sheet_(CONFIG.SHEETS.SESSIONS);
    var count = 0;
    var now = new Date().getTime();

    data.rows.forEach(function(row, rowIndex){
      var expiresAt = String(row[idx.expiresAt] || "");
      var active = String(idx.active >= 0 ? (row[idx.active] || "TRUE") : "TRUE").toUpperCase();
      if (active === "FALSE") return;
      if (!expiresAt || new Date(expiresAt).getTime() > now) return;
      if (idx.active >= 0) sh.getRange(rowIndex + 2, idx.active + 1).setValue("FALSE");
      count += 1;
    });

    return count;
  }

  return {
    ensure_: ensure_,
    create_: create_,
    findValid_: findValid_,
    touch_: touch_,
    deactivate_: deactivate_,
    deactivateExpired_: deactivateExpired_
  };
})();

var AccessLogService = (function(){
  function ensure_(){
    SheetRepo.setHeaderIfEmpty_(CONFIG.SHEETS.ACCESS_LOG, Schema.defaultHeaders_(CONFIG.SHEETS.ACCESS_LOG));
  }

  function log_(eventType, user, action, message, payload){
    try {
      ensure_();
      var data = SheetRepo.readAll_(CONFIG.SHEETS.ACCESS_LOG);
      var idx = Schema.buildIndexMap_(CONFIG.SHEETS.ACCESS_LOG, data.header);
      var safePayload = payload ? JSON.stringify(payload).slice(0, 50000) : "";

      SheetRepo.appendByIndexMap_(CONFIG.SHEETS.ACCESS_LOG, data.header, idx, {
        ts: DateUtil.nowIso_(),
        eventType: eventType || "VIEW",
        userId: user && user.userId ? user.userId : "",
        displayName: user && user.displayName ? user.displayName : "",
        role: user && user.role ? user.role : "",
        action: action || "",
        siteId: payload && payload.siteId ? payload.siteId : "",
        date: payload && payload.date ? payload.date : "",
        message: message || "",
        payload: safePayload
      });
    } catch (e) {
      // fail-safe
    }
  }

  return { log_: log_ };
})();

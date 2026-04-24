var LogService = (function(){
  function log_(level, source, action, message, payloadObj){
    try{
      var shName = CONFIG.SHEETS.LOG;
      SheetRepo.setHeaderIfEmpty_(shName, Schema.defaultHeaders_(shName));
      var data = SheetRepo.readAll_(shName);
      var idx = Schema.buildIndexMap_(shName, data.header);

      SheetRepo.appendByIndexMap_(shName, data.header, idx, {
        ts: DateUtil.nowIso_(),
        level: level || "INFO",
        source: source || "unknown",
        action: action || "",
        message: message || "",
        payload: payloadObj ? JSON.stringify(payloadObj).slice(0, 50000) : ""
      });
    }catch(e){
      // fail-safe: logging must never crash main flow
    }
  }
  return { log_: log_ };
})();

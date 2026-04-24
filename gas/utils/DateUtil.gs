var DateUtil = (function(){
  function today_() {
    return Utilities.formatDate(new Date(), CONFIG.TZ, "yyyy-MM-dd");
  }
  function addDays_(dateStr, days) {
    var parts = dateStr.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + days);
    return Utilities.formatDate(d, CONFIG.TZ, "yyyy-MM-dd");
  }
  function monthStart_(dateStr){
    var parts = dateStr.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return Utilities.formatDate(d, CONFIG.TZ, "yyyy-MM-dd");
  }
  function nowIso_(){ return new Date().toISOString(); }
  return { today_: today_, addDays_: addDays_, monthStart_: monthStart_, nowIso_: nowIso_ };
})();

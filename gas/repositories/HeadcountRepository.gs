var HeadcountRepository = (function(){
  function listBySiteDate_(siteId, dateStr){
    var data = SheetRepo.readAll_(CONFIG.SHEETS.HEADCOUNT);
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.HEADCOUNT, data.header);

    return data.rows.map(function(r){
      return {
        date: String(r[idx.date] || ""),
        siteId: String(r[idx.siteId] || ""),
        siteName: String(idx.siteName >= 0 ? (r[idx.siteName] || "") : ""),
        meal: String(r[idx.meal] || ""),
        di: Number(r[idx.diCount] || 0),
        to: Number(idx.toCount >= 0 ? (r[idx.toCount] || 0) : 0),
        seatCount: Number(idx.seatCount >= 0 ? (r[idx.seatCount] || 0) : 0),
        toCornerCount: Number(idx.toCornerCount >= 0 ? (r[idx.toCornerCount] || 1) : 1),
        staffCount: Number(idx.staffCount >= 0 ? (r[idx.staffCount] || 0) : 0)
      };
    }).filter(function(x){ return x.siteId === String(siteId) && x.date === String(dateStr); });
  }

  function listBySiteRange_(siteId, startDate, endDate){
    var data = SheetRepo.readAll_(CONFIG.SHEETS.HEADCOUNT);
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.HEADCOUNT, data.header);

    return data.rows.map(function(r){
      return {
        date: String(r[idx.date] || ""),
        siteId: String(r[idx.siteId] || ""),
        meal: String(r[idx.meal] || ""),
        di: Number(r[idx.diCount] || 0),
        to: Number(idx.toCount >= 0 ? (r[idx.toCount] || 0) : 0)
      };
    }).filter(function(x){
      return x.siteId === String(siteId) && x.date >= startDate && x.date <= endDate;
    });
  }

  return { listBySiteDate_: listBySiteDate_, listBySiteRange_: listBySiteRange_ };
})();

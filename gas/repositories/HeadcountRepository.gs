var HeadcountRepository = (function(){
  function listBySiteDate_(siteId, dateStr){
    var data;
    try {
      data = SheetRepo.readAll_(CONFIG.SHEETS.ACTUALS);
    } catch(e) { return []; }
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.ACTUALS, data.header);

    var results = [];
    data.rows.forEach(function(r){
      var d = String(r[idx.date] || "").trim();
      // 날짜 형식이 다를 수 있으므로 앞 10자리(YYYY-MM-DD)만 비교
      var dMatch = d.indexOf(" ") > 0 ? d.split(" ")[0] : d;
      var s = String(r[idx.siteName] || "").trim();
      
      if (!d || s !== String(siteId) || dMatch !== String(dateStr)) return;

      // ACTUALS 시트 구조를 기존 세로형(Meal별)으로 변환
      var mealsConfig = [
        { name: "\uC870\uC2DD", di: idx.di_b, to: idx.to_b },
        { name: "\uC911\uC2DD", di: idx.di_l, to: idx.to_l },
        { name: "\uC11D\uC2DD", di: idx.di_d, to: idx.to_d },
        { name: "\uC57C\uC2DD", di: idx.di_n, to: idx.to_n }
      ];

      mealsConfig.forEach(function(m){
        results.push({
          date: String(dateStr),
          siteId: s,
          siteName: s,
          defaultSeats: 120, // Default or fetch from SiteRepo
          meal: m.name,
          di: Number(r[m.di] || 0),
          to: Number(r[m.to] || 0)
        });
      });
    });
    return results;
  }

  function listBySiteRange_(siteId, startDate, endDate){
    var data;
    try {
      data = SheetRepo.readAll_(CONFIG.SHEETS.ACTUALS);
    } catch(e) { return []; }
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.ACTUALS, data.header);

    var results = [];
    data.rows.forEach(function(r){
      var d = String(r[idx.date] || "").trim();
      var dMatch = d.indexOf(" ") > 0 ? d.split(" ")[0] : d;
      var s = String(r[idx.siteName] || "").trim();
      
      if (!d || s !== String(siteId) || dMatch < startDate || dMatch > endDate) return;

      var mealsConfig = [
        { name: "\uC870\uC2DD", di: idx.di_b, to: idx.to_b },
        { name: "\uC911\uC2DD", di: idx.di_l, to: idx.to_l },
        { name: "\uC11D\uC2DD", di: idx.di_d, to: idx.to_d },
        { name: "\uC57C\uC2DD", di: idx.di_n, to: idx.to_n }
      ];

      mealsConfig.forEach(function(m){
        results.push({
          date: dMatch,
          siteId: s,
          meal: m.name,
          di: Number(r[m.di] || 0),
          to: Number(r[m.to] || 0)
        });
      });
    });
    return results;
  }

  return { listBySiteDate_: listBySiteDate_, listBySiteRange_: listBySiteRange_ };
})();

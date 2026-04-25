var SiteRepository = (function(){
  function listAll_(){
    var data;
    try {
      data = SheetRepo.readAll_(CONFIG.SHEETS.SITES);
    } catch(e) {
      return [];
    }
    if (!data.header || !data.header.length) return [];
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.SITES, data.header);

    return data.rows.map(function(r){
      return {
        region: String(idx.region >= 0 ? (r[idx.region] || "") : ""),
        siteName: String(r[idx.siteName] || "").trim(),
        dietitian: String(idx.dietitian >= 0 ? (r[idx.dietitian] || "") : ""),
        chef: String(idx.chef >= 0 ? (r[idx.chef] || "") : ""),
        seats: Number(idx.seats >= 0 ? (r[idx.seats] || 0) : 0),
        corners: Number(idx.corners >= 0 ? (r[idx.corners] || 0) : 0),
        targetSales: Number(idx.targetSales >= 0 ? (r[idx.targetSales] || 0) : 0)
      };
    }).filter(function(s){ return s.siteName; });
  }

  function getSiteList(payload){
    var sites = listAll_();
    var dict = sites.map(function(s){ 
       return { siteId: s.siteName, siteName: s.siteName, region: s.region }; 
    });
    // Add fallback if spreadsheet is entirely empty or missing
    if (dict.length === 0) dict.push({ siteId:"NONE", siteName:"\uC5D1\uC140 \uD30C\uC77C\uC744 \uC5C5\uB85C\uB4DC\uD574\uC8FC\uC138\uC694" });
    return ok_("getSiteList", dict, "\uC0AC\uC5C5\uC7A5 \uBAA9\uB85D \uC870\uD68C");
  }

  return { getSiteList: getSiteList, listAll_: listAll_ };
})();

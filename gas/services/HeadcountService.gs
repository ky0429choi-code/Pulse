var HeadcountService = (function(){
  function getDashboardSummary(req){
    var action = "getDashboardSummary";
    var bad = Validator.required_(action, req, ["siteId"]);
    if (bad) return bad;

    var date = req.date || DateUtil.today_();
    var rows = HeadcountRepository.listBySiteDate_(req.siteId, date);

    if (!rows.length) {
      return ok_(action, {
        siteId: req.siteId,
        siteName: "",
        date: date,
        headcount: {},
        ops: {},
        kpi: {},
        compare: {},
        status: { rotationLevel:"ok", staffLoadLevel:"ok" }
      }, "no data");
    }

    var siteName = rows[0].siteName || "";
    var headcount = { breakfast:{}, lunch:{}, dinner:{}, late:{} };
    var ops = { seatCount: 0, toCornerCount: 1, staffCountLunch: 0 };

    rows.forEach(function(r){
      var key = mealKey_(r.meal);
      headcount[key] = { di: r.di, to: r.to };
      if (key === "lunch") {
        ops.seatCount = r.seatCount || ops.seatCount;
        ops.toCornerCount = r.toCornerCount || ops.toCornerCount;
        ops.staffCountLunch = r.staffCount || ops.staffCountLunch;
      }
    });

    var lunch = headcount.lunch || { di:0, to:0 };
    var seat = ops.seatCount || 0;
    var toc  = ops.toCornerCount || 1;
    var staff = ops.staffCountLunch || 0;

    var rotationDi = seat ? round_(lunch.di / seat, 2) : null;
    var rotationWithTo = seat ? round_((lunch.di + (lunch.to / toc)) / seat, 2) : null;
    var mealPerStaff = staff ? round_((lunch.di + lunch.to) / staff, 1) : null;

    var rotationLevel = rotationWithTo >= 3.5 ? "err" : rotationWithTo >= 2.5 ? "warn" : "ok";
    var staffLoadLevel = mealPerStaff >= 95 ? "err" : mealPerStaff >= 80 ? "warn" : "ok";

    return ok_(action, {
      siteId: req.siteId,
      siteName: siteName,
      date: date,
      headcount: headcount,
      ops: ops,
      kpi: { rotationDi: rotationDi, rotationWithTo: rotationWithTo, mealPerStaff: mealPerStaff },
      compare: buildCompare_(req.siteId, date, (lunch.di + lunch.to) || 0),
      status: { rotationLevel: rotationLevel, staffLoadLevel: staffLoadLevel }
    }, "");
  }

  function buildCompare_(siteId, date, todayTotal){
    var prev = DateUtil.addDays_(date, -1);
    var prevRows = HeadcountRepository.listBySiteDate_(siteId, prev);
    var prevTotal = lunchTotal_(prevRows);

    var wStart = DateUtil.addDays_(date, -7);
    var wEnd = DateUtil.addDays_(date, -1);
    var wRows = HeadcountRepository.listBySiteRange_(siteId, wStart, wEnd);
    var prevWeekAvg = avgLunchTotalByDate_(wRows);

    var mStart = DateUtil.monthStart_(date);
    var mEnd = DateUtil.addDays_(date, -1);
    var mRows = (mStart <= mEnd) ? HeadcountRepository.listBySiteRange_(siteId, mStart, mEnd) : [];
    var monthAvg = avgLunchTotalByDate_(mRows);

    return {
      vsPrevDay: (todayTotal === null || prevTotal === null) ? null : (todayTotal - prevTotal),
      vsPrevWeekAvg: (todayTotal === null || prevWeekAvg === null) ? null : round_(todayTotal - prevWeekAvg, 0),
      vsMonthAvg: (todayTotal === null || monthAvg === null) ? null : round_(todayTotal - monthAvg, 0),
      prevWeekAvg: prevWeekAvg === null ? null : round_(prevWeekAvg, 0),
      monthAvg: monthAvg === null ? null : round_(monthAvg, 0)
    };
  }

  function avgLunchTotalByDate_(rows){
    var byDate = {};
    rows.forEach(function(r){
      if (mealKey_(r.meal) !== "lunch") return;
      byDate[r.date] = (r.di || 0) + (r.to || 0);
    });
    var dates = Object.keys(byDate);
    if (!dates.length) return null;
    var sum = 0;
    dates.forEach(function(d){ sum += Number(byDate[d] || 0); });
    return sum / dates.length;
  }

  function lunchTotal_(rows){
    var r = rows.filter(function(x){ return mealKey_(x.meal) === "lunch"; })[0];
    if (!r) return null;
    return (r.di || 0) + (r.to || 0);
  }

  function mealKey_(meal){
    if (meal === "\uC870\uC2DD") return "breakfast";
    if (meal === "\uC911\uC2DD") return "lunch";
    if (meal === "\uC11D\uC2DD") return "dinner";
    return "late";
  }

  function round_(n, d){
    var p = Math.pow(10, d);
    return Math.round(n * p) / p;
  }

  return { getDashboardSummary: getDashboardSummary };
})();

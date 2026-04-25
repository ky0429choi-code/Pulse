var CalculatorService = (function(){
  
  function calculateYield_(payload){
    var orderQty = Number(payload.orderQty || 0);
    var lossRate = Number(payload.lossRate || 0) / 100;
    var targetPerCapita = Number(payload.targetPerCapita || 0);

    if (!orderQty || !targetPerCapita) return fail_("CALC", "INVALID_INPUT", "\uBC1C\uC8FC\uB7C9\uACFC 1\uC778\uBAA9\uD45C\uB7C9\uC744 \uC785\uB825\uD558\uC138\uC694.");

    var actualWeight = orderQty * (1 - lossRate);
    var servings = actualWeight / targetPerCapita;

    var result = {
      orderQty: orderQty,
      lossRate: lossRate * 100,
      targetPerCapita: targetPerCapita,
      actualWeight: actualWeight.toFixed(2),
      servings: servings.toFixed(1)
    };

    var date = DateUtil.formatDate_(new Date());
    var calcId = "C" + new Date().getTime();
    var uid = payload.__session__ ? payload.__session__.userId : "SYSTEM";
    
    var dataRows = [
      calcId, date, uid, payload.itemName || "\uBBF8\uC9C0\uC815", "YIELD_CALC",
      orderQty, lossRate * 100, targetPerCapita, actualWeight.toFixed(2), servings.toFixed(1), payload.reason || ""
    ];

    try {
      saveHistory_(dataRows);
    } catch(e) {
      LogService.log_("ERROR", "CALC", "saveHistory", e.message, null);
    }

    return ok_("calculateYield", result, "\uACC4\uC0B0 \uBC0F \uC774\uB825 \uC800\uC7A5\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
  }

  function saveHistory_(mappedRow){
    var shName = CONFIG.SHEETS.CALC_HISTORY;
    SheetRepo.setHeaderIfEmpty_(shName, Schema.defaultHeaders_(shName));
    var data = SheetRepo.readAll_(shName);
    var idx = Schema.buildIndexMap_(shName, data.header);

    var row = new Array(data.header.length);
    row[idx.calcId] = mappedRow[0];
    row[idx.date] = mappedRow[1];
    row[idx.userId] = mappedRow[2];
    row[idx.itemName] = mappedRow[3];
    row[idx.calcType] = mappedRow[4];
    row[idx.orderQty] = mappedRow[5];
    row[idx.lossRate] = mappedRow[6];
    row[idx.perCapita] = mappedRow[7];
    row[idx.actualWeight] = mappedRow[8];
    row[idx.servings] = mappedRow[9];
    row[idx.reason] = mappedRow[10];

    var sh = SheetRepo.sheet_(shName);
    sh.appendRow(row);
  }

  function searchHistory_(payload){
    var query = String(payload.query || "").toLowerCase();
    var data = SheetRepo.readAll_(CONFIG.SHEETS.CALC_HISTORY);
    if (!data.header.length) return ok_("searchHistory", [], "\uC774\uB825\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
    var idx = Schema.buildIndexMap_(CONFIG.SHEETS.CALC_HISTORY, data.header);

    var history = data.rows.map(function(r){
      return {
        calcId: r[idx.calcId],
        date: r[idx.date],
        userId: r[idx.userId],
        itemName: String(r[idx.itemName] || ""),
        calcType: r[idx.calcType],
        orderQty: r[idx.orderQty],
        lossRate: r[idx.lossRate],
        perCapita: r[idx.perCapita],
        actualWeight: r[idx.actualWeight],
        servings: r[idx.servings],
        reason: String(r[idx.reason] || "")
      };
    });

    if (query) {
      history = history.filter(function(h){
        return h.itemName.toLowerCase().indexOf(query) >= 0 || h.reason.toLowerCase().indexOf(query) >= 0;
      });
    }

    return ok_("searchHistory", history.reverse(), "\uAC80\uC0C9 \uC644\uB8CC");
  }

  return {
    calculateYield_: calculateYield_,
    searchHistory_: searchHistory_
  };
})();

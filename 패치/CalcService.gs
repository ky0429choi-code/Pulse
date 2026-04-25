// ============================================================
// CalcService.gs
// 인당량 계산 + 피드백 자동 생성
// ============================================================

var CalcService = (function () {

  // ── 목록 조회 ────────────────────────────────────────────────
  function getCalcList(req) {
    Validator.required_("getCalcList", req, ["siteId"]);
    var opts = {
      menuName: req.menuName || "",
      limit   : Number(req.limit) || 200
    };
    var items = CalcRepository.list_(req.siteId, opts);
    return { items: items, total: items.length };
  }

  // ── 계산 + 저장 ─────────────────────────────────────────────
  function saveCalc(req) {
    Validator.required_("saveCalc", req, ["siteId", "itemName", "portionG", "usageKg", "headcount"]);

    var portionG  = Number(req.portionG)  || 0;
    var usageKg   = Number(req.usageKg)   || 0;
    var headcount = Number(req.headcount) || 0;
    var baselineG = Number(req.baselineG) || 0;

    // 산출량 계산: (사용량kg × 1000) ÷ 식수 = 인당 산출g
    var yieldG = headcount > 0
      ? Math.round((usageKg * 1000) / headcount * 10) / 10
      : 0;

    // 피드백 자동 생성
    var feedback = _buildFeedback_(req.itemName, portionG, yieldG, baselineG);

    var now    = new Date().toISOString();
    var calcId = "CALC_" + req.siteId + "_" + now.replace(/[-:.TZ]/g, "").slice(0, 14)
               + "_" + Math.floor(Math.random() * 1000);

    var rec = {
      calcId   : calcId,
      siteId   : req.siteId,
      menuName : req.menuName  || "",
      itemName : req.itemName,
      portionG : portionG,
      usageKg  : usageKg,
      headcount: headcount,
      yieldG   : yieldG,
      baselineG: baselineG,
      feedback : feedback,
      createdAt: now
    };
    CalcRepository.save_(rec);
    return rec;
  }

  // ── 저장 없이 계산만 ─────────────────────────────────────────
  function calculateOnly(req) {
    Validator.required_("calculateOnly", req, ["itemName", "portionG", "usageKg", "headcount"]);
    var portionG  = Number(req.portionG)  || 0;
    var usageKg   = Number(req.usageKg)   || 0;
    var headcount = Number(req.headcount) || 0;
    var baselineG = Number(req.baselineG) || 0;
    var yieldG    = headcount > 0
      ? Math.round((usageKg * 1000) / headcount * 10) / 10
      : 0;
    var feedback  = _buildFeedback_(req.itemName, portionG, yieldG, baselineG);
    return { yieldG: yieldG, feedback: feedback };
  }

  function deleteCalc(req) {
    Validator.required_("deleteCalc", req, ["calcId"]);
    var ok = CalcRepository.delete_(req.calcId);
    if (!ok) throw new Error("calcId not found: " + req.calcId);
    return { calcId: req.calcId, deleted: true };
  }

  // ── 내부: 피드백 문장 생성 ───────────────────────────────────
  function _buildFeedback_(itemName, portionG, yieldG, baselineG) {
    var item = itemName || "해당 품목";

    // 기준점 없을 때
    if (!baselineG || baselineG <= 0) {
      if (portionG > 0) {
        var diff0 = Math.round((yieldG - portionG) * 10) / 10;
        if (diff0 === 0) {
          return item + " 인당 " + yieldG + "g이 산출됩니다. 설정 인당량(" + portionG + "g)과 일치합니다.";
        } else if (diff0 > 0) {
          return item + " 인당 " + yieldG + "g이 산출됩니다. 설정 인당량(" + portionG + "g) 대비 " + diff0 + "g 초과됩니다.";
        } else {
          return item + " 인당 " + yieldG + "g이 산출됩니다. 설정 인당량(" + portionG + "g) 대비 " + Math.abs(diff0) + "g 부족합니다. 제공 시 " + portionG + "g 기준으로 맞춰 주세요.";
        }
      }
      return item + " 인당 " + yieldG + "g이 산출됩니다. 제공 기준을 설정하면 자동 비교가 가능합니다.";
    }

    // 기준점 있을 때
    var diff = Math.round((yieldG - baselineG) * 10) / 10;
    if (diff === 0) {
      return item + " 인당 " + yieldG + "g이 산출됩니다. 기준량(" + baselineG + "g)과 정확히 일치합니다.";
    } else if (diff > 0) {
      return item + " 인당 " + yieldG + "g이 산출됩니다. 기준 " + baselineG + "g 대비 " + diff + "g 초과됩니다. 사용량 조정을 권장합니다.";
    } else {
      return item + " 인당 " + yieldG + "g이 산출됩니다. 기준 " + baselineG + "g 대비 " + Math.abs(diff) + "g 부족합니다. 증량이 필요합니다.";
    }
  }

  return {
    getCalcList  : getCalcList,
    saveCalc     : saveCalc,
    calculateOnly: calculateOnly,
    deleteCalc   : deleteCalc
  };
})();

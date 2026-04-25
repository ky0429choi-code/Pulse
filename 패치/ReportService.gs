// ============================================================
// ReportService.gs
// 삼성웰스토리 보고서 양식 GAS 템플릿 조합
// ============================================================

var ReportService = (function () {

  var CATEGORIES = ["일일", "주간", "월간"];

  // ── 보고서 목록 ─────────────────────────────────────────────
  function getReportList(req) {
    Validator.required_("getReportList", req, ["siteId"]);
    var opts = {
      category: req.category || "",
      dateFrom: req.dateFrom || "",
      dateTo  : req.dateTo   || "",
      limit   : Number(req.limit) || 30
    };
    var items = ReportRepository.list_(req.siteId, opts);
    return { items: items, total: items.length };
  }

  // ── 보고서 생성 (템플릿 조합) ────────────────────────────────
  function generateReport(req) {
    Validator.required_("generateReport", req, ["siteId", "date", "category", "mainContent"]);
    var category = CATEGORIES.indexOf(req.category) >= 0 ? req.category : "일일";
    var siteName = _getSiteName_(req.siteId);
    var body     = _buildBody_(category, siteName, req);
    var title    = _buildTitle_(category, siteName, req.date);
    var now      = new Date().toISOString();
    var reportId = "RPT_" + req.siteId + "_" + now.replace(/[-:.TZ]/g, "").slice(0, 14);

    var rec = {
      reportId : reportId,
      siteId   : req.siteId,
      date     : req.date,
      title    : title,
      category : category,
      body     : body,
      status   : "draft",
      createdAt: now
    };
    ReportRepository.save_(rec);
    return rec;
  }

  // ── 상태 확정 ────────────────────────────────────────────────
  function finalizeReport(req) {
    Validator.required_("finalizeReport", req, ["reportId"]);
    var ok = ReportRepository.updateStatus_(req.reportId, "final");
    if (!ok) throw new Error("reportId not found: " + req.reportId);
    return { reportId: req.reportId, status: "final" };
  }

  function deleteReport(req) {
    Validator.required_("deleteReport", req, ["reportId"]);
    var ok = ReportRepository.delete_(req.reportId);
    if (!ok) throw new Error("reportId not found: " + req.reportId);
    return { reportId: req.reportId, deleted: true };
  }

  // ── 내부: 사업장명 조회 ──────────────────────────────────────
  function _getSiteName_(siteId) {
    try {
      var cfg = AppConfigService.getAppConfig({});
      var sites = cfg.sites || [];
      for (var i = 0; i < sites.length; i++) {
        if (sites[i].siteId === siteId) return sites[i].siteName;
      }
    } catch (e) {}
    return siteId;
  }

  // ── 내부: 보고서 제목 조합 ──────────────────────────────────
  function _buildTitle_(category, siteName, date) {
    var map = { "일일": "일일 운영 보고서", "주간": "주간 운영 보고서", "월간": "월간 운영 보고서" };
    return "[" + siteName + "] " + date + " " + (map[category] || "운영 보고서");
  }

  // ── 내부: 삼성웰스토리 양식 본문 조합 ────────────────────────
  function _buildBody_(category, siteName, req) {
    var lines = [];
    var divider = "══════════════════════════════════════";

    // 헤더
    lines.push("삼성웰스토리 " + siteName + " " + (category === "일일" ? "일일" : category === "주간" ? "주간" : "월간") + " 운영 보고서");
    lines.push(divider);
    lines.push("■ 기준일: " + req.date);
    lines.push("■ 사업장: " + siteName + " (" + req.siteId + ")");
    lines.push("■ 보고유형: " + category + " 보고");
    lines.push("");

    // 주요 내용
    lines.push("1. 주요 운영 현황");
    lines.push("─────────────────────────────────────");
    var mainLines = String(req.mainContent || "").split(/\n|\//).map(function(l){ return l.trim(); }).filter(Boolean);
    mainLines.forEach(function(l, i) {
      lines.push("  " + (i + 1) + ") " + l);
    });
    lines.push("");

    // 특이사항
    if (req.specialNote && req.specialNote.trim()) {
      lines.push("2. 특이사항");
      lines.push("─────────────────────────────────────");
      var noteLines = String(req.specialNote).split(/\n|\//).map(function(l){ return l.trim(); }).filter(Boolean);
      noteLines.forEach(function(l, i) {
        lines.push("  " + (i + 1) + ") " + l);
      });
      lines.push("");
    }

    // 조치 및 계획
    if (req.actionPlan && req.actionPlan.trim()) {
      lines.push("3. 조치 및 향후 계획");
      lines.push("─────────────────────────────────────");
      var planLines = String(req.actionPlan).split(/\n|\//).map(function(l){ return l.trim(); }).filter(Boolean);
      planLines.forEach(function(l, i) {
        lines.push("  " + (i + 1) + ") " + l);
      });
      lines.push("");
    }

    // 푸터
    lines.push(divider);
    lines.push("작성일시: " + new Date().toLocaleString("ko-KR", { timeZone: CONFIG.APP_TIMEZONE || "Asia/Seoul" }));
    lines.push("본 보고서는 Pulse 운영 시스템에서 자동 생성되었습니다.");

    return lines.join("\n");
  }

  return {
    getReportList  : getReportList,
    generateReport : generateReport,
    finalizeReport : finalizeReport,
    deleteReport   : deleteReport
  };
})();

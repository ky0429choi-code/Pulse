// ============================================================
// ReportService.gs
// Pulse 운영 보고서 양식 템플릿 조합
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

  var UI_STYLE = {
    DIVIDER_BOLD: "══════════════════════════════════════",
    DIVIDER_THIN: "─────────────────────────────────────"
  };

  /**
   * 내부 헬퍼: 텍스트를 리스트 형식으로 변환
   */
  function _buildListItem_(content) {
    if (!content) return [];
    return String(content)
      .split(/\n|\//)
      .map(function(l){ return l.trim(); })
      .filter(Boolean)
      .map(function(l, i) { return "  " + (i + 1) + ") " + l; });
  }

  /**
   * 본문 섹션 추가 헬퍼
   */
  function _addSection_(lines, title, content) {
    if (!content || !content.trim()) return;
    lines.push(title);
    lines.push(UI_STYLE.DIVIDER_THIN);
    lines.push.apply(lines, _buildListItem_(content));
    lines.push("");
  }

  // ... (getReportList, generateReport, finalizeReport, deleteReport 생략) ...

  // ── 내부: 보고서 제목 조합 ──────────────────────────────────
  function _buildTitle_(category, siteName, date) {
    var map = { "일일": "일일 운영 보고서", "주간": "주간 운영 보고서", "월간": "월간 운영 보고서" };
    return "[Pulse] " + (date || "현재") + " " + (map[category] || "운영 보고서");
  }

  // ── 내부: 운영 보고서 양식 본문 조합 ────────────────────────
  function _buildBody_(category, siteName, req) {
    var lines = [];
    var reportTerm = (category || "일일") + " 보고서";

    // 1. 헤더 영역
    lines.push("Pulse " + reportTerm);
    lines.push(UI_STYLE.DIVIDER_BOLD);
    lines.push("■ 기준일: " + (req.date || "-"));
    lines.push("■ 보고유형: " + category);
    lines.push("");

    // 2. 섹션별 본문 (모듈화된 함수 사용)
    _addSection_(lines, "1. 주요 운영 현황", req.mainContent);
    _addSection_(lines, "2. 특이사항", req.specialNote);
    _addSection_(lines, "3. 조치 및 향후 계획", req.actionPlan);

    // 3. 푸터 영역
    lines.push(UI_STYLE.DIVIDER_BOLD);
    var tz = (typeof CONFIG !== 'undefined' && CONFIG.APP_TIMEZONE) ? CONFIG.APP_TIMEZONE : "Asia/Seoul";
    lines.push("작성일시: " + new Date().toLocaleString("ko-KR", { timeZone: tz }));
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

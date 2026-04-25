// ============================================================
// Router_additions.gs
// 기존 Router.gs 의 SESSION_ACTIONS 배열과 route_() 함수에
// 아래 내용을 추가하세요.
// ============================================================

// ── SESSION_ACTIONS 배열에 추가할 액션명 ─────────────────────
//
//   "getWorklogList", "saveWorklog", "updateWorklog", "deleteWorklog",
//   "getReportList", "generateReport", "finalizeReport", "deleteReport",
//   "getCalcList", "saveCalc", "calculateOnly", "deleteCalc"

// ── route_() 함수 내 switch 문에 추가할 케이스 ────────────────

/*

// ── 업무일지 ─────────────────────────────────────
case "getWorklogList":
  if (method !== "GET") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, WorklogService.getWorklogList(req));

case "saveWorklog":
  if (method !== "POST") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, WorklogService.saveWorklog(req));

case "updateWorklog":
  if (method !== "POST") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, WorklogService.updateWorklog(req));

case "deleteWorklog":
  if (method !== "POST") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, WorklogService.deleteWorklog(req));

// ── 보고서 ───────────────────────────────────────
case "getReportList":
  if (method !== "GET") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, ReportService.getReportList(req));

case "generateReport":
  if (method !== "POST") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, ReportService.generateReport(req));

case "finalizeReport":
  if (method !== "POST") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, ReportService.finalizeReport(req));

case "deleteReport":
  if (method !== "POST") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, ReportService.deleteReport(req));

// ── 인당량 ───────────────────────────────────────
case "getCalcList":
  if (method !== "GET") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, CalcService.getCalcList(req));

case "saveCalc":
  if (method !== "POST") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, CalcService.saveCalc(req));

case "calculateOnly":
  if (method !== "POST") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, CalcService.calculateOnly(req));

case "deleteCalc":
  if (method !== "POST") return ApiResponse.methodNotAllowed_(action);
  return ApiResponse.ok_(action, CalcService.deleteCalc(req));

*/

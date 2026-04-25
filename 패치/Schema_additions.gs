// ============================================================
// Schema_additions.gs
// 기존 Schema.gs 하단에 병합하세요.
// 신규 시트: 업무일지 / 보고서 / 인당량
// ============================================================

// ── 시트 이름 상수 (Config.gs SHEET_NAMES 에 추가) ──────────
// WORKLOG  : "업무일지"
// REPORT   : "보고서"
// CALC     : "인당량"

// ── 헤더 정의 ────────────────────────────────────────────────

var SCHEMA_WORKLOG_HEADERS = [
  "logId", "siteId", "date", "category",
  "content", "isDone", "tags", "createdAt"
];

var SCHEMA_REPORT_HEADERS = [
  "reportId", "siteId", "date", "title",
  "category", "body", "status", "createdAt"
];

var SCHEMA_CALC_HEADERS = [
  "calcId", "siteId", "menuName", "itemName",
  "portionG", "usageKg", "headcount", "yieldG",
  "baselineG", "feedback", "createdAt"
];

// ── FieldMap 등록용 논리키 매핑 ──────────────────────────────
// Installer.gs 의 ensureFieldMap_() 호출 목록에 아래 3개를 추가하세요.

var FIELDMAP_WORKLOG = [
  ["logId",     "logId",     "업무일지", "TRUE"],
  ["siteId",    "siteId",    "업무일지", "TRUE"],
  ["date",      "date",      "업무일지", "TRUE"],
  ["category",  "category",  "업무일지", "TRUE"],
  ["content",   "content",   "업무일지", "TRUE"],
  ["isDone",    "isDone",    "업무일지", "TRUE"],
  ["tags",      "tags",      "업무일지", "TRUE"],
  ["createdAt", "createdAt", "업무일지", "TRUE"]
];

var FIELDMAP_REPORT = [
  ["reportId",  "reportId",  "보고서", "TRUE"],
  ["siteId",    "siteId",    "보고서", "TRUE"],
  ["date",      "date",      "보고서", "TRUE"],
  ["title",     "title",     "보고서", "TRUE"],
  ["category",  "category",  "보고서", "TRUE"],
  ["body",      "body",      "보고서", "TRUE"],
  ["status",    "status",    "보고서", "TRUE"],
  ["createdAt", "createdAt", "보고서", "TRUE"]
];

var FIELDMAP_CALC = [
  ["calcId",    "calcId",    "인당량", "TRUE"],
  ["siteId",    "siteId",    "인당량", "TRUE"],
  ["menuName",  "menuName",  "인당량", "TRUE"],
  ["itemName",  "itemName",  "인당량", "TRUE"],
  ["portionG",  "portionG",  "인당량", "TRUE"],
  ["usageKg",   "usageKg",   "인당량", "TRUE"],
  ["headcount", "headcount", "인당량", "TRUE"],
  ["yieldG",    "yieldG",    "인당량", "TRUE"],
  ["baselineG", "baselineG", "인당량", "TRUE"],
  ["feedback",  "feedback",  "인당량", "TRUE"],
  ["createdAt", "createdAt", "인당량", "TRUE"]
];

var Schema = (function(){
  var SCHEMAS = {};

  SCHEMAS[CONFIG.SHEETS.ACTUALS] = [
    { logical:"date",    header:"날짜", required:true },
    { logical:"region",  header:"지역", required:false },
    { logical:"siteName",header:"사업장명", required:false },
    { logical:"di_b",    header:"DI_조식", required:false },
    { logical:"di_l",    header:"DI_중식", required:false },
    { logical:"di_d",    header:"DI_석식", required:false },
    { logical:"di_n",    header:"DI_야식", required:false },
    { logical:"to_b",    header:"TO_조식", required:false },
    { logical:"to_l",    header:"TO_중식", required:false },
    { logical:"to_d",    header:"TO_석식", required:false },
    { logical:"to_n",    header:"TO_야식", required:false },
    { logical:"cost",    header:"재료비", required:false },
    { logical:"note1",   header:"식사특이사항", required:false },
    { logical:"note2",   header:"기타특이사항", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.SITES] = [
    { logical:"region",      header:"지역", required:false },
    { logical:"siteName",    header:"사업장명", required:true },
    { logical:"dietitian",   header:"영양사", required:false },
    { logical:"chef",        header:"조리사", required:false },
    { logical:"seats",       header:"좌석수", required:false },
    { logical:"corners",     header:"코너수", required:false },
    { logical:"to_corners",  header:"TO_코너수", required:false },
    { logical:"targetSales", header:"도전매출", required:false },
    { logical:"targetProfit",header:"도전영업이익", required:false },
    { logical:"targetRatio", header:"목표재료비", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.METRICS_MON] = [
    { logical:"month",       header:"기준연월", required:true },
    { logical:"region",      header:"지역", required:false },
    { logical:"siteName",    header:"사업장명", required:true },
    { logical:"workDays",    header:"조업일수", required:false },
    { logical:"avg_di_b",    header:"일평균_조식", required:false },
    { logical:"avg_di_l",    header:"일평균_중식", required:false },
    { logical:"avg_di_d",    header:"일평균_석식", required:false },
    { logical:"avg_di_n",    header:"일평균_야식", required:false },
    { logical:"avg_to_b",    header:"일평균_TO조식", required:false },
    { logical:"avg_to_l",    header:"일평균_TO중식", required:false },
    { logical:"avg_to_d",    header:"일평균_TO석식", required:false },
    { logical:"avg_to_n",    header:"일평균_TO야식", required:false },
    { logical:"costRatio",   header:"재료비율", required:false },
    { logical:"whiScore",    header:"WHI점수", required:false },
    { logical:"turnover",    header:"회전율(중식_T/O포함)", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.FORECAST] = [
    { logical:"createdAt",   header:"생성일시", required:false },
    { logical:"baseDate",    header:"기준일", required:false },
    { logical:"targetDate",  header:"예측대상일", required:true },
    { logical:"region",      header:"지역", required:false },
    { logical:"siteName",    header:"사업장명", required:true },
    { logical:"meal",        header:"끼니", required:false },
    { logical:"forecast",    header:"예측값", required:false },
    { logical:"actual",      header:"실제값", required:false },
    { logical:"errorRate",   header:"오차율(%)", required:false },
    { logical:"accuracy",    header:"정확도(%)", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.CALC_HISTORY] = [
    { logical:"calcId",      header:"계산ID", required:true },
    { logical:"date",        header:"일자", required:true },
    { logical:"userId",      header:"계정", required:true },
    { logical:"itemName",    header:"품목명", required:true },
    { logical:"calcType",    header:"계산유형", required:true },
    { logical:"orderQty",    header:"발주량", required:true },
    { logical:"lossRate",    header:"로스율(%)", required:true },
    { logical:"perCapita",   header:"1인목표량", required:true },
    { logical:"actualWeight",header:"실중량", required:true },
    { logical:"servings",    header:"제공가능식수", required:true },
    { logical:"reason",      header:"사유", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.MEMO] = [
    { logical:"memoId",    header:"\uBA54\uBAA8ID", required:true },
    { logical:"date",      header:"\uC77C\uC790", required:true },
    { logical:"siteId",    header:"\uC0AC\uC5C5\uC7A5ID", required:true },
    { logical:"category",  header:"\uCE74\uD14C\uACE0\uB9AC", required:true },
    { logical:"tags",      header:"\uD0DC\uADF8", required:false },
    { logical:"content",   header:"\uB0B4\uC6A9", required:true },
    { logical:"createdAt", header:"\uB4F1\uB85D\uC77C\uC2DC", required:true }
  ];

  SCHEMAS[CONFIG.SHEETS.TEMPLATES] = [
    { logical:"templateId",  header:"\uD15C\uD50C\uB9BFID", required:true },
    { logical:"groupId",     header:"\uADF8\uB8F9ID", required:true },
    { logical:"label",       header:"\uD15C\uD50C\uB9BF\uBA85", required:true },
    { logical:"description", header:"\uC124\uBA85", required:false },
    { logical:"body",        header:"\uD15C\uD50C\uB9BF\uBCF8\uBB38", required:true },
    { logical:"enabled",     header:"\uC0AC\uC6A9\uC5EC\uBD80", required:false },
    { logical:"sort",        header:"\uC815\uB82C\uC21C\uC11C", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.INSIGHTS] = [
    { logical:"runId",       header:"runId", required:true },
    { logical:"runAt",       header:"runAt", required:true },
    { logical:"siteId",      header:"siteId", required:true },
    { logical:"scope",       header:"scope", required:true },
    { logical:"period",      header:"period", required:false },
    { logical:"level",       header:"level", required:true },
    { logical:"code",        header:"code", required:true },
    { logical:"title",       header:"title", required:true },
    { logical:"message",     header:"message", required:true },
    { logical:"actionGuide", header:"actionGuide", required:false },
    { logical:"status",      header:"status", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.SETTINGS] = [
    { logical:"key", header:"key", required:true },
    { logical:"value", header:"value", required:false },
    { logical:"note", header:"note", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.LOG] = [
    { logical:"ts",      header:"ts", required:true },
    { logical:"level",   header:"level", required:true },
    { logical:"source",  header:"source", required:true },
    { logical:"action",  header:"action", required:false },
    { logical:"message", header:"message", required:false },
    { logical:"payload", header:"payload", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.USERS] = [
    { logical:"userId",      header:"접속권한계정", required:true },
    { logical:"role",        header:"권한등급", required:false },
    { logical:"region",      header:"담당지역", required:false },
    { logical:"siteId",      header:"소속사업장", required:false },
    { logical:"password",    header:"개인비밀번호", required:true },
    { logical:"displayName", header:"표시이름", required:false },
    { logical:"jobTitle",    header:"표시직책", required:false },
    { logical:"note",        header:"비고1", required:false },
    { logical:"note2",       header:"비고2", required:false },
    { logical:"note3",       header:"비고3", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.SESSIONS] = [
    { logical:"sessionToken", header:"sessionToken", required:true },
    { logical:"userId",       header:"userId", required:true },
    { logical:"displayName",  header:"displayName", required:false },
    { logical:"role",         header:"role", required:false },
    { logical:"createdAt",    header:"createdAt", required:true },
    { logical:"expiresAt",    header:"expiresAt", required:true },
    { logical:"lastSeenAt",   header:"lastSeenAt", required:false },
    { logical:"active",       header:"active", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.ACCESS_LOG] = [
    { logical:"ts",         header:"ts", required:true },
    { logical:"eventType",  header:"eventType", required:true },
    { logical:"userId",     header:"userId", required:false },
    { logical:"displayName",header:"displayName", required:false },
    { logical:"role",       header:"role", required:false },
    { logical:"action",     header:"action", required:false },
    { logical:"siteId",     header:"siteId", required:false },
    { logical:"date",       header:"date", required:false },
    { logical:"message",    header:"message", required:false },
    { logical:"payload",    header:"payload", required:false }
  ];

  SCHEMAS[CONFIG.SHEETS.WORKLOG] = [
    { logical: "logId", header: "logId", required: true },
    { logical: "siteId", header: "siteId", required: true },
    { logical: "date", header: "date", required: true },
    { logical: "category", header: "category", required: true },
    { logical: "content", header: "content", required: false },
    { logical: "isDone", header: "isDone", required: true },
    { logical: "tags", header: "tags", required: false },
    { logical: "createdAt", header: "createdAt", required: true }
  ];

  SCHEMAS[CONFIG.SHEETS.REPORT] = [
    { logical: "reportId", header: "reportId", required: true },
    { logical: "siteId", header: "siteId", required: true },
    { logical: "date", header: "date", required: true },
    { logical: "title", header: "title", required: true },
    { logical: "category", header: "category", required: true },
    { logical: "body", header: "body", required: false },
    { logical: "status", header: "status", required: true },
    { logical: "createdAt", header: "createdAt", required: true }
  ];

  SCHEMAS[CONFIG.SHEETS.CALC] = [
    { logical: "calcId", header: "calcId", required: true },
    { logical: "siteId", header: "siteId", required: true },
    { logical: "menuName", header: "menuName", required: true },
    { logical: "itemName", header: "itemName", required: true },
    { logical: "portionG", header: "portionG", required: true },
    { logical: "usageKg", header: "usageKg", required: true },
    { logical: "headcount", header: "headcount", required: true },
    { logical: "yieldG", header: "yieldG", required: true },
    { logical: "baselineG", header: "baselineG", required: true },
    { logical: "feedback", header: "feedback", required: false },
    { logical: "createdAt", header: "createdAt", required: true }
  ];

  var FIELDMAP_HEADER = ["sheet","logical","header","enabled","note"];

  var _fieldMapCache = null;

  function loadFieldMap_() {
    if (_fieldMapCache) return _fieldMapCache;
    var name = CONFIG.SHEETS.FIELDMAP;
    var data;
    try { data = SheetRepo.readAll_(name); } catch(e){ return {}; }
    var header = data.header || [];
    var idx = {
      sheet: header.indexOf("sheet"),
      logical: header.indexOf("logical"),
      hdr: header.indexOf("header"),
      enabled: header.indexOf("enabled")
    };
    if (idx.sheet < 0 || idx.logical < 0 || idx.hdr < 0) return {};

    var map = {};
    data.rows.forEach(function(r){
      var sh = String(r[idx.sheet] || "");
      var lg = String(r[idx.logical] || "");
      var hd = String(r[idx.hdr] || "");
      var en = idx.enabled >= 0 ? String(r[idx.enabled] || "TRUE") : "TRUE";
      if (!sh || !lg || !hd) return;
      if (String(en).toUpperCase() === "FALSE") return;
      if (!map[sh]) map[sh] = {};
      map[sh][lg] = hd;
    });
    _fieldMapCache = map;
    return _fieldMapCache;
  }

  function buildIndexMap_(sheetName, headerRow) {
    var schema = SCHEMAS[sheetName];
    if (!schema) throw new Error("Schema not found for sheet: " + sheetName);

    var fmapAll = loadFieldMap_();
    var fmap = fmapAll[sheetName] || {};

    var idx = {};
    var missing = [];
    schema.forEach(function(f){
      var realHeader = fmap[f.logical] || f.header;
      var pos = headerRow.indexOf(realHeader);
      idx[f.logical] = pos;
      if (f.required && pos < 0) missing.push(f.logical + "->" + realHeader);
    });

    if (missing.length) throw new Error("Missing required headers in '" + sheetName + "': " + missing.join(", "));
    return idx;
  }

  function defaultHeaders_(sheetName){
    if (sheetName === CONFIG.SHEETS.FIELDMAP) return FIELDMAP_HEADER;
    var schema = SCHEMAS[sheetName] || [];
    return schema.map(function(x){ return x.header; });
  }

  function getSchema_(sheetName){ return SCHEMAS[sheetName] || []; }

  return {
    getSchema_: getSchema_,
    defaultHeaders_: defaultHeaders_,
    loadFieldMap_: loadFieldMap_,
    buildIndexMap_: buildIndexMap_
  };
})();

// -- Constants for Installer addition --
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

var FIELDMAP_WORKLOG = [
  ["logId",     "logId",     "\uC5C5\uBB34\uC77C\uC9C0", "TRUE"],
  ["siteId",    "siteId",    "\uC5C5\uBB34\uC77C\uC9C0", "TRUE"],
  ["date",      "date",      "\uC5C5\uBB34\uC77C\uC9C0", "TRUE"],
  ["category",  "category",  "\uC5C5\uBB34\uC77C\uC9C0", "TRUE"],
  ["content",   "content",   "\uC5C5\uBB34\uC77C\uC9C0", "TRUE"],
  ["isDone",    "isDone",    "\uC5C5\uBB34\uC77C\uC9C0", "TRUE"],
  ["tags",      "tags",      "\uC5C5\uBB34\uC77C\uC9C0", "TRUE"],
  ["createdAt", "createdAt", "\uC5C5\uBB34\uC77C\uC9C0", "TRUE"]
];

var FIELDMAP_REPORT = [
  ["reportId",  "reportId",  "\uBCF4\uACE0\uC11C", "TRUE"],
  ["siteId",    "siteId",    "\uBCF4\uACE0\uC11C", "TRUE"],
  ["date",      "date",      "\uBCF4\uACE0\uC11C", "TRUE"],
  ["title",     "title",     "\uBCF4\uACE0\uC11C", "TRUE"],
  ["category",  "category",  "\uBCF4\uACE0\uC11C", "TRUE"],
  ["body",      "body",      "\uBCF4\uACE0\uC11C", "TRUE"],
  ["status",    "status",    "\uBCF4\uACE0\uC11C", "TRUE"],
  ["createdAt", "createdAt", "\uBCF4\uACE0\uC11C", "TRUE"]
];

var FIELDMAP_CALC = [
  ["calcId",    "calcId",    "\uC778\uB2F9\uB7C9", "TRUE"],
  ["siteId",    "siteId",    "\uC778\uB2F9\uB7C9", "TRUE"],
  ["menuName",  "menuName",  "\uC778\uB2F9\uB7C9", "TRUE"],
  ["itemName",  "itemName",  "\uC778\uB2F9\uB7C9", "TRUE"],
  ["portionG",  "portionG",  "\uC778\uB2F9\uB7C9", "TRUE"],
  ["usageKg",   "usageKg",   "\uC778\uB2F9\uB7C9", "TRUE"],
  ["headcount", "headcount", "\uC778\uB2F9\uB7C9", "TRUE"],
  ["yieldG",    "yieldG",    "\uC778\uB2F9\uB7C9", "TRUE"],
  ["baselineG", "baselineG", "\uC778\uB2F9\uB7C9", "TRUE"],
  ["feedback",  "feedback",  "\uC778\uB2F9\uB7C9", "TRUE"],
  ["createdAt", "createdAt", "\uC778\uB2F9\uB7C9", "TRUE"]
];

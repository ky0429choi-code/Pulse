var CONFIG = (function(){
  var props = PropertiesService.getScriptProperties();

  return {
    API_VERSION: "v1",
    API_KEY: props.getProperty("API_KEY") || "",
    ADMIN_API_KEY: props.getProperty("ADMIN_API_KEY") || "",
    SPREADSHEET_ID: "12Z5JDOUfBne08-TyYIziTIo7HeFEzXAoCyM9uIKnHVY", // Hardcoded to new ID
    TZ: props.getProperty("APP_TIMEZONE") || "Asia/Seoul",
    SESSION_TTL_MINUTES: Number(props.getProperty("SESSION_TTL_MINUTES") || 480),
    DEFAULTS: {
      DEFAULT_SITE_ID: "H2",
      SITE_LIST_JSON: JSON.stringify([
        { siteId: "H1", siteName: "Site H1" },
        { siteId: "H2", siteName: "Site H2" }
      ]),
      FEATURE_FLAGS_JSON: JSON.stringify({
        memoSync: true,
        insightAudit: true,
        templateAutoFill: true,
        auditPersist: true,
        weeklySummary: true,
        systemStatus: true
      })
    },
    SHEETS: {
      WORKLOG: "\uC5C5\uBB34\uC77C\uC9C0",
      REPORT: "\uBCF4\uACE0\uC11C",
      CALC: "\uC778\uB2F9\uB7C9",
      ACTUALS: "실적데이터",
      SITES: "사업장현황",
      METRICS_MON: "월간지표_압축",  
      FORECAST: "AI예측이력",
      CALC_HISTORY: "계산이력",
      MEMO: "업무메모로그",
      TEMPLATES: "반복질의사전",
      INSIGHTS: "점검데이터결과",
      SETTINGS: "설정",
      FIELDMAP: "필드매핑",
      LOG: "로그",
      USERS: "권한관리",
      SESSIONS: "세션",
      ACCESS_LOG: "접속로그"
    }
  };
})();

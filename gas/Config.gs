var CONFIG = (function(){
  var props = PropertiesService.getScriptProperties();

  return {
    API_VERSION: "v1",
    API_KEY: props.getProperty("API_KEY") || "",
    ADMIN_API_KEY: props.getProperty("ADMIN_API_KEY") || "",
    SPREADSHEET_ID: props.getProperty("SPREADSHEET_ID") || "",
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
      HEADCOUNT: "\uC778\uC6D0\uC6B4\uC601",
      MEMO: "\uC5C5\uBB34\uBA54\uBAA8\uB85C\uADF8",
      TEMPLATES: "\uBC18\uBCF5\uC9C8\uC758\uC0AC\uC804",
      INSIGHTS: "\uC810\uAC80\uB370\uC774\uD130\uACB0\uACFC",
      SETTINGS: "\uC124\uC815",
      FIELDMAP: "\uD544\uB4DC\uB9E4\uD551",
      LOG: "\uB85C\uADF8",
      USERS: "\uAD8C\uD55C\uAD00\uB9AC",
      SESSIONS: "\uC138\uC158",
      ACCESS_LOG: "\uC811\uC18D\uB85C\uADF8"
    }
  };
})();

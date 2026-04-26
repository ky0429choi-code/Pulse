var Router = (function () {
  var PUBLIC_ACTIONS = {
    health: { method: "GET", handler: function(req){ return HealthService.health(req); } },
    login: { method: "POST", handler: function(req){ return AuthService.login(req); } }
  };

  var SESSION_ACTIONS = {
    logout: { method: "POST", handler: function(req){ return AuthService.logout(req); } },
    getSession: { method: "POST", handler: function(req){ return AuthService.getSession(req); } },
    getAppConfig: { method: "POST", handler: function(req){ return AppConfigService.getAppConfig(req); } },
    getDashboardSummary: { method: "POST", handler: function(req){ return HeadcountService.getDashboardSummary(req); } },
    getTemplateActions: { method: "POST", handler: function(req){ return TemplateService.getTemplateActions(req); } },
    renderTemplate: { method: "POST", handler: function(req){ return TemplateService.renderTemplate(req); } },
    getMemoList: { method: "POST", handler: function(req){ return MemoService.getMemoList(req); } },
    getInsights: { method: "POST", handler: function(req){ return InsightService.getInsights(req); } },
    getBriefing: { method: "POST", handler: function(req){ return JarvisService.getBriefing(req); } },
    saveMemo: { method: "POST", handler: function(req){ return MemoService.saveMemo(req); } },
    runAudit: { method: "POST", handler: function(req){ return InsightService.runAudit(req); } },
    getSiteList: { method: "POST", handler: function(req){ return SiteRepository.getSiteList(req); } },
    getDashboardMetrics: { method: "POST", handler: function(req){ return MetricsRepository.getDashboardMetrics(req); } },
    calculateYield: { method: "POST", handler: function(req){ return CalculatorService.calculateYield_(req); } },
    searchCalcHistory: { method: "POST", handler: function(req){ return CalculatorService.searchHistory_(req); } },
    
    // Worklog Additions
    getWorklogList: { method: "POST", handler: function(req){ return WorklogService.getWorklogList(req); } },
    saveWorklog: { method: "POST", handler: function(req){ return WorklogService.saveWorklog(req); } },
    updateWorklog: { method: "POST", handler: function(req){ return WorklogService.updateWorklog(req); } },
    deleteWorklog: { method: "POST", handler: function(req){ return WorklogService.deleteWorklog(req); } },
    syncFromCalendar: { method: "POST", handler: function(req){ return WorklogService.syncFromCalendar(req); } },

    // Report Additions
    getReportList: { method: "POST", handler: function(req){ return ReportService.getReportList(req); } },
    generateReport: { method: "POST", handler: function(req){ return ReportService.generateReport(req); } },
    finalizeReport: { method: "POST", handler: function(req){ return ReportService.finalizeReport(req); } },
    deleteReport: { method: "POST", handler: function(req){ return ReportService.deleteReport(req); } },

    // Calc Additions
    getCalcList: { method: "POST", handler: function(req){ return CalcService.getCalcList(req); } },
    saveCalc: { method: "POST", handler: function(req){ return CalcService.saveCalc(req); } },
    calculateOnly: { method: "POST", handler: function(req){ return CalcService.calculateOnly(req); } },
    deleteCalc: { method: "POST", handler: function(req){ return CalcService.deleteCalc(req); } }
  };

  var ADMIN_ACTIONS = {
    getSystemStatus: { method: "POST", handler: function(req){ return SystemService.getSystemStatus(req); } },
    setupAll: { method: "POST", handler: function(req){ return Installer.setupAll(req); } },
    setupTriggers: { method: "POST", handler: function(req){ return Installer.setupTriggers(req); } }
  };

  function route_(action) {
    return PUBLIC_ACTIONS[action] || SESSION_ACTIONS[action] || ADMIN_ACTIONS[action] || null;
  }

  function sanitizeReq_(req) {
    var safeReq = {};
    Object.keys(req || {}).forEach(function(key){
      if (key !== "k" && key !== "adminKey" && key !== "password" && key !== "st") safeReq[key] = req[key];
    });
    return safeReq;
  }

  function enforceMethod_(action, expected, method) {
    if (expected === method) return null;
    return fail_(action, "METHOD_NOT_ALLOWED", "Use " + expected + " for this action");
  }

  function requireKey_(action, provided, expected, errorCode, message) {
    if (!expected) return fail_(action, "CONFIG_REQUIRED", message + " is not configured");
    if (provided === expected) return null;
    return fail_(action, errorCode, message + " is invalid");
  }

  function handle_(method, req) {
    var action = (req && req.action) ? req.action : "health";
    var route = route_(action);
    var session = null;

    LogService.log_("INFO", "API", action, method, sanitizeReq_(req));

    if (!route) {
      LogService.log_("WARN", "API", action, "UNKNOWN_ACTION", null);
      return jsonOut_(fail_(action, "UNKNOWN_ACTION", "unknown action"));
    }

    var methodError = enforceMethod_(action, route.method, method);
    if (methodError) return jsonOut_(methodError);

    if (CONFIG.API_KEY && req.k !== CONFIG.API_KEY) {
      LogService.log_("WARN", "API", action, "INVALID_API_KEY", null);
      return jsonOut_(fail_(action, "FORBIDDEN", "Invalid API key"));
    }

    if (SESSION_ACTIONS[action] || ADMIN_ACTIONS[action]) {
      var sessionResult = AuthService.requireSession_(req);
      if (!sessionResult.ok) return jsonOut_(sessionResult.error);
      session = sessionResult.session;
    }

    if (ADMIN_ACTIONS[action]) {
      var adminKeyError = requireKey_(action, req.adminKey, CONFIG.ADMIN_API_KEY, "ADMIN_AUTH_REQUIRED", "Admin API key");
      if (adminKeyError) return jsonOut_(adminKeyError);
      if (!AuthService.isAdminRole_(session.role)) {
        return jsonOut_(fail_(action, "FORBIDDEN", "Admin role is required"));
      }
    }

    try {
      if (session) {
        req._user = {
          userId: session.userId,
          displayName: session.displayName,
          role: session.role,
          expiresAt: session.expiresAt
        };
        AccessLogService.log_(ADMIN_ACTIONS[action] ? "ADMIN" : "VIEW", req._user, action, method, sanitizeReq_(req));
      }
      return jsonOut_(route.handler(req));
    } catch (err) {
      LogService.log_("ERROR", "API", action, String(err), null);
      return jsonOut_(fail_(action, "INTERNAL_ERROR", String(err)));
    }
  }

  return { handle_: handle_ };
})();

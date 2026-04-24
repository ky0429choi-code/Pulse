var AppConfigService = (function(){
  function parseJsonOr_(raw, fallback){
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function getSettingsMap_(){
    try { return SettingsRepository.getMap_(); }
    catch (e) { return {}; }
  }

  function getAppConfig(){
    var settings = getSettingsMap_();
    var sites = parseJsonOr_(settings.SITE_LIST_JSON, parseJsonOr_(CONFIG.DEFAULTS.SITE_LIST_JSON, []));
    var featureFlags = parseJsonOr_(settings.FEATURE_FLAGS_JSON, parseJsonOr_(CONFIG.DEFAULTS.FEATURE_FLAGS_JSON, {}));
    var defaultSiteId = settings.DEFAULT_SITE_ID || CONFIG.DEFAULTS.DEFAULT_SITE_ID;

    return ok_("getAppConfig", {
      defaultSiteId: defaultSiteId,
      sites: sites,
      featureFlags: featureFlags
    }, "");
  }

  function listSites_(){
    var cfg = getAppConfig();
    return cfg.success ? (cfg.data.sites || []) : [];
  }

  return { getAppConfig: getAppConfig, listSites_: listSites_ };
})();

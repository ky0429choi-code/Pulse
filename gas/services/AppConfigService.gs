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
    var sitesRaw = [];
    try { sitesRaw = SiteRepository.listAll_(); } catch(e) {}
    var sites = sitesRaw.map(function(s){ return { siteId: s.siteName, siteName: s.siteName, region: s.region }; });
    if (sites.length === 0) sites.push({ siteId: "NONE", siteName: "데이터 로딩 실패 (스프레드시트 확인)" });

    var featureFlags = parseJsonOr_(settings.FEATURE_FLAGS_JSON, parseJsonOr_(CONFIG.DEFAULTS.FEATURE_FLAGS_JSON, {}));
    var defaultSiteId = sites.length > 0 ? sites[0].siteId : "NONE";

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

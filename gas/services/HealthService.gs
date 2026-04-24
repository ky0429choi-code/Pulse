var HealthService = (function(){
  function health(){
    return ok_("health", { ok:true, version: CONFIG.API_VERSION }, "");
  }
  return { health: health };
})();

var Schema = (function(){
  var SCHEMAS = {};

  SCHEMAS[CONFIG.SHEETS.HEADCOUNT] = [
    { logical:"date",         header:"\uC77C\uC790", required:true },
    { logical:"siteId",       header:"\uC0AC\uC5C5\uC7A5ID", required:true },
    { logical:"siteName",     header:"\uC0AC\uC5C5\uC7A5\uBA85", required:false },
    { logical:"meal",         header:"\uB07C\uB2C8", required:true },
    { logical:"diCount",      header:"DI\uC2DD\uC218", required:true },
    { logical:"toCount",      header:"TO\uC2DD\uC218", required:false },
    { logical:"seatCount",    header:"\uC88C\uC11D\uC218", required:false },
    { logical:"toCornerCount",header:"TO\uCF54\uB108\uC218", required:false },
    { logical:"staffCount",   header:"\uC0AC\uC785\uC778\uC6D0", required:false },
    { logical:"note",         header:"\uBE44\uACE0", required:false }
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
    { logical:"userId",      header:"userId", required:true },
    { logical:"password",    header:"password", required:true },
    { logical:"displayName", header:"displayName", required:false },
    { logical:"role",        header:"role", required:false },
    { logical:"enabled",     header:"enabled", required:false },
    { logical:"note",        header:"note", required:false }
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

  var FIELDMAP_HEADER = ["sheet","logical","header","enabled","note"];

  function loadFieldMap_() {
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
    return map;
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

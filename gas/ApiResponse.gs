function ok_(action, data, message) {
  return {
    success: true,
    version: CONFIG.API_VERSION,
    action: action,
    message: message || "",
    data: data || {},
    meta: { timestamp: new Date().toISOString() }
  };
}

function fail_(action, errorCode, message) {
  return {
    success: false,
    version: CONFIG.API_VERSION,
    action: action,
    message: message || "",
    data: null,
    meta: { timestamp: new Date().toISOString(), errorCode: errorCode || "INTERNAL_ERROR" }
  };
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

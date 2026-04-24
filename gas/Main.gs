function doGet(e) {
  return Router.handle_("GET", (e && e.parameter) ? e.parameter : {});
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) ? e.postData.contents : "{}");
  } catch (err) {
    return jsonOut_(fail_("__parse__", "VALIDATION_ERROR", "Invalid JSON body"));
  }
  return Router.handle_("POST", body);
}

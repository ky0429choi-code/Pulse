var Validator = (function(){
  function required_(action, req, keys) {
    var miss = [];
    keys.forEach(function(k){ if (!req[k]) miss.push(k); });
    if (miss.length) return fail_(action, "VALIDATION_ERROR", "required: " + miss.join(", "));
    return null;
  }
  return { required_: required_ };
})();

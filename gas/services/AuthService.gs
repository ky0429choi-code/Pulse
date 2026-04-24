var AuthService = (function(){
  function normalizeUserId_(value){
    return String(value || "").trim().toLowerCase().replace(/@samsung\.com$/i, "");
  }

  function roleNorm_(role){
    return String(role || "USER").trim().toUpperCase();
  }

  function isAdminRole_(role){
    var normalized = roleNorm_(role);
    return normalized === "M" || normalized === "A" || normalized === "ADMIN" || normalized === "SUPERADMIN";
  }

  function sessionExpiry_(){
    var expires = new Date();
    expires.setMinutes(expires.getMinutes() + CONFIG.SESSION_TTL_MINUTES);
    return expires.toISOString();
  }

  function buildSession_(user){
    var raw = Utilities.getUuid() + "|" + user.userId + "|" + new Date().toISOString();
    var token = Utilities.base64EncodeWebSafe(
      Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw)
    ).replace(/=+$/g, "");

    return {
      sessionToken: token,
      userId: user.userId,
      displayName: user.displayName || user.userId,
      role: roleNorm_(user.role),
      createdAt: DateUtil.nowIso_(),
      expiresAt: sessionExpiry_(),
      lastSeenAt: DateUtil.nowIso_()
    };
  }

  function login(req){
    var action = "login";
    var bad = Validator.required_(action, req, ["userId","password"]);
    if (bad) return bad;

    SessionRepository.deactivateExpired_();

    var user = UserRepository.findByUserId_(req.userId);
    var normalizedUserId = normalizeUserId_(req.userId);
    if (!user || !user.enabled) {
      AccessLogService.log_("LOGIN_FAIL", { userId: normalizedUserId }, action, "user_not_found_or_disabled", null);
      return fail_(action, "AUTH_REQUIRED", "Invalid user or password");
    }

    if (String(user.password || "") !== String(req.password || "")) {
      AccessLogService.log_("LOGIN_FAIL", user, action, "wrong_password", null);
      return fail_(action, "AUTH_REQUIRED", "Invalid user or password");
    }

    var session = buildSession_(user);
    SessionRepository.create_(session);
    AccessLogService.log_("LOGIN", session, action, "login_success", null);
    LogService.log_("INFO", "AUTH", action, "login_success", { userId: session.userId, role: session.role });

    return ok_(action, {
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      user: {
        userId: session.userId,
        displayName: session.displayName,
        role: session.role
      }
    }, "");
  }

  function requireSession_(req){
    SessionRepository.deactivateExpired_();

    var sessionToken = req && req.st ? String(req.st) : "";
    if (!sessionToken) {
      return { ok: false, error: fail_("session", "AUTH_REQUIRED", "Session is required") };
    }

    var session = SessionRepository.findValid_(sessionToken);
    if (!session) {
      return { ok: false, error: fail_("session", "SESSION_EXPIRED", "Session expired. Please login again") };
    }

    var newExpiry = sessionExpiry_();
    SessionRepository.touch_(session.sessionToken, newExpiry);
    session.expiresAt = newExpiry;
    session.role = roleNorm_(session.role);
    return { ok: true, session: session };
  }

  function logout(req){
    var action = "logout";
    var checked = requireSession_(req);
    if (!checked.ok) return checked.error;

    SessionRepository.deactivate_(checked.session.sessionToken);
    AccessLogService.log_("LOGOUT", checked.session, action, "logout", null);
    return ok_(action, { ok: true }, "");
  }

  function getSession(req){
    var action = "getSession";
    var checked = requireSession_(req);
    if (!checked.ok) return checked.error;

    return ok_(action, {
      user: {
        userId: checked.session.userId,
        displayName: checked.session.displayName,
        role: checked.session.role
      },
      expiresAt: checked.session.expiresAt
    }, "");
  }

  return {
    login: login,
    logout: logout,
    getSession: getSession,
    requireSession_: requireSession_,
    isAdminRole_: isAdminRole_
  };
})();

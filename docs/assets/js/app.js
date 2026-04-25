import { initTabs } from "./router.js";
import { apiGet, apiPost, setAuthHandlers } from "./services/api.js";
import { renderDashboard } from "./modules/dashboard.js";
import { renderTemplates } from "./modules/templates.js";
import { renderInsights } from "./modules/insights.js";
import { renderMemo } from "./modules/memo.js";
import { renderCalculators } from "./modules/calculators.js";
import { renderReference } from "./modules/reference.js";
import { getState, setState, subscribe } from "./store.js";
import { getStoredSession, storeSession, clearStoredSession } from "./auth/session.js";
import { escapeHtml } from "./components/ui.js";
import { CONFIG } from "./config.js";

function todayISO(){
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function boot(){
  setAuthHandlers({ onUnauthorized: handleUnauthorized_ });
  initTabs();
  wireAuthUi_();
  renderCalculators();
  renderReference();
  subscribe(onStateChange_);
  await restoreSession_();
}

function wireAuthUi_(){
  const dateInput = document.getElementById("dateInput");
  const siteSelect = document.getElementById("siteSelect");
  const loginBtn = document.getElementById("loginBtn");
  const loginIdEl = document.getElementById("loginId");
  const passwordEl = document.getElementById("loginPassword");
  const rememberEl = document.getElementById("rememberLoginId");
  const logoutBtn = document.getElementById("logoutBtn");

  dateInput.value = todayISO();
  restoreRememberedLoginId_(loginIdEl, rememberEl);
  siteSelect.addEventListener("change", ()=> setState({ siteId: siteSelect.value }));
  dateInput.addEventListener("change", ()=> setState({ date: dateInput.value }));
  loginBtn?.addEventListener("click", submitLogin_);
  passwordEl?.addEventListener("keydown", (event)=>{
    if (event.key === "Enter") submitLogin_();
  });
  logoutBtn?.addEventListener("click", logout_);
}

function restoreRememberedLoginId_(loginIdEl, rememberEl){
  try {
    const remembered = localStorage.getItem(CONFIG.REMEMBER_LOGIN_ID_KEY) || "";
    if (remembered && loginIdEl) loginIdEl.value = remembered;
    if (rememberEl) rememberEl.checked = !!remembered;
  } catch (err) {
    // localStorage can be blocked; login still works without remembering the id.
  }
}

function normalizeLoginIdInput_(value){
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/@samsung\.com$/i, "");
}

function syncRememberedLoginId_(userId){
  const rememberEl = document.getElementById("rememberLoginId");
  try {
    if (rememberEl?.checked) {
      localStorage.setItem(CONFIG.REMEMBER_LOGIN_ID_KEY, userId);
    } else {
      localStorage.removeItem(CONFIG.REMEMBER_LOGIN_ID_KEY);
    }
  } catch (err) {
    // ignore storage errors
  }
}

async function restoreSession_(){
  const session = getStoredSession();
  if (!session?.sessionToken) {
    showLogin_();
    return;
  }

  try {
    const res = await apiPost("getSession", {});
    if (!res?.success) throw new Error(res?.message || "Session check failed");
    await completeLogin_(res.data.user, res.data.expiresAt);
  } catch (err) {
    clearStoredSession();
    showLogin_(String(err.message || err));
  }
}

async function submitLogin_(){
  const btn = document.getElementById("loginBtn");
  const error = document.getElementById("loginError");
  const userId = normalizeLoginIdInput_(document.getElementById("loginId").value);
  const password = document.getElementById("loginPassword").value;

  error.textContent = "";
  error.classList.remove("show");

  if (!password) {
    error.textContent = "Password is required.";
    error.classList.add("show");
    return;
  }

  btn.disabled = true;
  btn.textContent = "로그인 중...";
  try {
    if (!window.ENV?.API_BASE) {
      throw new Error("환경 설정(API_BASE)이 누락되었습니다. env.js를 확인하세요.");
    }

    if (!userId) {
      throw new Error("Single ID is required.");
    }

    const res = await apiPost("login", { userId, password });
    if (!res?.success) throw new Error(res?.message || "Login failed");
    syncRememberedLoginId_(userId);
    storeSession(res.data);
    await completeLogin_(res.data.user, res.data.expiresAt);
    document.getElementById("loginPassword").value = "";
  } catch (err) {
    error.textContent = String(err.message || err);
    error.classList.add("show");
  } finally {
    btn.disabled = false;
    btn.textContent = "로그인";
  }
}

async function completeLogin_(user, expiresAt){
  applyUserUi_(user, expiresAt);
  applyWatermark_(user);
  await loadConfig_();
  showApp_();
}

async function loadConfig_(){
  const cfg = await apiPost("getAppConfig", {});
  if(!cfg?.success){
    throw new Error("getAppConfig failed: " + (cfg?.message || "unknown"));
  }

  const siteSelect = document.getElementById("siteSelect");
  siteSelect.innerHTML = (cfg.data.sites || []).map((site)=>
    `<option value="${escapeHtml(site.siteId)}">${escapeHtml(site.siteName)}</option>`
  ).join("");

  const initialSiteId = cfg.data.defaultSiteId || cfg.data.sites?.[0]?.siteId || "";
  siteSelect.value = initialSiteId;

  setState({
    appConfig: cfg.data,
    siteId: initialSiteId,
    date: document.getElementById("dateInput").value,
    isReady: true
  });
}

let refreshToken = 0;

async function onStateChange_(state){
  if (!state.isReady || !state.siteId || !state.date) return;

  const siteSelect = document.getElementById("siteSelect");
  const dateInput = document.getElementById("dateInput");
  if (siteSelect && siteSelect.value !== state.siteId) siteSelect.value = state.siteId;
  if (dateInput && dateInput.value !== state.date) dateInput.value = state.date;

  const token = ++refreshToken;
  await refreshAll(state, token);
}

async function refreshAll(state = getState(), token = ++refreshToken){
  const siteId = state.siteId;
  const date = state.date;

  await renderDashboard({ siteId, date });
  if (token !== refreshToken) return;
  await renderTemplates({ siteId, date });
  if (token !== refreshToken) return;
  await renderInsights({ siteId });
  if (token !== refreshToken) return;
  await renderMemo({ siteId, date });
}

function applyUserUi_(user, expiresAt){
  const safeUser = user || { userId: "-", displayName: "-", role: "USER" };
  const nameEl = document.getElementById("userName");
  const roleEl = document.getElementById("userRole");
  const hintEl = document.getElementById("sessionHint");

  nameEl.textContent = safeUser.displayName || safeUser.userId || "-";
  roleEl.textContent = `${safeUser.role || "USER"} / ${safeUser.userId || "-"}`;
  hintEl.textContent = `세션 만료: ${new Date(expiresAt).toLocaleString("ko-KR")}`;

  setState({ user: safeUser, expiresAt: expiresAt || "" });
}

function showLogin_(message = ""){
  document.getElementById("appShell").classList.add("app-shell--locked");
  document.getElementById("loginOverlay").classList.add("show");
  document.getElementById("watermarkLayer").classList.remove("show");

  const hintEl = document.getElementById("sessionHint");
  if (hintEl) hintEl.textContent = "보호된 운영 데이터를 보려면 로그인이 필요합니다.";

  const error = document.getElementById("loginError");
  error.textContent = message;
  error.classList.toggle("show", !!message);

  setState({ isReady: false, user: null, expiresAt: "" });
}

function showApp_(){
  document.getElementById("loginOverlay").classList.remove("show");
  document.getElementById("appShell").classList.remove("app-shell--locked");
  document.getElementById("watermarkLayer").classList.add("show");
}

function applyWatermark_(user){
  const layer = document.getElementById("watermarkLayer");
  const stamp = `${user.displayName || user.userId} / ${user.userId} / ${new Date().toLocaleString("ko-KR")}`;
  layer.innerHTML = new Array(18).fill(`<span>${escapeHtml(stamp)}</span>`).join("");
}

async function logout_(){
  try {
    await apiPost("logout", {});
  } catch (err) {
    // ignore and clear locally
  }
  clearStoredSession();
  showLogin_();
}

function handleUnauthorized_(payload){
  clearStoredSession();
  showLogin_(payload?.message || "Session expired. Please login again.");
}

boot();

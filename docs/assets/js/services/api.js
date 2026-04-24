import { CONFIG } from "../config.js";
import { getSessionToken } from "../auth/session.js";

let authHandlers = {
  onUnauthorized: null
};

function withKey(params = {}){
  const sessionToken = getSessionToken();
  const withSession = sessionToken ? { ...params, st: sessionToken } : { ...params };
  return CONFIG.API_KEY ? { ...withSession, k: CONFIG.API_KEY } : withSession;
}

async function parseJson(res){
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON response (${res.status})`);
  }
}

function unwrapAuthError(payload){
  const code = payload?.meta?.errorCode || "";
  if (code === "AUTH_REQUIRED" || code === "SESSION_EXPIRED" || code === "FORBIDDEN") {
    if (typeof authHandlers.onUnauthorized === "function") authHandlers.onUnauthorized(payload);
    const error = new Error(payload?.message || "Unauthorized");
    error.code = code;
    throw error;
  }
  return payload;
}

export async function apiGet(action, params = {}){
  const qp = new URLSearchParams(withKey({ action, ...params })).toString();
  const url = `${CONFIG.API_BASE}?${qp}`;
  const res = await fetch(url, { method:"GET", cache:"no-store" });
  if (!res.ok) throw new Error(`GET ${action} failed (${res.status})`);
  return unwrapAuthError(await parseJson(res));
}

export async function apiPost(action, payload = {}){
  const res = await fetch(CONFIG.API_BASE, {
    method:"POST",
    headers:{ "Content-Type":"text/plain;charset=utf-8" },
    body: JSON.stringify(withKey({ action, ...payload }))
  });
  if (!res.ok) throw new Error(`POST ${action} failed (${res.status})`);
  return unwrapAuthError(await parseJson(res));
}

export function setAuthHandlers(handlers = {}){
  authHandlers = { ...authHandlers, ...handlers };
}

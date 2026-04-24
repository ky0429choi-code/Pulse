import { CONFIG } from "../config.js";

export function getStoredSession(){
  try {
    const raw = sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function getSessionToken(){
  const session = getStoredSession();
  return session?.sessionToken || "";
}

export function storeSession(data){
  const payload = {
    sessionToken: data.sessionToken,
    expiresAt: data.expiresAt,
    user: data.user || null
  };
  sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredSession(){
  sessionStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
}

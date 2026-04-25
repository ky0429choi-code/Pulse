import { CONFIG } from "../config.js";
export function cacheSet(key, value){
  const payload = { t: Date.now(), v: value };
  sessionStorage.setItem(key, JSON.stringify(payload));
}
export function cacheGet(key, ttlMs = CONFIG.CACHE_TTL_MS){
  const raw = sessionStorage.getItem(key);
  if(!raw) return null;
  try{
    const obj = JSON.parse(raw);
    if(!obj?.t) return null;
    if(Date.now() - obj.t > ttlMs) return null;
    return obj.v;
  }catch{ return null; }
}

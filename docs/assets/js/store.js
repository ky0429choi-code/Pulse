const state = {
  siteId: "",
  date: "",
  appConfig: null,
  user: null,
  expiresAt: "",
  isReady: false
};

const listeners = new Set();
export function getState(){ return state; }
export function setState(patch){
  Object.assign(state, patch);
  listeners.forEach(fn => fn(state));
}
export function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }

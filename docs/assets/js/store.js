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
  let changed = false;
  for (let k in patch) {
    if (state[k] !== patch[k]) changed = true;
  }
  Object.assign(state, patch);
  if (changed) {
    listeners.forEach(fn => fn(state));
  }
}
export function subscribe(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }

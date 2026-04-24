export function escapeHtml(value){
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function card(title, bodyHtml){
  return `<div class="card">
    <div class="card-hdr"><h2>${escapeHtml(title)}</h2></div>
    <div class="card-body">${bodyHtml}</div>
  </div>`;
}

export function kv(key, value){
  return `<div class="kv"><div class="k">${escapeHtml(key)}</div><div class="v">${escapeHtml(value)}</div></div>`;
}

export function badge(level){
  const cls = level === "err" ? "err" : level === "warn" ? "warn" : "ok";
  const label = level === "err" ? "Critical" : level === "warn" ? "Warn" : "OK";
  return `<span class="badge ${cls}">${label}</span>`;
}

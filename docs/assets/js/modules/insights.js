import { apiGet, apiPost } from "../services/api.js";
import { badge, card, escapeHtml } from "../components/ui.js";
import { toast } from "../components/toast.js";
import { getState, setState } from "../store.js";

export async function renderInsights({ siteId }){
  const root = document.getElementById("p-insights");
  root.innerHTML = card("\uC810\uAC80 \uB370\uC774\uD130 (\uC778\uC0AC\uC774\uD2B8)", "<div>\uB85C\uB529 \uC911...</div>");

  try{
    const res = await apiPost("getInsights", { siteId, period:"14d" });
    if(!res?.success) throw new Error(res?.message || "unknown");

    const run = res.data?.run || null;
    const items = res.data?.items || [];
    const metaHtml = run ? `
      <div class="small">runId: ${escapeHtml(run.runId)} / runAt: ${escapeHtml(run.runAt)} / scope: ${escapeHtml(run.scope)}</div>
      <div class="hr"></div>
    ` : "";
    const list = items.map((item)=>`
      <div class="card" style="margin-bottom:10px">
        <div class="card-hdr">
          <h2>${escapeHtml(item.title)}</h2>
          ${badge(item.level)}
        </div>
        <div class="card-body">
          <div class="small">${escapeHtml(item.code)}</div>
          <div style="margin-top:6px;line-height:1.6">${escapeHtml(item.message)}</div>
          <div style="margin-top:8px;color:var(--acc);font-weight:900">${escapeHtml(item.actionGuide || "")}</div>
        </div>
      </div>
    `).join("");

    root.innerHTML = card("\uC810\uAC80 \uB370\uC774\uD130 (\uC778\uC0AC\uC774\uD2B8)", `
      <button class="btn" id="runAuditBtn" style="width:100%">\uC810\uAC80 \uB370\uC774\uD130 \uC0C8\uB85C\uACE0\uCE68</button>
      <div class="small" style="margin-top:8px">\uC778\uAC00\uB41C \uC0AC\uC6A9\uC790\uB294 \uCD5C\uC2E0 \uC810\uAC80 \uACB0\uACFC\uB97C \uC2E4\uC2DC\uAC04\uC73C\uB85C \uBD88\uB7EC\uC62C \uC218 \uC788\uC2B5\uB2C8\uB2E4.</div>
      <div class="hr"></div>
      ${metaHtml}
      ${list || "<div class='small'>\uC810\uAC80 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>"}
    `);

    document.getElementById("runAuditBtn")?.addEventListener("click", async ()=>{
      try{
        const out = await apiPost("runAudit", { siteId, scope:"recent", period:"14d" });
        if(!out?.success) throw new Error(out?.message || "\uC810\uAC80 \uC2E4\uD589 \uC2E4\uD328");
        const state = getState();
        setState({ siteId: state.siteId, date: state.date });
      }catch(err){
        toast(String(err.message || err));
      }
    });
  }catch(err){
    root.innerHTML = card("\uC810\uAC80 \uB370\uC774\uD130 (\uC778\uC0AC\uC774\uD2B8)", `<div class="small">API \uC624\uB958: ${escapeHtml(String(err.message || err))}</div>`);
  }
}

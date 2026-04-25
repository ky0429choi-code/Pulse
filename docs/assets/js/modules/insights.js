import { apiGet, apiPost } from "../services/api.js";
import { badge, card, escapeHtml } from "../components/ui.js";
import { toast } from "../components/toast.js";
import { getState, setState } from "../store.js";

export async function renderInsights({ siteId }){
  const root = document.getElementById("p-insights");
  root.innerHTML = card("Insights", "<div>Loading...</div>");

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

    root.innerHTML = card("Insights", `
      <button class="btn" id="runAuditBtn" style="width:100%">Run Audit</button>
      <div class="small" style="margin-top:8px">Signed-in users can refresh audit results and inspect the latest findings.</div>
      <div class="hr"></div>
      ${metaHtml}
      ${list || "<div class='small'>No insight items.</div>"}
    `);

    document.getElementById("runAuditBtn")?.addEventListener("click", async ()=>{
      try{
        const out = await apiPost("runAudit", { siteId, scope:"recent", period:"14d" });
        if(!out?.success) throw new Error(out?.message || "runAudit failed");
        const state = getState();
        setState({ siteId: state.siteId, date: state.date });
      }catch(err){
        toast(String(err.message || err));
      }
    });
  }catch(err){
    root.innerHTML = card("Insights", `<div class="small">API error: ${escapeHtml(String(err.message || err))}</div>`);
  }
}

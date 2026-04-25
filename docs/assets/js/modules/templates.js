import { apiGet, apiPost } from "../services/api.js";
import { card, escapeHtml } from "../components/ui.js";
import { toast } from "../components/toast.js";

export async function renderTemplates({ siteId, date }){
  const root = document.getElementById("p-templates");
  root.innerHTML = card("Templates", "<div>Loading...</div>");

  try{
    const res = await apiPost("getTemplateActions", { siteId });
    if(!res?.success) throw new Error(res?.message || "unknown");

    const groups = res.data?.groups || [];
    root.innerHTML = groups.map((group)=>{
      const items = (group.items || []).map((item)=>`
        <button class="btn" data-tid="${escapeHtml(item.id)}" style="width:100%;margin:6px 0">${escapeHtml(item.label)}</button>
        <div class="small">${escapeHtml(item.description || "")}</div>
      `).join("");
      return card(group.groupName || group.groupId || "Templates", items || "<div class='small'>No template items.</div>");
    }).join("") || card("Templates", "<div class='small'>No templates available.</div>");

    root.querySelectorAll("button[data-tid]").forEach((btn)=>{
      btn.addEventListener("click", async ()=>{
        const templateId = btn.dataset.tid;
        try{
          const out = await apiPost("renderTemplate", { templateId, siteId, date });
          if(!out?.success) throw new Error(out?.message || "renderTemplate failed");
          try {
            await navigator.clipboard.writeText(out.data.content);
          } catch(e){
            const ta = document.createElement("textarea");
            ta.value = out.data.content;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
          toast("Template copied");
        }catch(err){
          toast(String(err.message || err));
        }
      });
    });
  }catch(err){
    root.innerHTML = card("Templates", `<div class="small">API error: ${escapeHtml(String(err.message || err))}</div>`);
  }
}

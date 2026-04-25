import { apiGet, apiPost } from "../services/api.js";
import { card, escapeHtml } from "../components/ui.js";
import { toast } from "../components/toast.js";

export async function renderTemplates({ siteId, date }){
  const root = document.getElementById("p-templates");
  root.innerHTML = card("\uC5C5\uBB34 \uD15C\uD50C\uB9BF", "<div>\uB85C\uB529 \uC911...</div>");

  try{
    const res = await apiPost("getTemplateActions", { siteId });
    if(!res?.success) throw new Error(res?.message || "unknown");

    const groups = res.data?.groups || [];
    root.innerHTML = groups.map((group)=>{
      const items = (group.items || []).map((item)=>`
        <button class="btn" data-tid="${escapeHtml(item.id)}" style="width:100%;margin:6px 0">${escapeHtml(item.label)}</button>
        <div class="small">${escapeHtml(item.description || "")}</div>
      `).join("");
      return card(group.groupName || group.groupId || "\uC5C5\uBB34 \uD15C\uD50C\uB9BF", items || "<div class='small'>\uD15C\uD50C\uB9BF \uD56D\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>");
    }).join("") || card("\uC5C5\uBB34 \uD15C\uD50C\uB9BF", "<div class='small'>\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uD15C\uD50C\uB9BF\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>");

    root.querySelectorAll("button[data-tid]").forEach((btn)=>{
      btn.addEventListener("click", async ()=>{
        const templateId = btn.dataset.tid;
        try{
          const out = await apiPost("renderTemplate", { templateId, siteId, date });
          if(!out?.success) throw new Error(out?.message || "\uD15C\uD50C\uB9BF \uB80C\uB354\uB9C1 \uC2E4\uD328");
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
          toast("\uD15C\uD50C\uB9BF\uC774 \uBCF5\uC0AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
        }catch(err){
          toast(String(err.message || err));
        }
      });
    });
  }catch(err){
    root.innerHTML = card("\uC5C5\uBB34 \uD15C\uD50C\uB9BF", `<div class="small">API \uC624\uB958: ${escapeHtml(String(err.message || err))}</div>`);
  }
}

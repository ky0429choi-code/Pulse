import { apiPost } from "../services/api.js";
import { card, kv, escapeHtml } from "../components/ui.js";
import { toast } from "../components/toast.js";

let refDraft = "";

export async function renderReference(state = {}){
  const { siteId, date } = state;
  const root = document.getElementById("p-ref");
  if (!root) return;
  
  const staticHtml = `
    ${card("\uC8FC\uB9D0 \uBC0F \uC57C\uAC04 \uC9C0\uC6D0\uAE08", `
      ${kv("\uC8FC\uB9D0\uC9C0\uC6D0\uAE08 (\uC911/\uC11D/\uC57C)", "\uAC01 3,500\uC6D0")}
      ${kv("\uBA74\uC5ED\uB825 \uC9C0\uC6D0 (\uC911/\uC57C)", "\uBCC4\uB3C4 1,000\uC6D0")}
      ${kv("\uC57C\uC2DD\uD3EC\uCC28 (\uC8FC\uB9D0\uC57C\uAC04 \uD3EC\uD568)", "2,400\uC6D0")}
    `)}
    <div style="margin-top: 16px;"></div>
    ${card("\uAC74\uAC15 \uBC0F \uD2B9\uC2DD \uC9C0\uC6D0\uAE08", `
      ${kv("\uAC74\uAC15\uC9C0\uC6D0\uAE08 (\uC8FC\uB9D0 \uC870/\uC11D, \uC57C)", "2,500\uC6D0")}
      ${kv("\uADF8\uB9B0\uB370\uC774 (21\uC77C \uC911\uC2DD T/I)", "4,000\uC6D0")}
      ${kv("\uADF8\uB9B0\uBBF8\uD2B8 (\uC6D4/\uC218/\uAE08 \uC911/\uC11D)", "2,000\uC6D0")}
    `)}
    <div class="small" style="margin-top:16px;">\u203B \uC704 \uAC00\uC774\uB4DC\uB294 \uC0AC\uC5C5\uC7A5 \uACE0\uC815 \uC6B4\uC601 \uC9C0\uCE68\uC73C\uB85C \uC801\uC6A9\uB429\uB2C8\uB2E4.</div>
  `;

  const dynamicHtml = card("\uC0AC\uC5C5\uC7A5 \uC790\uCCB4 \uC6B4\uC601 \uC9C0\uCE68 (\uCD94\uAC00)", `
    <textarea class="textarea" id="refContent" placeholder="\uC5EC\uAE30\uC5D0 \uC0C8\uB85C\uC6B4 \uC790\uCCB4 \uC9C0\uCE68\uC774\uB098 \uB808\uD37C\uB7F0\uC2A4\uB97C \uC790\uC720\uB86D\uAC8C \uCD94\uAC00\uD558\uC138\uC694...">${escapeHtml(refDraft)}</textarea>
    <button class="btn" id="refSaveBtn" style="width:100%;margin-top:8px">\uC9C0\uCE68 \uCD94\uAC00\uD558\uAE30</button>
    <div class="hr"></div>
    <div id="refList"></div>
  `);

  root.innerHTML = staticHtml + `<div style="margin-top: 16px;"></div>` + dynamicHtml;

  document.getElementById("refContent").addEventListener("input", (e)=>{ refDraft = e.target.value; });

  async function loadRefs(){
    if (!siteId) return;
    try{
       const res = await apiPost("getMemoList", { siteId, limit: 30 });
       const items = (res?.success ? (res.data?.items || []) : []).filter(x => x.category === "\uC9C0\uCE68");
       document.getElementById("refList").innerHTML = items.map(m => `
         <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">
           <div class="small">${escapeHtml(m.date)} \uCD94\uAC00\uB428 / \uC791\uC131\uC790: ${m.userId || 'system'}</div>
           <div style="margin-top:4px;line-height:1.6;font-weight:bold;">${escapeHtml(m.content)}</div>
         </div>
       `).join("") || `<div class="small">\uCD94\uAC00\uB41C \uC790\uCCB4 \uC9C0\uCE68\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>`;
    } catch(err) {
       document.getElementById("refList").innerHTML = `<div class="small">\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.</div>`;
    }
  }

  document.getElementById("refSaveBtn").addEventListener("click", async ()=>{
    const content = document.getElementById("refContent").value.trim();
    if(!content) return toast("\uB0B4\uC6A9\uC744 \uC785\uB825\uD558\uC138\uC694.");
    try {
      const btn = document.getElementById("refSaveBtn");
      btn.disabled = true;
      btn.textContent = "\uC800\uC7A5 \uC911...";
      const res = await apiPost("saveMemo", { siteId, date, category: "\uC9C0\uCE68", tags: [], content });
      if(!res?.success) throw new Error(res?.message || "\uC800\uC7A5 \uC2E4\uD328");
      document.getElementById("refContent").value = "";
      refDraft = "";
      await loadRefs();
      toast("\uC9C0\uCE68\uC774 \uCD94\uAC00\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    } catch(e) {
      toast("\uC624\uB958: " + String(e.message || e));
    } finally {
      const btn = document.getElementById("refSaveBtn");
      if(btn) {
        btn.disabled = false;
        btn.textContent = "\uC9C0\uCE68 \uCD94\uAC00\uD558\uAE30";
      }
    }
  });

  await loadRefs();
}

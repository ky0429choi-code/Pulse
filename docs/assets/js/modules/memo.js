import { apiGet, apiPost } from "../services/api.js";
import { card, escapeHtml } from "../components/ui.js";
import { toast } from "../components/toast.js";

let memoDraft = "";

export async function renderMemo({ siteId, date }){
  const root = document.getElementById("p-memo");

  root.innerHTML = card("\uC5C5\uBB34 \uBA54\uBAA8", `
    <div class="grid2">
      <input class="input" id="memoTags" placeholder="\uD0DC\uADF8 (\uC27C\uD45C\uB85C \uAD6C\uBD84)" />
      <select class="input" id="memoCategory">
        <option value="\uC6B4\uC601">\uC6B4\uC601</option>
        <option value="\uBA54\uB274">\uBA54\uB274</option>
        <option value="\uBCF4\uACE0">\uBCF4\uACE0</option>
      </select>
    </div>
    <textarea class="textarea" id="memoContent" placeholder="\uBA54\uBAA8 \uB0B4\uC6A9\uC744 \uC791\uC131\uD558\uC138\uC694...">${escapeHtml(memoDraft)}</textarea>
    <button class="btn" id="memoSaveBtn" style="width:100%;margin-top:8px">\uBA54\uBAA8 \uC800\uC7A5</button>
    <div class="small" style="margin-top:8px">\uC778\uAC00\uB41C \uC0AC\uC6A9\uC790\uB9CC \uBA54\uBAA8\uB97C \uC791\uC131\uD558\uACE0 \uC870\uD68C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</div>
    <div class="hr"></div>
    <div id="memoList"></div>
  `);

  document.getElementById("memoContent").addEventListener("input", (e)=>{ memoDraft = e.target.value; });

  async function loadList(){
    try{
      const listRes = await apiPost("getMemoList", { siteId, limit: 20 });
      const memos = listRes?.success ? (listRes.data?.items || []) : [];
      document.getElementById("memoList").innerHTML = memos.map((memo)=>`
        <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">
          <div class="small">${escapeHtml(memo.date)} / ${escapeHtml(memo.category)} / ${escapeHtml((memo.tags || []).join(","))}</div>
          <div style="margin-top:4px;line-height:1.6">${escapeHtml(memo.content)}</div>
        </div>
      `).join("") || `<div class="small">\uB4F1\uB85D\uB41C \uBA54\uBAA8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>`;
    }catch(err){
      document.getElementById("memoList").innerHTML = `<div class="small">API \uC624\uB958: ${escapeHtml(String(err.message || err))}</div>`;
    }
  }

  document.getElementById("memoSaveBtn").addEventListener("click", async ()=>{
    const tags = (document.getElementById("memoTags").value || "").split(",").map((x)=>x.trim()).filter(Boolean);
    const category = document.getElementById("memoCategory").value;
    const content = document.getElementById("memoContent").value.trim();
    if(!content) return toast("\uBA54\uBAA8 \uB0B4\uC6A9\uC744 \uC785\uB825\uD558\uC138\uC694.");

    try{
      const out = await apiPost("saveMemo", { siteId, date, category, tags, content });
      if(!out?.success) throw new Error(out?.message || "\uC800\uC7A5 \uC2E4\uD328");
      document.getElementById("memoContent").value = "";
      memoDraft = "";
      await loadList();
    }catch(err){
      toast(String(err.message || err));
    }
  });

  await loadList();
}

import { apiGet, apiPost } from "../services/api.js";
import { card, escapeHtml } from "../components/ui.js";
import { toast } from "../components/toast.js";

let memoDraft = "";

export async function renderMemo({ siteId, date }){
  const root = document.getElementById("p-memo");

  root.innerHTML = card("Memo", `
    <div class="grid2">
      <input class="input" id="memoTags" placeholder="tags, comma-separated" />
      <select class="input" id="memoCategory">
        <option value="ops">ops</option>
        <option value="menu">menu</option>
        <option value="report">report</option>
      </select>
    </div>
    </div>
    <textarea class="textarea" id="memoContent" placeholder="Write a memo...">${escapeHtml(memoDraft)}</textarea>
    <button class="btn" id="memoSaveBtn" style="width:100%;margin-top:8px">Save Memo</button>
    <div class="small" style="margin-top:8px">Memo save and read actions are available to signed-in users only.</div>
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
      `).join("") || `<div class="small">No memos yet.</div>`;
    }catch(err){
      document.getElementById("memoList").innerHTML = `<div class="small">API error: ${escapeHtml(String(err.message || err))}</div>`;
    }
  }

  document.getElementById("memoSaveBtn").addEventListener("click", async ()=>{
    const tags = (document.getElementById("memoTags").value || "").split(",").map((x)=>x.trim()).filter(Boolean);
    const category = document.getElementById("memoCategory").value;
    const content = document.getElementById("memoContent").value.trim();
    if(!content) return toast("Enter memo content.");

    try{
      const out = await apiPost("saveMemo", { siteId, date, category, tags, content });
      if(!out?.success) throw new Error(out?.message || "saveMemo failed");
      document.getElementById("memoContent").value = "";
      memoDraft = "";
      await loadList();
    }catch(err){
      toast(String(err.message || err));
    }
  });

  await loadList();
}

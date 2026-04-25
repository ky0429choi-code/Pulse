// docs/assets/js/modules/worklog.js
import { apiGet, apiPost } from "../services/api.js";
import { card, escapeHtml } from "../components/ui.js";
import { getState } from "../store.js";

const CATEGORIES = ["조리", "위생", "운영", "행정", "기타"];

export async function renderWorklog({ siteId, date }) {
  const root = document.getElementById("p-worklog");
  if (!root) return;

  root.innerHTML = _buildShell(date);
  _wireEvents(siteId, date);
  await _loadList(siteId, { date });
}

// ── 셸 HTML ─────────────────────────────────────────────────
function _buildShell(date) {
  const catOptions = CATEGORIES.map(c =>
    `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
  ).join("");

  return `
  <div class="card" id="worklog-input-card">
    <div class="card-hdr"><h2>업무 일지 입력</h2></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
      <div class="grid2">
        <select class="input" id="wl-category">${catOptions}</select>
        <input  class="input" id="wl-tags" placeholder="태그 (쉼표 구분)" />
      </div>
      <textarea class="textarea" id="wl-content" placeholder="업무 내용을 입력하세요..."></textarea>
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)">
        <input type="checkbox" id="wl-done" style="accent-color:var(--acc)" />
        수행 완료
      </label>
      <button class="btn" id="wl-save-btn" style="width:100%">저장</button>
      <div class="login-error" id="wl-error"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-hdr">
      <h2>기록 조회</h2>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input class="input" type="date" id="wl-filter-from" value="${escapeHtml(date)}" style="width:130px" />
        <span style="color:var(--muted);font-size:12px">~</span>
        <input class="input" type="date" id="wl-filter-to"   value="${escapeHtml(date)}" style="width:130px" />
        <select class="input" id="wl-filter-cat" style="width:90px">
          <option value="">전체</option>
          ${CATEGORIES.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}
        </select>
        <button class="btn btn-ghost" id="wl-search-btn">조회</button>
        <button class="btn btn-ghost" id="wl-print-btn">인쇄</button>
      </div>
    </div>
    <div class="card-body" id="wl-list">
      <div class="small">불러오는 중...</div>
    </div>
  </div>`;
}

// ── 이벤트 ──────────────────────────────────────────────────
function _wireEvents(siteId, date) {
  document.getElementById("wl-save-btn")
    ?.addEventListener("click", () => _handleSave(siteId, date));

  document.getElementById("wl-search-btn")
    ?.addEventListener("click", () => {
      const from = document.getElementById("wl-filter-from")?.value || "";
      const to   = document.getElementById("wl-filter-to")?.value   || "";
      const cat  = document.getElementById("wl-filter-cat")?.value  || "";
      _loadList(siteId, { dateFrom: from, dateTo: to, category: cat });
    });

  document.getElementById("wl-print-btn")
    ?.addEventListener("click", () => window.print());
}

// ── 저장 ────────────────────────────────────────────────────
async function _handleSave(siteId, date) {
  const btn      = document.getElementById("wl-save-btn");
  const errEl    = document.getElementById("wl-error");
  const content  = document.getElementById("wl-content")?.value.trim()  || "";
  const category = document.getElementById("wl-category")?.value        || "기타";
  const tags     = (document.getElementById("wl-tags")?.value || "")
                   .split(",").map(t => t.trim()).filter(Boolean);
  const isDone   = document.getElementById("wl-done")?.checked || false;

  errEl.textContent = "";
  errEl.classList.remove("show");

  if (!content) {
    errEl.textContent = "업무 내용을 입력해주세요.";
    errEl.classList.add("show");
    return;
  }

  btn.disabled = true;
  btn.textContent = "저장 중...";
  try {
    const res = await apiPost("saveWorklog", { siteId, date, category, content, tags, isDone });
    if (!res?.success) throw new Error(res?.message || "저장 실패");
    document.getElementById("wl-content").value = "";
    document.getElementById("wl-tags").value    = "";
    document.getElementById("wl-done").checked  = false;
    await _loadList(siteId, { date });
  } catch (err) {
    errEl.textContent = String(err.message || err);
    errEl.classList.add("show");
  } finally {
    btn.disabled = false;
    btn.textContent = "저장";
  }
}

// ── 목록 렌더 ────────────────────────────────────────────────
async function _loadList(siteId, opts = {}) {
  const listEl = document.getElementById("wl-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="small">불러오는 중...</div>`;
  try {
    const params = { siteId, ...opts };
    const res = await apiGet("getWorklogList", params);
    const items = res?.success ? (res.data?.items || []) : [];
    if (!items.length) {
      listEl.innerHTML = `<div class="small">등록된 업무 일지가 없습니다.</div>`;
      return;
    }
    listEl.innerHTML = items.map(item => _buildItem(item, siteId)).join("");
    listEl.querySelectorAll(".wl-done-toggle").forEach(btn => {
      btn.addEventListener("click", async () => {
        const logId  = btn.dataset.logid;
        const isDone = btn.dataset.done !== "true";
        await apiPost("updateWorklog", { logId, isDone });
        const currentFrom = document.getElementById("wl-filter-from")?.value || "";
        const currentTo   = document.getElementById("wl-filter-to")?.value   || "";
        const currentCat  = document.getElementById("wl-filter-cat")?.value  || "";
        await _loadList(siteId, { dateFrom: currentFrom, dateTo: currentTo, category: currentCat });
      });
    });
    listEl.querySelectorAll(".wl-delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("삭제하시겠습니까?")) return;
        await apiPost("deleteWorklog", { logId: btn.dataset.logid });
        btn.closest(".wl-item").remove();
      });
    });
  } catch (err) {
    listEl.innerHTML = `<div class="small">오류: ${escapeHtml(String(err.message || err))}</div>`;
  }
}

// ── 아이템 HTML ──────────────────────────────────────────────
function _buildItem(item, siteId) {
  const doneCls  = item.isDone ? "ok" : "warn";
  const doneText = item.isDone ? "완료" : "미완";
  const tagHtml  = item.tags.length
    ? item.tags.map(t => `<span style="font-size:10px;padding:2px 6px;border-radius:999px;background:rgba(255,255,255,.08);color:var(--muted)">${escapeHtml(t)}</span>`).join(" ")
    : "";
  return `
  <div class="wl-item" style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05)">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span class="badge ${doneCls}">${doneText}</span>
        <span style="font-size:11px;font-weight:900;color:var(--acc2)">${escapeHtml(item.category)}</span>
        <span style="font-size:11px;color:var(--muted)">${escapeHtml(item.date)}</span>
        ${tagHtml}
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost wl-done-toggle" style="height:28px;font-size:11px;padding:0 10px"
          data-logid="${escapeHtml(item.logId)}" data-done="${item.isDone}">
          ${item.isDone ? "미완으로" : "완료처리"}
        </button>
        <button class="btn btn-ghost wl-delete-btn" style="height:28px;font-size:11px;padding:0 10px;color:var(--err)"
          data-logid="${escapeHtml(item.logId)}">삭제</button>
      </div>
    </div>
    <div style="font-size:13px;line-height:1.7;white-space:pre-wrap">${escapeHtml(item.content)}</div>
  </div>`;
}

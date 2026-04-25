// docs/assets/js/modules/report.js
import { apiGet, apiPost } from "../services/api.js";
import { card, escapeHtml } from "../components/ui.js";
import { toast } from "../components/toast.js";

const CATEGORIES = ["일일", "주간", "월간"];

export async function renderReport({ siteId, date }) {
  const root = document.getElementById("p-report");
  if (!root) return;
  root.innerHTML = _buildShell(date);
  _wireEvents(siteId, date);
  await _loadList(siteId);
}

// ── 셸 HTML ─────────────────────────────────────────────────
function _buildShell(date) {
  const catOptions = CATEGORIES.map(c =>
    `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
  ).join("");

  return `
  <div class="card">
    <div class="card-hdr"><h2>보고서 작성</h2></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
      <div class="grid2">
        <div class="field">
          <span>보고서 종류</span>
          <select class="input" id="rpt-category">${catOptions}</select>
        </div>
        <div class="field">
          <span>기준일</span>
          <input class="input" type="date" id="rpt-date" value="${escapeHtml(date)}" />
        </div>
      </div>
      <div class="field">
        <span>주요 내용 <span style="color:var(--muted);font-weight:400">(항목은 줄바꿈 또는 / 로 구분)</span></span>
        <textarea class="textarea" id="rpt-main" placeholder="예) 피크 시간 좌석 혼잡 발생 / 특식(닭갈비) 반응 양호 / 식수 전일 대비 +12명"></textarea>
      </div>
      <div class="field">
        <span>특이사항 <span style="color:var(--muted);font-weight:400">(선택)</span></span>
        <textarea class="textarea" id="rpt-note" style="min-height:80px" placeholder="예) 식수 초과로 추가 배식 진행"></textarea>
      </div>
      <div class="field">
        <span>조치 및 향후 계획 <span style="color:var(--muted);font-weight:400">(선택)</span></span>
        <textarea class="textarea" id="rpt-plan" style="min-height:80px" placeholder="예) 다음 주 피크 시간대 추가 인력 편성 검토"></textarea>
      </div>
      <button class="btn" id="rpt-generate-btn" style="width:100%">보고서 생성</button>
      <div class="login-error" id="rpt-error"></div>
    </div>
  </div>

  <div class="card" id="rpt-preview-card" style="display:none">
    <div class="card-hdr">
      <h2>미리보기</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost" id="rpt-copy-btn" style="height:32px;font-size:11px">복사</button>
        <button class="btn btn-ghost" id="rpt-print-btn" style="height:32px;font-size:11px">인쇄</button>
        <button class="btn btn-ghost" id="rpt-finalize-btn" style="height:32px;font-size:11px;color:var(--ok)">확정</button>
      </div>
    </div>
    <div class="card-body">
      <pre id="rpt-preview-body" style="font-size:12px;line-height:1.8;white-space:pre-wrap;font-family:var(--font-mono, monospace);color:var(--tx)"></pre>
    </div>
  </div>

  <div class="card">
    <div class="card-hdr">
      <h2>저장된 보고서</h2>
      <button class="btn btn-ghost" id="rpt-refresh-btn" style="height:32px;font-size:11px">새로고침</button>
    </div>
    <div class="card-body" id="rpt-list">
      <div class="small">불러오는 중...</div>
    </div>
  </div>`;
}

// ── 이벤트 ──────────────────────────────────────────────────
function _wireEvents(siteId, date) {
  document.getElementById("rpt-generate-btn")
    ?.addEventListener("click", () => _handleGenerate(siteId));

  document.getElementById("rpt-refresh-btn")
    ?.addEventListener("click", () => _loadList(siteId));

  document.getElementById("rpt-print-btn")
    ?.addEventListener("click", () => window.print());

  document.getElementById("rpt-copy-btn")
    ?.addEventListener("click", async () => {
      const body = document.getElementById("rpt-preview-body")?.textContent || "";
      try {
        await navigator.clipboard.writeText(body);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = body;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast("복사 완료");
    });
}

// ── 보고서 생성 ──────────────────────────────────────────────
let _currentReportId = null;

async function _handleGenerate(siteId) {
  const btn      = document.getElementById("rpt-generate-btn");
  const errEl    = document.getElementById("rpt-error");
  const category = document.getElementById("rpt-category")?.value    || "일일";
  const date     = document.getElementById("rpt-date")?.value        || "";
  const main     = document.getElementById("rpt-main")?.value.trim() || "";
  const note     = document.getElementById("rpt-note")?.value.trim() || "";
  const plan     = document.getElementById("rpt-plan")?.value.trim() || "";

  errEl.textContent = "";
  errEl.classList.remove("show");

  if (!main) {
    errEl.textContent = "주요 내용을 입력해주세요.";
    errEl.classList.add("show");
    return;
  }

  btn.disabled = true;
  btn.textContent = "생성 중...";
  try {
    const res = await apiPost("generateReport", {
      siteId, date, category,
      mainContent: main,
      specialNote: note,
      actionPlan : plan
    });
    if (!res?.success) throw new Error(res?.message || "생성 실패");
    _currentReportId = res.data.reportId;
    document.getElementById("rpt-preview-body").textContent = res.data.body;
    document.getElementById("rpt-preview-card").style.display = "";

    // 확정 버튼
    document.getElementById("rpt-finalize-btn")?.removeEventListener("click", _noop);
    document.getElementById("rpt-finalize-btn")?.addEventListener("click", async () => {
      if (!_currentReportId) return;
      const out = await apiPost("finalizeReport", { reportId: _currentReportId });
      if (out?.success) { toast("보고서 확정됨"); await _loadList(siteId); }
    });

    await _loadList(siteId);
  } catch (err) {
    errEl.textContent = String(err.message || err);
    errEl.classList.add("show");
  } finally {
    btn.disabled = false;
    btn.textContent = "보고서 생성";
  }
}

// ── 목록 렌더 ────────────────────────────────────────────────
async function _loadList(siteId) {
  const listEl = document.getElementById("rpt-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="small">불러오는 중...</div>`;
  try {
    const res   = await apiGet("getReportList", { siteId });
    const items = res?.success ? (res.data?.items || []) : [];
    if (!items.length) {
      listEl.innerHTML = `<div class="small">저장된 보고서가 없습니다.</div>`;
      return;
    }
    listEl.innerHTML = items.map(item => `
      <div class="kv">
        <div class="k" style="flex-direction:column;align-items:flex-start;gap:2px">
          <span style="font-size:12px;font-weight:900">${escapeHtml(item.title)}</span>
          <span style="font-size:10px;color:var(--muted)">${escapeHtml(item.date)} · ${escapeHtml(item.category)}</span>
        </div>
        <span class="badge ${item.status === "final" ? "ok" : "warn"}">${item.status === "final" ? "확정" : "임시"}</span>
      </div>`
    ).join("");
  } catch (err) {
    listEl.innerHTML = `<div class="small">오류: ${escapeHtml(String(err.message || err))}</div>`;
  }
}

function _noop() {}

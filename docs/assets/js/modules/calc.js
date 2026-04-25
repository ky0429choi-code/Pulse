// docs/assets/js/modules/calc.js
import { apiGet, apiPost } from "../services/api.js";
import { card, escapeHtml } from "../components/ui.js";
import { toast } from "../components/toast.js";

export async function renderCalc({ siteId }) {
  const root = document.getElementById("p-calc");
  if (!root) return;
  root.innerHTML = _buildShell();
  _wireEvents(siteId);
  await _loadList(siteId);
}

// ── 셸 HTML ─────────────────────────────────────────────────
function _buildShell() {
  return `
  <div class="card">
    <div class="card-hdr"><h2>인당량 계산</h2></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:10px">

      <div class="grid2">
        <div class="field">
          <span>메뉴명 <span style="color:var(--muted);font-weight:400">(없으면 공란)</span></span>
          <input class="input" id="calc-menu" placeholder="예) 닭갈비 (선택)" />
        </div>
        <div class="field">
          <span>품목명 *</span>
          <input class="input" id="calc-item" placeholder="예) 닭다리살" />
        </div>
      </div>

      <div class="grid2">
        <div class="field">
          <span>인당량 (g) *</span>
          <input class="input" type="number" id="calc-portion" placeholder="예) 150" min="0" step="0.1" />
        </div>
        <div class="field">
          <span>기준점 (g) <span style="color:var(--muted);font-weight:400">(비교 기준, 없으면 공란)</span></span>
          <input class="input" type="number" id="calc-baseline" placeholder="예) 150" min="0" step="0.1" />
        </div>
      </div>

      <div class="grid2">
        <div class="field">
          <span>사용량 (kg) *</span>
          <input class="input" type="number" id="calc-usage" placeholder="예) 30" min="0" step="0.01" />
        </div>
        <div class="field">
          <span>식수 (명) *</span>
          <input class="input" type="number" id="calc-headcount" placeholder="예) 200" min="1" step="1" />
        </div>
      </div>

      <div class="card" id="calc-result-box" style="display:none;background:rgba(59,130,246,.06);border-color:rgba(96,165,250,.28)">
        <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:baseline;gap:10px">
            <span style="font-size:11px;color:var(--muted);font-weight:900;text-transform:uppercase;letter-spacing:.08em">산출량</span>
            <span id="calc-yield-val" style="font-size:32px;font-weight:900;letter-spacing:-.04em">-</span>
            <span style="font-size:13px;color:var(--muted)">g / 인</span>
          </div>
          <div id="calc-feedback" style="font-size:12px;line-height:1.7;color:var(--tx)"></div>
        </div>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" id="calc-preview-btn" style="flex:1">계산만</button>
        <button class="btn" id="calc-save-btn" style="flex:1">계산 + 저장</button>
      </div>
      <div class="login-error" id="calc-error"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-hdr">
      <h2>저장된 계산 이력</h2>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost" id="calc-print-btn" style="height:32px;font-size:11px">인쇄</button>
        <button class="btn btn-ghost" id="calc-refresh-btn" style="height:32px;font-size:11px">새로고침</button>
      </div>
    </div>
    <div class="card-body" id="calc-list">
      <div class="small">불러오는 중...</div>
    </div>
  </div>`;
}

// ── 이벤트 ──────────────────────────────────────────────────
function _wireEvents(siteId) {
  document.getElementById("calc-preview-btn")
    ?.addEventListener("click", () => _handleCalc(siteId, false));

  document.getElementById("calc-save-btn")
    ?.addEventListener("click", () => _handleCalc(siteId, true));

  document.getElementById("calc-refresh-btn")
    ?.addEventListener("click", () => _loadList(siteId));

  document.getElementById("calc-print-btn")
    ?.addEventListener("click", () => window.print());
}

// ── 계산 처리 ────────────────────────────────────────────────
async function _handleCalc(siteId, doSave) {
  const errEl     = document.getElementById("calc-error");
  const itemName  = document.getElementById("calc-item")?.value.trim()   || "";
  const menuName  = document.getElementById("calc-menu")?.value.trim()   || "";
  const portionG  = parseFloat(document.getElementById("calc-portion")?.value)   || 0;
  const usageKg   = parseFloat(document.getElementById("calc-usage")?.value)     || 0;
  const headcount = parseInt(document.getElementById("calc-headcount")?.value, 10)|| 0;
  const baselineG = parseFloat(document.getElementById("calc-baseline")?.value)  || 0;

  errEl.textContent = "";
  errEl.classList.remove("show");

  if (!itemName) { _showError("품목명을 입력해주세요."); return; }
  if (!portionG) { _showError("인당량을 입력해주세요."); return; }
  if (!usageKg)  { _showError("사용량을 입력해주세요."); return; }
  if (!headcount){ _showError("식수를 입력해주세요.");   return; }

  const payload = { siteId, menuName, itemName, portionG, usageKg, headcount, baselineG };

  try {
    let result;
    if (doSave) {
      const res = await apiPost("saveCalc", payload);
      if (!res?.success) throw new Error(res?.message || "저장 실패");
      result = res.data;
      toast("저장 완료");
      await _loadList(siteId);
    } else {
      const res = await apiPost("calculateOnly", payload);
      if (!res?.success) throw new Error(res?.message || "계산 실패");
      result = res.data;
    }
    _showResult(result.yieldG, result.feedback);
  } catch (err) {
    _showError(String(err.message || err));
  }
}

function _showResult(yieldG, feedback) {
  document.getElementById("calc-result-box").style.display = "";
  document.getElementById("calc-yield-val").textContent = yieldG + " g";
  document.getElementById("calc-feedback").textContent  = feedback;
}

function _showError(msg) {
  const el = document.getElementById("calc-error");
  el.textContent = msg;
  el.classList.add("show");
}

// ── 이력 목록 ────────────────────────────────────────────────
async function _loadList(siteId) {
  const listEl = document.getElementById("calc-list");
  if (!listEl) return;
  listEl.innerHTML = `<div class="small">불러오는 중...</div>`;
  try {
    const res   = await apiGet("getCalcList", { siteId });
    const items = res?.success ? (res.data?.items || []) : [];
    if (!items.length) {
      listEl.innerHTML = `<div class="small">저장된 계산 이력이 없습니다.</div>`;
      return;
    }
    listEl.innerHTML = `
      <div class="calc-print-header" style="display:none">
        <div style="font-size:13px;font-weight:900;margin-bottom:8px">인당량 계산 이력</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,.1)">
            <th style="text-align:left;padding:6px 4px;color:var(--muted);font-weight:900;font-size:10px">메뉴</th>
            <th style="text-align:left;padding:6px 4px;color:var(--muted);font-weight:900;font-size:10px">품목</th>
            <th style="text-align:right;padding:6px 4px;color:var(--muted);font-weight:900;font-size:10px">인당량</th>
            <th style="text-align:right;padding:6px 4px;color:var(--muted);font-weight:900;font-size:10px">사용량</th>
            <th style="text-align:right;padding:6px 4px;color:var(--muted);font-weight:900;font-size:10px">식수</th>
            <th style="text-align:right;padding:6px 4px;color:var(--muted);font-weight:900;font-size:10px">산출량</th>
            <th style="padding:6px 4px"></th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => _buildRow(item)).join("")}
        </tbody>
      </table>`;

    // 삭제 버튼
    listEl.querySelectorAll(".calc-delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("삭제하시겠습니까?")) return;
        const res = await apiPost("deleteCalc", { calcId: btn.dataset.calcid });
        if (res?.success) {
          btn.closest("tr").remove();
          toast("삭제 완료");
        }
      });
    });

    // 불러오기 버튼
    listEl.querySelectorAll(".calc-load-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const d = JSON.parse(btn.dataset.item || "{}");
        if (d.menuName)  document.getElementById("calc-menu").value      = d.menuName;
        if (d.itemName)  document.getElementById("calc-item").value      = d.itemName;
        if (d.portionG)  document.getElementById("calc-portion").value   = d.portionG;
        if (d.usageKg)   document.getElementById("calc-usage").value     = d.usageKg;
        if (d.headcount) document.getElementById("calc-headcount").value = d.headcount;
        if (d.baselineG) document.getElementById("calc-baseline").value  = d.baselineG;
        _showResult(d.yieldG, d.feedback);
        document.getElementById("calc-input-card")?.scrollIntoView({ behavior: "smooth" });
      });
    });

  } catch (err) {
    listEl.innerHTML = `<div class="small">오류: ${escapeHtml(String(err.message || err))}</div>`;
  }
}

function _buildRow(item) {
  // 출력 시 메뉴명 공란은 숨김 처리 (print CSS 에서 .no-print-empty 처리)
  const menuCell = item.menuName
    ? escapeHtml(item.menuName)
    : `<span class="no-print-empty" style="color:var(--muted)">-</span>`;

  const diffG    = item.baselineG
    ? Math.round((item.yieldG - item.baselineG) * 10) / 10
    : null;
  const diffHtml = diffG !== null
    ? `<span style="font-size:10px;color:${diffG >= 0 ? "var(--ok)" : "var(--err)"}"> (${diffG >= 0 ? "+" : ""}${diffG}g)</span>`
    : "";

  const safeItem = JSON.stringify({
    menuName: item.menuName, itemName: item.itemName,
    portionG: item.portionG, usageKg: item.usageKg,
    headcount: item.headcount, baselineG: item.baselineG,
    yieldG: item.yieldG, feedback: item.feedback
  }).replace(/"/g, "&quot;");

  return `
  <tr style="border-bottom:1px solid rgba(255,255,255,.05)">
    <td style="padding:8px 4px">${menuCell}</td>
    <td style="padding:8px 4px;font-weight:900">${escapeHtml(item.itemName)}</td>
    <td style="padding:8px 4px;text-align:right">${item.portionG}g</td>
    <td style="padding:8px 4px;text-align:right">${item.usageKg}kg</td>
    <td style="padding:8px 4px;text-align:right">${item.headcount}명</td>
    <td style="padding:8px 4px;text-align:right;font-weight:900">${item.yieldG}g${diffHtml}</td>
    <td style="padding:8px 4px;text-align:right">
      <button class="btn btn-ghost calc-load-btn" style="height:24px;font-size:10px;padding:0 8px;margin-right:4px"
        data-item="${safeItem}">불러오기</button>
      <button class="btn btn-ghost calc-delete-btn" style="height:24px;font-size:10px;padding:0 8px;color:var(--err)"
        data-calcid="${escapeHtml(item.calcId)}">삭제</button>
    </td>
  </tr>`;
}

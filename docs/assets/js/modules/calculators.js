import { apiPost } from '../services/api.js';
import { showToast } from '../components/ui.js';

export function renderCalculators() {
  const root = document.getElementById("p-calc");
  if (!root) return;

  root.innerHTML = `
  <div class="card">
    <div class="card-hdr"><h2>🧮 기본 운영 지표 계산기</h2></div>
    <div class="card-body">
      <div class="calc-grid">
        <!-- 회전율 -->
        <div class="calc-box">
          <h3>🔄 회전율</h3>
          <div class="ff"><label>중식 DI 식수</label><input type="number" id="c-di" placeholder="350"></div>
          <div class="ff"><label>중식 TO 식수</label><input type="number" id="c-to" placeholder="80"></div>
          <div class="ff"><label>좌석 수</label><input type="number" id="c-seat" placeholder="120"></div>
          <div class="calc-result" id="r-rotation"><span>값 입력 후 자동 계산</span></div>
        </div>

        <!-- 인시당 식수 -->
        <div class="calc-box">
          <h3>👤 인시당 식수</h3>
          <div class="ff"><label>총 식수 (DI+TO)</label><input type="number" id="c-total" placeholder="430"></div>
          <div class="ff"><label>투입 인원 (명)</label><input type="number" id="c-staff" placeholder="6"></div>
          <div class="calc-result" id="r-perstaff"><span>값 입력 후 자동 계산</span></div>
        </div>

        <!-- 재료비율 -->
        <div class="calc-box">
          <h3>💰 재료비율 (단순 계산용)</h3>
          <div class="ff"><label>총 매출 (원)</label><input type="number" id="c-sales" placeholder="2800000"></div>
          <div class="ff"><label>식재료비 (원)</label><input type="number" id="c-foodcost" placeholder="870000"></div>
          <div class="ff"><label>목표 재료비율 (%)</label><input type="number" id="c-target" placeholder="31"></div>
          <div class="calc-result" id="r-foodcost"><span>값 입력 후 자동 계산</span></div>
        </div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:20px;">
    <div class="card-hdr"><h2>⚖️ 산출량 및 제공식수 추적 계산기 (이력 동기화)</h2></div>
    <div class="card-body">
      <p style="color:var(--text-muted); margin-bottom:15px; font-size:0.9rem;">
        * 발주량은 1인 중량에 기반하여 발주되나, 실제 조리시에 발생하는 로스율(1차전처리 등)을 반영한 <strong>실 중량</strong>과 이에 기반한 정확한 <strong>제공 가능 식수</strong>를 산출하고 영구 기록합니다.
      </p>
      <div style="display:flex; gap:20px; flex-wrap:wrap; background:var(--bg-dark); padding:20px; border-radius:8px; border:1px solid #232b42;">
        <div style="flex:1; min-width:280px;">
          <div class="ff" style="margin-bottom:10px;"><label>품목명 (키워드)*</label><input type="text" id="c-item" placeholder="예: 돼지고기 뒷다리살"></div>
          <div class="ff" style="margin-bottom:10px;"><label>발주량 (단위: g)*</label><input type="number" id="c-orderQty" placeholder="10000"></div>
          <div class="ff" style="margin-bottom:10px;"><label>로스율 (전처리/가공 손실%)*</label><input type="number" id="c-loss" placeholder="15"></div>
          <div class="ff" style="margin-bottom:10px;"><label>목표 1인 제공량 (g)*</label><input type="number" id="c-targetp" placeholder="120"></div>
          <div class="ff"><label>계산 사유 / 특이사항</label><input type="text" id="c-reason" placeholder="단가 상승으로 인한 수율 재조정"></div>
        </div>
        <div style="flex:1; min-width:280px; display:flex; flex-direction:column; justify-content:center;">
          <div id="r-yield" style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:20px; text-align:center;">
             <div style="color:var(--text-muted); font-size:0.95rem;">값을 입력하고 버튼을 누르세요.</div>
          </div>
          <button id="btn-calc-save" class="btn btn-primary" style="margin-top:15px; font-size:1.05rem; padding:12px;">🧮 산출 및 서버에 이력 저장</button>
        </div>
      </div>
      
      <div style="margin-top:30px; border-top:1px dashed var(--border); padding-top:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
           <h3 style="margin:0;">🔎 품목 계산 이력 검색</h3>
           <div style="display:flex; gap:10px;">
             <input type="text" id="c-search" placeholder="품목명 자동 검색..." style="width:250px;">
           </div>
        </div>
        <div id="calc-history-list" style="max-height:350px; overflow-y:auto; border:1px solid var(--border); border-radius:6px; background:var(--bg);">
          <div style="padding:20px; text-align:center; color:var(--text-muted)">검색어를 입력하면 DB에서 이력을 불러옵니다.</div>
        </div>
      </div>
    </div>
  </div>`;

  function n(id) { return parseFloat(document.getElementById(id)?.value) || 0; }
  function v(id) { return document.getElementById(id)?.value || ""; }
  function setR(id, html) { document.getElementById(id).innerHTML = html; }

  // Simple Calculators (Real-time)
  function calcRotation() {
    const di = n('c-di'), to = n('c-to'), seat = n('c-seat');
    if(!seat) return;
    const re = (di / seat).toFixed(2);
    const col = re >= 3.5 ? 'var(--err)' : re >= 2.5 ? 'var(--warn)' : 'var(--ok)';
    setR('r-rotation', `회전율 <b style="color:${col}">${re}</b>회`);
  }
  function calcPerStaff() {
    const tot = n('c-total'), staff = n('c-staff');
    if(!staff) return;
    const ps = (tot / staff).toFixed(1);
    setR('r-perstaff', `인시당 <b>${ps}</b> 식`);
  }
  function calcFoodCost() {
    const sales = n('c-sales'), fc = n('c-foodcost'), target = n('c-target');
    if(!sales) return;
    const rate = (fc / sales * 100).toFixed(1);
    setR('r-foodcost', `재료비율 <b>${rate}%</b> (단순참고장부)`);
  }

  ["c-di","c-to","c-seat"].forEach(id=>document.getElementById(id).oninput=calcRotation);
  ["c-total","c-staff"].forEach(id=>document.getElementById(id).oninput=calcPerStaff);
  ["c-sales","c-foodcost","c-target"].forEach(id=>document.getElementById(id).oninput=calcFoodCost);

  // Advanced Yield Calculator (Server-synced)
  document.getElementById("btn-calc-save").onclick = async () => {
    const btn = document.getElementById("btn-calc-save");
    const itemName = v('c-item'), orderQty = n('c-orderQty'), lossRate = n('c-loss');
    const targetP = n('c-targetp'), reason = v('c-reason');

    if(!itemName || !orderQty || !targetP) return showToast("품목명, 발주량, 1인목표량은 필수입니다.", true);

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> 처리중...`;

    try {
      const res = await apiPost("calculateYield", { itemName, orderQty, lossRate, targetPerCapita: targetP, reason });
      if(!res.ok) throw new Error(res.message);

      setR('r-yield', `
        <div style="font-size:0.9rem; color:var(--text-muted); margin-bottom:10px;">[ ${itemName} ] 산출 결과</div>
        <div style="display:flex; justify-content:space-around;">
          <div><div style="font-size:0.8rem; color:var(--acc);">실 중량 반입분</div><div style="font-size:1.5rem; font-weight:700; color:#fff;">${res.data.actualWeight} <small style="font-size:0.9rem;">g</small></div></div>
          <div style="width:1px; background:var(--border);"></div>
          <div><div style="font-size:0.8rem; color:var(--acc);">실제 식수 제공가능량</div><div style="font-size:1.5rem; font-weight:700; color:var(--ok);">${res.data.servings} <small style="font-size:0.9rem;">명</small></div></div>
        </div>
      `);
      showToast(res.message);
      doSearch(itemName); // instant search refresh
    } catch(err) {
      showToast(err.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `🧮 산출 및 서버에 이력 저장`;
    }
  };

  // Search History
  let searchTimer;
  document.getElementById("c-search").oninput = (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(e.target.value), 400);
  };

  async function doSearch(query) {
    if(!query) {
       setR("calc-history-list", `<div style="padding:20px; text-align:center; color:var(--text-muted)">검색어를 입력하면 DB에서 이력을 불러옵니다.</div>`);
       return;
    }
    const tgt = document.getElementById("calc-history-list");
    tgt.innerHTML = `<div style="padding:20px; text-align:center; color:var(--acc)">검색 중...</div>`;
    
    try {
      const res = await apiPost("searchCalcHistory", { query });
      if(!res.ok) throw new Error(res.message);
      
      if(!res.data || res.data.length === 0) {
        tgt.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted)">'${query}'에 대한 계산 이력이 없습니다.</div>`;
        return;
      }

      tgt.innerHTML = res.data.map(h => `
        <div style="padding:15px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
           <div>
              <div style="font-weight:600; color:#fff; display:flex; align-items:center; gap:8px;">
                 ${h.itemName}
                 <span class="badge" style="background:#2c3a58;">${h.date.split('T')[0] || h.date}</span>
              </div>
              <div style="font-size:0.85rem; color:var(--text-muted); margin-top:5px;">
                사유: <b>${h.reason || '없음'}</b> | 작성: ${h.userId}
              </div>
           </div>
           <div style="text-align:right; font-size:0.85rem;">
              <div>발주: ${h.orderQty}g (로스 ${h.lossRate}%)</div>
              <div style="color:var(--ok); font-weight:600; margin-top:3px;">제공: ${h.servings}명 (${h.actualWeight}g 실반입)</div>
           </div>
        </div>
      `).join('');
    } catch(err) {
      tgt.innerHTML = `<div style="padding:20px; text-align:center; color:var(--err)">오류: ${err.message}</div>`;
    }
  }
}

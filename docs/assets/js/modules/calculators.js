export function renderCalculators() {
  const root = document.getElementById("p-calc");
  if (!root) return;

  root.innerHTML = `
  <div class="card">
    <div class="card-hdr"><h2>🧮 빠른 계산기</h2></div>
    <div class="card-body">
      <div class="calc-grid">

        <!-- 회전율 -->
        <div class="calc-box">
          <h3>🔄 회전율</h3>
          <div class="ff"><label>중식 DI 식수</label><input type="number" id="c-di" placeholder="350"></div>
          <div class="ff"><label>중식 TO 식수</label><input type="number" id="c-to" placeholder="80"></div>
          <div class="ff"><label>좌석 수</label><input type="number" id="c-seat" placeholder="120"></div>
          <div class="ff"><label>TO 코너 수</label><input type="number" id="c-tocorner" placeholder="2"></div>
          <div class="calc-result" id="r-rotation"><span>값 입력 후 자동 계산</span></div>
        </div>

        <!-- 인시당 식수 -->
        <div class="calc-box">
          <h3>👤 인시당 식수</h3>
          <div class="ff"><label>끼니</label>
            <select id="c-meal">
              <option>조식</option><option selected>중식</option><option>석식</option><option>야식</option>
            </select>
          </div>
          <div class="ff"><label>총 식수 (DI+TO)</label><input type="number" id="c-total" placeholder="430"></div>
          <div class="ff"><label>투입 인원</label><input type="number" id="c-staff" placeholder="6"></div>
          <div class="calc-result" id="r-perstaff"><span>값 입력 후 자동 계산</span></div>
        </div>

        <!-- 발주량 계산 -->
        <div class="calc-box">
          <h3>📦 발주량 (1인분 기준)</h3>
          <div class="ff"><label>예상 식수</label><input type="number" id="c-headcount" placeholder="350"></div>
          <div class="ff"><label>1인 중량 (g)</label><input type="number" id="c-gram" placeholder="150"></div>
          <div class="ff"><label>손질 수율 (%)</label><input type="number" id="c-yield" placeholder="85"></div>
          <div class="calc-result" id="r-order"><span>값 입력 후 자동 계산</span></div>
        </div>

        <!-- 재료비율 -->
        <div class="calc-box">
          <h3>💰 재료비율</h3>
          <div class="ff"><label>총 매출 (원)</label><input type="number" id="c-sales" placeholder="2800000"></div>
          <div class="ff"><label>식재료비 (원)</label><input type="number" id="c-foodcost" placeholder="870000"></div>
          <div class="ff"><label>목표 재료비율 (%)</label><input type="number" id="c-target" placeholder="31"></div>
          <div class="calc-result" id="r-foodcost"><span>값 입력 후 자동 계산</span></div>
        </div>

      </div>
    </div>
  </div>`;

  function n(id) { return parseFloat(document.getElementById(id)?.value) || 0; }
  function setR(id, html) { document.getElementById(id).innerHTML = html; }

  function calcRotation() {
    const di = n('c-di'), to = n('c-to'), seat = n('c-seat'), toc = n('c-tocorner') || 1;
    if(!seat) return;
    const re = (di / seat).toFixed(2);
    const ri = ((di + to / toc) / seat).toFixed(2);
    const col = ri >= 3.5 ? 'var(--err)' : ri >= 2.5 ? 'var(--warn)' : 'var(--ok)';
    const badge = ri >= 3.5 ? '🔴 과부하' : ri >= 2.5 ? '🟡 주의' : '🟢 양호';
    setR('r-rotation', `DI전용 <b style="color:${col}">${re}</b>회 &nbsp;|&nbsp; T/O포함 <b style="color:${col}">${ri}</b>회 &nbsp;<span style="color:${col}">${badge}</span>`);
  }

  function calcPerStaff() {
    const tot = n('c-total'), staff = n('c-staff');
    if(!staff) return;
    const ps = (tot / staff).toFixed(1);
    const col = ps >= 95 ? 'var(--err)' : ps >= 80 ? 'var(--warn)' : 'var(--ok)';
    const badge = ps >= 95 ? '🔴 과부하' : ps >= 80 ? '🟡 주의' : '🟢 양호';
    setR('r-perstaff', `인시당 <b style="color:${col}">${ps}식/인</b> &nbsp;<span style="color:${col}">${badge}</span>`);
  }

  function calcOrder() {
    const hc = n('c-headcount'), g = n('c-gram'), y = n('c-yield') || 100;
    if(!hc || !g) return;
    const raw = hc * g / (y / 100);
    const kg  = (raw / 1000).toFixed(2);
    setR('r-order', `필요량 <b>${Math.ceil(raw).toLocaleString()}g</b> <span>(${kg}kg)</span><br><span>수율 ${y}% 적용 · 1인 ${g}g 기준</span>`);
  }

  function calcFoodCost() {
    const sales = n('c-sales'), fc = n('c-foodcost'), target = n('c-target');
    if(!sales) return;
    const rate = (fc / sales * 100).toFixed(1);
    const diff = target ? (parseFloat(rate) - target).toFixed(1) : null;
    const col  = diff === null ? 'var(--acc)' : diff > 0 ? 'var(--err)' : 'var(--ok)';
    const note = diff === null ? '' : ` &nbsp;<span style="color:${col}">${diff > 0 ? '▲' : '▼'}${Math.abs(diff)}%p (목표 ${target}%)</span>`;
    setR('r-foodcost', `재료비율 <b style="color:${col}">${rate}%</b>${note}`);
  }

  ["c-di","c-to","c-seat","c-tocorner"].forEach(id=>document.getElementById(id).oninput=calcRotation);
  ["c-total","c-staff","c-meal"].forEach(id=>document.getElementById(id).oninput=calcPerStaff);
  ["c-headcount","c-gram","c-yield"].forEach(id=>document.getElementById(id).oninput=calcOrder);
  ["c-sales","c-foodcost","c-target"].forEach(id=>document.getElementById(id).oninput=calcFoodCost);
}

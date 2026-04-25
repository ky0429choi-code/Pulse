import { apiPost } from "../services/api.js";
import { cacheGet, cacheSet } from "../services/cache.js";
import { badge, card, kv, escapeHtml } from "../components/ui.js";

export async function renderDashboard({ siteId, date }){
  const root = document.getElementById("p-dashboard");
  root.innerHTML = card("\uB300\uC2DC\uBCF4\uB4DC", "<div>\uB85C\uB529 \uC911...</div>");

  const cacheKey = `dash:${siteId}:${date}`;
  try{
    const res = await apiPost("getDashboardSummary", { siteId, date });
    if(!res?.success) throw new Error(res?.message || "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958");
    cacheSet(cacheKey, res);
    root.innerHTML = buildDashboard(res.data);
  }catch(err){
    const cached = cacheGet(cacheKey, 24 * 60 * 60 * 1000);
    if(cached?.success){
      root.innerHTML = buildDashboard(cached.data, true);
      return;
    }
    root.innerHTML = card("\uB300\uC2DC\uBCF4\uB4DC", `<div class="small">API \uC624\uB958: ${escapeHtml(String(err.message || err))}</div>`);
  }
}

function fmt(value, suffix = ""){
  if(value === null || value === undefined || value === "") return "-";
  if(typeof value === "number") return `${value.toLocaleString()}${suffix}`;
  return escapeHtml(`${value}${suffix}`);
}

function buildDashboard(data, isCached = false){
  const lunch = data.headcount?.lunch || { di:0, to:0 };
  const total = (lunch.di || 0) + (lunch.to || 0);
  const cachedText = isCached ? `<div class="small">\uC2E4\uC2DC\uAC04 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD574 \uCEA1\uC2DC\uB41C \uB370\uC774\uD130\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.</div>` : "";
  const siteName = escapeHtml(data.siteName || "-");
  const safeSiteId = escapeHtml(data.siteId || "-");
  const safeDate = escapeHtml(data.date || "-");
  const hero = `
    <div class="hero-card">
      <div>
        <div class="eyebrow">\uC6B4\uC601 \uC694\uC57D</div>
        <div class="hero-title">${siteName} <span class="hero-sub">${safeSiteId}</span></div>
        <div class="hero-meta">${safeDate} / \uC911\uC2DD \uC6B4\uC601 \uC9C0\uD45C \uD604\uD669</div>
        ${cachedText ? `<div style="margin-top:12px">${cachedText}</div>` : ""}
      </div>
      <div class="hero-number-wrap">
        <div class="hero-number-label">\uC911\uC2DD \uCD1D \uC2DD\uC218</div>
        <div class="hero-number">${fmt(total)}</div>
        <div class="hero-number-foot">${fmt(lunch.di)} DI / ${fmt(lunch.to)} TO</div>
      </div>
    </div>
  `;

  const top = `
    <div class="metric-grid">
      <div class="metric-tile accent">
        <div class="metric-label">\uC911\uC2DD DI</div>
        <div class="metric-value">${fmt(lunch.di, " \uC2DD")}</div>
      </div>
      <div class="metric-tile accent2">
        <div class="metric-label">\uC911\uC2DD TO</div>
        <div class="metric-value">${fmt(lunch.to, " \uC2DD")}</div>
      </div>
      <div class="metric-tile ok">
        <div class="metric-label">\uC88C\uC11D \uC218</div>
        <div class="metric-value">${fmt(data.ops?.seatCount)}</div>
      </div>
      <div class="metric-tile warn">
        <div class="metric-label">\uC911\uC2DD \uD22C\uC785\uC778\uC6D0</div>
        <div class="metric-value">${fmt(data.ops?.staffCountLunch)}</div>
      </div>
    </div>
  `;

  const kpi = `
    <div class="stat-rack">
      <div class="stat-line">
        <div>
          <div class="stat-label">\uD68C\uC804\uC728 (DI \uC804\uC6A9)</div>
          <div class="stat-value">${fmt(data.kpi?.rotationDi)}</div>
        </div>
      </div>
      <div class="stat-line">
        <div>
          <div class="stat-label">\uD68C\uC804\uC728 (DI+TO \uD3EC\uD568)</div>
          <div class="stat-value">${fmt(data.kpi?.rotationWithTo)}</div>
        </div>
        ${badge(data.status?.rotationLevel || "ok")}
      </div>
      <div class="stat-line">
        <div>
          <div class="stat-label">\uC778\uC2DC\uB2F9 \uC2DD\uC218</div>
          <div class="stat-value">${fmt(data.kpi?.mealPerStaff)}</div>
        </div>
        ${badge(data.status?.staffLoadLevel || "ok")}
      </div>
    </div>
  `;

  const compare = `
    <div class="compare-grid">
      <div class="compare-box">
        <div class="compare-label">\uC804\uC77C \uB300\uBE44</div>
        <div class="compare-value">${fmt(data.compare?.vsPrevDay)}</div>
      </div>
      <div class="compare-box">
        <div class="compare-label">\uC804\uC8FC \uD3C9\uADE0 \uB300\uBE44</div>
        <div class="compare-value">${fmt(data.compare?.vsPrevWeekAvg)}</div>
      </div>
      <div class="compare-box">
        <div class="compare-label">\uC6D4 \uD3C9\uADE0 \uB300\uBE44</div>
        <div class="compare-value">${fmt(data.compare?.vsMonthAvg)}</div>
      </div>
    </div>
  `;

  const reference = [
    kv("\uC804\uC8FC \uD3C9\uADE0", fmt(data.compare?.prevWeekAvg)),
    kv("\uC6D4 \uD3C9\uADE0", fmt(data.compare?.monthAvg)),
    kv("TO \uCF54\uB108 \uC218", fmt(data.ops?.toCornerCount))
  ].join("");

  return [
    hero,
    card("\uAE08\uC77C \uC694\uC57D", cachedText + top),
    card("\uD575\uC2EC \uC9C0\uD45C (KPI)", kpi),
    card("\uC2E4\uC801 \uBE44\uAD50", compare + `<div class="hr"></div>` + reference)
  ].join("");
}

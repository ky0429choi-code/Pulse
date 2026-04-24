import { apiGet } from "../services/api.js";
import { cacheGet, cacheSet } from "../services/cache.js";
import { badge, card, kv, escapeHtml } from "../components/ui.js";

export async function renderDashboard({ siteId, date }){
  const root = document.getElementById("p-dashboard");
  root.innerHTML = card("Dashboard", "<div>Loading...</div>");

  const cacheKey = `dash:${siteId}:${date}`;
  try{
    const res = await apiGet("getDashboardSummary", { siteId, date });
    if(!res?.success) throw new Error(res?.message || "unknown");
    cacheSet(cacheKey, res);
    root.innerHTML = buildDashboard(res.data);
  }catch(err){
    const cached = cacheGet(cacheKey, 24 * 60 * 60 * 1000);
    if(cached?.success){
      root.innerHTML = buildDashboard(cached.data, true);
      return;
    }
    root.innerHTML = card("Dashboard", `<div class="small">API error: ${escapeHtml(String(err.message || err))}</div>`);
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
  const cachedText = isCached ? `<div class="small">Showing cached data because the live request failed.</div>` : "";
  const siteName = escapeHtml(data.siteName || "-");
  const safeSiteId = escapeHtml(data.siteId || "-");
  const safeDate = escapeHtml(data.date || "-");
  const hero = `
    <div class="hero-card">
      <div>
        <div class="eyebrow">Protected Summary</div>
        <div class="hero-title">${siteName} <span class="hero-sub">${safeSiteId}</span></div>
        <div class="hero-meta">${safeDate} / lunch focused operational snapshot</div>
        ${cachedText ? `<div style="margin-top:12px">${cachedText}</div>` : ""}
      </div>
      <div class="hero-number-wrap">
        <div class="hero-number-label">Lunch Total</div>
        <div class="hero-number">${fmt(total)}</div>
        <div class="hero-number-foot">${fmt(lunch.di)} DI / ${fmt(lunch.to)} TO</div>
      </div>
    </div>
  `;

  const top = `
    <div class="metric-grid">
      <div class="metric-tile accent">
        <div class="metric-label">Lunch DI</div>
        <div class="metric-value">${fmt(lunch.di, " meals")}</div>
      </div>
      <div class="metric-tile accent2">
        <div class="metric-label">Lunch TO</div>
        <div class="metric-value">${fmt(lunch.to, " meals")}</div>
      </div>
      <div class="metric-tile ok">
        <div class="metric-label">Seat Count</div>
        <div class="metric-value">${fmt(data.ops?.seatCount)}</div>
      </div>
      <div class="metric-tile warn">
        <div class="metric-label">Lunch Staff</div>
        <div class="metric-value">${fmt(data.ops?.staffCountLunch)}</div>
      </div>
    </div>
  `;

  const kpi = `
    <div class="stat-rack">
      <div class="stat-line">
        <div>
          <div class="stat-label">Rotation (DI)</div>
          <div class="stat-value">${fmt(data.kpi?.rotationDi)}</div>
        </div>
      </div>
      <div class="stat-line">
        <div>
          <div class="stat-label">Rotation (DI+TO)</div>
          <div class="stat-value">${fmt(data.kpi?.rotationWithTo)}</div>
        </div>
        ${badge(data.status?.rotationLevel || "ok")}
      </div>
      <div class="stat-line">
        <div>
          <div class="stat-label">Meals per Staff</div>
          <div class="stat-value">${fmt(data.kpi?.mealPerStaff)}</div>
        </div>
        ${badge(data.status?.staffLoadLevel || "ok")}
      </div>
    </div>
  `;

  const compare = `
    <div class="compare-grid">
      <div class="compare-box">
        <div class="compare-label">Vs Prev Day</div>
        <div class="compare-value">${fmt(data.compare?.vsPrevDay)}</div>
      </div>
      <div class="compare-box">
        <div class="compare-label">Vs Prev Week Avg</div>
        <div class="compare-value">${fmt(data.compare?.vsPrevWeekAvg)}</div>
      </div>
      <div class="compare-box">
        <div class="compare-label">Vs Month Avg</div>
        <div class="compare-value">${fmt(data.compare?.vsMonthAvg)}</div>
      </div>
    </div>
  `;

  const reference = [
    kv("Prev Week Avg", fmt(data.compare?.prevWeekAvg)),
    kv("Month Avg", fmt(data.compare?.monthAvg)),
    kv("TO Corner Count", fmt(data.ops?.toCornerCount))
  ].join("");

  return [
    hero,
    card("Today Summary", cachedText + top),
    card("KPI", kpi),
    card("Compare", compare + `<div class="hr"></div>` + reference)
  ].join("");
}

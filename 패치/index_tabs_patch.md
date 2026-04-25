# index.html 수정 가이드

## 1. 탭 버튼 교체

기존 탭 버튼 블록을 아래로 교체하세요:

```html
<nav class="tab-row" id="tabs">
  <button class="tab on" data-tab="worklog">업무 일지</button>
  <button class="tab"    data-tab="report">보고서</button>
  <button class="tab"    data-tab="insights">점검 결과</button>
  <button class="tab"    data-tab="calc">인당량 계산</button>
  <button class="tab"    data-tab="ref">기준표</button>
</nav>
```

## 2. 패널 교체

```html
<main>
  <section class="panel on" id="p-worklog"></section>
  <section class="panel"    id="p-report"></section>
  <section class="panel"    id="p-insights"></section>
  <section class="panel"    id="p-calc"></section>
  <section class="panel"    id="p-ref"></section>
</main>
```

## 3. print.css 추가 (head 안에)

```html
<link rel="stylesheet" href="./assets/css/print.css" />
```

## 4. 인쇄용 헤더 추가 (body 맨 위, login-overlay 위에)

```html
<div class="print-header" id="printHeader">
  <div class="site-name" id="printSiteName"></div>
  <div class="print-meta" id="printMeta"></div>
</div>
```

---

# app.js 수정 가이드

## 1. import 교체

```js
// 제거
import { renderDashboard }   from "./modules/dashboard.js";
import { renderTemplates }   from "./modules/templates.js";
import { renderMemo }        from "./modules/memo.js";
import { renderCalculators } from "./modules/calculators.js";

// 추가
import { renderWorklog } from "./modules/worklog.js";
import { renderReport }  from "./modules/report.js";
import { renderCalc }    from "./modules/calc.js";
```

## 2. boot() 안 초기 렌더 교체

```js
// 제거
renderCalculators();
renderReference();

// 추가
renderReference();
```

## 3. refreshAll() 교체

```js
async function refreshAll(state = getState(), token = ++refreshToken) {
  const { siteId, date } = state;

  await renderWorklog({ siteId, date });
  if (token !== refreshToken) return;

  await renderReport({ siteId, date });
  if (token !== refreshToken) return;

  await renderInsights({ siteId });
  if (token !== refreshToken) return;

  await renderCalc({ siteId });
}
```

## 4. 인쇄 헤더 자동 주입 (applyUserUi_ 안에 추가)

```js
function applyUserUi_(user, expiresAt) {
  // ... 기존 코드 ...

  // 인쇄 헤더 갱신
  const state = getState();
  const printSite = document.getElementById("printSiteName");
  const printMeta = document.getElementById("printMeta");
  if (printSite) printSite.textContent = state.siteId || "";
  if (printMeta) printMeta.textContent =
    (user.displayName || user.userId || "") + " · " +
    new Date().toLocaleDateString("ko-KR");
}
```

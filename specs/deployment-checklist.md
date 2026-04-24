# Deployment Checklist

## Apps Script

- [ ] Upload every file in `gas/` to the Apps Script project.
- [ ] Confirm `gas/appsscript.json` uses `Asia/Seoul` and V8.
- [ ] Set Script Properties:
  - [ ] `SPREADSHEET_ID`
  - [ ] `APP_TIMEZONE` such as `Asia/Seoul`
  - [ ] `ADMIN_API_KEY`
  - [ ] Optional `SESSION_TTL_MINUTES`
- [ ] Deploy as a Web App and copy the latest `exec` URL.

## Initial Data

- [ ] Create or seed at least one enabled admin user in the `권한관리` sheet.
- [ ] Sign in from the frontend.
- [ ] Run `setupAll` with a valid session and `adminKey`.
- [ ] Run `setupTriggers` only when scheduled jobs are wanted.

## Frontend

- [ ] Put the Web App `exec` URL into `docs/assets/js/config.js`.
- [ ] Keep `API_KEY` empty unless an older deployment still needs it.
- [ ] Publish `docs/` with GitHub Pages.
- [ ] Confirm login, logout, and session restore.
- [ ] Confirm Dashboard, Templates, Insights, Memo, Calc, and Reference tabs render.

## API Smoke Checks

- [ ] `GET health` returns `success: true`.
- [ ] `POST login` returns a session token for a valid user.
- [ ] `GET getSession` succeeds with `st`.
- [ ] `GET getDashboardSummary` succeeds with `st`, `siteId`, and `date`.
- [ ] `POST saveMemo` succeeds with `st`, `siteId`, `date`, `category`, and `content`.
- [ ] `POST runAudit` succeeds with `st`.
- [ ] Admin actions fail without `adminKey`.
- [ ] Admin actions fail for non-admin sessions.

## Safety Checks

- [ ] No real production keys are committed.
- [ ] No production user password is committed in docs or fixtures.
- [ ] Dynamic Spreadsheet text is escaped before `innerHTML` rendering.
- [ ] `shared/api-contract.md` matches `gas/Router.gs`.

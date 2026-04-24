# Pulse v1.2

Pulse is a zero-cost operations dashboard built with:

- `docs/`: GitHub Pages frontend
- `gas/`: Google Apps Script backend
- `specs/`: architecture, API, and deployment notes

Visual structure map:

- `docs/structure-map.html`

## Current security model

- Public actions: `health`, `login`
- Session actions: `logout`, `getSession`, `getAppConfig`, `getDashboardSummary`, `getTemplateActions`, `renderTemplate`, `getMemoList`, `getInsights`, `saveMemo`, `runAudit`
- Admin actions require both a valid session with an admin role and `ADMIN_API_KEY`: `getSystemStatus`, `setupAll`, `setupTriggers`
- JSONP fallback is removed from the frontend
- Dynamic text should be escaped before it is injected into string-rendered UI

## Deploy flow

1. Upload every file in `gas/` to Apps Script
2. Set Script Properties: `SPREADSHEET_ID`, `APP_TIMEZONE`, `ADMIN_API_KEY`
3. Create or seed an admin user in the `권한관리` sheet
4. Run `setupAll` with `POST`, a valid session token, and `adminKey`
5. Deploy the Apps Script project as a Web App
6. Put the Web App `exec` URL into `docs/assets/js/config.js`
7. Publish `docs/` with GitHub Pages

## Notes

- Do not commit real production keys into the repo
- User passwords are currently stored in the sheet for a lightweight MVP. Hashing should be added before wider production use.

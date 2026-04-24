# UI Structure

The UI is an internal operations console, not a marketing page. Keep it direct, dense, and readable.

## Shell

- Login overlay protects the app before a valid session exists.
- Topbar owns site, date, user identity, and logout.
- Tabs switch feature panels without changing pages.
- Watermark is shown after login for light deterrence and audit context.

## Tabs

- Dashboard: daily counts, KPI, comparisons, cached fallback if live read fails.
- Templates: grouped template buttons and copy-to-clipboard output.
- Insights: latest audit results and manual `runAudit`.
- Memo: save and read operating notes.
- Calc: reserved for lightweight calculators.
- Reference: fixed operating references.

## Rendering Rules

- Prefer compact cards and tables over large explanatory sections.
- Do not add feature instructions unless operators need them to complete a task.
- Escape Spreadsheet/API text before injecting into string HTML.
- Keep controls stable on mobile: no layout shifts when values change.

## Auth-Aware Behavior

- Before login, only the login overlay is actionable.
- After login, session-protected tabs may call the API.
- Admin-only workflows should be hidden or disabled for non-admin users when added to the UI.

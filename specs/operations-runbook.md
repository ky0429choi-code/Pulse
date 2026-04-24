# Operations Runbook

## Header or Column Changes

- Update the field map or `Schema.gs` before changing service logic.
- Confirm repositories still read the expected logical fields.
- Run a smoke check for Dashboard, Memo, Templates, and Insights.

## Daily Checks

- Confirm users can log in and restore a session.
- Confirm `getDashboardSummary` returns current data for the active site/date.
- Check the `로그` and `접속로그` sheets for repeated errors or login failures.
- Confirm memo save/read works for a normal user.

## Audit Jobs

- Manual audit: use `runAudit` from the Insights tab after signing in.
- Daily scheduled audit: `Jobs.runDailyAudit`.
- Weekly scheduled audit: `Jobs.runWeeklyAudit`.
- Trigger setup: `Installer.setupTriggers`.

## Troubleshooting

- `AUTH_REQUIRED`: user is not signed in or the session token was not sent.
- `SESSION_EXPIRED`: sign in again.
- `FORBIDDEN`: the signed-in user is not an admin.
- `ADMIN_AUTH_REQUIRED`: admin key is missing or invalid.
- `SHEET_ERROR` or `Sheet not found`: run `setupAll` and confirm sheet names.

## Release Notes Discipline

- If `Router.gs` changes, update `shared/api-contract.md`.
- If sheet headers change, update `Schema.gs` and this runbook if the operating step changes.
- If frontend rendering uses `innerHTML`, escape dynamic values with `escapeHtml`.

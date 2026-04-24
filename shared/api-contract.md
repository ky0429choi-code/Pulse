# API Contract (v1)

This is the lightweight FE/BE contract for the GitHub Pages frontend and Google Apps Script backend.

## Envelope

Every response must use the same envelope:

```json
{
  "success": true,
  "version": "v1",
  "action": "getDashboardSummary",
  "message": "",
  "data": {},
  "meta": {
    "timestamp": "2026-04-24T12:00:00.000Z"
  }
}
```

Failures use `success: false`, `data: null`, and `meta.errorCode`.

## Auth Policy

| Group | Actions | Requirement |
| --- | --- | --- |
| Public | `health`, `login` | No session |
| Session | `logout`, `getSession`, `getAppConfig`, `getDashboardSummary`, `getTemplateActions`, `renderTemplate`, `getMemoList`, `getInsights`, `saveMemo`, `runAudit` | `st` session token |
| Admin | `getSystemStatus`, `setupAll`, `setupTriggers` | `st` session token, admin role, `adminKey` |

## Request Rules

- GET actions pass `action` and parameters in the query string.
- POST actions send a JSON body with `action` and payload fields.
- Session-protected calls include `st`.
- Admin calls include `adminKey`.
- Do not commit real keys or production passwords.

## Stable Error Codes

- `UNKNOWN_ACTION`
- `METHOD_NOT_ALLOWED`
- `VALIDATION_ERROR`
- `AUTH_REQUIRED`
- `SESSION_EXPIRED`
- `ADMIN_AUTH_REQUIRED`
- `FORBIDDEN`
- `CONFIG_REQUIRED`
- `NOT_FOUND`
- `SHEET_ERROR`
- `INTERNAL_ERROR`

## Frontend Safety Rules

- Escape dynamic text before using `innerHTML`.
- Prefer `textContent` for single text nodes.
- Treat Spreadsheet values as untrusted user input.
- Keep `docs/assets/js/services/api.js` focused on transport and auth error handling.

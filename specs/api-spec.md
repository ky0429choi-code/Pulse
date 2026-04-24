# API Spec (v1.2)

The canonical lightweight contract lives in `shared/api-contract.md`.

## Actions

| Method | Action | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `health` | Public | Runtime health check |
| POST | `login` | Public | Create a session |
| POST | `logout` | Session | End the current session |
| GET | `getSession` | Session | Validate and refresh the current session |
| GET | `getAppConfig` | Session | Site list and feature flags |
| GET | `getDashboardSummary` | Session | Daily KPI and comparison summary |
| GET | `getTemplateActions` | Session | Template button groups |
| POST | `renderTemplate` | Session | Render a selected template |
| GET | `getMemoList` | Session | Recent memos |
| POST | `saveMemo` | Session | Save an operating memo |
| GET | `getInsights` | Session | Latest persisted insight batch |
| POST | `runAudit` | Session | Run and persist an audit batch |
| POST | `getSystemStatus` | Admin | System status for operators |
| POST | `setupAll` | Admin | Create sheets, headers, seed data |
| POST | `setupTriggers` | Admin | Create scheduled jobs |

## Notes

- The API envelope is fixed: `success/version/action/message/data/meta`.
- Admin means a valid session, an admin role, and `adminKey`.
- Frontend modules should not rely on undocumented response fields.
- Spreadsheet values must be escaped before string-rendering into the DOM.

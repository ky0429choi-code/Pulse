# File Roles

This map keeps ownership clear without adding a heavy framework.

## Frontend

- `docs/index.html`: Static application shell and panel containers.
- `docs/assets/css/base.css`: Shared visual system and responsive layout.
- `docs/assets/js/app.js`: App boot, global UI wiring, config loading, refresh coordination.
- `docs/assets/js/auth/session.js`: Browser session storage helpers.
- `docs/assets/js/config.js`: Frontend deployment configuration.
- `docs/assets/js/router.js`: Tab switching only.
- `docs/assets/js/services/api.js`: Fetch transport, session token attachment, auth error handling.
- `docs/assets/js/services/cache.js`: Local cache helper for read-only fallback.
- `docs/assets/js/components/ui.js`: Small HTML helpers that escape display text.
- `docs/assets/js/modules/*.js`: Feature rendering and feature-local events.

## Backend

- `gas/Main.gs`: `doGet` and `doPost` entrypoints.
- `gas/Router.gs`: Action whitelist, method checks, session/admin gates, request logging.
- `gas/ApiResponse.gs`: Shared response envelope.
- `gas/Config.gs`: Runtime properties, sheet names, defaults.
- `gas/Schema.gs`: Sheet schemas and field mapping.
- `gas/Installer.gs`: Sheet setup, seed data, trigger setup.
- `gas/Jobs.gs`: Scheduled job entrypoints.
- `gas/services/*.gs`: Business logic.
- `gas/repositories/*.gs`: Spreadsheet access and row mapping.
- `gas/utils/*.gs`: Small utility helpers.

## Shared Docs

- `shared/api-contract.md`: Canonical API envelope, auth policy, and safety rules.
- `specs/architecture.md`: Lightweight architecture boundaries and tradeoffs.
- `specs/api-spec.md`: Action list and auth requirements.
- `specs/deployment-checklist.md`: Manual deployment and smoke checks.
- `specs/operations-runbook.md`: Day-to-day operating procedures.

## Ownership Rules

- Add new API actions in `Router.gs` first, then update `shared/api-contract.md`.
- Keep Spreadsheet header changes in `Schema.gs` and field maps, not scattered services.
- Keep session storage logic in `auth/session.js`.
- Keep `api.js` transport-focused; feature modules decide how to render results.
- Escape API/Spreadsheet text before rendering string HTML.

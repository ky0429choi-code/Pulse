# Architecture Notes (v1.2)

This project intentionally stays lightweight:

- Static frontend in `docs/`
- Google Apps Script API in `gas/`
- Spreadsheet-backed repositories
- Small markdown contracts and runbooks instead of a heavy build system

## Boundaries

```text
docs/index.html
  loads the shell and module entrypoint

docs/assets/js/app.js
  boots the app, wires global UI, coordinates refresh

docs/assets/js/auth/
  owns browser session storage helpers

docs/assets/js/services/
  owns API transport and cache helpers

docs/assets/js/modules/
  owns feature rendering and feature events

gas/Router.gs
  owns action whitelist, method checks, auth gates

gas/services/
  owns business logic

gas/repositories/
  owns Spreadsheet read/write details

gas/Schema.gs
  owns sheet header and logical field mapping
```

## Invariants

- API responses use the v1 envelope.
- Only `Router.gs` decides whether an action is public, session-protected, or admin-only.
- Services do not read raw request secrets after routing.
- Repositories hide Spreadsheet row/header details from services.
- Frontend modules escape Spreadsheet/API text before injecting string HTML.
- Deployment config stays in Apps Script properties and `docs/assets/js/config.js`.

## Known Tradeoffs

- Spreadsheet storage keeps deployment simple, but `readAll_()` style repositories have scale limits.
- Passwords are currently sheet-backed for MVP speed. Hashing is required before broader production use.
- Session tokens are passed to GET endpoints as query parameters. Keep TTL modest and avoid logging raw tokens.
- There is no automated test runner yet. Use the deployment checklist and API contract as the lightweight guardrail.

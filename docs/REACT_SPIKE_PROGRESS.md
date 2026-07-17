# React Spike Progress And Validation Log

This document records implementation milestones and evidence for the experimental React reconstruction. It does not redefine current vanilla behavior.

## 2026-07-16: Workspace And Build Foundation

Implemented:

- Dedicated `codex/react-modernization-spike` branch.
- Isolated `react-app/` React 19 + Vite 8 workspace.
- Hash-based workflow routes and a recognizable ManaSpec application shell.
- Copied ManaSpec design tokens and active CSS into the isolated workspace as the initial fidelity baseline.
- Removed the React runtime's dependency on the vanilla Pico CDN by adding local reset/control foundations.
- Normal relative-asset build and `/ManaSpec/react-spike/` Pages build mode.
- Classic-script, single-bundle portable build with committed `dist-portable/index.html`.
- Local package manifest/lockfile using normal package names rather than private `/lib` paths.
- Source-policy and basic format checks.

Validated:

- Normal Vite production build completes.
- `/ManaSpec/react-spike/` Pages-mode build completes with the configured project base path.
- Portable IIFE/classic-script build completes.
- Portable HTML contains a normal script rather than `type="module"`, uses relative local assets, and contains no runtime CDN reference.
- Source-policy and format checks pass.

Open validation:

- Direct `file://` browser launch remains pending manual/supported-browser validation. The Codex in-app browser policy blocks navigation to local file URLs, so build inspection alone is not recorded as proof.
- Direct local-server access was established in the later workflow milestone below.

## 2026-07-16: End-To-End React Workflow

Implemented:

- Compatibility-normalized state provider and localStorage adapter for current positions, Radar, transactions, notes, legacy signals, thesis notes, cash, snapshots, refresh status, and market observations.
- Replace-only backup preview/restore with future-schema rejection and an emergency pre-import backup.
- Shared native dialogs, notices, metric bands, filters, responsive tables, loading/empty states, and global error boundary.
- Complete Radar discovery flow using Scryfall exact-name or exact set/collector lookup, exact printing/finish selection, plan edits, removal, and buy promotion.
- Positions buy/add, partial/full sell, weighted average cost basis, cash updates, automatic position closure, and ledger writes.
- Transactions, unified trade/note History, computed Signals, Dashboard triage, and read-only ledger reconciliation.
- Exact-printing Card Detail with shared notes, compatible price history, comparable printings, Scryfall/TCGplayer links, and manual TCGplayer observations.
- Admin price refresh with daily compatible snapshots, cash reset, export/import, counts, storage guidance, and reconciliation status.
- Help drawer and intentional desktop/tablet/phone CSS behavior, including stacked mobile records rather than a squeezed desktop table.

Validated:

- Eleven focused Node tests pass: backup compatibility/safety, unknown-field preservation, portfolio math, atomic Radar buy, weighted cost basis, partial/full sells, realized P/L, foil printing identity, and card-name/set-number parsing.
- Source-policy and format checks pass.
- Normal, `/ManaSpec/react-spike/` Pages, and portable IIFE builds complete.
- Browser smoke tests render the existing stored ManaSpec data and pass all seven routes.
- Browser checks exercise Positions, the sell confirmation, Card Detail, legacy-record comparable fallback, Admin, and the error boundary.
- Desktop visual review confirms the ManaSpec shell, information density, financial formatting, tables, and dashboard remain recognizable.
- Live search testing exposed a plain-name query mismatch; the request now uses Scryfall's exact-name paper-printing grammar.

Open validation:

- Perform direct `file://` launch manually because the in-app browser policy rejects local-file navigation; the regenerated artifact has a classic script, relative CSS/assets, no CDN URL, no `import.meta`, and no source-map reference.
- A Pages publication workflow and live URL are intentionally not enabled by this spike branch.
- Representative tablet/phone rules are implemented, but a second manual device/browser pass remains appropriate before calling the spike production-ready.

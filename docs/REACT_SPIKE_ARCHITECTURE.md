# React Spike Target Architecture

This document defines the target architecture for the experimental React reconstruction of ManaSpec. It is an implementation contract for the spike, not a description of the current production application and not approval to replace the vanilla app.

For current behavior and ownership, use [README](README.md), [ARCHITECTURE](ARCHITECTURE.md), and [DATA_MODEL](DATA_MODEL.md). For scope and parity gates, use [REACT_MIGRATION_NOTES](REACT_MIGRATION_NOTES.md). For dependency evaluation, use [LIBRARIES](LIBRARIES.md). For local and Pages delivery, use [DEPLOYMENT](DEPLOYMENT.md).

## Status And Boundaries

- The vanilla app at the repository root remains the production/beta source of truth.
- React work occurs on a dedicated experimental branch and in an isolated `react-app/` workspace.
- Opening, building, or deploying the spike must not require restructuring the vanilla app.
- The spike may be abandoned without removing or repairing the vanilla implementation.
- No production cutover is implied. Promotion requires a separate decision after parity, data-safety, deployment, and usability evidence is reviewed.

## Proposed Repository Shape

```text
/
|-- index.html                 # current vanilla entry point; remains operational
|-- css/, js/, assets/         # current vanilla application
|-- docs/                      # shared active documentation
|-- react-app/
|   |-- index.html             # Vite source entry
|   |-- package.json
|   |-- vite.config.*
|   |-- src/                   # React source
|   |-- public/                # copied static assets when appropriate
|   |-- dist/                  # normal Pages/deployment build; generated
|   `-- dist-portable/         # committed no-build local version
`-- .github/workflows/         # deployment workflow after it is implemented
```

The exact generated filenames may change. The ownership boundaries may not: root files belong to vanilla, React source belongs under `react-app/`, and the committed portable artifact must have one documented entry point.

## Source Structure

The initial React source should use a feature-oriented structure with small shared layers:

```text
react-app/src/
|-- app/             # bootstrap, providers, route map, error boundary
|-- layouts/         # stable terminal shell and responsive layouts
|-- features/        # Dashboard, Radar, Positions, Signals, etc.
|-- components/      # genuinely shared presentational and interaction pieces
|-- hooks/           # reusable React behavior with clear ownership
|-- state/           # shared runtime state and selectors
|-- services/        # Scryfall, storage, backup, external-link boundaries
|-- persistence/     # keys, adapters, normalization, migrations
|-- domain/          # pure calculations, identity, projections, validation
|-- styles/          # tokens, layout, forms, components, tables, responsive rules
|-- assets/          # bundled images and fonts owned by the React app
|-- config/          # environment-independent application configuration
|-- test/            # fixtures and test helpers
`-- main.*           # application entry
```

Do not create a layer merely to match this diagram. A directory is earned when it has a real responsibility. Feature-specific UI, state, tests, and helpers should stay together until reuse is proven.

## Application Shell And Routing

The React shell preserves the current header, account summary, navigation, search, notices, help access, and active workflow area. Hash-based routing is the default spike direction because it supports:

- direct `file://` opening of the portable artifact;
- GitHub Pages under `/ManaSpec/react-spike/` without server rewrite rules;
- refresh-safe navigation;
- reviewable workflow URLs without changing the vanilla root.

Routes should represent user-recognizable workflow destinations, not internal modal state. Card Detail may use route state or a route only if back/forward behavior remains predictable. The routing decision must be validated in both portable and Pages builds before it is marked final.

## State Ownership

Use the simplest state model that survives full parity:

- Component state owns transient form input, open/closed state, and local display controls.
- Feature state owns filters, sorts, selection, pagination, and feature-specific draft state.
- Shared application state owns user records and derived values used across workflows.
- Persistence is an explicit boundary; React components do not call `localStorage` directly.
- Calculations and normalization remain pure where practical so they can be compared with vanilla behavior.

React state plus context is the baseline to test. Zustand or Redux Toolkit may be adopted only if the parity implementation demonstrates cross-feature coordination, debugging, or update complexity that context cannot handle cleanly. The selection and evidence belong in [LIBRARIES](LIBRARIES.md) and [DECISIONS](DECISIONS.md).

## Persistence Compatibility

The persistence layer is the highest-risk architectural boundary.

- Existing localStorage keys and backup schema remain compatibility contracts.
- A storage adapter owns all reads, writes, serialization, backup, restore, and migration calls.
- Existing records pass through compatibility normalizers without destructive startup rewrites.
- Unknown fields survive ordinary read/edit/write cycles where the vanilla compatibility layer preserves them.
- A migration is explicit, versioned, fixture-backed, and separate from normal normalization.
- React must not create an incompatible parallel schema merely for cleaner component state.
- React-written records must remain readable by vanilla unless an explicitly approved, reversible migration says otherwise.

The deployed vanilla root and React subpath share the same web origin and therefore the same localStorage namespace. That makes compatibility testing mandatory: a write in the spike can affect the root application. Before first live-spike use, export a backup and validate cross-opening in both implementations.

Portable `file://` storage is browser-dependent and does not share the GitHub Pages origin. Backup/export and restore/import are the supported bridge between origins; the docs must never imply automatic data sharing between a local file and Pages.

## Data Flow

The preferred flow is explicit and one-directional:

1. A feature requests data or performs a user action.
2. A domain operation validates and calculates the result.
3. Shared state applies the result.
4. The persistence adapter serializes compatible records when the action is durable.
5. Selectors derive Dashboard, Signals, Positions, History, and summary views.
6. React re-renders only affected consumers.

Scryfall and external links remain services, not component-owned fetch code. Network failure must not make locally stored user data unavailable.

## UI And Responsive Foundation

The spike preserves ManaSpec's tokens, typography, density, terminology, and table-oriented desktop rhythm. Corrective polish may improve association, alignment, focus, padding, wrapping, and accessibility without changing the product's mental model.

Responsive strategy:

- Desktop baseline: 1366 x 768. Core workflows must remain usable without avoidable page-width overflow or nested vertical scrolling.
- Tablet: condense navigation, allow panels to stack, prioritize primary table columns, and expose secondary row detail deliberately.
- Phone: use touch-sized controls, stacked forms, responsive dialogs, and list/card alternatives where dense tables stop being usable.

Initial breakpoint candidates are `< 640px` for phone, `640px-1023px` for tablet, and `>= 1024px` for desktop. These are starting tokens, not permanent truth; browser validation may adjust them. Breakpoint changes should be centralized and recorded.

## Tables

Tables are a product-critical subsystem, not a generic component exercise. The spike must compare the current table contract, Tabulator, and React-first options against:

- density and styling control;
- sorting, filtering, column sizing, pagination, and row actions;
- responsive column priority and expandable detail;
- keyboard and screen-reader behavior;
- virtualization and large-list performance;
- bundle cost and maintenance health.

A single primary table direction should serve Radar, Positions, Signals, Transactions, and History. A second table system requires a documented exception. Feature parity may begin with a small ManaSpec table wrapper if adopting a grid would delay the core workflow.

## Forms, Dialogs, And Accessibility

Shared primitives should own labels, validation messages, focus states, dialogs, confirmation, toasts, icon buttons, and loading/empty states. Every dialog must restore focus, trap focus when modal, close predictably, and remain usable at phone width. Labels must be programmatically associated with controls.

A mature accessible primitive library is preferred when it reduces custom focus and keyboard code while allowing ManaSpec styling. The chosen styling and primitive systems must not compete with each other.

## Builds

Two production-quality outputs serve different constraints:

- `dist/`: normal optimized deployment output for `/ManaSpec/react-spike/`; may use lazy loading and code splitting.
- `dist-portable/`: committed, self-contained output intended to open through its local `index.html`; uses relative assets, hash navigation, local dependencies, and no Node/CDN runtime.

The portable build may require a dedicated Vite/Rollup configuration that avoids browser-blocked module loading under `file://`, potentially by emitting a classic single JavaScript bundle plus local CSS. This must be proven by direct browser testing rather than assumed from `base: './'` alone.

Generated deployment output is reproducible and normally ignored. The portable output is deliberately committed because it is a user-facing deliverable. Exact ignore rules and scripts must be recorded when the workspace exists.

## Performance

- Lazy-load large workflow modules in the deployment build where it does not harm local navigation.
- Keep derived calculations memoizable and independent from rendering.
- Virtualize only lists large enough to benefit.
- Avoid broad shared-state subscriptions.
- Analyze normal and portable bundle sizes before parity sign-off.
- Prefer measurable improvements over speculative infrastructure.

## Error Handling

The application shell should include an error boundary that protects navigation and offers a clear recovery path. Storage parse errors, rejected backups, Scryfall failures, and missing optional metadata require user-facing messages. Never replace or clear stored data as an automatic error-recovery action.

## Validation Gates

The architecture is not complete until evidence covers:

- old localStorage fixtures and backups load without destructive writes;
- React writes remain readable by vanilla;
- backup/restore and transaction/position calculations match current contracts;
- notes remain keyed by exact printing and finish;
- snapshots, comparable printings, and external links match current behavior;
- dialogs, focus, routes, and responsive layouts work at target sizes;
- portable `index.html` works without npm or a server;
- Pages works at `/ManaSpec/react-spike/` while the vanilla root remains unchanged.

## Decision Discipline

Material choices are recorded in [DECISIONS](DECISIONS.md). Dependency evidence belongs in [LIBRARIES](LIBRARIES.md). A choice that has not been implemented and tested remains `Proposed`, even when this document identifies it as the preferred starting direction.

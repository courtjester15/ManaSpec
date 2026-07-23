# React Modernization Spike

This document is the active execution charter and parity plan for the implemented React reconstruction of ManaSpec.

The spike is in implementation and stabilization mode. It now reproduces the full application shape and is the likely forward project path, subject to remaining parity, data compatibility, deployment, responsive/accessibility, and promotion evidence. It is not yet the production frontend and does not authorize a cutover from vanilla.

Vanilla remains the behavioral and production/beta source of truth until an explicit promotion decision. Use [React Spike Architecture](REACT_SPIKE_ARCHITECTURE.md) for implemented structure, [React Spike Progress](REACT_SPIKE_PROGRESS.md) and [React Parity Log](REACT_PARITY_LOG.md) for evidence, [Libraries](LIBRARIES.md) for the next dependency-evaluation phase, and [Deployment](DEPLOYMENT.md) for local and GitHub Pages delivery.

## Current Implementation Status

- The seven primary routes, shared shell, compatibility-backed local state, normal build, tracked Pages artifact, and stable portable build are implemented.
- The UI has completed broad parity plus focused table and Card Detail corrections; the user's current directional assessment is roughly 80-90% familiar, not a declaration of full parity.
- The shared Tabulator foundation is implemented with Radar as the Phase 1 pilot. Remaining table modules stay unchanged until a deliberate Phase 2 migration after Radar visual/interaction approval.
- React Parity Batch 1 closes the audit's C1 Position-deletion guard and C2 exact-printing related-record identity findings with focused regression coverage. Signals, Card Detail workflow, and dense-table review controls remain open for later batches.
- The next phase closes remaining workflow/UI/accessibility/responsive gaps, completes Radar browser evidence, and evaluates the next useful libraries against the working baseline.
- React may make small correctness and consistency improvements, but vanilla defines expected behavior wherever the implementations disagree until promotion.

## Objectives

Reconstruct the complete existing ManaSpec application in React while:

1. Preserving current behavior and user workflows.
2. Achieving feature parity before redesign or speculative expansion.
3. Preserving the visual identity and compact desktop experience.
4. Establishing a maintainable React architecture and professional toolchain.
5. Correcting small UI and accessibility inconsistencies encountered during parity work.
6. Establishing intentional tablet and phone foundations after desktop parity.
7. Evaluating mature libraries against actual ManaSpec needs.
8. Delivering clear architecture, dependency, development, deployment, and validation evidence.

## Non-Goals

- Replacing the vanilla production/beta app during the spike.
- Broadly redesigning ManaSpec.
- Changing terminology or user mental models to suit a library.
- Introducing a backend, accounts, sync, or a new persistence model.
- Renaming localStorage keys for cleanliness.
- Adding new product features before parity.
- Adopting libraries because they are popular or already downloaded.
- Treating a working shell as proof of complete migration.

## Isolation

- Use a dedicated React spike branch.
- Keep React source in an isolated `react-app/` workspace.
- Keep the root vanilla app functional and reviewable.
- Permit side-by-side comparison throughout implementation.
- Keep the experiment removable without repairing the vanilla app.
- Keep the implemented branch, `react-app/` source layout, tracked `react-spike/` Pages artifact, and committed portable-output policy documented as they evolve.

## Source Of Truth

Until a separate promotion decision:

- Vanilla behavior is the parity oracle.
- [README](README.md) owns current workflow truth.
- [ARCHITECTURE](ARCHITECTURE.md) owns current vanilla implementation architecture.
- [DATA_MODEL](DATA_MODEL.md) owns entity and compatibility semantics.
- [STYLE_GUIDE](STYLE_GUIDE.md) owns visual and interaction language.
- This document owns spike scope, sequence, and acceptance gates.
- React architecture and implementation choices must not silently redefine current product behavior.

## Required Scope

Parity includes all current user-facing modules and supporting behavior, including:

- application shell and navigation;
- Dashboard;
- Radar and Scryfall discovery;
- Positions;
- Signals;
- Transactions and History;
- Card Detail;
- Comparable Printings;
- shared Notes;
- Price History;
- Help and tutorials;
- Admin;
- import/export and backup/restore;
- price refresh and refresh status;
- market observations;
- TCGplayer and other external links;
- dialogs, confirmations, toasts, pickers, filters, tables, and row actions;
- localStorage keys, normalization, backup envelopes, migrations, and compatibility behavior.

Archived or unreachable code is not automatically a parity requirement. Active documentation and current navigation determine product truth; uncertain legacy behavior must be classified before porting.

## Implementation Order

Parity work follows dependency risk rather than visual convenience:

1. Documentation baseline, branch/workspace isolation, and library inventory.
2. Vite/React foundation, normal build, portable build, and Pages-path proof.
3. Application shell, navigation, route strategy, global error handling, and shared tokens.
4. Pure domain helpers and persistence compatibility adapter.
5. Backup/export/import and migration-fixture tests.
6. Shared components: forms, dialogs, notices, table primitives, loading, and empty states.
7. Radar and Scryfall discovery.
8. Positions and transaction calculations.
9. Transactions and History.
10. Notes, Card Detail, Comparable Printings, and Price History.
11. Signals and Dashboard derived views.
12. Help, Admin utilities, external links, and remaining parity details.
13. Corrective UI polish, accessibility, and responsive behavior.
14. Bundle/performance review, full parity validation, Pages deployment, and evidence summary.

This order may change when a dependency is discovered, but convenience features and redesign do not move ahead of data safety and core workflow parity.

## Data Compatibility Contract

The React app initially recognizes the current ManaSpec keys and records, including:

- `specs`;
- `radar`;
- `transactions`;
- `cardNotes`;
- legacy `signals`;
- `thesisNotes`;
- `cash`;
- `priceSnapshots`;
- `priceRefreshStatus`;
- `marketObservations`;
- current UI preference keys included by the active storage/backup documentation.

Rules:

- Read existing data without requiring manual conversion.
- Preserve exact printing and finish identity.
- Preserve unknown fields through normal compatible edits where current adapters do so.
- Do not perform destructive startup migrations.
- Keep data schema and backup-envelope schema versions distinct.
- Keep import replace-only unless a separately approved design changes it.
- Reject unsupported future schema versions before writing.
- Test migrations with retained fixtures and idempotence/round-trip coverage.
- Confirm vanilla can read controlled React-written data before live spike use.
- Export a backup before testing the deployed React app against real user data.

## Local No-Build Deliverable

The spike must commit a prebuilt static version with a stable local entry:

```text
react-app/dist-portable/index.html
```

Opening it should require no package installation, npm command, terminal, development server, or CDN. The portable build must use relative assets, local dependencies, file-compatible script output, and hash-safe navigation.

This is not satisfied merely by a normal Vite `dist/` directory. Direct opening must be tested. Browser-specific `file://` storage limitations and the lack of shared storage with the Pages origin must be documented honestly. See [Deployment](DEPLOYMENT.md).

## Developer Workflow

The React workspace also provides a conventional workflow with explicit scripts for:

- development server;
- normal production build;
- portable build;
- preview;
- linting;
- formatting checks;
- focused automated tests;
- browser/responsive tests where adopted;
- bundle analysis where useful.

The lockfile is committed. `node_modules`, normal generated deployment output, coverage, caches, and temporary assembly artifacts are ignored. The portable output is committed intentionally.

## UI Fidelity And Corrective Polish

Preserve:

- ManaSpec colors and typography;
- layout hierarchy and information density;
- navigation and terminology;
- dense table workflows;
- compact 1366 x 768 desktop usability;
- current financial formatting and status language.

Small corrections are allowed when they improve correctness: associated labels, consistent control heights, button alignment, dialog padding, table spacing, icon centering, wrapping, focus/hover states, keyboard access, accessible naming, and touch targets.

When uncertain, reproduce current behavior first and make the smallest correction in a separately reviewable change.

## Responsive Requirements

Priority order:

1. Desktop parity at 1366 x 768.
2. Tablet usability.
3. Phone usability.

Tablet and phone layouts may stack panels, condense navigation, prioritize columns, expose expandable details, or use deliberate list/card alternatives. They should not shrink an unusable desktop table onto a phone. Breakpoint strategy belongs in [React Spike Target Architecture](REACT_SPIKE_ARCHITECTURE.md) and must be validated at representative viewports.

## Library Audit And Selection

Before installing dependencies:

1. Inventory the local library collection and exact versions.
2. Identify the problem each candidate solves.
3. Determine React compatibility and official/maintained wrappers.
4. Compare a React-native alternative and the simplest no-library approach where material.
5. Record selection, alternatives, present benefit, future benefit, bundle cost, and maintenance cost.
6. Avoid overlapping state, table, styling, dialog, date, icon, notification, and animation systems.

The active audit and adoption records live in [LIBRARIES](LIBRARIES.md). No candidate listed there is approved merely by being listed.

## High-Risk Validation

At minimum, produce evidence that:

- existing localStorage fixtures load correctly without destructive writes;
- backup and restore remain safe;
- transaction and position calculations match vanilla behavior;
- notes remain attached to the correct printing and finish;
- price snapshots remain compatible;
- Comparable Printings matches current identity and link behavior;
- Scryfall, TCGplayer, and other external links are correct;
- shared dialogs, focus management, and confirmations work;
- hash navigation works in development, portable output, and `/ManaSpec/react-spike/`;
- direct portable `index.html` works without npm or a server;
- desktop, tablet, and phone layouts are intentionally usable;
- the vanilla root remains unchanged and operational;
- React-controlled writes remain readable by vanilla.

Automate high-risk pure logic, persistence, migration, and repeatable interaction checks. Do not delay the spike for exhaustive low-value coverage.

## Performance And Accessibility

Use code splitting, lazy loading, memoized derivation, efficient table rendering, and asset optimization where measurement justifies them. The portable build may trade code splitting for file compatibility; record that difference.

Accessibility is UI correctness. Review labels, focus, keyboard navigation, dialog behavior, contrast, button names, icon-only controls, table access, and touch targets during each shared-component milestone rather than deferring all work to the end.

## Documentation Deliverables

Maintain:

- README and docs index status/pointers;
- current vanilla architecture;
- React target architecture;
- data compatibility rules;
- development workflow;
- deployment and portable usage;
- library inventory and adoption records;
- decision log/ADRs;
- responsive strategy;
- progress and validation results;
- roadmap status.

Clearly label `Current`, `Proposed`, `Implemented`, and `Verified`. Documentation must not describe an unbuilt workflow or live deployment as complete.

## Milestones And Version Control

Commit meaningful milestones separately:

- workspace/build foundation;
- portable local-launch proof;
- shell/routing;
- persistence compatibility;
- shared tables/forms/dialogs;
- feature migration groups;
- responsive foundation;
- parity completion;
- Pages deployment;
- documentation and validation.

Before each milestone commit, review unrelated working-tree changes and stage only files belonging to that milestone.

## Promotion Decision

Completing the spike does not automatically replace vanilla. A promotion review must answer:

- Is full workflow parity demonstrated?
- Is user data safe and cross-readable?
- Does React materially improve maintenance, testing, responsiveness, or feature work?
- Are library and bundle costs acceptable?
- Does desktop remain excellent and are smaller viewports intentionally usable?
- Are local portable and Pages deployments reliable?
- Is the React architecture easier for Pete and Dex to understand?
- Is rollback credible?

Possible outcomes are: abandon the spike, retain it for further experiments, continue incremental parity work, or approve a separately planned production cutover.

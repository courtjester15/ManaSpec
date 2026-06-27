# ManaSpec Parking Lot

This is a lightweight holding area for useful ideas that are not yet ready for the roadmap, decision log, or implementation work.

Use it for workflow sketches, future enhancements, and discussion outcomes that are worth preserving but still need testing, prioritization, or a clearer owner.

## How To Use This File

- Keep bullets short.
- Group ideas by module or workflow.
- Prefer "review later" language over commitments.
- Move durable priorities to [ROADMAP](ROADMAP.md).
- Move durable rationale to [DECISIONS](DECISIONS.md).
- Delete stale ideas freely.

This file is not a second roadmap, a decision log, or a development journal.

## Recommendation

ManaSpec benefits from this document because the active docs already have clear jobs:

- [README](README.md) describes current product shape and behavior.
- [ROADMAP](ROADMAP.md) tracks current and upcoming work.
- [DECISIONS](DECISIONS.md) captures durable choices and rationale.
- [WORKFLOW](WORKFLOW.md) defines how to work on the app.
- [hygiene-audit](hygiene-audit.md) records a point-in-time code and docs audit.

The missing layer is a small, pruneable place for promising ideas before they are ready to become roadmap items or decisions.

## Dashboard

- Explore whether Dashboard should become the default "start here" scan surface once Signals deep-linking and card detail flows are tighter.
- Consider future dashboard concepts around tonight's attention list, recent activity, stale checks, and target movement without turning Dashboard into Signals.

## Radar

- Review an Add-to-Radar planning modal for setting planned quantity, entry target, hold time, and an initial note at the moment a printing is selected.
- Revisit unified smart search so name search, set-number lookup, and exact printing discovery feel like one workflow instead of separate modes.
- Keep future bulk set or spreadsheet paste ideas out of core Radar unless the workflow is explicitly about watched ideas before purchase.

## Positions

- Replace browser-native sell confirmation with an app-styled sell workflow that can explain quantity, proceeds, and after-sale state before committing.
- Review whether bulk actions are useful after the core single-position buy/sell loop is stable.
- Keep export/reporting ideas separate from full backup so Positions snapshots can eventually support review without implying partial restore.

## Signals

- Expand Signals beyond target states into attention categories such as missing plan, stale market check, newly purchased, thesis missing, and never reviewed.
- Make Signals hierarchy clearer: each signal should explain why it appears and what action the user is expected to consider.
- Use exact deep-links, row highlight, temporary filtering, or scroll-to-card behavior so a signal lands on the relevant Radar idea or Position.
- Revisit View navigation after beta: smoother transitions, destination row highlighting, and clearer context after jumping from Signals into Radar or Positions.
- Consider lightweight local usage analytics later to understand whether users naturally prefer row clicks, Detail, or View before simplifying Signals actions.
- Evolve static Hold Months toward an expected review or target date, such as "Hold: 12 months" plus "Expected Review: Jun 2027"; this is UX polish, not a beta requirement.

## Card Detail

- Continue treating Card Detail as the spec workspace: plan, market check, evaluation, notes, card data, and actions.
- Review whether Market Check history should display trend deltas for sellers, market price, and buylist from user-pasted observations.
- Keep Oracle and card metadata available as supporting context, but do not let them crowd the active decision workflow.

## Transactions And Ledger

- Draft the ledger migration plan before changing storage behavior: transaction events become the source of truth and Positions becomes computed current holdings.
- Preserve uncertainty in historical backfill with explicit estimated date, estimated price, confidence, and source-note fields.
- Review non-buy acquisition methods such as opened, trade, prize, promo, gift, store credit, and correction when the ledger shape is ready.

## Admin And Data Safety

- Consider lightweight module exports, such as Positions snapshot and Radar watchlist, after beta workflow and data safety are stable.
- Keep full backup/restore separate from reporting exports: backup protects data, exports help review and sharing.
- Revisit owned-spec backfill as a small Admin workflow, not a general collection importer.

## UI Polish

- Replace layout-shifting save notices with app-level toast notifications.
- Standardize empty, filtered, loading, and network-failure states across Radar, Positions, Signals, Transactions, History, and Dashboard.
- Review a shared formatting and escaping helper pass once beta UI settles.
- Responsive Desktop Layout Contract (Post-Beta Review): after beta and more real-world desktop usage, evaluate whether ManaSpec needs an intentional desktop layout. First answer whether the current laptop-first layout limits usability, which screens benefit from width, whether ManaSpec should remain dense like a trading terminal or become more fluid, whether Dashboard should preserve fixed grouped tile rhythm, and whether wider monitors should gain breathing room rather than different layouts. Do not begin another responsive CSS pass until a clear visual contract has been defined from 1366x768, 1440x900, and 1920x1080 usage.

## Technical Follow-Ups

- Document global script dependency order before any ES module migration.
- Revisit dormant bulk lookup helpers and related CSS after the Admin/import direction is clearer.
- Consider shared pure helpers for market parsing and evaluation if Card Detail gains a second caller or becomes harder to maintain.

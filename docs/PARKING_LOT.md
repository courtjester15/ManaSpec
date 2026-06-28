# ManaSpec Parking Lot

This is a lightweight holding area for useful ideas that are not yet accepted as product commitments.

Use it for workflow sketches, future enhancements, and discussion outcomes that are worth preserving but still need validation, workflow testing, prioritization, or a product decision.

Roadmap means "we are going to build this." Parking Lot means "we might build this."

## How To Use This File

- Keep bullets short.
- Group ideas by module or workflow.
- Prefer "review later" language over commitments.
- Move accepted product commitments to [ROADMAP](ROADMAP.md).
- Move durable rationale to [DECISIONS](DECISIONS.md).
- Delete stale ideas freely.

This file is not a second roadmap, a decision log, or a development journal.

## Recommendation

ManaSpec benefits from this document because the active docs already have clear jobs:

- [README](README.md) describes current product shape and behavior.
- [ROADMAP](ROADMAP.md) tracks committed current and future work.
- [DECISIONS](DECISIONS.md) captures durable choices and rationale.
- [WORKFLOW](WORKFLOW.md) defines how to work on the app.
- [hygiene-audit](audits/hygiene-audit.md) records a point-in-time code and docs audit.

The missing layer is a small, pruneable place for promising ideas before they are ready to become roadmap items or decisions.

## Dashboard

- Explore whether Dashboard should become the default "start here" scan surface once Signals deep-linking and card detail flows are tighter.
- Consider future dashboard concepts around tonight's attention list, recent activity, stale checks, and target movement without turning Dashboard into Signals.

## Radar

- Review an Add-to-Radar planning modal for setting planned quantity, entry target, hold time, and an initial note at the moment a printing is selected.
- Keep future bulk set or spreadsheet paste ideas out of core Radar unless the workflow is explicitly about watched ideas before purchase.

## Positions

- Review whether bulk actions are useful after the core single-position buy/sell loop is stable.

## Signals

- Expand Signals beyond target states into attention categories such as missing plan, stale market check, newly purchased, thesis missing, and never reviewed.
- Revisit View navigation after beta: smoother transitions, destination row highlighting, and clearer context after jumping from Signals into Radar or Positions.
- Consider lightweight local usage analytics later to understand whether users naturally prefer row clicks, Detail, or View before simplifying Signals actions.
- Evolve static Hold Months toward an expected review or target date, such as "Hold: 12 months" plus "Expected Review: Jun 2027"; this is UX polish, not a beta requirement.

## Card Detail

- Revisit whether card-name clicks should open Card Detail instead of art preview. Possible future alternative: card name opens Detail, and a small art icon/button opens art preview. Do not change before beta unless usage shows real friction or the user explicitly asks.
- Review whether Market Check history should display trend deltas for sellers, market price, and buylist from user-pasted observations.
- Keep Oracle and card metadata available as supporting context, but do not let them crowd the active decision workflow.

## Transactions And Ledger

- Preserve uncertainty in historical backfill with explicit estimated date, estimated price, confidence, and source-note fields.
- Review non-buy acquisition methods such as opened, trade, prize, promo, gift, store credit, and correction when the ledger shape is ready.

## Admin And Data Safety

- Keep full backup/restore separate from reporting exports: backup protects data, exports help review and sharing.
- Explore whether any additional Admin tools are needed after backup, restore, owned-spec backfill, and lightweight module exports settle into the workflow.

## UI Polish

- Standardize empty, filtered, loading, and network-failure states across Radar, Positions, Signals, Transactions, History, and Dashboard.
- Review a shared formatting and escaping helper pass once beta UI settles.
- Responsive Desktop Layout Contract (Post-Beta Review): after beta and more real-world desktop usage, evaluate whether ManaSpec needs an intentional desktop layout. First answer whether the current laptop-first layout limits usability, which screens benefit from width, whether ManaSpec should remain dense like a trading terminal or become more fluid, whether Dashboard should preserve fixed grouped tile rhythm, and whether wider monitors should gain breathing room rather than different layouts. Do not begin another responsive CSS pass until a clear visual contract has been defined from 1366x768, 1440x900, and 1920x1080 usage.

## Technical Follow-Ups

- Revisit dormant bulk lookup helpers and related CSS after the Admin/import direction is clearer.
- Consider shared pure helpers for market parsing and evaluation if Card Detail gains a second caller or becomes harder to maintain.

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
- Watch beta feedback on whether users expect Dashboard gainers/losers. If few users ask, keep gainers/losers out of the main Dashboard. If many users ask, reintroduce them intentionally as a secondary row or Positions-linked view.

## Radar

- Review an Add-to-Radar planning modal for setting planned quantity, entry target, hold time, and an initial note at the moment a printing is selected.
- Keep future bulk set or spreadsheet paste ideas out of core Radar unless the workflow is explicitly about watched ideas before purchase.

## Positions

- Review whether bulk actions are useful after the core single-position buy/sell loop is stable.
- Consider position lifecycle states only if beta usage shows they make real workflows clearer, such as holding, listed, sold, or archived. Avoid status bookkeeping that duplicates transaction history or makes a simple owned-position table feel like an accounting system.

## Signals

- Expand Signals beyond target states into attention categories such as missing plan, stale market check, newly purchased, thesis missing, and never reviewed.
- Consider break-even, stale-hold review, and more advanced target-condition alerts after the core attention workflow is stable. Keep these as computed "inspect this" prompts that explain why they exist and route back to Radar, Positions, or Card Detail.
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
- Review optional platform fee presets, shipping/friction costs, and advanced lot accounting only after the append-first ledger is stable. These should help decision review and realized P/L without making ManaSpec feel like tax or bookkeeping software.

## History, Review, And Learning

- Explore a post-beta trading-journal surface that helps users learn from past specs rather than predict future winners. Possible review slices include best trades, worst trades, sold-too-early examples, average hold time, profitable strategies, best-performing sets, and historical lessons.
- Review portfolio analytics only when enough transaction and snapshot history exists to make them meaningful. Candidate views include allocation by set, format, rarity, or asset type; concentration/exposure; cash allocation over time; realized vs unrealized P/L; win rate; average gain/loss; capital deployment history; and an equity curve.
- Keep review analytics decision-oriented and lightweight. They should support the Search -> Evaluate -> Radar -> Buy -> Manage -> Exit -> Review -> Learn loop, not turn ManaSpec into a portfolio terminal or accounting package.

## Optional Metadata

- Consider optional strategy/review metadata such as custom tags, entry catalyst, exit reason, confidence level, and reprint-risk notes if they improve later review. Keep them optional, user-authored, and attached to the appropriate printing, transaction, or review record rather than required fields in the core workflow.

## Asset Expansion

- Revisit sibling asset types beyond singles and sealed product later, including Secret Lairs and other MTG investment products, only when the singles workflow is stable and the identity/source model is clear. Do not merge these into the single-card printing model.

## Admin And Data Safety

- Keep full backup/restore separate from reporting exports: backup protects data, exports help review and sharing.
- Explore whether any additional Admin tools are needed after backup, restore, owned-spec backfill, and lightweight module exports settle into the workflow.

## UI Polish

- Standardize empty, filtered, loading, and network-failure states across Radar, Positions, Signals, Transactions, History, and Dashboard.
- Review a shared formatting and escaping helper pass once beta UI settles.
- Responsive Desktop Layout Contract (Post-Beta Review): after beta and more real-world desktop usage, evaluate whether ManaSpec needs an intentional desktop layout. First answer whether the current laptop-first layout limits usability, which screens benefit from width, whether ManaSpec should remain dense like a trading terminal or become more fluid, whether Dashboard should preserve fixed grouped tile rhythm, and whether wider monitors should gain breathing room rather than different layouts. Do not begin another responsive CSS pass until a clear visual contract has been defined from 1366x768, 1440x900, and 1920x1080 usage.
- Workflow Guidance Review (Post-Beta Feedback): after friend and beta testing, review where users naturally hesitate or become unsure of the next step. The goal is not to add more text throughout the app, but to identify small workflow guidance that reduces friction while preserving ManaSpec's dense terminal feel. Evaluate better empty-state guidance, improved action labels, stronger click affordances, hover hints or tooltips, context-sensitive helper icons, better visual hierarchy, and small "next step" prompts only where users consistently pause. Avoid large help boxes, persistent instructional text, pop-up tours, onboarding overlays, and UI clutter. ManaSpec should quietly answer "What would I probably do next?" without feeling like it is teaching the user how to use software. Base any future implementation on observed beta feedback rather than assumptions.

## Technical Follow-Ups

- Revisit dormant bulk lookup helpers and related CSS after the Admin/import direction is clearer.
- Consider shared pure helpers for market parsing and evaluation if Card Detail gains a second caller or becomes harder to maintain.
- Review React/Vite migration only after beta feedback exposes real maintenance or state-coordination pain. Use [React Migration Notes](REACT_MIGRATION_NOTES.md) and the GalleyFlow pattern audit before deciding whether to migrate.

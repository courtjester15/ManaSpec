# ManaSpec Data Ownership And Storage Readiness Audit

Status: completed. Findings promoted to `docs/audits/data-ownership-storage-readiness-audit-2026-07-11.md`.

## Why This Audit Exists

The 2026-07-11 feature-planning pass identified Comparable Printings, Price-History Charts, Owned-Spec Backfill, and Portfolio Performance as likely next candidates. Discussion of backfill and expanded finance metadata exposed a more important readiness question: whether ManaSpec's current localStorage-backed model has clear enough identity, field ownership, transaction authority, and migration safety to expand without compounding duplication.

This is not a claim that the completed MVP singles workflow is broken. It is a foundation check before adding features that depend on richer history, additional user-authored fields, and reliable calculations.

## Core Concern

An exact printing should remain the stable anchor for tracked speculation activity, but printing reference data, user intent, transaction or lot facts, calculated position state, notes, snapshots, market observations, and bankroll state may need distinct ownership boundaries.

Current areas to audit include:

- Printing metadata duplicated across `radar`, `specs`, and `transactions`.
- Ownership represented by both directly mutated Positions and an early transaction ledger.
- Direct localStorage access spread across modules.
- Field ownership that is currently implied rather than formally defined.
- Finish-aware identity and the implications of future language or condition support.
- Backup/import compatibility once stored shapes or entities expand.
- The risk of moving to Dexie before the conceptual model is settled.

## Proposed Audit Scope

1. Inventory every localStorage key, actual record shape, loader, saver, reader, writer, calculated field, duplicated field, and legacy field.
2. Build a field-ownership matrix for printing identity, finish, quantity, cost, current price, dates, plan fields, notes, observations, snapshots, cash, realized P/L, and transaction metadata.
3. Define identity requirements for Oracle cards, exact printings, finish-specific tracking, possible language-specific holdings, tracked specs, transactions, notes, snapshots, and observations.
4. Evaluate the smallest useful entity model across Printing, Tracked Spec, Plan, Transaction, computed Position, Note, Price Snapshot, Market Observation, and possible Account/Bankroll Event concepts.
5. Determine whether Transactions can safely become authoritative, what current records lack, how current `specs` would migrate, and how multiple buys, partial sells, fees, repurchases, conditions, and languages should behave.
6. Clarify bankroll ownership, including starting cash, corrections, deposits, withdrawals, non-cash acquisitions, and transaction cash effects.
7. Assign likely expanded fields to their correct owner and classify them as core now, useful next, defer, or exclude. Candidate fields include language, condition, acquisition method/source, fees, shipping, storage location, thesis, conviction, catalyst, review date, risk, tags, estimated-data flags, import provenance, sale venue, exit reason, and outcome notes.
8. Audit backup schema v1, unknown-field preservation, new-entity compatibility, schema versioning, migration detection, rollback, pre-migration backups, and fixture-based compatibility testing.
9. Compare keeping the current localStorage model, normalizing and centralizing while remaining on localStorage, and adopting Dexie/IndexedDB now.
10. Propose a controlled, independently committable implementation sequence that preserves the working MVP.

## Required Outcome

The future audit should conclude with:

- A ready, partially ready, or not-ready assessment for expansion.
- Current storage/entity and field-ownership maps.
- Identity findings and a recommended target model.
- A current-to-target migration map.
- Backup and migration risks.
- A localStorage-versus-Dexie recommendation.
- A staged implementation sequence and smallest safe first step.
- Decisions Jason must make before code changes.

## Guardrails

- Planning and audit only until explicitly authorized otherwise.
- Preserve the completed MVP workflow, existing localStorage data, and backup compatibility.
- Do not migrate data, install dependencies, or begin feature work during the audit.
- Avoid a broad rewrite unless concrete findings justify it.
- Do not reopen general core-loop testing.
- Do not accept the proposed entity model automatically; validate it against actual code and stored behavior.

## Feature Planning Impact

Pause major feature execution until this audit establishes whether foundation work is required. Comparable Printings remains comparatively low-risk because it can be read-only and storage-neutral, but even that should wait until Jason chooses whether to complete the readiness audit first.

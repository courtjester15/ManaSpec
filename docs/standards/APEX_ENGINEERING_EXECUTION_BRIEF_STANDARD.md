# APEX Engineering Execution Brief Standard

Version: 1.0
Status: Active

## Purpose

This standard defines how implementation briefs are written across APEX Iteration projects for both human and AI contributors.

The goals are to create consistency among contributors, reduce project onboarding time, minimize implementation mistakes, and keep work aligned with each project's established architecture. An execution brief communicates intent, context, boundaries, constraints, acceptance criteria, validation expectations, and documentation requirements; it does not merely describe a feature.

A brief must be sufficiently self-contained that a qualified contributor can begin work without relying on undocumented conversation history.

## Requirement Levels

The terms below describe how strongly a rule applies:

- **Must:** required. A brief is not ready until the requirement is satisfied.
- **Should:** expected unless the brief gives a reasonable explanation for omitting it.
- **May:** optional and included when it improves clarity or execution.

## Brief Sizes

Brief depth must be proportional to the work's complexity and risk. Use the complete [Implementation Brief Template](../templates/IMPLEMENTATION_BRIEF_TEMPLATE.md), keeping non-applicable sections brief rather than inventing unnecessary detail.

### Small

Use for focused, low-risk changes with limited architectural impact.

A Small brief must include useful metadata, Objective, Scope, Acceptance Criteria, Validation Plan, and Deliverables. Other sections may be concise or marked `Not applicable` with a short reason.

### Standard

Use for normal feature work, meaningful bug fixes, or changes spanning multiple components.

A Standard brief should address every template section with enough detail for independent execution. Sections that genuinely do not apply may be marked accordingly.

### High-Risk

Use for changes that affect critical data, security or privacy, compatibility, deployment, migrations, foundational architecture, or difficult-to-reverse behavior.

A High-Risk brief must address every applicable section and explicitly cover relevant failure modes, safeguards, compatibility, migration, recovery or rollback, and expanded validation.

## Brief Lifecycle

An execution brief is an implementation plan, not an implementation log. It describes intended work and planned validation. Actual changes, deviations, validation results, and completion evidence belong in the project's designated progress record, pull request, development history, or other completion record.

Recommended status values are:

- `Draft`: still being shaped or reviewed.
- `Ready`: approved and sufficiently complete for implementation.
- `In Progress`: currently being implemented.
- `Completed`: implementation has finished; completion evidence is recorded in the appropriate project location.
- `Superseded`: replaced by a newer brief or decision.

If implementation materially changes the agreed scope or approach, the brief or an authoritative linked decision must be updated before the expanded work proceeds.

## Standard Brief Structure

### 1. Metadata

Every brief must identify:

- Title
- Status
- Date
- Brief Size: Small, Standard, or High-Risk

It may also identify:

- Related documents or issues
- Author
- Approver

### 2. Objective

Provide a concise description of the desired outcome.

Answer:

- What is being built or changed?
- Why is it being built?
- What constitutes success?

### 3. Background

Provide enough project context that someone unfamiliar with the current conversation can understand why the work exists.

Include relevant previous work, the current implementation, known issues, and prior decisions. Do not require undocumented conversation history.

### 4. Scope

#### In Scope

State exactly what must be completed.

#### Out of Scope

State what must not be modified or completed as part of this task. Prevent scope creep whenever practical.

### 5. Existing Architecture

Briefly explain the systems the change will extend, such as shared components, existing libraries, data flow, storage, and important abstractions.

The purpose is to encourage contributors to extend established systems instead of replacing them unnecessarily.

### 6. Existing Research / Decisions

Reference relevant decisions, implementation notes, research, spike results, or design discussions. Link to authoritative project documents whenever possible and avoid repeating completed research.

### 7. Assumptions

State material assumptions that affect the proposed implementation. Assumptions must not silently expand scope or override established project decisions.

### 8. Dependencies

Identify internal or external work, systems, data, decisions, or approvals required for implementation or validation. State `None known` when appropriate.

### 9. Risks

Identify meaningful implementation, regression, compatibility, data, operational, security, or delivery risks. Include safeguards, migration, recovery, or rollback expectations when the risk warrants them.

### 10. Constraints

Document relevant project boundaries and quality requirements, such as:

- Offline-first or local-first behavior
- Reuse-first architecture
- Existing UI or behavior parity
- Performance
- Accessibility
- Error handling and recovery
- Data integrity
- Storage and backward compatibility
- Security and privacy
- Responsive behavior and target screen sizes
- Browser or platform support

Include only considerations that apply, but do not omit a material constraint merely because it complicates implementation.

### 11. Likely Files to Review

Identify files that should be understood before implementation begins to reduce unnecessary repository exploration.

These are implementation guidance only. Contributors should review additional files when required. File paths should be verified before implementation, particularly when reusing older briefs.

### 12. Likely Files to Modify

Identify the components expected to change.

These are implementation guidance only. Contributors should review and modify additional files when required. File paths should be verified before implementation, particularly when reusing older briefs.

### 13. Implementation Expectations

Describe how the work should be approached without prescribing speculative implementation details.

Expectations may include extending shared systems, building incrementally, avoiding duplication, preserving compatibility, minimizing regressions, and limiting unrelated cleanup or refactoring.

### 14. Acceptance Criteria

List observable, testable conditions that must be true for the work to be accepted. Criteria should describe outcomes rather than implementation activity.

### 15. Validation Plan

Describe how the acceptance criteria and relevant regressions will be verified. Include specific commands, environments, comparisons, workflows, devices, browsers, edge cases, or manual checks when known.

Consider functional behavior, visual parity, regression coverage, performance, accessibility, error handling, data integrity, compatibility, security or privacy, and responsiveness where applicable.

Planned checks in this section are not proof that validation has occurred. Record actual results and evidence in the project's completion record.

### 16. Documentation Updates

Update documentation only when implementation changes documented behavior, architecture, workflows, decisions, or project status. Otherwise, the completion record must explicitly state that no documentation updates were required.

Identify the likely owning documents when an update is expected.

### 17. Deliverables

Provide a concise checklist of expected outcomes, including implementation, preserved behavior, documentation, and validation as applicable.

### 18. Suggested Commit

Provide a concise suggested commit message that follows the repository's conventions. This is guidance; the final commit message should reflect the work actually completed.

### 19. Recommended Next Task

When useful, recommend the logical next implementation step. A recommended next task is explicitly outside the current brief unless separately approved.

## General Engineering Principles

Execution briefs must remain focused and should:

- Prefer extending existing architecture over replacing it.
- Favor shared solutions over module-specific implementations.
- Encourage documentation updates alongside relevant code changes.
- Minimize unrelated cleanup.
- Avoid speculative refactoring.
- Preserve user-facing behavior unless the brief intentionally changes it.
- Prefer incremental improvements over large rewrites.
- Protect compatibility and user data.
- Leave the project in a clearer, better-documented state when documentation is affected.

## Definition of a Ready Brief

A brief is ready for implementation when:

- Its status is `Ready` or the project owner has otherwise approved execution.
- Its size and required metadata are identified.
- Its objective, in-scope work, and out-of-scope boundaries are unambiguous.
- Material assumptions, dependencies, risks, and constraints are documented.
- Acceptance criteria are testable.
- The validation plan is adequate for the work's risk.
- A contributor can begin without relying on undocumented conversation history.

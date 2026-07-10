# ManaSpec Development Workflow

This doc is intentionally small. ManaSpec is a sandbox app, so the docs should help momentum instead of creating process overhead.

## Core Model

ManaSpec development separates three things:

- Thinking: product direction, UX shape, architecture choices.
- Execution: code changes based on current specs.
- State: what is true now.

The docs in this folder represent current state. `dev notes/inbox/` is for raw daily notes and beta observations; `dev notes/archive/` is memory.

## Source Of Truth Order

When working on ManaSpec, use context in this order:

1. [README](README.md) for product shape, current workflow behavior, module lineup, and the docs ownership map.
2. [Product Principles](PRODUCT_PRINCIPLES.md) when product philosophy or decision mindset matters.
3. [Roadmap](ROADMAP.md) for current phase, next work, and deferred work.
4. [Architecture](ARCHITECTURE.md), [Data Model](DATA_MODEL.md), or [Style Guide](STYLE_GUIDE.md) when a change touches internals, entities, UI language, or design consistency.
5. [Decisions](DECISIONS.md) when rationale matters.
6. [History](../HISTORY.md) when the project origin, major milestones, or older context matters.
7. `dev notes/inbox/` for current raw observations, or `dev notes/archive/` only if a current doc points there or the user asks for history.

Audit files in `docs/audits/` are point-in-time review records. Use them for context, but promote durable findings into the active docs above before treating them as current truth.

## Work Loop

1. Pick one module or workflow.
2. Read the relevant section in [README](README.md), the roadmap phase, and any ownership doc affected by the change.
3. Make the smallest code change that satisfies the current goal.
4. Verify the app still works.
5. Update the owning doc if behavior, architecture, data relationships, or UI language changed.
6. Update `docs/DECISIONS.md` only when a meaningful choice was made.
7. Put new raw notes in `dev notes/inbox/`, then promote durable behavior, priorities, or decisions into active docs.

When a change alters a workflow model, interaction contract, or data ownership rule, update the owning active docs in the same pass. Examples include manual-to-computed behavior, shared Dashboard/Signals attention queues, canonical plan ownership, native-to-app confirmation flows, and ledger/source-of-truth changes. `CHANGELOG.md` records that the change happened; it is not a substitute for updating README, Architecture, Data Model, Style Guide, Roadmap, or Decisions when those docs own the current truth.

## Pasted Notes Workflow

When the user pastes full notes from GPT, chat history, beta testing, or another planning session, treat them as project memory that may need to be saved before the thread moves on.

Triage pasted notes this way:

- Current behavior or implementation rules: summarize into [README](README.md).
- Stable product philosophy or decision principles: summarize into [PRODUCT_PRINCIPLES](PRODUCT_PRINCIPLES.md).
- Active priorities, beta gates, or next-session tasks: summarize into [ROADMAP](ROADMAP.md).
- App internals, boot flow, rendering flow, module ownership, storage ownership, or architectural direction: summarize into [ARCHITECTURE](ARCHITECTURE.md).
- Entities, relationships, lifecycle, ledger migration, or ownership semantics: summarize into [DATA_MODEL](DATA_MODEL.md).
- UI terminology, visual language, dense table rules, formatting, or copy conventions: summarize into [STYLE_GUIDE](STYLE_GUIDE.md).
- Durable product, architecture, data, or workflow rationale: summarize into [DECISIONS](DECISIONS.md).
- Promising but uncommitted ideas: summarize into [PARKING_LOT](PARKING_LOT.md).
- Raw observations, exploratory thinking, or context that may improve later analysis: save or summarize in `dev notes/inbox/` with a date-first filename.

Do not paste long transcripts into active docs. Preserve the useful context, source, and reasoning in a concise form, then prune or promote it later.

If the pasted notes are important and are not already saved in the project folder, create or update an appropriate note file before finishing the work. This helps future Codex sessions provide better analysis from project memory instead of relying on chat history alone.

## GPT Collaboration Notes

When using GPT for brainstorming, workflow review, or product critique outside Codex, ask it to produce notes in a format Codex can execute later.

Preferred note types:

### Architect Summary

Use for broad review, prioritization, and batching.

Include:

- Status.
- Overall assessment.
- Themes.
- Future direction.
- Risks or open questions.
- Suggested batch order.
- What not to implement yet.

Architect summaries are guidance, not implementation instructions. Use them to shape future batches.

### Implementation Batch

Use for one executable change set.

Include:

- Goal.
- Problem.
- User outcome.
- Scope.
- Out of scope.
- Context Routing.
- Acceptance checks.
- Regression checks.
- Docs to update.
- Git instructions.

Each implementation batch should end with:

- Suggested commit message.
- Whether to commit after completion.
- Whether to push after completion.
- Files, workflows, or data that must not be touched.

GPT notes are project memory, not automatic authority. Codex should still compare them against active docs, current code, and the current Git state before implementing.

Implementation notes should include a Context Routing section so Codex can begin from the right docs and files without rediscovering the whole repo:

```md
## Context Routing

Read first:
- docs/README.md
- docs/ROADMAP.md
- docs/PRODUCT_PRINCIPLES.md

If UI/table/copy:
- docs/STYLE_GUIDE.md

If architecture/module/rendering/script-order:
- docs/ARCHITECTURE.md

If storage/entities/ledger/data ownership:
- docs/DATA_MODEL.md

Likely files:
- ...

Avoid touching:
- ...
```

## Git Checkpoints

ManaSpec now uses Git for recovery points and version history.

- Commit before risky refactors or data-model changes.
- Commit after each coherent workflow fix or doc update.
- Do not push to GitHub or use remote GitHub actions unless the user explicitly asks for that batch.
- Use branches for experiments that may need to be abandoned or compared.
- Use tags for meaningful app versions such as alpha, beta, or release milestones.
- Do not create new dated release-copy folders for normal checkpoints.
- Treat existing `releases/` folders as legacy snapshots until they are removed in a deliberate cleanup commit.
- Keep `archive/` only for reference material that is still useful outside Git history.

## Changelog Maintenance

Maintain `CHANGELOG.md` as the human-readable history of meaningful work.

- Update `CHANGELOG.md` in the same pass when a change is user-visible, workflow-relevant, or adds a project/process guardrail.
- Use the current environment date for changelog sections when work happens in the active session.
- If reconstructing older history from Git, docs, or notes, label it as retrospective instead of pretending it was recorded live.
- Keep entries concise and human-readable; do not duplicate every commit.
- Leave tiny internal refactors, formatting-only changes, and throwaway experiments out unless they affect behavior or process.

## AI Usage Rules

- Do not ask AI to read every note by default.
- Point AI to the relevant README section and roadmap phase whenever possible.
- Point AI to [Product Principles](PRODUCT_PRINCIPLES.md) when a change needs product judgment before implementation detail.
- Point AI to [Architecture](ARCHITECTURE.md) for app structure, [Data Model](DATA_MODEL.md) for entity relationships, and [Style Guide](STYLE_GUIDE.md) for UI language or table/design consistency.
- Use this folder for current behavior and constraints.
- Use `docs/DECISIONS.md` for rationale and tradeoffs.
- Use `docs/PARKING_LOT.md` for useful ideas that are not ready for roadmap or decisions.
- Use `dev notes/inbox/` and `dev notes/archive/` as reference, not authority.
- When pasting full GPT or chat notes, ask AI to save the important parts if they are not already in the project folder.
- If old notes conflict with active docs, active docs win.

## Codex Friction Notes

Use `dev notes/inbox/codex-friction-log.md` for recurring tool, environment, browser harness, command, or workflow snags that make Codex take non-obvious detours.

Log friction when it is surprising, repeated, safety-relevant, or likely to save future time. Do not log every harmless typo, one-off retry, or normal command failure.

Promote a friction note into this Workflow doc only after it becomes a durable operating rule.

## Repeated Issue Check

When the same issue comes back after one or two fix attempts, pause before making more small adjustments. Treat the repeat as a signal to step back and inspect the underlying cause, especially for styling, layout, cascade, shared component, browser-state, or data-flow problems.

This is a rule of thumb, not dogma. The goal is to avoid polishing around a hidden root cause while keeping normal iteration lightweight.

## Documentation Ownership Rules

Use the docs ownership map in [README](README.md) before adding or moving documentation.

- Put product behavior and current workflow truth in [README](README.md).
- Put stable product philosophy and decision mindset in [PRODUCT_PRINCIPLES](PRODUCT_PRINCIPLES.md).
- Put internal build structure, boot order, module ownership, rendering flow, storage ownership, and future architecture direction in [ARCHITECTURE](ARCHITECTURE.md).
- Put entities, relationships, lifecycle, ledger migration context, and data ownership semantics in [DATA_MODEL](DATA_MODEL.md).
- Put terminology, UI language, visual design philosophy, table conventions, formatting, wrapping, and copy rules in [STYLE_GUIDE](STYLE_GUIDE.md).
- Put active priority and sequencing in [ROADMAP](ROADMAP.md).
- Put process rules in [WORKFLOW](WORKFLOW.md).
- Put durable rationale in [DECISIONS](DECISIONS.md).
- Put uncommitted ideas in [PARKING_LOT](PARKING_LOT.md).
- Put reconstructed origin, milestone, and project-evolution context in [HISTORY](../HISTORY.md).
- Put dated audits, audit plans, and diagnostic snapshots in `docs/audits/`.
- Put raw session memory in `dev notes/inbox/`.

Avoid duplicating the same truth across multiple active docs. If a topic belongs in a new ownership doc, link to that doc instead of restating it in full.

Audit docs are allowed to be more diagnostic and time-bound than active docs. They can propose work, but they do not define current behavior until their findings are promoted into README, Architecture, Data Model, Style Guide, Roadmap, Workflow, or Decisions.

## Browser Testing

When performing UI QA, browser inspection, console debugging, or regression testing:

- Use the Codex in-app Browser when available.
- Never open the app using `file://`.
- Always test against the local static server on `127.0.0.1`.
- Start the standard ManaSpec browser QA server from the project root:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

Notes:
- If the browser reports `file://` is blocked, do not troubleshoot file access. Start or reconnect to the local static server and continue testing at the localhost URL.
- Avoid `file://`, inline `node -e` scripts, checked-in Node static server launches, or hidden `Start-Process` server launches for the standard browser QA path.
- Prefer browser inspection and console validation over screenshot-only debugging when available.
- Browser `evaluate()` is not a reliable way to inspect localStorage or app state in the Codex browser harness. Prefer visible UI, DOM snapshots, screenshots when useful, and console checks.
- If the browser harness becomes sluggish, loops, hangs, or returns inconsistent inspection results after extended debugging, restart the browser session, reopen the page, and continue from a fresh state.

### Card Detail Browser QA

Across ManaSpec modules, clicking the card name currently opens art preview, not Card Detail. Do not assume card-name click equals Detail.

For Card Detail QA, use one of these entry points:

- An explicit Detail action, if present.
- A known row/body click target that opens Card Detail.
- Another module entry point already wired to Detail.

Before claiming Card Detail was browser-tested, verify the open modal contains `#cardDetailBody` or `.card-detail-panel`, not `.card-art-preview`.

Do not change the card-name/art-preview behavior for beta unless the user explicitly asks.

## Local QA Fixtures

The `test-fixtures/` folder is for local ManaSpec backup JSON files used during browser QA.

- Treat `test-fixtures/` as local-only unless the user explicitly says a fixture is sanitized and safe to commit.
- Keep backup JSON files in `test-fixtures/` ignored by Git.
- Before staging broad changes, check that local QA backups are not being committed.
- Use the newest ManaSpec backup in `test-fixtures/` as the default rich-data QA fixture when regression testing needs Positions, Radar, Transactions, notes, or market observations.
- If browser QA mutates local test data, restore the newest fixture afterward when practical.

## Change Size

Prefer narrow, durable steps:

- One module at a time.
- One workflow at a time.
- Update docs in the same pass as behavior changes.
- Avoid large architecture rewrites unless the roadmap explicitly calls for one.

## Doc Size

Keep docs flat until the app earns more structure. ManaSpec has earned focused ownership docs for architecture, data model, and style; do not add more active docs casually.

- Prefer updating the existing ownership doc before creating another doc.
- Do not create module folders for early ideas.
- Split a module into its own spec only when it has independent state, multiple files, non-obvious behavior, or enough detail that README becomes hard to scan.

## Completion Checklist

Before calling a task done:

- The app behavior matches the relevant README section.
- For UI-facing changes, verify behavior through the Codex in-app Browser on localhost when browser automation is available.
- If a change affects table structure, rendering, styling, sorting, pagination, or dense cell content, complete the table contract verification below.
- Any new rule or workflow is documented.
- The roadmap status still makes sense.
- No old note has silently become the new source of truth.

## Table Contract Verification

ManaSpec uses shared table rendering and styling across Radar, Positions, Signals, Transactions, and History. Treat table changes as system changes, not isolated module changes.

A table change is not complete simply because a new field, column, button, indicator, or editable control appears. Table integrity is part of the acceptance criteria.

Use this verification whenever a change affects:

- Table columns, column order, or column width.
- Editable cells, buttons, row actions, or cell content density.
- Money formatting, dates, set codes, collector numbers, or compact labels.
- Headers, rows, shared table helpers, table CSS, pagination, or sorting.

Before implementation:

- Identify every table surface potentially affected.
- Identify any shared renderer, helper, or CSS involved.

After implementation, verify at approximately 1366px laptop width. If the browser harness cannot force 1366px, verify at the available width and note the limitation.

Required surfaces:

- Radar
- Positions
- Signals
- Transactions
- History

Confirm structure:

- Headers align with data columns.
- Column ordering remains correct.
- No duplicate or displaced headers appear.
- No horizontal overflow appears.

Confirm visual rhythm:

- Row height remains consistent.
- Text remains vertically centered.
- Money values remain readable.
- Dense scan surfaces remain compact.

Confirm interaction:

- Editable cells still enter edit mode correctly.
- Save behavior still works.
- Buttons remain aligned.
- Row actions remain usable.

Confirm text handling:

- Text does not unexpectedly wrap.
- Prices, dates, set codes, collector numbers, and actions do not wrap.

Confirm cross-module impact:

- Tables not directly modified did not regress because of shared rendering or CSS changes.

## Workflow Ownership Rules

Radar
- Discovery
- Watched ideas
- Entry planning
- Planned quantity

Positions
- Owned holdings
- Exit planning
- Position management

Signals
- Read-only attention layer
- Alerts and reminders
- Deep-links to Radar or Positions

Card Detail
- Unified editor for a specific printing
- Edits canonical plan data

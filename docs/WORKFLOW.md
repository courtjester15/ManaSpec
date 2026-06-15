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

1. [README](README.md) for product shape, module lineup, data model, and implementation rules.
2. [Roadmap](ROADMAP.md) for current phase, next work, and deferred work.
3. [Decisions](DECISIONS.md) when rationale matters.
4. `dev notes/inbox/` for current raw observations, or `dev notes/archive/` only if a current doc points there or the user asks for history.

## Work Loop

1. Pick one module or workflow.
2. Read the relevant section in [README](README.md) and the roadmap phase.
3. Make the smallest code change that satisfies the current goal.
4. Verify the app still works.
5. Update [README](README.md) or [ROADMAP.md](ROADMAP.md) if behavior or priorities changed.
6. Update `docs/DECISIONS.md` only when a meaningful choice was made.
7. Put new raw notes in `dev notes/inbox/`, then promote durable behavior, priorities, or decisions into active docs.

## Git Checkpoints

ManaSpec now uses Git for recovery points and version history.

- Commit before risky refactors or data-model changes.
- Commit after each coherent workflow fix or doc update.
- Use branches for experiments that may need to be abandoned or compared.
- Use tags for meaningful app versions such as alpha, beta, or release milestones.
- Do not create new dated release-copy folders for normal checkpoints.
- Treat existing `releases/` folders as legacy snapshots until they are removed in a deliberate cleanup commit.
- Keep `archive/` only for reference material that is still useful outside Git history.

## AI Usage Rules

- Do not ask AI to read every note by default.
- Point AI to the relevant README section and roadmap phase whenever possible.
- Use this folder for current behavior and constraints.
- Use `docs/DECISIONS.md` for rationale and tradeoffs.
- Use `dev notes/inbox/` and `dev notes/archive/` as reference, not authority.
- If old notes conflict with active docs, active docs win.

## Browser Testing

When performing UI QA, browser inspection, console debugging, or regression testing:

- Use the Codex in-app Browser when available.
- Test against a localhost URL rather than a file:// URL.
- If browser automation is needed, start a temporary local HTTP server and test through localhost.

Example:

http://localhost:8000/index.html

Notes:
- Browser automation may fail against file:// URLs even when the app works normally.
- Temporary localhost server scripts are development helpers and should not be committed unless intentionally added to the project.
- Prefer browser inspection and console validation over screenshot-only debugging when available.

## Change Size

Prefer narrow, durable steps:

- One module at a time.
- One workflow at a time.
- Update docs in the same pass as behavior changes.
- Avoid large architecture rewrites unless the roadmap explicitly calls for one.

## Doc Size

Keep docs flat until the app earns more structure.

- Prefer updating `README.md` or `ROADMAP.md`.
- Do not create module folders for early ideas.
- Split a module into its own spec only when it has independent state, multiple files, non-obvious behavior, or enough detail that README becomes hard to scan.

## Completion Checklist

Before calling a task done:

- The app behavior matches the relevant README section.
- For UI-facing changes, verify behavior through the Codex in-app Browser on localhost when browser automation is available.
- Any new rule or workflow is documented.
- The roadmap status still makes sense.
- No old note has silently become the new source of truth.

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

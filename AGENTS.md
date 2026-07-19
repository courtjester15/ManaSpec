# ManaSpec Agent Instructions

## Browser QA

For standard ManaSpec browser QA, follow `docs/WORKFLOW.md`.

- Serve the vanilla app from the project root with `python -m http.server 8000`.
- Open `http://127.0.0.1:8000/index.html` in the Codex in-app Browser.
- Do not use `file://` for the standard vanilla QA path.
- Do not substitute inline `node -e` scripts, Node static servers, hidden `Start-Process` server launches, or other ad hoc servers unless the documented Python server genuinely fails or the project docs have changed.
- Do not ask whether to open the local QA URL when ManaSpec browser testing is requested.
- Confirm the local QA URL responds before troubleshooting browser behavior.
- Report console errors, UI failures, screenshots when relevant, and verification results.

React spike development, preview, and portable-file checks have separate requirements. Follow `docs/DEPLOYMENT.md`, `docs/REACT_MIGRATION_NOTES.md`, and `docs/WORKFLOW.md` for those cases instead of applying the standard vanilla QA path blindly.

## Engineering Execution Briefs

For implementation work, follow `docs/standards/APEX_ENGINEERING_EXECUTION_BRIEF_STANDARD.md` and begin with `docs/templates/IMPLEMENTATION_BRIEF_TEMPLATE.md`.

- Use Small, Standard, or High-Risk depth in proportion to the work.
- Treat the brief as the approved implementation plan, not as the completion or validation log.
- Keep actual validation results and completion evidence in the project's designated progress, history, or handoff record.

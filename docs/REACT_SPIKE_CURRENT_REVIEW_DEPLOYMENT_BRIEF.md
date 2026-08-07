# Current React Spike Review Deployment

## Metadata

- **Status:** Corrective deployment in progress
- **Date:** 2026-08-06
- **Brief Size:** Small
- **Related Documents / Issues:** Issue #11; `docs/DEPLOYMENT.md`; `docs/REACT_SPIKE_PROGRESS.md`

This brief is an implementation plan, not an implementation log. Record completed work, deviations, validation results, and evidence in the project's designated completion record.

## 1. Objective

Publish the committed `react-spike/` artifact from `codex/react-modernization-integration` to the repository's existing GitHub Pages branch source so reviewers see the approved current Issue #11 implementation rather than the stale July artifact. Repair the incomplete first upload and add an integrity gate for future artifact-only deployments.

## 2. Background

GitHub Pages serves the root of `main`. Before the first Issue #11 review deployment, its `react-spike/index.html` referenced `index-C0BGTNfh.js` and `index-CZpdjZgv.css`, originally published by commit `2640f48430a4c3947305a0b7631dd6018399c27b`. The integration branch instead contains `index-DhItT0pw.js` and `index-D8hpU8Tb.css`. Issue #11 pull requests targeted the integration branch, so branch-based Pages did not receive their generated artifact automatically.

The first deployment commit, `8cf49d4`, used an API upload path whose captured base64 payload was truncated. The HTML referenced the intended hashes, but the deployed JavaScript and CSS were only about 30 KB and the React application could not start. The corrective deployment must use Git's normal binary-safe object transfer and must verify artifact contents, JavaScript syntax, and rendered application startup.

## 3. Scope

### In Scope

- Publish the integration branch's tracked `react-spike/` entry point and hashed JS, CSS, and source-map files through a deployment-only branch based on `main`.
- Add a committed artifact manifest plus CI validation that detects missing, changed, or syntactically invalid generated files.
- Verify the deployed entry point references the current asset names, both assets are complete, and the React root renders.
- Compare the exact deployed current React build with the locally served vanilla application.

### Out of Scope

- Any change to React source, shared Tabulator behavior, Issue #11 route markup, or layout CSS.
- Any rollback or parity rewrite.
- Changes to the vanilla application.

## 4. Existing Architecture

GitHub Pages uses branch publishing from the repository root. Vanilla remains at `/ManaSpec/`; the committed React review artifact lives under `/ManaSpec/react-spike/`.

## 5. Existing Research / Decisions

- `docs/DEPLOYMENT.md`
- `docs/REACT_MIGRATION_NOTES.md`
- `docs/WORKFLOW.md`

## 6. Assumptions

- The tracked integration artifact is the approved review build.
- Existing image assets on `main` are unchanged and reusable.

## 7. Dependencies

- GitHub Pages branch publishing must remain enabled for `main` at the repository root.

## 8. Risks

- **Risk:** Publishing the wrong or incomplete branch artifact would repeat the stale/broken-review problem.
  - **Mitigation:** Compare canonical file hashes in CI, validate JavaScript syntax, and require a rendered-DOM browser smoke after deployment.
- **Risk:** Scope expansion could alter the approved UI.
  - **Mitigation:** Limit the commit to generated `react-spike/` files and this brief.

## 9. Constraints

- Do not modify the Issue #11 implementation.
- Do not include local QA files or `static-server.mjs`.
- Preserve the vanilla root and existing Pages configuration.

## 10. Likely Files to Review

- `docs/DEPLOYMENT.md`
- `docs/WORKFLOW.md`
- `react-spike/index.html`
- `react-app/package.json`

## 11. Likely Files to Modify

- `react-spike/index.html`
- `react-spike/assets/index-DhItT0pw.js`
- `react-spike/assets/index-DhItT0pw.js.map`
- `react-spike/assets/index-D8hpU8Tb.css`
- `react-spike/artifact-manifest.json`
- `tools/check-react-spike-artifact.mjs`
- `.github/workflows/react-spike-artifact.yml`
- `docs/REACT_SPIKE_CURRENT_REVIEW_DEPLOYMENT_BRIEF.md`

## 12. Implementation Expectations

- Copy generated files exactly from the integration branch's tracked artifact using normal Git object transfer.
- Use a deployment-only branch and pull request to `main`.
- Leave old hashed files removable as part of the same generated-artifact refresh.
- Treat HTTP 200 responses as insufficient; the browser smoke must confirm the React application shell renders.

## 13. Acceptance Criteria

- [ ] The public React review URL references `index-DhItT0pw.js` and `index-D8hpU8Tb.css`.
- [ ] Both deployed assets return successfully.
- [ ] The deployed assets match the committed manifest and JavaScript syntax validation passes.
- [ ] The public page renders the React application shell rather than only the static document title/root placeholder.
- [ ] The vanilla root remains available.
- [ ] No React source or Issue #11 layout file changes.
- [ ] Visual comparison uses this exact deployed build.

## 14. Validation Plan

### Functional

- Run React tests, lint, format check, and Pages build.
- Confirm the committed artifact passes `node tools/check-react-spike-artifact.mjs`.
- Confirm the public entry point and complete hashed assets load.

### Visual / Responsive

- Compare deployed React and locally served vanilla at approximately 1366 by 768, focusing on Signals, Transactions, and History.

### Regression / Compatibility

- Confirm the vanilla root still loads, the React application shell renders, route navigation works, and browser consoles remain clean.

### Quality and Edge Cases

- Confirm the deployment commit contains only generated review files and this brief.

## 15. Documentation Updates

This brief records the deployment correction. No product behavior documentation change is expected.

## 16. Deliverables

- [ ] Current review artifact published
- [ ] Deployment commit and correct URL reported
- [ ] Exact deployed hashes verified
- [ ] Current-build visual comparison completed

## 17. Suggested Commit

`deploy: refresh React spike review build`

## 18. Recommended Next Task

Reassess the visual-regression hypothesis using the current deployed build before authorizing any rollback.

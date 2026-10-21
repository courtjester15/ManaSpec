# React Integration Promotion Preparation

## Metadata

- **Status:** Completed
- **Date:** 2026-08-21
- **Brief Size:** High-Risk
- **Related Documents / Issues:** [PR #17](https://github.com/courtjester15/ManaSpec/pull/17), [Deployment](DEPLOYMENT.md), [React Migration Notes](REACT_MIGRATION_NOTES.md), [React Spike Progress](REACT_SPIKE_PROGRESS.md)
- **Author:** Codex with project-owner direction
- **Approver:** Project owner in the 2026-08-21 promotion-preparation request

This brief is an implementation plan, not an implementation log. Record actual reconciliation, validation, and promotion evidence in `REACT_SPIKE_PROGRESS.md` and the promotion pull request.

## 1. Objective

Prepare the accumulated React integration branch for review against `main` without deploying it. Preserve the two deployment/integrity commits already unique to `main`, reconcile and regenerate React artifacts, validate the complete branch, and open an integration-to-main promotion pull request that remains unmerged.

## 2. Background

PR #17 landed the sealed-product vertical slice on `codex/react-modernization-integration`. GitHub Pages currently publishes the repository root from `main`. Before reconciliation, integration was 31 commits and 84 files ahead of `main`, while `main` contained two integration-absent commits:

- `8cf49d4` — `deploy: refresh React spike review build`
- `74d7a27` — `Fix React spike Pages artifact and add integrity guard (#14)`

The second commit adds a manifest-backed integrity boundary that must not be lost when promoting the accumulated React work.

## 3. Scope

### In Scope

- Merge current `main` into `codex/react-modernization-integration` with history preserved.
- Preserve the root Pages configuration, artifact-integrity tooling, and deployment fixes from `main`.
- Regenerate normal, Pages, and portable React outputs from the reconciled source.
- Run full automated, build, generated-artifact, and browser checks required by active deployment guidance.
- Update completion evidence and open a reviewed promotion PR from integration to `main`.

### Out of Scope

- Merging the promotion PR.
- Changing the GitHub Pages source or promoting React as the canonical root application.
- New product features, storage migrations, dependency upgrades, or unrelated cleanup.

## 4. Existing Architecture

React source lives in `react-app/`; the tracked Pages review artifact lives in `react-spike/`; the portable artifact lives in `react-app/dist-portable/`. GitHub Pages publishes `main` from `/`. Artifact-integrity tooling on `main` guards the tracked review build against truncation or incomplete generated assets.

## 5. Existing Research / Decisions

- [Deployment](DEPLOYMENT.md) defines normal, Pages-subpath, and portable outputs.
- [React Migration Notes](REACT_MIGRATION_NOTES.md) keeps React as the forward candidate until explicit promotion.
- [Issue #16 Brief](ISSUE_16_SEALED_PRODUCT_VERTICAL_SLICE_BRIEF.md) records sealed compatibility and delivery requirements.
- The owner explicitly authorized integration preparation and explicitly prohibited merging the promotion PR.

## 6. Assumptions

- A merge commit from `main` into integration is preferable to replaying or duplicating the deployment commits.
- Generated artifacts should reflect reconciled integration source; conflict resolution must not retain stale bundle hashes.
- The promotion PR targets `main` from the same-repository integration branch.

## 7. Dependencies

- Current `main` and `codex/react-modernization-integration` refs on GitHub.
- Existing Node dependencies and documented local browser workflow.
- GitHub Pages artifact-integrity scripts introduced by #14.

## 8. Risks

- **Risk:** Main's integrity guard or Pages repair is lost during conflict resolution.
  - **Mitigation:** Inspect both commits, merge rather than overwrite history, run the guard after regeneration, and review the final main-to-integration diff.
- **Risk:** Generated Pages or portable assets do not match reconciled source.
  - **Mitigation:** Rebuild every topology once from the final source and verify all referenced assets and JavaScript syntax.
- **Risk:** Promotion unintentionally deploys before review.
  - **Mitigation:** Open the promotion pull request without merging it and verify its state.
- **Risk:** User-owned untracked files enter the promotion.
  - **Mitigation:** Stage only explicit project files and leave `static-server.mjs` plus the Issue #15 browser fixture untouched.

## 9. Constraints

- Preserve singles/sealed storage compatibility and existing local-first behavior.
- Preserve the main-only Pages integrity boundary.
- Do not rewrite branch history or force-push.
- Do not merge the promotion PR.
- Keep validation evidence separate from this plan.

## 10. Likely Files to Review

- `.github/workflows/`
- `tools/`
- `react-app/package.json`
- `react-app/tools/`
- `react-app/vite.config.js`
- `react-app/vite.portable.config.js`
- `react-spike/`
- `docs/DEPLOYMENT.md`
- `docs/REACT_SPIKE_PROGRESS.md`

## 11. Likely Files to Modify

- Conflict-resolved deployment/integrity files from `main`.
- `react-spike/` generated Pages artifact.
- `react-app/dist-portable/` generated portable artifact.
- `docs/REACT_SPIKE_PROGRESS.md` and any owning deployment documentation whose current truth changes.

## 12. Implementation Expectations

- Inspect the main-only commits before resolving conflicts.
- Preserve authored source and integrity tooling; regenerate generated bundles rather than hand-merging minified output.
- Keep commits reviewable: brief, reconciliation/artifacts, then validation evidence when changes warrant separate checkpoints.
- Review the full integration-to-main patch before publishing the promotion PR.

## 13. Acceptance Criteria

- [x] PR #17 is merged into `codex/react-modernization-integration`.
- [x] Integration contains both main-only deployment/integrity commits through a non-destructive merge.
- [x] Main's artifact-integrity guard is present and passes against regenerated artifacts.
- [x] Full tests, source policy, formatting, normal build, Pages build, portable build, and generated JavaScript checks pass.
- [x] Required browser topology loads the reconciled Pages artifact without regression.
- [x] The integration branch is pushed without user-owned untracked files.
- [x] An integration-to-main promotion PR is open with validation evidence and remains unmerged.

## 14. Validation Plan

### Functional

- Exercise the generated React review build, including sealed Search/Radar visibility and representative saved-state routes.

### Visual / Responsive

- Run the documented local Pages-subpath browser check at the required desktop viewport and inspect the console.

### Regression / Compatibility

- Run the full Node test suite, source-policy check, formatting check, normal build, Pages build, portable build, artifact-integrity guard, and generated JavaScript syntax checks.
- Confirm the vanilla root remains present and the promotion diff does not replace it.

### Quality and Edge Cases

- Verify every asset referenced by `react-spike/index.html` exists and integrity metadata matches.
- Confirm the promotion PR is open, targets `main`, originates from integration, and is not merged.

## 15. Documentation Updates

- Update `docs/REACT_SPIKE_PROGRESS.md` with actual reconciliation and validation evidence.
- Update deployment or migration guidance only if reconciliation changes current instructions.

## 16. Deliverables

- [x] Main reconciled into React integration without losing deployment protections.
- [x] Generated artifacts refreshed from final source.
- [x] Full validation and integrity checks recorded.
- [x] Reviewed integration-to-main promotion PR opened and left unmerged.

## 17. Suggested Commit

`docs(react): brief integration promotion preparation`

## 18. Recommended Next Task

Review the promotion PR, exercise the public rollback plan, and make the explicit merge/deployment decision separately.

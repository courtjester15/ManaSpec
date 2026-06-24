# ManaSpec Future CSS Audit Note

Do not execute this yet.

Park this until after the current pre-beta workflow/polish passes are done. The goal is to capture the CSS audit scope now so we do not forget it.

## Context

ManaSpec has mostly moved beyond its earliest one-page prototype. The app now has its own CSS structure and design system:

* `css/base.css`
* `css/layout.css`
* `css/forms.css`
* `css/components.css`
* `css/tables.css`

Pico CSS is still loaded from CDN in `index.html`, but it appears to be mostly historical at this point. It may still provide some baseline styling for native controls, typography, focus states, `.container`, buttons, inputs, selects, etc., but the active ManaSpec UI is largely driven by local CSS.

The recent Radar duplicate-spinner bug exposed a risk: Pico silently generated an extra spinner through `[aria-busy="true"]::before`, even though the app only had one explicit ManaSpec spinner. That bug was fixed with a scoped override, but it showed that Pico can still create hidden framework behavior that is hard to spot through normal JS/DOM search.

## Audit Goal

Run a broad CSS/system audit before true beta.

This is not a request to immediately remove Pico or rewrite CSS.

The goal is to inspect, document, and propose a staged cleanup plan.

## Audit Scope

Review:

* `index.html`
* Pico CSS CDN dependency
* `css/base.css`
* `css/layout.css`
* `css/forms.css`
* `css/components.css`
* `css/tables.css`
* any module-specific style hooks/classes used by JS

Check for:

* repeated CSS rules
* obsolete selectors
* legacy prototype styling
* rules only supporting removed UI
* overly specific overrides
* Pico-dependent styling
* Pico conflicts or hidden behavior
* duplicated spacing/button/input/table patterns
* unused loading/spinner styles
* inconsistent modal/toast/form/table spacing
* old class names that no longer match current terminology
* "card" naming where UI should now say "tile"
* dense-table no-wrap rules and whether they are consistent

## Pico-Specific Audit

Do not remove Pico immediately.

First identify what Pico still affects.

Check especially:

* buttons
* inputs
* selects
* checkboxes
* disabled states
* focus rings
* typography defaults
* tables
* `.container`
* `details` / `summary`
* modal-ish defaults
* `[aria-busy]`
* pseudo-elements like `::before` / `::after`

Compare the app with Pico on vs off before proposing removal.

If Pico is removable, propose a staged plan:

1. Identify Pico-provided behaviors still being relied on.
2. Add local ManaSpec baseline styles for any needed behavior.
3. Remove or neutralize hidden Pico behaviors.
4. Test all major screens.
5. Remove the CDN link only after verification.

## Verification Screens

If/when this audit becomes an implementation pass, verify at localhost:

* Dashboard
* Radar
* Radar search loading state
* Radar search results
* Positions
* Signals
* Transactions
* History
* Admin
* Card Detail
* Notes section inside Card Detail
* Market Check inside Card Detail
* Modals / confirmations
* Toasts
* Help drawer

Also verify table layout at 1366px width per `docs/WORKFLOW.md`.

## Rules

* Do not combine this with active workflow fixes.
* Do not remove Pico blindly.
* Do not do a broad redesign.
* Do not change app behavior unless needed to remove visual/system risk.
* Preserve ManaSpec's dense terminal feel.
* Preserve single-line table rhythm.
* Preserve the "tiles" terminology for Dashboard/context/metric UI.
* Use local commits only unless GitHub push/proxy issue is fixed.

## Suggested Output

First pass should be recommendation-only:

1. What Pico still affects.
2. What local CSS appears duplicated or obsolete.
3. What selectors/rules look risky.
4. What can safely wait until after beta.
5. What should be fixed before beta.
6. Whether Pico removal looks safe, risky, or not worth it yet.
7. Proposed staged execution batches.

## Suggested Future Commit Message

Only use this if an actual cleanup implementation happens later:

```bash
git status
git add .
git commit -m "chore: audit and clean css system"
```

If the work is Pico-specific:

```bash
git status
git add .
git commit -m "chore: remove legacy pico dependency"
```

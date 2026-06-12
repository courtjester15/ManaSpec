# ManaSpec - Beta Direction Review (2026-06-11)

## Major Realization

ManaSpec is no longer solving architecture problems.

The major workflows exist:

* Dashboard
* Radar
* Positions
* Signals
* History
* Card Detail

The current phase is workflow discovery and attention management.

The question is no longer:

"Can the app track a spec?"

The question is:

"How does the app help a user manage 50-300 specs without missing opportunities?"

---

# What ManaSpec Is Becoming

ManaSpec is not a live trading terminal.

ManaSpec is not a collection tracker.

ManaSpec is becoming a decision-management system for MTG finance.

The user owns:

* Thesis
* Conviction
* Strategy

ManaSpec owns:

* Organization
* Reminders
* Targets
* Review prompts
* Attention allocation

The app's job is not to tell the user what to buy.

The app's job is to tell the user:

"What deserves attention right now?"

---

# Dashboard vs Signals

This became much clearer after reviewing the current implementation.

## Dashboard

Dashboard answers:

"What is happening?"

Examples:

* Cash
* Position Value
* Open P/L
* Radar Count
* Position Count
* Transactions
* Winners
* Losers
* Recent Activity
* Targets Approaching

Dashboard is portfolio awareness.

---

## Signals

Signals answers:

"What should I do next?"

Examples:

* Entry Hit
* Exit Hit
* Approaching Target
* No Plan

Current implementation already supports this direction.

The opportunity is expansion, not replacement.

---

# Signals V2 Direction

Current Signals are mostly target-based.

Future Signals should become broader attention management.

Potential signal categories:

## Plan Signals

* No Plan
* Missing Exit
* Missing Entry
* Missing Hold

## Target Signals

* Entry Hit
* Exit Hit
* Approaching Entry
* Approaching Exit

## Review Signals

* No Market Check
* Stale Market Check
* High Conviction + Stale
* Near Exit + Stale

## Workflow Signals

* Newly Purchased
* Thesis Missing
* Never Reviewed

The goal is not more data.

The goal is identifying what deserves attention.

---

# The 300 Spec Problem

Important realization:

The user should NEVER be expected to review 300 specs.

The app should reduce:

300 specs

into

10-20 specs that deserve attention tonight.

Examples:

* 12 specs not reviewed in 45 days
* 4 specs approaching exits
* 3 specs with no plan
* 6 high-conviction specs with stale market checks

This is likely one of the strongest value propositions ManaSpec can offer over spreadsheets.

---

# Market Check Re-Evaluation

Current Market Check stores:

* Seller Count
* Market Price
* Buylist
* Check Date

The current model treats Market Check as a snapshot.

The future model should treat Market Check as history.

Example:

6/01
420 sellers
$19.50
$14 buylist

6/15
390 sellers
$21.00
$16 buylist

7/01
364 sellers
$22.09
$17 buylist

No scraping required.

No TCG API required.

The user already provides the data.

ManaSpec simply preserves prior observations.

---

# Freshness Is More Important Than Expected

Freshness is not merely informational.

Freshness measures confidence.

Examples:

Updated Today
→ High confidence

Updated 14 Days Ago
→ Medium confidence

Updated 60 Days Ago
→ Low confidence

A stale thesis may be acceptable.

A stale market check is dangerous.

This naturally creates future Signals.

---

# Trends Without Scraping

Important realization:

Trend data does not require automated market collection.

If Market Checks are stored historically, ManaSpec can calculate:

* Seller change
* Price change
* Buylist change

between observations.

Examples:

Price
$22.09 (+$0.59)

Buylist
$17.00 (+$1.00)

Sellers
364 (-26)

This provides meaningful finance context while remaining fully user-driven.

---

# Card Detail Re-Evaluation

Card Detail is not a card-information modal.

It is a Spec Workspace.

The card itself is context.

The workflow is:

* Review Plan
* Review Market Check
* Review Evaluation
* Review Thesis
* Decide what to do

Current navigation still appears correct:

* Row Click → Card Detail
* Card Image → Art/Image View

No immediate reason exists to add additional detail buttons.

Focus should remain on workflow clarity and layout quality.

---

# Card Detail Usage Hierarchy

Based on current testing:

Most important information:

1. Current Price
2. Plan
3. Market Check
4. Market Evaluation
5. Thesis
6. Oracle

Oracle still belongs in the app because this is a Magic product.

However, Oracle appears to be a supporting reference rather than a primary workflow surface.

---

# Thesis Re-Evaluation

Current conclusion:

Do not remove Thesis.

Do not prioritize Thesis.

Thesis appears valuable as stored reasoning.

However, daily workflow is increasingly centered around:

* Plan
* Market Check
* Evaluation
* Signals

Rather than repeatedly reviewing thesis notes.

Continue observing actual usage before making structural changes.

---

# Current Module Direction

Dashboard

* What is happening?

Radar

* What should I buy?

Positions

* What do I own?

Signals

* What needs attention?

Card Detail

* What should I do about this specific spec?

History

* What happened?

Thesis

* Why did I care?

This is currently a coherent workflow model.

---

# Tomorrow's Focus

Do NOT add major new features.

Continue beta workflow testing.

Primary questions:

1. Does Signals feel like an attention-management layer?

2. How should stale Market Check data be surfaced?

3. How much Market Check history is needed before trends become useful?

4. Does Dashboard naturally become the user's starting screen?

5. Does Card Detail match actual usage priorities?

6. Which signals would genuinely cause a user to review a position?

Continue:

Test
→ Find Friction
→ Batch Fix
→ Verify
→ Commit

The biggest discovery from this review is not a new module.

The biggest discovery is that Signals is likely the system that solves the "too many specs, not enough attention" problem.

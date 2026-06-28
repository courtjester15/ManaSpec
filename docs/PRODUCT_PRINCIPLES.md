# ManaSpec Product Principles

This document explains how to think about building ManaSpec.

It is product philosophy, not implementation guidance. These principles should change rarely. Roadmaps, architecture, and UI details can evolve; this document should still describe the product's center of gravity.

## Workflow Before Features

ManaSpec exists to improve the user's speculation workflow. A smoother decision loop is usually more valuable than another feature. Prefer work that helps the user find, evaluate, track, review, and learn from specs with less friction.

## Make The User Right

The interface should reduce avoidable mistakes. Good ManaSpec workflows guide users toward correct actions through clear ownership, confirmations, context, and feedback instead of depending on perfect memory.

## The App Organizes. The User Decides.

ManaSpec surfaces information, structure, reminders, and history. It does not make investment decisions. Targets, notes, conviction, and strategy belong to the user.

## One Owner For Every Piece Of Data

Each important concept should have one canonical owner. Avoid duplicated state, parallel editors, and competing sources of truth. If the same value appears in multiple places, those places should point back to the same underlying data.

## Printing Identity Matters

ManaSpec tracks exact printings because different versions of the same card can represent different opportunities. Set, collector number, finish, and printing identity are first-class product concepts, not metadata decoration.

## Radar Plans. Positions Manage.

Radar is for pre-purchase thinking: discovery, watching, entry planning, and planned quantity. Positions are for committed capital: ownership, value, exit planning, and management. The product should keep that boundary legible.

## Signals Explain

Signals are an attention layer. A useful Signal answers why it exists, why it matters, and where the user should go next. Signals should clarify action, not become another planning module.

## Card Detail Is The Command Center

Card Detail concentrates work for one exact tracked printing. The user should not need to bounce across modules simply to understand or update the plan, notes, market check, and reference context for a tracked card.

## Transactions Remember

History matters. Long term, transactions should become the durable record of what happened, while Positions become the current view computed from that record. ManaSpec should preserve enough context to review decisions later.

## Notes Belong To The Printing

Notes are accumulated user thinking about a specific tracked printing. Buying, selling, or re-buying should never accidentally destroy that memory.

## Local-First User Ownership

User data belongs to the user. ManaSpec should keep local data understandable, portable, and recoverable. Backup and restore behavior are trust features, not admin extras.

## Build For The Real Workflow

Observed friction beats imagined requirements. Prefer solving problems found through real use, beta testing, and workflow review over building hypothetical surfaces because they might be useful later.

## Dense Information Over Decorative Layouts

ManaSpec is a working terminal. The interface should favor fast scanning, compact context, and decision support over visual spectacle. Whitespace is useful when it improves understanding, not when it hides work.

## Laptop-First

The primary experience should work well around a normal laptop viewport. Larger screens can provide breathing room, but they should not require different workflows to make the product feel complete.

## Small, Reversible Improvements

Favor changes that are easy to understand, test, and revert. Large rewrites need strong evidence that they remove real friction or unlock a necessary workflow.

## Complexity Must Earn Its Place

Libraries, architecture, abstractions, workflows, and documentation should be added only when repeated use shows they solve recurring problems. ManaSpec should stay simple where simple is still working.

## Documentation Is Part Of Implementation

Project knowledge should live in the repository instead of only in chat history. Documentation preserves reasoning, boundaries, and product memory so future work starts from shared truth.

## Beta Validates Workflows

Beta is not a race to add features. Its purpose is to validate that the core speculation workflow feels natural, reliable, and trustworthy.

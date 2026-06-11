app-spec.md — ManaSpec (v1)
1. Overview

ManaSpec is a Magic: The Gathering speculation tracking and decision system.

It is designed to replace spreadsheets used by MTG finance traders by providing a structured workflow for:

finding speculative opportunities
tracking entry and exit plans
recording trades
monitoring price movement
reviewing performance over time

The system focuses on medium-to-long term speculation, with support for short-term flips.

2. Core Workflow

ManaSpec follows a simple lifecycle:

Watch an idea
user adds a card to watchlist
sets optional entry and exit targets
Open a spec (buy)
user records purchase
quantity, price, date
Track position
current price updates
gain/loss is calculated
compare against entry/exit targets
Sell position
partial or full exit
record sell price and quantity
Review
view realized profit/loss
compare outcome vs original plan
3. Core Objects
3.1 Card

Represents a Magic card.

Fields:

name
set (optional)
printing (important: multiple versions exist)
current price (optional update source)
listing count (if available)
3.2 Watch Item

Represents a speculative idea before purchase.

Fields:

card
entry target price (optional)
exit target price (optional)
notes (thesis)
status: watch / active / closed
3.3 Position

Represents an active or closed trade.

Fields:

card
quantity
entry price
entry date
exit price (if sold)
exit date (if sold)
realized / unrealized P&L
4. Core Screens (UI structure)
4.1 Watchlist
list of watch items
current price vs entry target
alert when price hits entry or exit zone
4.2 Portfolio
total value
per-position profit/loss
open vs closed positions
4.3 Position Detail
entry/exit data
price history (basic)
notes / thesis
current performance
4.4 Card View
card name + printing
current price
listing count (if available)
watch + position links
5. Market Data (minimum viable)

ManaSpec tracks only what is necessary:

current price
historical price (basic chart if possible)
listing count (important)
printing-level differences (if available)

No advanced modeling required in v1.

6. Key Rules
Every trade must be linked to either a Watch or a Position
Printing matters (same card can behave differently per version)
Entry and exit targets are optional but recommended
System is not predictive — it is tracking + decision support
User is responsible for strategy decisions
7. Core Principle

ManaSpec does NOT make trading decisions.

It provides:

structured visibility into MTG speculative trades and performance

8. Data Philosophy
price is primary signal
listings are secondary signal (liquidity context)
notes are user-driven thesis (not system-generated)
performance is always based on real entry/exit data
9. v1 Goal

v1 is successful if:

user can track all specs without spreadsheets
user can see portfolio profit/loss clearly
user can monitor watchlist entry/exit levels
user can record buys and sells cleanly
system remains simple and fast to use
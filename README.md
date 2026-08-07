# Ledgerline

A tax-preparation workspace built for the GGCPA AI Engineer case study.

The whole thing is organized around one goal: a preparer should be able to trust every number
on a return, because they can see where it came from and change it if it's wrong.

Live demo: https://ggcpa-case-study-nu.vercel.app

The best place to start is the dashboard, then open the Marcus & Elena Delgado return
(`RET-2041`). That's the one I built out in full detail.

## What it covers

I picked four of the challenges and tried to make them one product instead of four separate
demos. They mostly come together on the return workbench.

**Source-document traceability.** Click any figure on the Delgado return and the right panel
shows where it came from: the source form with the exact box highlighted, the page it was read
from (e.g. p.4/6 with the section name), and any math applied on the way (summing two W-2s,
capping SALT at $10,000, and so on). The Documents page shows the same links in reverse, from a
document to the return lines that depend on it.

**Clickable vs. editable.** Every value carries three pieces of state: where it came from, how
much to trust it, and what you're allowed to do with it. Those render the same way on the
dashboard, the workbench, and the documents list. There's a Legend button in the header that
lays out the whole vocabulary, and anything locked says why it's locked.

**Trustworthy AI.** Each AI value shows a confidence level, a short rationale, the evidence it
used, and any concern. There are two ways to correct it: override the value directly with a
reason, or (when the AI wants to change something itself) approve or reject its proposal.
Nothing the AI proposes takes effect until a person signs off, and every decision is logged.

**Actionable dashboard.** 242 returns, ranked by a scoring function that also tells you why each
one is where it is. Three views: my own queue, the whole firm, and a manager view with
per-preparer workload. Search, stage filters, and pagination keep it workable at that volume.

The one interaction worth clicking through: on `RET-2041`, open *Estimated tax payments*. The
client reported $6,000 in estimated payments but the AI only found $4,500 on the IRS transcript,
so it proposes lowering it. Approve the change and the refund drops from $10,818 to $9,318 on the
spot, because the totals are actually computed rather than stored.

A couple of the other challenges show up along the way: status/progress (the six-step tracker,
worded differently for firm vs. client) and navigation (breadcrumbs, deep links like
`?field=f-cap-gains`, jumping from a document to the line it feeds).

## The field model

Rather than a pile of booleans, each field is described by three independent things:

- **Provenance**: where the value came from (`ai`, `client`, `human`, `carryforward`, `calculated`)
- **Affordance**: what you can do with it (`editable`, `readonly`, `calculated`)
- **Verification**: how much to trust it (`unverified`, `verified`, `awaiting_approval`, `flagged`)

Most of what the UI needs to say is a combination of these. An AI figure a reviewer confirmed is
`ai + editable + verified`. A statutory amount is `carryforward + readonly + verified`. An AI
change nobody has approved is `client + editable + awaiting_approval`. Keeping the axes separate
is what lets one set of components render every case consistently.

## Firm view vs. client view

The toggle at the top right of a return switches audiences. In client view the confidence
scores and internal flags come off, "unverified" becomes "in progress," and the status wording
softens (staff see "reviewer is checking the return," the client sees "a senior reviewer is
double-checking everything"). Same data underneath.

## What's real and what's faked

Since the brief asks, here's the split.

Real:

- All the UI and interaction: selecting fields, inline overrides, verify/flag/ask, the
  approve/reject flow, the audience toggle, scope switching, search, filters, sorting, paging.
- The return math in `lib/compute.ts`. Total income, AGI, itemized deductions, bracket tax and
  the refund are computed from their inputs, so an override or an approved change moves the
  totals. (The bracket table is a simplified 2025 MFJ schedule, not a real tax engine.)
- The prioritization in `lib/prioritize.ts`: the score and the "reason" chips are computed, and
  the manager view aggregates per-preparer load from the same data.
- The traceability links. Fields point at specific document boxes and pages; the documents page
  builds the reverse index at runtime.

Faked, on purpose:

- **The AI.** No model. `lib/mockAI.ts` returns a canned response after a short delay so the
  "re-run AI check" button does something. Confidence scores, rationales, evidence and the
  proposed correction are written by hand in `lib/data.ts`.
- **The documents.** No OCR. The W-2 / 1099 / 1098 / K-1 forms are React components drawn from
  fixed values. Page numbers are authored, not detected.
- **The book of business.** One return is modeled by hand; the other ~240 come from a seeded
  generator in `lib/generate.ts` so the volume is realistic and the render is deterministic
  (using `Math.random` or `Date.now` here would break server/client hydration). "Today" is
  pinned to 2026-08-05 so the deadlines don't drift.
- **Data and auth.** No database, no login. "Priya Anand" is a fixed user.
- Overrides and approvals live in React state; nothing is persisted.

## Notes on the look

I wanted it to read like professional tax software, not a demo landing page: neutral off-white
canvas, dense tables, one blue accent, IBM Plex, tabular figures for anything numeric. The
flagship return is built out with enough variety to be worth poking at (a flagged low-confidence
capital gain, the SALT cap, a figure summed from two W-2s, client-stated values with no backup,
locked statutory amounts). The rest of the returns show the lighter status/overview screen.

## Running it

```bash
npm install
npm run dev
```

Needs Node 20.9+ (built on 24).

Stack: Next.js 16 (App Router), React 19, Tailwind v4, lucide-react. No backend.

## Layout

```
lib/types.ts            domain types + the three-axis field model
lib/data.ts             the flagship return, its documents, and the featured returns
lib/generate.ts         seeded generator for the rest of the book of business
lib/compute.ts          return math (totals, brackets, refund) and the derivations shown in the UI
lib/prioritize.ts       dashboard scoring and the manager rollup
lib/mockAI.ts           stand-in for a model call
lib/status.ts           the six-step status vocabulary, per audience
components/affordance.tsx        the shared badges/marks for field state
components/legend-popover.tsx    the header legend
components/dashboard.tsx         the dashboard (three views)
components/documents-library.tsx documents + reverse traceability
components/return/return-view.tsx  the workbench (field list + inspector + header)
components/return/inspector.tsx    traceability, AI panel, corrections, approvals
components/return/document-view.tsx  the rendered source forms
```

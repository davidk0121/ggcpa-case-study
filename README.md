# Ledgerline — Return Workbench

A prototype for the **GGCPA AI Engineer case study**. Ledgerline is a tax‑preparation
workspace built on one idea: **every number on a return should trace back to the document it
came from, and every AI decision should be inspectable and correctable.**

**Live demo → https://ledgerline-theta.vercel.app**

Start on the dashboard, then open the **Marcus & Elena Delgado** return (`RET-2041`) — that's
the deep, fully‑wired workbench.

---

## Challenges covered

I chose four challenges that form one coherent product rather than four disconnected demos.
They all meet on a single screen — the return workbench — which is where an AI Engineer's work
actually has to earn trust.

| # | Challenge | Where to see it |
|---|-----------|-----------------|
| **01** | **Source‑document traceability** | Open any figure on `RET-2041`. The right pane shows the exact source form, the originating box highlighted, **the exact page** it was read from (`p.4/6`, plus the section name), and the transformation applied (e.g. "Sum of Box 1 across 2 W‑2s", "SALT capped at $10,000"). The Documents screen traces the same links in reverse. |
| **08** | **Clickable vs. editable affordances** | Three orthogonal axes (below) render identically on the dashboard, the workbench, and the documents library. A **Legend** button in the header explains the whole system on every screen. Locked values always state *why* they're locked. |
| **10** | **Trustworthy AI** | Confidence meter, plain‑language rationale, evidence bullets, and specific concerns. Two correction paths: direct override with a reason, and an **approval workflow** where the AI proposes a change that does nothing until a human approves it. Every decision lands in an audit trail. |
| **07** | **Actionable dashboard** | 242 returns ranked by a real prioritization function that explains *why*. Three lenses: **My queue** (individual preparer), **All firm**, and **Manager** (per‑preparer load, overdue, flags). Search, stage filters, and pagination keep it usable at volume. |

**The approval demo worth clicking:** open `RET-2041` → *Estimated tax payments*. The AI found
only 3 of 4 estimated payments on the IRS transcript and proposes $6,000 → $4,500. Approving it
changes the value, clears the badge, writes the audit trail, and **recomputes the refund live
from $10,818 to $9,318** — because the calculated lines are genuinely derived, not hardcoded.

Two more challenges are partially demonstrated because they fell out naturally:
**06 (status/progress)** via the audience‑aware 6‑step tracker, and **04 (navigation)** via
breadcrumbs, deep links (`/returns/RET-2041?field=f-cap-gains`), the Documents→workbench jump,
and the clickable calculation‑input chips.

---

## The one idea worth stealing: a 3‑axis affordance model

Instead of a tangle of boolean flags, every field is described by three **orthogonal** axes.
Everything the case study asks the UI to communicate is a combination of these:

- **Provenance** — where the value came from: `ai` · `client` · `human` · `carryforward` · `calculated`
- **Affordance** — what you can do: `editable` · `readonly` · `calculated`
- **Verification** — how much to trust it: `unverified` · `verified` · `awaiting_approval` · `flagged`

So "an AI‑extracted figure a reviewer confirmed" is `ai + editable + verified`, while "a
statutory value you can't change" is `carryforward + readonly + verified`, and "an AI change
the firm hasn't signed off on" is `client + editable + awaiting_approval`. One model,
consistent rendering everywhere (dashboard, field list, inspector, documents library) — and
the header **Legend** makes it self‑documenting rather than something to reverse‑engineer.

---

## Firm view vs. Client view

The audience toggle (top‑right of a return) proves the same data can serve two very different
readers without a second product. In **Client view**, AI confidence percentages and internal
flags disappear, "Unverified" becomes "In progress," and status copy switches from
"Reviewer is checking the return" to "A senior reviewer is double‑checking everything." Same
underlying return, appropriate detail per audience.

---

## What's real vs. simulated

Honest breakdown, since the brief asks for it.

**Genuinely wired up (real code):**
- All UI, interaction, and state: field selection, inline override, verify/flag/ask, the
  **approve/reject** workflow, the audience toggle, scope switching, search, stage filters,
  sorting, and pagination.
- **Return math** (`lib/compute.ts`) — total income, AGI, itemized deductions, bracket tax,
  and the refund are *computed from their inputs*, not hardcoded. Override a figure or approve
  an AI change and the totals move. (The bracket table is a simplified 2025 MFJ schedule — it
  is not a production tax engine.)
- **Prioritization logic** (`lib/prioritize.ts`) — a real scoring function (deadline pressure,
  ownership, open flags, quick‑wins) plus a manager rollup that aggregates per‑preparer load.
  The ranking and the "reason" chips are computed, not hardcoded.
- **Traceability linking** — fields reference specific document boxes and pages; selecting a
  field renders the matching form with that box highlighted. The Documents screen derives the
  reverse index (document → return lines) from the same data at runtime.
- Status model, formatting, and the affordance system.

**Simulated / faked (by design — the brief says to):**
- **The AI.** There is no model. `lib/mockAI.ts` is a stub that returns a plausible response
  after a short fake delay to power the "Re‑run AI check" flow. Confidence scores, rationales,
  evidence, concerns, and the proposed correction are hand‑written fixtures in `lib/data.ts`.
- **Documents.** No OCR or parsing. The W‑2 / 1099 / 1098 / K‑1 forms are React components
  rendered from hardcoded box values (`components/return/document-view.tsx`). Page numbers are
  authored data, not detected.
- **The book of business.** One flagship return is modeled line‑by‑line; the other ~240 are
  generated by a **seeded** PRNG (`lib/generate.ts`) so volume is realistic and the render is
  deterministic — no `Math.random`/`Date.now`, which would break SSR hydration. "Today" is
  pinned to 2026‑08‑05 so every deadline in the demo is stable.
- **Data & auth.** No database, no real users, no login. "Priya Anand (Preparer)" is fixed.
- Corrections and approvals update in‑memory React state only; they are not persisted.

---

## Design notes

- **Deliberately not the generic AI‑demo look.** Warm‑neutral canvas, dense data tables, a
  single ink‑blue accent, IBM Plex, tabular figures. No purple gradients, no emoji, no vanity
  stat cards. It should read like professional tax software, not a landing page.
- **The flagship is deep, the rest is broad.** One return (`RET-2041`) is built line‑by‑line so
  the core interactions are testable against real variety — a low‑confidence flagged capital
  gain, a SALT cap, a multi‑source sum, client‑stated values with no backup, locked statutory
  amounts. Other returns show the status/overview surface.

---

## Run locally

```bash
npm install
npm run dev
```

Then open the dev URL it prints. Requires Node ≥ 20.9 (built on Node 24).

## Tech

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 (CSS `@theme` tokens) · lucide‑react.
No backend.

## Where to look

```
lib/types.ts            # the 3-axis field model + domain types
lib/data.ts             # flagship return, documents, featured returns (all mock)
lib/generate.ts         # seeded generator for the ~240-return tail (07)
lib/compute.ts          # real return math — totals, brackets, refund
lib/prioritize.ts       # ranking logic + manager rollup (07)
lib/mockAI.ts           # the simulated AI stub (10)
lib/status.ts           # audience-aware status vocabulary (06)
components/affordance.tsx           # the interaction visual language (08)
components/legend-popover.tsx       # the always-available legend (08)
components/dashboard.tsx            # actionable dashboard, 3 lenses (07)
components/documents-library.tsx    # documents + reverse traceability (01/08)
components/return/return-view.tsx   # the workbench shell
components/return/inspector.tsx     # traceability + AI + approvals (01/10)
components/return/document-view.tsx # highlightable fake tax forms (01)
```

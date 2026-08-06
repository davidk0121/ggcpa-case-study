# Ledgerline — Return Workbench

A prototype for the **GGCPA AI Engineer case study**. Ledgerline is a tax‑preparation
workspace built on one idea: **every number on a return should trace back to the document it
came from, and every AI decision should be inspectable and correctable.**

**Live demo → https://ggcpa-case-study-nu.vercel.app**

Start on the dashboard, then open the **Marcus & Elena Delgado** return (`RET-2041`) — that's
the deep, fully‑wired workbench.

---

## Challenges covered

I chose four challenges that form one coherent product rather than four disconnected demos.
They all meet on a single screen — the return workbench — which is where an AI Engineer's work
actually has to earn trust.

| # | Challenge | Where to see it |
|---|-----------|-----------------|
| **01** | **Source‑document traceability** | Open any figure on `RET-2041`. The right pane shows the exact source form with the originating box highlighted, plus the transformation applied (e.g. "Sum of Box 1 across 2 W‑2s", "SALT capped at $10,000"). |
| **08** | **Clickable vs. editable affordances** | Every field carries a consistent visual language for *where it came from*, *what you can do with it*, and *whether it's trusted*. Locked, calculated, editable, AI‑generated, verified, and flagged states are all visibly distinct. |
| **10** | **Trustworthy AI** | Each AI value shows a confidence meter, plain‑language rationale, evidence bullets, and — when relevant — a specific concern. "Re‑run AI check" and the correction controls (Verify / Edit / Flag / Ask client) live right next to it. |
| **07** | **Actionable dashboard** | The landing page ranks returns by a real prioritization function and explains *why* each item is where it is. It answers "what should I work on right now?" |

Two more challenges are partially demonstrated because they fell out naturally:
**06 (status/progress)** via the audience‑aware 6‑step tracker, and **04 (navigation)** via
breadcrumbs, deep links, and the clickable calculation‑input chips.

---

## The one idea worth stealing: a 3‑axis affordance model

Instead of a tangle of boolean flags, every field is described by three **orthogonal** axes.
Everything the case study asks the UI to communicate is a combination of these:

- **Provenance** — where the value came from: `ai` · `client` · `human` · `carryforward` · `calculated`
- **Affordance** — what you can do: `editable` · `readonly` · `calculated`
- **Verification** — how much to trust it: `unverified` · `verified` · `flagged`

So "an AI‑extracted figure a reviewer confirmed" is `ai + editable + verified`, while "a
statutory value you can't change" is `carryforward + readonly + verified`, and "an AI figure
with a problem" is `ai + editable + flagged`. One model, consistent rendering everywhere
(dashboard, field list, inspector).

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
- All UI, interaction, and state: field selection, inline editing/override, verify/flag/ask
  actions, the audience toggle, dashboard scope + stage filters, and search — all functional.
- **Prioritization logic** (`lib/prioritize.ts`) — a real scoring function over the mock
  dataset (deadline pressure, ownership, open flags, quick‑wins). The ranking and the "reason"
  chips are computed, not hardcoded.
- **Traceability linking** — return fields reference specific document boxes; selecting a field
  renders the matching (fake) form with that box highlighted. The relationships are real data
  structures, just hand‑authored.
- Status model, formatting, and the affordance system.

**Simulated / faked (by design — the brief says to):**
- **The AI.** There is no model. `lib/mockAI.ts` is a stub that returns a plausible response
  after a short fake delay to power the "Re‑run AI check" flow. Confidence scores, rationales,
  evidence, and concerns are hand‑written fixtures in `lib/data.ts`.
- **Documents.** No OCR or parsing. The W‑2 / 1099 / 1098 / K‑1 forms are React components
  rendered from hardcoded box values (`components/return/document-view.tsx`).
- **Data & auth.** One flagship return is modeled in full depth; ~10 others carry enough
  metadata to drive the dashboard. No database, no real users, no login. "Priya Anand
  (Preparer)" is a fixed identity.
- Corrections update in‑memory React state only; they are not persisted.

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
lib/data.ts             # flagship return, documents, dashboard returns (all mock)
lib/prioritize.ts       # real dashboard ranking logic
lib/mockAI.ts           # the simulated AI stub
lib/status.ts           # audience-aware status vocabulary
components/affordance.tsx        # the interaction visual language (Challenge 08)
components/return/return-view.tsx  # the workbench shell
components/return/inspector.tsx    # traceability + AI + corrections (01/10)
components/return/document-view.tsx # highlightable fake tax forms (01)
components/dashboard.tsx           # actionable dashboard (07)
```

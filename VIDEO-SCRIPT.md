# Video walkthrough script

Target: **6–8 minutes**. Screen recording with narration. Not for submission — a crib sheet.

Open with the deployed link, browser at a normal desktop size. Speak to *decisions*, not
features: they can see the features.

---

## 0 · Framing (30s)

> "I'm building a tax platform from scratch. I picked four challenges that all meet on one
> screen — traceability, affordances, trustworthy AI, and the dashboard — because for an AI
> product those aren't separate problems. A CPA either trusts the number in front of them or
> they re-derive it by hand, and that's decided by the interface.
>
> One thing I decided up front: this should look like professional tax software, not a demo.
> Dense tables, quiet palette, one accent color."

---

## 1 · Dashboard — Challenge 07 (90s)

Land on `/`.

> "The dashboard answers one question: what should I work on right now."

- Point at the **four tiles**: "These aren't vanity metrics. Every one maps to a decision —
  'needs you now' is firm-owned *and* due within three days. Work I can actually move."
- **"Waiting on your approval" band**: "Approvals are their own thing — the AI has proposed a
  change and nothing happens until I decide. I pulled those out of the deadline queue because
  they're a different kind of decision: fast to clear, but blocking until they are. I'll come
  back to the Delgado one." *(This is your entry point to the workbench in section 2.)*
- **Priority queue**: "Everything else is ranked by a real scoring function — deadline
  pressure, who owns the next step, open flags. And it *shows its reasoning* right here:
  'due today · 5 open flags.' I never wanted a black-box ranking."
- Call out: "Returns waiting on the *client* get pushed **down**. I can't move them, so they
  shouldn't top my list."
- Scroll to the table → **242 returns**, use search, a stage filter, pagination.
  > "The brief asked for this to survive someone owning hundreds of returns."
- Click **Manager**.
  > "A manager is asking a different question — not 'what do I do' but 'who's underwater.'
  > Same data, per-preparer load, and the pressure formula is stated so it's auditable."

---

## 2 · The workbench — Challenges 01 + 08 (2 min)

Click **Marcus & Elena Delgado** in the approval band (or search `delgado`, press ↵).

- Header: "Six-step status tracker — I'll come back to that."
- Click **Wages**.
  > "Here's the core of traceability. This number is $181,300. Where did it come from? The
  > transformation is stated — sum of Box 1 across two W-2s — and both source forms render
  > with the exact box highlighted."
- Click **Capital gain** (the flagged one).
  > "This is the interesting one. It's built from *two different documents* — a 1099-B and a
  > 1099-DIV — and it tells me the exact page: page 4 of 6, Part II, long-term transactions.
  > A CPA can go find that page in the real PDF."
  > "And notice the document itself carries the warning: cost basis wasn't reported for 3 of
  > 11 lots. That's why confidence is 61%."

**Now open the Legend** (header, top right).

> "Challenge 8 was a consistent system for what's clickable versus editable. I didn't want a
> pile of boolean flags, so everything is described by three *independent* axes: where a value
> came from, how much to trust it, and what you can do with it.
>
> That's why a statutory amount and an AI extraction can both be 'verified' but look and
> behave differently. And the legend is on every screen — the system documents itself."

Click **Standard deduction**: "Locked — and it says *why*. I made lock reasons mandatory in
the data model. Locking someone out without an explanation is how you lose trust."

---

## 3 · Trustworthy AI + approvals — Challenge 10 (2 min)

Click **Estimated tax payments**. *(This is the showpiece — take your time.)*

> "This is my favorite interaction. The client said they made four quarterly payments —
> $6,000. The AI checked the IRS transcript and only found three. So it's proposing to lower
> this to $4,500."

- Point at the **approval panel**: "Current, proposed, and the dollar impact. It states the
  reasoning, and it's honest about the risk — a payment made close to the deadline can post
  late, so confirm before accepting."
- **Key point:**
  > "The critical design decision: nothing has happened yet. The AI can *propose*, but it
  > can't change a number on a tax return. 'Awaiting approval' is a real state in the model,
  > not a styling variant."
- Note the refund on the header: **$10,818**.
- Click **Approve change**.
  > "Value updates, badge flips to verified, it writes an audit trail — and watch the refund:
  > $10,818 down to $9,318. The calculated lines are genuinely derived, so approving a change
  > ripples through AGI, tax, and the refund immediately. Nothing here is hardcoded."
- Mention the other correction path: "There's also a direct override with a required reason,
  and 'Ask the client' when the right move is a question, not a decision."
- Optionally hit **Re-run AI check**: "Simulated, obviously — it's a stub with a fake delay."

---

## 4 · Documents + navigation (60s)

Go to **Documents**.

> "Third screen, same visual language — same provenance marks, same confidence chips. That was
> the point: prove the system travels."

- Click the **1099-B**: "Needs review, 61% — consistent with the flag we just saw."
- Point at **Feeds N return lines**:
  > "This is traceability in reverse. From a document, which lines on the return depend on it?
  > That's the question you ask when an amended 1099 shows up."
- Click one → jumps straight to that field in the workbench.
  > "Deep-linked, and it lands with the field already selected. You don't lose your place."

---

## 5 · Status & audience — Challenge 06 (45s)

Back on the return, hit **Client view**.

> "Same return, same data, different reader. Confidence percentages and internal flags
> disappear — a client doesn't need to know the model was 82% sure. 'Unverified' becomes 'in
> progress.' And the status copy changes: staff see 'reviewer is checking the return,' the
> client sees 'a senior reviewer is double-checking everything.'
>
> One status model, two vocabularies. That's how you stop clients and staff reading the same
> word differently."

---

## 6 · Close — what's real (45s)

> "To be clear about what's real: there's no model and no OCR. The AI is a stub returning
> fixture data, and the tax forms are React components with hardcoded values.
>
> What *is* real: the prioritization scoring, the return math — totals, brackets, refund all
> computed — the traceability graph in both directions, and every interaction you just saw.
> The 240-odd extra returns are generated by a seeded PRNG so the volume is honest and the
> render stays deterministic.
>
> It's all in the README. If I had another day I'd wire the collaboration layer, since
> 'ask the client' currently ends at the button."

---

### Notes

- Don't read the script. Bullet points on a second monitor.
- If you fumble, keep going — one take with a stumble beats four polished attempts.
- Record at 1280×800 or larger so the dense tables stay legible.
- **Refresh the page before recording** so the approval demo is un-approved and ready.

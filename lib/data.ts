import type {
  ReturnField,
  TaxDocument,
  TaxReturn,
} from "./types";
import { generateReturns } from "./generate";

/* ================================================================== *
 * FLAGSHIP RETURN — the deep traceability demo (Challenges 01/08/10) *
 * Marcus & Elena Delgado, Married Filing Jointly, TY2025.            *
 * ================================================================== */

export const FLAGSHIP_RETURN_ID = "RET-2041";

/* ----------------------------- Documents ----------------------------- */
/* Boxes are keyed by the box number/label as it appears on the form.    */

export const documents: TaxDocument[] = [
  {
    id: "doc-w2-marcus",
    type: "W-2",
    title: "W-2 — Northwind Logistics",
    issuer: "Northwind Logistics Inc.",
    receivedAt: "2026-01-28",
    pageCount: 1,
    status: "confirmed",
    extractionConfidence: 99,
    uploadedBy: "client",
    boxes: {
      e: "Marcus J. Delgado",
      employer: "Northwind Logistics Inc.",
      ein: "84-3927115",
      "1": "112,400.00",
      "2": "18,240.00",
      "3": "112,400.00",
      "4": "6,968.80",
      "5": "112,400.00",
      "6": "1,629.80",
      "16": "112,400.00",
      "17": "6,100.00",
    },
  },
  {
    id: "doc-w2-elena",
    type: "W-2",
    title: "W-2 — Brightpath Health",
    issuer: "Brightpath Health Systems",
    receivedAt: "2026-01-31",
    pageCount: 1,
    status: "confirmed",
    extractionConfidence: 98,
    uploadedBy: "client",
    boxes: {
      e: "Elena R. Delgado",
      employer: "Brightpath Health Systems",
      ein: "27-1180934",
      "1": "68,900.00",
      "2": "9,850.00",
      "3": "68,900.00",
      "4": "4,271.80",
      "5": "68,900.00",
      "6": "999.05",
      "16": "68,900.00",
      "17": "3,720.00",
    },
  },
  {
    id: "doc-1099int",
    type: "1099-INT",
    title: "1099-INT — Meridian Savings",
    issuer: "Meridian Savings Bank",
    receivedAt: "2026-02-04",
    pageCount: 1,
    status: "extracted",
    extractionConfidence: 97,
    uploadedBy: "client",
    boxes: {
      payer: "Meridian Savings Bank",
      "1": "1,240.00",
      "4": "0.00",
    },
  },
  {
    id: "doc-1099div",
    type: "1099-DIV",
    title: "1099-DIV — Harbor Funds",
    issuer: "Harbor Funds Brokerage",
    receivedAt: "2026-02-11",
    pageCount: 2,
    status: "extracted",
    extractionConfidence: 96,
    uploadedBy: "client",
    boxes: {
      payer: "Harbor Funds Brokerage",
      "1a": "4,860.00",
      "1b": "3,910.00",
      "2a": "1,150.00",
    },
  },
  {
    id: "doc-1099b",
    type: "1099-B",
    title: "1099-B — Harbor Funds",
    issuer: "Harbor Funds Brokerage",
    receivedAt: "2026-02-11",
    pageCount: 6,
    status: "needs_review",
    extractionConfidence: 61,
    uploadedBy: "client",
    boxes: {
      payer: "Harbor Funds Brokerage",
      proceeds: "42,300.00",
      basis: "38,900.00",
      basisNote: "Cost basis not reported for 3 of 11 lots",
      st_gain: "0.00",
      lt_gain: "3,400.00",
    },
  },
  {
    id: "doc-1098",
    type: "1098",
    title: "1098 — Cascade Mortgage",
    issuer: "Cascade Mortgage Co.",
    receivedAt: "2026-01-22",
    pageCount: 1,
    status: "confirmed",
    extractionConfidence: 98,
    uploadedBy: "client",
    boxes: {
      lender: "Cascade Mortgage Co.",
      "1": "18,600.00",
      "2": "0.00",
      "10": "9,400.00",
    },
  },
  {
    id: "doc-k1",
    type: "K-1",
    title: "Schedule K-1 — Delgado Design LLC",
    issuer: "Delgado Design LLC",
    receivedAt: "2026-03-02",
    pageCount: 3,
    status: "needs_review",
    extractionConfidence: 88,
    uploadedBy: "firm",
    boxes: {
      entity: "Delgado Design LLC",
      ein: "88-4410027",
      "1": "14,200.00",
      partner: "Elena R. Delgado (50%)",
    },
  },
];

export const documentsById = Object.fromEntries(
  documents.map((d) => [d.id, d]),
);

/* ----------------------------- Return fields ----------------------------- */

export const fields: ReturnField[] = [
  /* ------------------------------ Income ------------------------------ */
  {
    id: "f-wages",
    section: "Income",
    formLine: "Form 1040, Line 1a",
    label: "Wages, salaries, tips",
    value: 181300,
    provenance: "ai",
    affordance: "editable",
    verification: "verified",
    transformation: "Sum of Box 1 across 2 W-2s ($112,400 + $68,900).",
    sources: [
      {
        documentId: "doc-w2-marcus",
        boxId: "1",
        boxLabel: "Box 1 — Wages",
        rawValue: "112,400.00",
        page: 1,
      },
      {
        documentId: "doc-w2-elena",
        boxId: "1",
        boxLabel: "Box 1 — Wages",
        rawValue: "68,900.00",
        page: 1,
      },
    ],
    ai: {
      confidence: 99,
      rationale:
        "Read Box 1 from both W-2s and summed them onto the wages line.",
      evidence: [
        "Northwind Logistics — Box 1: $112,400.00",
        "Brightpath Health — Box 1: $68,900.00",
        "Both employer EINs match the client's prior-year return.",
      ],
    },
  },
  {
    id: "f-interest",
    section: "Income",
    formLine: "Form 1040, Line 2b",
    label: "Taxable interest",
    value: 1240,
    provenance: "ai",
    affordance: "editable",
    verification: "unverified",
    transformation: "Box 1 of the single 1099-INT on file.",
    sources: [
      {
        documentId: "doc-1099int",
        boxId: "1",
        boxLabel: "Box 1 — Interest income",
        rawValue: "1,240.00",
        page: 1,
      },
    ],
    ai: {
      confidence: 97,
      rationale: "Extracted interest income from the Meridian Savings 1099-INT.",
      evidence: [
        "Meridian Savings Bank — Box 1: $1,240.00",
        "No backup withholding reported (Box 4 = $0).",
      ],
    },
  },
  {
    id: "f-ord-div",
    section: "Income",
    formLine: "Form 1040, Line 3b",
    label: "Ordinary dividends",
    value: 4860,
    provenance: "ai",
    affordance: "editable",
    verification: "unverified",
    sources: [
      {
        documentId: "doc-1099div",
        boxId: "1a",
        boxLabel: "Box 1a — Ordinary dividends",
        rawValue: "4,860.00",
        page: 1,
      },
    ],
    ai: {
      confidence: 96,
      rationale: "Extracted ordinary dividends from the Harbor Funds 1099-DIV.",
      evidence: ["Harbor Funds — Box 1a: $4,860.00"],
    },
  },
  {
    id: "f-qual-div",
    section: "Income",
    formLine: "Form 1040, Line 3a",
    label: "Qualified dividends",
    value: 3910,
    provenance: "ai",
    affordance: "editable",
    verification: "verified",
    sources: [
      {
        documentId: "doc-1099div",
        boxId: "1b",
        boxLabel: "Box 1b — Qualified dividends",
        rawValue: "3,910.00",
        page: 1,
      },
    ],
    ai: {
      confidence: 98,
      rationale: "Extracted qualified dividends from the Harbor Funds 1099-DIV.",
      evidence: [
        "Harbor Funds — Box 1b: $3,910.00",
        "Qualified portion is within ordinary dividends, as expected.",
      ],
    },
  },
  {
    id: "f-cap-gains",
    section: "Income",
    formLine: "Form 1040, Line 7",
    label: "Capital gain",
    value: 4550,
    provenance: "ai",
    affordance: "editable",
    verification: "flagged",
    transformation:
      "Schedule D: brokerage net long-term gain $3,400 + $1,150 capital-gain distributions.",
    sources: [
      {
        documentId: "doc-1099b",
        boxId: "lt_gain",
        boxLabel: "Long-term gain/loss",
        rawValue: "3,400.00",
        page: 4,
        section: "Part II — Long-term transactions",
      },
      {
        documentId: "doc-1099div",
        boxId: "2a",
        boxLabel: "Box 2a — Capital gain distributions",
        rawValue: "1,150.00",
        page: 1,
      },
    ],
    ai: {
      confidence: 61,
      rationale:
        "Combined the reported brokerage long-term gain with capital-gain distributions.",
      evidence: [
        "Harbor Funds 1099-B — long-term gain: $3,400.00",
        "Harbor Funds 1099-DIV — Box 2a: $1,150.00",
      ],
      concern:
        "Cost basis was NOT reported for 3 of 11 lots on the 1099-B. The $3,400 gain may be understated until basis is confirmed with the client.",
    },
  },
  {
    id: "f-k1-income",
    section: "Income",
    formLine: "Schedule 1, Line 5",
    label: "Partnership income (K-1)",
    value: 14200,
    provenance: "ai",
    affordance: "editable",
    verification: "unverified",
    transformation: "K-1 Box 1 (ordinary business income), 50% partner share.",
    sources: [
      {
        documentId: "doc-k1",
        boxId: "1",
        boxLabel: "Box 1 — Ordinary business income",
        rawValue: "14,200.00",
        page: 2,
        section: "Part III — Partner's share of income",
      },
    ],
    ai: {
      confidence: 88,
      rationale:
        "Extracted ordinary business income from the Delgado Design LLC K-1.",
      evidence: [
        "Delgado Design LLC — Box 1: $14,200.00",
        "Elena Delgado listed as 50% partner.",
      ],
      concern:
        "K-1 arrived late (Mar 2). Confirm no amended K-1 is expected before filing.",
    },
  },
  {
    id: "f-total-income",
    section: "Income",
    formLine: "Form 1040, Line 9",
    label: "Total income",
    value: 206150,
    provenance: "calculated",
    affordance: "calculated",
    verification: "verified",
    transformation: "Sum of all income lines above.",
    inputs: ["f-wages", "f-interest", "f-ord-div", "f-cap-gains", "f-k1-income"],
    sources: [],
  },

  /* --------------------------- Adjustments --------------------------- */
  {
    id: "f-hsa",
    section: "Adjustments",
    formLine: "Schedule 1, Line 13",
    label: "HSA deduction",
    value: 4150,
    provenance: "client",
    affordance: "editable",
    verification: "unverified",
    transformation: "Client questionnaire — self-only HSA contribution.",
    sources: [],
    ai: {
      confidence: 74,
      rationale:
        "Carried the client's questionnaire answer for HSA contributions.",
      evidence: ["Client questionnaire Q14: $4,150 contributed to HSA."],
      concern:
        "No Form 5498-SA on file to confirm the amount. Client-stated only.",
    },
  },
  {
    id: "f-agi",
    section: "Adjustments",
    formLine: "Form 1040, Line 11",
    label: "Adjusted gross income",
    value: 202000,
    provenance: "calculated",
    affordance: "calculated",
    verification: "verified",
    transformation: "Total income $206,150 − adjustments $4,150.",
    inputs: ["f-total-income", "f-hsa"],
    sources: [],
  },

  /* --------------------------- Deductions ---------------------------- */
  {
    id: "f-mortgage-int",
    section: "Deductions",
    formLine: "Schedule A, Line 8a",
    label: "Home mortgage interest",
    value: 18600,
    provenance: "ai",
    affordance: "editable",
    verification: "verified",
    sources: [
      {
        documentId: "doc-1098",
        boxId: "1",
        boxLabel: "Box 1 — Mortgage interest received",
        rawValue: "18,600.00",
        page: 1,
      },
    ],
    ai: {
      confidence: 98,
      rationale: "Extracted mortgage interest from the Cascade Mortgage 1098.",
      evidence: ["Cascade Mortgage — Box 1: $18,600.00"],
    },
  },
  {
    id: "f-salt",
    section: "Deductions",
    formLine: "Schedule A, Line 5e",
    label: "State & local taxes (SALT)",
    value: 10000,
    provenance: "ai",
    affordance: "editable",
    verification: "unverified",
    transformation:
      "State income tax withheld ($9,820) + property tax ($9,400) = $19,220, CAPPED at the $10,000 SALT limit.",
    sources: [
      {
        documentId: "doc-w2-marcus",
        boxId: "17",
        boxLabel: "Box 17 — State income tax",
        rawValue: "6,100.00",
        page: 1,
      },
      {
        documentId: "doc-w2-elena",
        boxId: "17",
        boxLabel: "Box 17 — State income tax",
        rawValue: "3,720.00",
        page: 1,
      },
      {
        documentId: "doc-1098",
        boxId: "10",
        boxLabel: "Box 10 — Property taxes",
        rawValue: "9,400.00",
        page: 1,
      },
    ],
    ai: {
      confidence: 92,
      rationale:
        "Summed state withholding and property tax, then applied the $10,000 SALT cap.",
      evidence: [
        "State tax withheld: $6,100 + $3,720 = $9,820",
        "Property tax (1098 Box 10): $9,400",
        "Uncapped total $19,220 → capped to $10,000",
      ],
    },
  },
  {
    id: "f-charity",
    section: "Deductions",
    formLine: "Schedule A, Line 11",
    label: "Charitable contributions",
    value: 3200,
    provenance: "client",
    affordance: "editable",
    verification: "unverified",
    transformation: "Client questionnaire — cash gifts to qualified charities.",
    sources: [],
    ai: {
      confidence: 70,
      rationale: "Carried the client's questionnaire total for cash donations.",
      evidence: ["Client questionnaire Q9: $3,200 in cash donations."],
      concern: "No receipts uploaded for gifts over $250.",
    },
  },
  {
    id: "f-itemized",
    section: "Deductions",
    formLine: "Schedule A, Line 17",
    label: "Total itemized deductions",
    value: 31800,
    provenance: "calculated",
    affordance: "calculated",
    verification: "verified",
    transformation: "Mortgage interest $18,600 + SALT $10,000 + charity $3,200.",
    inputs: ["f-mortgage-int", "f-salt", "f-charity"],
    sources: [],
  },
  {
    id: "f-standard",
    section: "Deductions",
    formLine: "Form 1040, Line 12",
    label: "Standard deduction (MFJ)",
    value: 30000,
    provenance: "carryforward",
    affordance: "readonly",
    verification: "verified",
    transformation:
      "Statutory 2025 standard deduction for Married Filing Jointly. Itemizing ($31,800) is higher, so itemized is used.",
    lockReason:
      "Set by statute (IRC §63(c)). This amount is fixed for the filing status and cannot be edited — change the filing status to affect it.",
    sources: [],
  },

  /* ----------------------------- Credits ----------------------------- */
  {
    id: "f-ctc",
    section: "Credits",
    formLine: "Form 1040, Line 19",
    label: "Child tax credit",
    value: 4000,
    provenance: "carryforward",
    affordance: "calculated",
    verification: "verified",
    transformation: "2 qualifying dependents × $2,000 (from prior-year return).",
    sources: [],
    ai: {
      confidence: 95,
      rationale:
        "Applied the child tax credit for 2 dependents carried from last year.",
      evidence: [
        "Prior-year return listed 2 qualifying children.",
        "AGI $202,000 is below the $400,000 MFJ phase-out threshold.",
      ],
    },
  },

  /* ----------------------------- Payments ---------------------------- */
  {
    id: "f-fed-wh",
    section: "Payments",
    formLine: "Form 1040, Line 25a",
    label: "Federal tax withheld",
    value: 28090,
    provenance: "ai",
    affordance: "calculated",
    verification: "verified",
    transformation: "Sum of Box 2 across both W-2s ($18,240 + $9,850).",
    sources: [
      {
        documentId: "doc-w2-marcus",
        boxId: "2",
        boxLabel: "Box 2 — Federal income tax withheld",
        rawValue: "18,240.00",
        page: 1,
      },
      {
        documentId: "doc-w2-elena",
        boxId: "2",
        boxLabel: "Box 2 — Federal income tax withheld",
        rawValue: "9,850.00",
        page: 1,
      },
    ],
    ai: {
      confidence: 99,
      rationale: "Summed federal withholding from both W-2s.",
      evidence: [
        "Northwind Logistics — Box 2: $18,240.00",
        "Brightpath Health — Box 2: $9,850.00",
      ],
    },
  },
  {
    id: "f-est-pay",
    section: "Payments",
    formLine: "Form 1040, Line 26",
    label: "Estimated tax payments",
    value: 6000,
    provenance: "client",
    affordance: "editable",
    verification: "awaiting_approval",
    transformation: "Client questionnaire — 4 quarterly payments of $1,500.",
    proposedValue: 4500,
    proposalReason:
      "The IRS account transcript shows only 3 estimated payments posted for 2025. The Q4 payment the client reported does not appear. Lowering this reduces the refund by $1,500.",
    sources: [],
    ai: {
      confidence: 82,
      rationale:
        "Client reported 4 quarterly payments, but only 3 are on the IRS transcript — proposing a correction down to $4,500.",
      evidence: [
        "Client questionnaire Q21: 4 × $1,500 = $6,000",
        "IRS transcript: payments posted 4/15, 6/16, 9/15 — $4,500 total",
        "No Q4 (1/15) payment found on the transcript",
      ],
      concern:
        "A payment made very close to the filing date can post late. Confirm with the client before accepting.",
    },
    history: [
      {
        actor: "Ledgerline AI",
        action: "Proposed correction $6,000 → $4,500",
        at: "2026-08-05T08:55:00",
        note: "Transcript reconciliation",
      },
    ],
  },

  /* ------------------------------- Tax ------------------------------- */
  {
    id: "f-total-tax",
    section: "Tax",
    formLine: "Form 1040, Line 22",
    label: "Total tax",
    value: 23272,
    provenance: "calculated",
    affordance: "calculated",
    verification: "verified",
    transformation:
      "Bracket tax on taxable income, less the child tax credit. Recomputed live whenever an input changes.",
    inputs: ["f-agi", "f-itemized", "f-ctc"],
    sources: [],
  },
  {
    id: "f-refund",
    section: "Tax",
    formLine: "Form 1040, Line 34",
    label: "Refund",
    value: 10818,
    provenance: "calculated",
    affordance: "calculated",
    verification: "verified",
    transformation: "Total payments − total tax. Recomputed live.",
    inputs: ["f-fed-wh", "f-est-pay", "f-total-tax"],
    sources: [],
  },
];

export const fieldsById = Object.fromEntries(fields.map((f) => [f.id, f]));

/* ================================================================== *
 * DASHBOARD DATASET — many returns at varied stages/urgency (07/06)  *
 * ================================================================== */

/** Hand-authored returns — these carry the interesting, specific edge cases. */
export const featuredReturns: TaxReturn[] = [
  {
    id: FLAGSHIP_RETURN_ID,
    client: "Marcus & Elena Delgado",
    entityType: "Individual",
    taxYear: 2025,
    stage: "in_review",
    nextActionOwner: "firm",
    preparer: "You (Priya Anand)",
    reviewer: "David Okafor",
    dueDate: "2026-08-12",
    progress: 78,
    openFlags: 3,
    balance: 10818,
    lastActivity: "2026-08-05T09:20:00",
    openItems: [
      { id: "oi-1", label: "Confirm missing cost basis (3 lots)", owner: "client", kind: "question" },
      { id: "oi-2", label: "Upload HSA Form 5498-SA", owner: "client", kind: "document" },
      { id: "oi-3", label: "Reviewer sign-off on Schedule D", owner: "firm", kind: "review" },
    ],
  },
  {
    id: "RET-2088",
    client: "Aurora Robotics LLC",
    entityType: "Business",
    taxYear: 2025,
    stage: "in_prep",
    nextActionOwner: "firm",
    preparer: "You (Priya Anand)",
    reviewer: "David Okafor",
    dueDate: "2026-08-06",
    progress: 41,
    openFlags: 5,
    balance: -18400,
    lastActivity: "2026-08-04T16:05:00",
    openItems: [
      { id: "oi-4", label: "Reconcile depreciation schedule", owner: "firm", kind: "review" },
      { id: "oi-5", label: "Missing Q4 bank statements", owner: "client", kind: "document" },
    ],
  },
  {
    id: "RET-2073",
    client: "Sandra Whitfield",
    entityType: "Individual",
    taxYear: 2025,
    stage: "client_review",
    nextActionOwner: "client",
    preparer: "You (Priya Anand)",
    reviewer: "David Okafor",
    dueDate: "2026-08-07",
    progress: 92,
    openFlags: 0,
    balance: 2140,
    lastActivity: "2026-08-03T11:30:00",
    openItems: [
      { id: "oi-6", label: "Client e-signature on Form 8879", owner: "client", kind: "signature" },
    ],
  },
  {
    id: "RET-2065",
    client: "Trailhead Coffee Co.",
    entityType: "Business",
    taxYear: 2025,
    stage: "ready_to_file",
    nextActionOwner: "firm",
    preparer: "Nadia Rahman",
    reviewer: "You (Priya Anand)",
    dueDate: "2026-08-09",
    progress: 100,
    openFlags: 0,
    balance: -3220,
    lastActivity: "2026-08-05T08:10:00",
    openItems: [
      { id: "oi-7", label: "Queue federal e-file", owner: "firm", kind: "review" },
    ],
  },
  {
    id: "RET-2054",
    client: "Jerome & Lila Banks",
    entityType: "Individual",
    taxYear: 2025,
    stage: "intake",
    nextActionOwner: "client",
    preparer: "You (Priya Anand)",
    reviewer: "David Okafor",
    dueDate: "2026-08-20",
    progress: 15,
    openFlags: 1,
    balance: 0,
    lastActivity: "2026-07-30T14:45:00",
    openItems: [
      { id: "oi-8", label: "Awaiting W-2 and 1099 uploads", owner: "client", kind: "document" },
    ],
  },
  {
    id: "RET-2049",
    client: "Peakline Consulting",
    entityType: "Business",
    taxYear: 2025,
    stage: "in_review",
    nextActionOwner: "firm",
    preparer: "Nadia Rahman",
    reviewer: "You (Priya Anand)",
    dueDate: "2026-08-08",
    progress: 84,
    openFlags: 2,
    balance: -9800,
    lastActivity: "2026-08-04T17:50:00",
    openItems: [
      { id: "oi-9", label: "Review §179 election", owner: "firm", kind: "review" },
    ],
  },
  {
    id: "RET-2036",
    client: "Grace Okonkwo",
    entityType: "Individual",
    taxYear: 2025,
    stage: "filed",
    nextActionOwner: "firm",
    preparer: "You (Priya Anand)",
    reviewer: "David Okafor",
    dueDate: "2026-07-28",
    progress: 100,
    openFlags: 0,
    balance: 1310,
    lastActivity: "2026-07-28T10:00:00",
    openItems: [],
  },
  {
    id: "RET-2031",
    client: "Delgado Design LLC",
    entityType: "Business",
    taxYear: 2025,
    stage: "in_prep",
    nextActionOwner: "firm",
    preparer: "You (Priya Anand)",
    reviewer: "David Okafor",
    dueDate: "2026-08-14",
    progress: 33,
    openFlags: 2,
    balance: -4100,
    lastActivity: "2026-08-02T13:15:00",
    openItems: [
      { id: "oi-10", label: "Tie K-1 to partner returns", owner: "firm", kind: "review" },
    ],
  },
  {
    id: "RET-2022",
    client: "Henry Vasquez",
    entityType: "Individual",
    taxYear: 2025,
    stage: "client_review",
    nextActionOwner: "client",
    preparer: "Nadia Rahman",
    reviewer: "You (Priya Anand)",
    dueDate: "2026-08-11",
    progress: 90,
    openFlags: 0,
    balance: 620,
    lastActivity: "2026-08-01T09:40:00",
    openItems: [
      { id: "oi-11", label: "Client to confirm dependents", owner: "client", kind: "question" },
    ],
  },
  {
    id: "RET-2019",
    client: "Cobalt Studio Inc.",
    entityType: "Business",
    taxYear: 2025,
    stage: "intake",
    nextActionOwner: "client",
    preparer: "You (Priya Anand)",
    reviewer: "David Okafor",
    dueDate: "2026-09-01",
    progress: 8,
    openFlags: 0,
    balance: 0,
    lastActivity: "2026-07-25T15:20:00",
    openItems: [
      { id: "oi-12", label: "Awaiting prior-year return", owner: "client", kind: "document" },
    ],
  },
];

/**
 * The full book of business: the hand-authored returns plus a generated tail so
 * the dashboard, search, and prioritization are exercised at realistic volume
 * (Challenge 07: "usable when someone owns hundreds of returns").
 */
export const returns: TaxReturn[] = [
  ...featuredReturns,
  ...generateReturns(232, 0),
];

export const returnsById = Object.fromEntries(returns.map((r) => [r.id, r]));

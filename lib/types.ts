// Domain model. A field is described by three independent axes (provenance,
// affordance, verification) rather than a set of overlapping booleans, so the
// same components can render every combination the UI needs to show.

/** Where a value came from. */
export type Provenance =
  | "ai" // extracted or computed by the model
  | "human" // typed/confirmed by firm staff
  | "client" // supplied by the client (questionnaire / upload)
  | "carryforward" // pulled from the prior-year filed return
  | "calculated"; // derived from other fields

/** What the user is allowed to do with the value. */
export type Affordance =
  | "editable" // can be changed inline
  | "readonly" // display only
  | "calculated"; // system-derived; edit the inputs, not this

/** How much to trust the value. */
export type Verification =
  | "unverified" // AI produced it, nobody has checked
  | "verified" // a human confirmed it
  | "awaiting_approval" // AI proposes a change; needs approve/reject
  | "flagged"; // low confidence or a conflict to resolve

export interface SourceRef {
  documentId: string;
  /** Which highlighted box on the rendered form this figure came from. */
  boxId: string;
  boxLabel: string;
  /** The raw value as it appears on the document, before any transformation. */
  rawValue: string;
  /** The exact page this figure was read from (1-based). */
  page: number;
  /** Optional section/table name within that page. */
  section?: string;
}

export interface AiMeta {
  /** 0 to 100. */
  confidence: number;
  /** One line on what the model did. */
  rationale: string;
  /** Evidence bullets the reviewer can scan. */
  evidence: string[];
  /** Set when the model isn't confident: why it's flagged. */
  concern?: string;
}

export interface ReturnField {
  id: string;
  section: FieldSection;
  /** e.g. "Form 1040, Line 1a". */
  formLine: string;
  label: string;
  /** Numeric value in dollars (null = not yet determined). */
  value: number | null;
  provenance: Provenance;
  affordance: Affordance;
  verification: Verification;
  /** How we got from the source document(s) to this figure. */
  transformation?: string;
  /** One or more source documents backing this figure. */
  sources: SourceRef[];
  /** Field ids this value is computed from (for calculated lines). */
  inputs?: string[];
  ai?: AiMeta;
  /**
   * When verification is "awaiting_approval", the value the AI wants to change
   * this to. The live value doesn't move until someone approves.
   */
  proposedValue?: number;
  /** Why the AI is proposing the change. */
  proposalReason?: string;
  /** Required for readonly fields: we don't lock a value without explaining it. */
  lockReason?: string;
  /** Audit trail of human decisions on this field. */
  history?: FieldEvent[];
}

export interface FieldEvent {
  actor: string;
  action: string;
  at: string; // ISO datetime
  note?: string;
}

export type FieldSection =
  | "Income"
  | "Adjustments"
  | "Deductions"
  | "Credits"
  | "Payments"
  | "Tax";

/* ------------------------------------------------------------------ */
/* Documents, rendered as real (fake) forms with highlightable boxes  */
/* ------------------------------------------------------------------ */

export type DocType =
  | "W-2"
  | "1099-INT"
  | "1099-DIV"
  | "1099-B"
  | "1098"
  | "K-1";

/** Where the document is in the extraction pipeline. */
export type ExtractionStatus =
  | "processing" // AI is still reading it
  | "extracted" // values pulled, not yet human-checked
  | "needs_review" // AI hit something it isn't sure about
  | "confirmed"; // a human signed off on the extraction

export interface TaxDocument {
  id: string;
  type: DocType;
  /** Display title, e.g. "W-2, Northwind Logistics". */
  title: string;
  issuer: string;
  receivedAt: string; // ISO date
  pageCount: number;
  /** Box values keyed by box id, rendered by the form components. */
  boxes: Record<string, string>;
  status: ExtractionStatus;
  /** Overall extraction confidence for the document, 0 to 100. */
  extractionConfidence: number;
  /** Who uploaded it. */
  uploadedBy: "client" | "firm";
}

// Returns and clients: the data behind the dashboard and the status tracker.

export type ReturnStage =
  | "intake" // gathering documents
  | "in_prep" // preparer building the return
  | "in_review" // reviewer checking
  | "client_review" // waiting on client sign-off
  | "ready_to_file" // approved, queued to e-file
  | "filed"; // done

export type Owner = "firm" | "client";

export interface OpenItem {
  id: string;
  label: string;
  owner: Owner;
  kind: "document" | "question" | "signature" | "review";
}

export interface TaxReturn {
  id: string;
  client: string;
  entityType: "Individual" | "Business";
  taxYear: number;
  stage: ReturnStage;
  /** Whose court the ball is in for the NEXT action. */
  nextActionOwner: Owner;
  preparer: string;
  reviewer: string;
  dueDate: string; // ISO date
  /** Percent complete, 0 to 100. */
  progress: number;
  /** Unresolved AI flags on this return. */
  openFlags: number;
  openItems: OpenItem[];
  /** Positive is a refund, negative is a balance due, in dollars. */
  balance: number;
  lastActivity: string; // ISO datetime
}

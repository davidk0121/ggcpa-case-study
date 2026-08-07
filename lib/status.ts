import type { ReturnStage } from "./types";

// One set of stages, worded for two audiences. Staff and client see the same
// step number (1 to 6), but the label and description differ: a client never
// sees "in review", they see "we're working on it".

export interface StageMeta {
  stage: ReturnStage;
  step: number;
  /** Firm-facing label. */
  label: string;
  /** Client-facing label, plain language, no jargon. */
  clientLabel: string;
  /** Firm-facing one-liner. */
  detail: string;
  /** Client-facing one-liner. */
  clientDetail: string;
  tone: "neutral" | "active" | "waiting" | "done";
}

export const STAGES: StageMeta[] = [
  {
    stage: "intake",
    step: 1,
    label: "Intake",
    clientLabel: "Gathering your documents",
    detail: "Collecting source documents from the client.",
    clientDetail: "We're collecting the documents we need to start.",
    tone: "waiting",
  },
  {
    stage: "in_prep",
    step: 2,
    label: "In preparation",
    clientLabel: "We're preparing your return",
    detail: "Preparer is building the return.",
    clientDetail: "Your preparer is putting your return together.",
    tone: "active",
  },
  {
    stage: "in_review",
    step: 3,
    label: "In review",
    clientLabel: "We're preparing your return",
    detail: "Reviewer is checking the return before it goes to the client.",
    clientDetail: "A senior reviewer is double-checking everything.",
    tone: "active",
  },
  {
    stage: "client_review",
    step: 4,
    label: "Client review",
    clientLabel: "Your review & signature",
    detail: "Waiting on client to review and sign.",
    clientDetail: "Please review your return and sign to approve.",
    tone: "waiting",
  },
  {
    stage: "ready_to_file",
    step: 5,
    label: "Ready to file",
    clientLabel: "Approved — filing now",
    detail: "Approved and queued for e-file.",
    clientDetail: "You've approved it. We're filing with the IRS.",
    tone: "active",
  },
  {
    stage: "filed",
    step: 6,
    label: "Filed",
    clientLabel: "Filed",
    detail: "Accepted by the taxing authority.",
    clientDetail: "Your return has been filed. Nothing more to do.",
    tone: "done",
  },
];

export const STAGE_COUNT = STAGES.length;

export const stageMeta = (stage: ReturnStage): StageMeta =>
  STAGES.find((s) => s.stage === stage)!;

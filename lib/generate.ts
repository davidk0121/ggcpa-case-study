import type { TaxReturn, ReturnStage, Owner, OpenItem } from "./types";

/**
 * Challenge 07 asks the dashboard to stay usable "when someone owns hundreds of
 * returns". So the demo carries a real book of business, not six demo rows.
 *
 * Generation is SEEDED and deterministic — no Math.random, no Date.now. That
 * keeps the server render and the client render byte-identical (otherwise React
 * would throw a hydration mismatch) and makes the demo reproducible.
 */

/* --- tiny deterministic PRNG (mulberry32) --------------------------- */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Marcus", "Elena", "Sandra", "Jerome", "Lila", "Grace", "Henry", "Nadia", "Owen", "Priya",
  "Rosa", "Tomas", "Aisha", "Bennett", "Clara", "Desmond", "Farah", "Gideon", "Hana", "Isaac",
  "Jonah", "Kira", "Leon", "Maya", "Noor", "Oscar", "Paloma", "Quentin", "Rhea", "Silas",
  "Tessa", "Umar", "Vera", "Wesley", "Xiomara", "Yusuf", "Zara", "Adrian", "Bianca", "Caleb",
];
const LAST = [
  "Delgado", "Whitfield", "Banks", "Okonkwo", "Vasquez", "Rahman", "Okafor", "Anand", "Lindqvist",
  "Moreau", "Castellanos", "Nakamura", "Ferreira", "Abadi", "Kowalski", "Mbeki", "Halloran",
  "Petrov", "Sandoval", "Thackeray", "Ueda", "Villanueva", "Weaver", "Yates", "Zimmerman",
  "Brennan", "Cho", "Dumont", "Eriksen", "Fitzgerald",
];
const BIZ_A = [
  "Aurora", "Trailhead", "Peakline", "Cobalt", "Northwind", "Brightpath", "Meridian", "Harbor",
  "Cascade", "Ironwood", "Silverbrook", "Redstone", "Lakeshore", "Summit", "Foxglove", "Wildwind",
  "Copperfield", "Granite", "Bluepine", "Sablewood",
];
const BIZ_B = [
  "Robotics", "Coffee Co.", "Consulting", "Studio Inc.", "Logistics", "Health", "Partners",
  "Analytics", "Design LLC", "Fabrication", "Media Group", "Dental", "Veterinary", "Outfitters",
  "Brewing", "Systems", "Interiors", "Freight", "Orthopedics", "Capital",
];

export const PREPARERS = [
  "You (Priya Anand)",
  "Nadia Rahman",
  "Tomas Lindqvist",
  "Grace Okonkwo",
  "Owen Brennan",
];
export const REVIEWERS = ["David Okafor", "You (Priya Anand)", "Rosa Castellanos"];

const STAGES: ReturnStage[] = [
  "intake", "in_prep", "in_review", "client_review", "ready_to_file", "filed",
];
/** Rough real-world mix — most work sits in prep/review during the season. */
const STAGE_WEIGHTS = [0.14, 0.26, 0.22, 0.16, 0.08, 0.14];

const ITEM_TEMPLATES: Array<{ label: string; owner: Owner; kind: OpenItem["kind"] }> = [
  { label: "Missing prior-year return", owner: "client", kind: "document" },
  { label: "Awaiting brokerage 1099", owner: "client", kind: "document" },
  { label: "Confirm dependent eligibility", owner: "client", kind: "question" },
  { label: "Client e-signature on Form 8879", owner: "client", kind: "signature" },
  { label: "Upload mileage log", owner: "client", kind: "document" },
  { label: "Reviewer sign-off required", owner: "firm", kind: "review" },
  { label: "Reconcile depreciation schedule", owner: "firm", kind: "review" },
  { label: "Verify state apportionment", owner: "firm", kind: "review" },
  { label: "Resolve AI flag on Schedule C", owner: "firm", kind: "review" },
];

function pick<T>(r: () => number, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)];
}

function weightedStage(r: () => number): ReturnStage {
  const x = r();
  let acc = 0;
  for (let i = 0; i < STAGES.length; i++) {
    acc += STAGE_WEIGHTS[i];
    if (x < acc) return STAGES[i];
  }
  return "in_prep";
}

/** ISO date N days from the fixed demo anchor (2026-08-05). */
const ANCHOR = new Date("2026-08-05T09:30:00").getTime();
const DAY = 86_400_000;
const isoDate = (offsetDays: number) =>
  new Date(ANCHOR + offsetDays * DAY).toISOString().slice(0, 10);
const isoDateTime = (offsetDays: number) =>
  new Date(ANCHOR + offsetDays * DAY).toISOString().slice(0, 19);

export function generateReturns(count: number, startIndex = 0): TaxReturn[] {
  const out: TaxReturn[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng(9973 + i * 7919);
    const isBiz = r() < 0.38;
    const client = isBiz
      ? `${pick(r, BIZ_A)} ${pick(r, BIZ_B)}`
      : `${pick(r, FIRST)} ${pick(r, LAST)}`;

    const stage = weightedStage(r);
    const filed = stage === "filed";

    // Deadlines cluster near the extension deadline; a few are already late.
    const dueOffset = filed
      ? -Math.floor(r() * 30) - 1
      : Math.floor(r() * 46) - 4; // −4 .. +41 days

    const progress = filed
      ? 100
      : stage === "ready_to_file"
        ? 100
        : stage === "client_review"
          ? 86 + Math.floor(r() * 12)
          : stage === "in_review"
            ? 62 + Math.floor(r() * 26)
            : stage === "in_prep"
              ? 25 + Math.floor(r() * 40)
              : 4 + Math.floor(r() * 22);

    const openFlags = filed ? 0 : r() < 0.42 ? 1 + Math.floor(r() * 5) : 0;

    // Who owns the next step follows from the stage, not a coin flip.
    const nextActionOwner: Owner =
      stage === "intake" || stage === "client_review"
        ? r() < 0.85
          ? "client"
          : "firm"
        : "firm";

    const itemCount = filed ? 0 : 1 + Math.floor(r() * 3);
    const openItems: OpenItem[] = [];
    for (let k = 0; k < itemCount; k++) {
      const t = pick(r, ITEM_TEMPLATES);
      openItems.push({ id: `gi-${startIndex + i}-${k}`, label: t.label, owner: t.owner, kind: t.kind });
    }

    const magnitude = isBiz ? 4_000 + r() * 90_000 : 300 + r() * 12_000;
    const balance = filed || stage === "intake"
      ? (stage === "intake" ? 0 : Math.round((r() < 0.6 ? 1 : -1) * magnitude))
      : Math.round((r() < 0.55 ? 1 : -1) * magnitude);

    out.push({
      id: `RET-${2100 + startIndex + i}`,
      client,
      entityType: isBiz ? "Business" : "Individual",
      taxYear: 2025,
      stage,
      nextActionOwner,
      preparer: pick(r, PREPARERS),
      reviewer: pick(r, REVIEWERS),
      dueDate: isoDate(dueOffset),
      progress,
      openFlags,
      openItems,
      balance,
      lastActivity: isoDateTime(-Math.floor(r() * 21) - 0.2),
    });
  }
  return out;
}

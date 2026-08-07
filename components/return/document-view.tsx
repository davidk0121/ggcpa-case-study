import type { TaxDocument } from "@/lib/types";
import { cx } from "@/lib/cx";

// Draws a source document as a tax form with highlightable boxes. highlightBox
// comes from the selected return field, so a figure on the return lights up the
// exact box it was read from.

export function DocumentView({
  doc,
  highlightBox,
  page,
}: {
  doc: TaxDocument;
  highlightBox?: string;
  /** The page this figure was read from, shown so the trace is exact. */
  page?: number;
}) {
  return (
    <div className="rounded-md border border-line-strong bg-surface font-mono text-[12px] text-ink shadow-panel">
      {/* form title bar */}
      <div className="flex items-center justify-between border-b border-line-strong bg-surface-sunken px-3 py-2">
        <div className="font-sans text-[12px] font-semibold">{formTitle(doc)}</div>
        <div className="flex items-center gap-2 font-sans text-[11px] text-ink-subtle">
          {page !== undefined && doc.pageCount > 1 && (
            <span className="rounded-sm border border-ai-line bg-ai-soft px-1.5 py-0.5 font-medium text-ai tnum">
              Showing page {page} of {doc.pageCount}
            </span>
          )}
          <span>Tax year 2025</span>
        </div>
      </div>
      <div className="p-3">{renderBody(doc, highlightBox)}</div>
      <div className="border-t border-line px-3 py-1.5 font-sans text-[10.5px] text-ink-subtle">
        Received {new Date(doc.receivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {doc.pageCount} page{doc.pageCount > 1 ? "s" : ""} · {doc.id}
      </div>
    </div>
  );
}

function formTitle(doc: TaxDocument): string {
  switch (doc.type) {
    case "W-2":
      return "Form W-2 · Wage and Tax Statement";
    case "1099-INT":
      return "Form 1099-INT · Interest Income";
    case "1099-DIV":
      return "Form 1099-DIV · Dividends and Distributions";
    case "1099-B":
      return "Form 1099-B · Proceeds from Broker Transactions";
    case "1098":
      return "Form 1098 · Mortgage Interest Statement";
    case "K-1":
      return "Schedule K-1 · Partner's Share of Income";
  }
}

/* --- A single labeled box on a form --------------------------------- */
function Box({
  id,
  label,
  value,
  highlight,
  money,
  className,
}: {
  id?: string;
  label: string;
  value: string;
  highlight?: boolean;
  money?: boolean;
  className?: string;
}) {
  return (
    <div
      data-box={id}
      className={cx(
        "relative rounded-sm border px-2 py-1.5 transition-colors",
        highlight
          ? "border-ai bg-ai-soft ring-2 ring-ai/40"
          : "border-line bg-surface",
        className,
      )}
    >
      <div className="flex items-center gap-1 font-sans text-[10px] uppercase tracking-wide text-ink-subtle">
        {id && <span className="font-semibold text-ink-muted">{id}</span>}
        {label}
      </div>
      <div className={cx("mt-0.5 tnum", money && "text-right")}>
        {money && value !== "" ? "$" : ""}
        {value}
      </div>
      {highlight && (
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-ai px-1.5 py-px font-sans text-[9px] font-semibold text-surface">
          source
        </span>
      )}
    </div>
  );
}

function renderBody(doc: TaxDocument, hl?: string) {
  const b = doc.boxes;
  const is = (id: string) => hl === id;

  switch (doc.type) {
    case "W-2":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Box label="Employer" value={b.employer} className="col-span-2" />
            <Box label="Employee" value={b.e} />
            <Box id="b" label="EIN" value={b.ein} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Box id="1" label="Wages, tips" value={b["1"]} money highlight={is("1")} />
            <Box id="2" label="Fed. tax withheld" value={b["2"]} money highlight={is("2")} />
            <Box id="3" label="SS wages" value={b["3"]} money highlight={is("3")} />
            <Box id="4" label="SS tax" value={b["4"]} money highlight={is("4")} />
            <Box id="5" label="Medicare wages" value={b["5"]} money highlight={is("5")} />
            <Box id="6" label="Medicare tax" value={b["6"]} money highlight={is("6")} />
            <Box id="16" label="State wages" value={b["16"]} money highlight={is("16")} />
            <Box id="17" label="State income tax" value={b["17"]} money highlight={is("17")} />
          </div>
        </div>
      );
    case "1099-INT":
      return (
        <div className="space-y-2">
          <Box label="Payer" value={b.payer} />
          <div className="grid grid-cols-2 gap-2">
            <Box id="1" label="Interest income" value={b["1"]} money highlight={is("1")} />
            <Box id="4" label="Fed. tax withheld" value={b["4"]} money highlight={is("4")} />
          </div>
        </div>
      );
    case "1099-DIV":
      return (
        <div className="space-y-2">
          <Box label="Payer" value={b.payer} />
          <div className="grid grid-cols-3 gap-2">
            <Box id="1a" label="Ordinary div." value={b["1a"]} money highlight={is("1a")} />
            <Box id="1b" label="Qualified div." value={b["1b"]} money highlight={is("1b")} />
            <Box id="2a" label="Cap. gain distr." value={b["2a"]} money highlight={is("2a")} />
          </div>
        </div>
      );
    case "1099-B":
      return (
        <div className="space-y-2">
          <Box label="Payer" value={b.payer} />
          <div className="grid grid-cols-2 gap-2">
            <Box label="Proceeds" value={b.proceeds} money highlight={is("proceeds")} />
            <Box label="Cost basis" value={b.basis} money highlight={is("basis")} />
            <Box label="Short-term gain" value={b.st_gain} money highlight={is("st_gain")} />
            <Box label="Long-term gain" value={b.lt_gain} money highlight={is("lt_gain")} />
          </div>
          <div className="rounded-sm border border-review-line bg-review-soft px-2 py-1.5 font-sans text-[11px] text-review">
            ⚠ {b.basisNote}
          </div>
        </div>
      );
    case "1098":
      return (
        <div className="space-y-2">
          <Box label="Lender" value={b.lender} />
          <div className="grid grid-cols-3 gap-2">
            <Box id="1" label="Mortgage interest" value={b["1"]} money highlight={is("1")} />
            <Box id="2" label="Points" value={b["2"]} money highlight={is("2")} />
            <Box id="10" label="Property taxes" value={b["10"]} money highlight={is("10")} />
          </div>
        </div>
      );
    case "K-1":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Box label="Partnership" value={b.entity} />
            <Box label="EIN" value={b.ein} />
            <Box label="Partner" value={b.partner} className="col-span-2" />
          </div>
          <Box id="1" label="Ordinary business income" value={b["1"]} money highlight={is("1")} />
        </div>
      );
  }
}

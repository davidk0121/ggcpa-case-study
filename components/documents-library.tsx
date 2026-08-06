"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText, ArrowRight, User, Building2 } from "lucide-react";
import { documents, fields, FLAGSHIP_RETURN_ID } from "@/lib/data";
import type { ExtractionStatus, TaxDocument } from "@/lib/types";
import { shortDate } from "@/lib/format";
import { cx } from "@/lib/cx";
import { ConfidenceChip, ProvenanceMark } from "@/components/affordance";
import { DocumentView } from "@/components/return/document-view";

/**
 * Challenge 08 asks the interaction system to prove itself across SEVERAL
 * screens. This is the third surface (after the dashboard and the workbench):
 * the same provenance marks, confidence chips, and status language, applied to
 * documents rather than return lines.
 *
 * It doubles as the reverse traceability direction — from a document, see every
 * return line it feeds.
 */

const STATUS_META: Record<
  ExtractionStatus,
  { label: string; cls: string; hint: string }
> = {
  processing: {
    label: "Processing",
    cls: "border-line bg-surface-sunken text-ink-subtle",
    hint: "AI is still reading this document",
  },
  extracted: {
    label: "Extracted",
    cls: "border-ai-line bg-ai-soft text-ai",
    hint: "Values pulled — not yet human-checked",
  },
  needs_review: {
    label: "Needs review",
    cls: "border-review-line bg-review-soft text-review",
    hint: "AI hit something it isn't sure about",
  },
  confirmed: {
    label: "Confirmed",
    cls: "border-verified-line bg-verified-soft text-verified",
    hint: "A human signed off on this extraction",
  },
};

export function DocumentsLibrary() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExtractionStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string>(documents[0].id);

  /** Reverse index: which return lines does each document feed? */
  const feedsByDoc = useMemo(() => {
    const map: Record<string, Array<{ id: string; label: string; formLine: string; boxLabel: string; page: number }>> = {};
    for (const f of fields) {
      for (const s of f.sources) {
        (map[s.documentId] ??= []).push({
          id: f.id,
          label: f.label,
          formLine: f.formLine,
          boxLabel: s.boxLabel,
          page: s.page,
        });
      }
    }
    return map;
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.issuer.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      );
    });
  }, [query, statusFilter]);

  const selected = documents.find((d) => d.id === selectedId) ?? documents[0];
  const feeds = feedsByDoc[selected.id] ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Documents</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            Marcus &amp; Elena Delgado · {documents.length} source documents ·{" "}
            {documents.reduce((n, d) => n + d.pageCount, 0)} pages
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/25">
          <Search className="h-4 w-4 text-ink-subtle" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issuer, form type…"
            className="w-52 bg-transparent text-[13px] outline-none placeholder:text-ink-subtle"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        <Chip label="All" active={statusFilter === null} onClick={() => setStatusFilter(null)} />
        {(Object.keys(STATUS_META) as ExtractionStatus[]).map((s) => (
          <Chip
            key={s}
            label={STATUS_META[s].label}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* list */}
        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-panel">
          {rows.map((d, i) => (
            <DocRow
              key={d.id}
              doc={d}
              feedCount={(feedsByDoc[d.id] ?? []).length}
              selected={d.id === selectedId}
              first={i === 0}
              onClick={() => setSelectedId(d.id)}
            />
          ))}
          {rows.length === 0 && (
            <div className="px-4 py-10 text-center text-[13px] text-ink-subtle">
              No documents match “{query}”.
            </div>
          )}
        </div>

        {/* detail: the document + what it feeds */}
        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-surface p-3.5 shadow-panel">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold tracking-tight">{selected.title}</h2>
                <p className="text-[12px] text-ink-subtle">
                  {selected.pageCount} page{selected.pageCount > 1 ? "s" : ""} · received{" "}
                  {shortDate(selected.receivedAt)}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={selected.status} />
                <ConfidenceChip value={selected.extractionConfidence} />
              </div>
            </div>
            <div className="mb-3 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-sm border border-line bg-surface-sunken px-1.5 py-0.5 text-[11px] text-ink-muted">
                {selected.uploadedBy === "client" ? (
                  <User className="h-3 w-3" strokeWidth={2} />
                ) : (
                  <Building2 className="h-3 w-3" strokeWidth={2} />
                )}
                Uploaded by {selected.uploadedBy === "client" ? "client" : "firm"}
              </span>
              <span className="text-[11px] text-ink-subtle">{STATUS_META[selected.status].hint}</span>
            </div>
            <DocumentView doc={selected} />
          </div>

          {/* reverse traceability */}
          <div className="rounded-lg border border-line bg-surface p-3.5 shadow-panel">
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-muted">
              Feeds {feeds.length} return line{feeds.length === 1 ? "" : "s"}
            </h3>
            {feeds.length === 0 ? (
              <p className="text-[12.5px] text-ink-subtle">
                Nothing on the return references this document yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {feeds.map((f) => (
                  <li key={`${f.id}-${f.boxLabel}`}>
                    <Link
                      href={`/returns/${FLAGSHIP_RETURN_ID}?field=${f.id}`}
                      className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-sunken"
                    >
                      <span className="rounded-sm border border-ai-line bg-ai-soft px-1.5 py-0.5 text-[10.5px] font-medium text-ai">
                        p.{f.page}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium group-hover:text-primary">
                          {f.label}
                        </span>
                        <span className="block text-[11px] text-ink-subtle">
                          {f.boxLabel} → {f.formLine}
                        </span>
                      </span>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        strokeWidth={2}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocRow({
  doc,
  feedCount,
  selected,
  first,
  onClick,
}: {
  doc: TaxDocument;
  feedCount: number;
  selected: boolean;
  first: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        !first && "border-t border-line",
        selected ? "bg-primary-soft/60" : "hover:bg-surface-sunken",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-muted ring-1 ring-line">
        <FileText className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium">{doc.title}</span>
          <ProvenanceMark provenance="ai" size="xs" />
        </span>
        <span className="block text-[11px] text-ink-subtle">
          {doc.pageCount} page{doc.pageCount > 1 ? "s" : ""} · feeds {feedCount} line
          {feedCount === 1 ? "" : "s"} · {shortDate(doc.receivedAt)}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <ConfidenceChip value={doc.extractionConfidence} />
        <StatusPill status={doc.status} />
      </span>
    </button>
  );
}

function StatusPill({ status }: { status: ExtractionStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        m.cls,
      )}
      title={m.hint}
    >
      {m.label}
    </span>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "rounded-md border px-2 py-1 text-[12px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-surface"
          : "border-line bg-surface text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderOpen,
  FileText,
  Hash,
  CornerDownLeft,
  X,
} from "lucide-react";
import { returns, documents, fields, FLAGSHIP_RETURN_ID } from "@/lib/data";
import { stageMeta } from "@/lib/status";
import { balanceLabel, dueDisplay } from "@/lib/format";
import { cx } from "@/lib/cx";

/**
 * Global search — one box that reaches every object type in the product.
 *
 * This is the navigation backbone (Challenge 04): from anywhere, jump straight
 * to a return, a document, or a *specific line on the return* — the last one
 * deep-links with ?field=, so you land with that figure already selected and
 * its source document open. At 242 returns, search is how you actually move.
 */

type Hit =
  | { kind: "return"; id: string; title: string; sub: string; href: string }
  | { kind: "document"; id: string; title: string; sub: string; href: string }
  | { kind: "field"; id: string; title: string; sub: string; href: string };

const KIND_META = {
  return: { Icon: FolderOpen, label: "Return" },
  document: { Icon: FileText, label: "Document" },
  field: { Icon: Hash, label: "Return line" },
} as const;

const MAX_PER_KIND = 5;

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* "/" opens search from anywhere; Escape closes. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Hit[] = [];

    for (const r of returns) {
      if (out.filter((h) => h.kind === "return").length >= MAX_PER_KIND) break;
      if (
        r.client.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.preparer.toLowerCase().includes(q)
      ) {
        const bal = balanceLabel(r.balance);
        out.push({
          kind: "return",
          id: r.id,
          title: r.client,
          sub: `${r.entityType} · ${stageMeta(r.stage).label} · ${dueDisplay(r.dueDate, r.stage).text}${bal.kind !== "even" ? ` · ${bal.text}` : ""}`,
          href: `/returns/${r.id}`,
        });
      }
    }

    for (const d of documents) {
      if (out.filter((h) => h.kind === "document").length >= MAX_PER_KIND) break;
      if (
        d.title.toLowerCase().includes(q) ||
        d.issuer.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q)
      ) {
        out.push({
          kind: "document",
          id: d.id,
          title: d.title,
          sub: `${d.type} · ${d.pageCount} page${d.pageCount > 1 ? "s" : ""} · ${d.issuer}`,
          href: `/documents`,
        });
      }
    }

    for (const f of fields) {
      if (out.filter((h) => h.kind === "field").length >= MAX_PER_KIND) break;
      if (
        f.label.toLowerCase().includes(q) ||
        f.formLine.toLowerCase().includes(q)
      ) {
        out.push({
          kind: "field",
          id: f.id,
          title: f.label,
          sub: `${f.formLine} · Delgado return`,
          href: `/returns/${FLAGSHIP_RETURN_ID}?field=${f.id}`,
        });
      }
    }

    return out;
  }, [query]);

  // Keep the highlighted row in range as results change.
  const safeActive = hits.length === 0 ? 0 : Math.min(active, hits.length - 1);

  const go = (hit: Hit) => {
    setOpen(false);
    setQuery("");
    setActive(0);
    router.push(hit.href);
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (hits.length ? (a + 1) % hits.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (hits.length ? (a - 1 + hits.length) % hits.length : 0));
    } else if (e.key === "Enter" && hits[safeActive]) {
      e.preventDefault();
      go(hits[safeActive]);
    }
  };

  return (
    <>
      {/* The trigger in the header. */}
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-line bg-surface-sunken px-2.5 py-1.5 text-[13px] text-ink-subtle transition-colors hover:border-line-strong hover:text-ink-muted lg:flex"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={2} />
        <span>Search returns, clients, documents…</span>
        <kbd className="ml-2 rounded border border-line bg-surface px-1 font-mono text-[10px]">
          /
        </kbd>
      </button>

      {/* Compact trigger for narrow windows. */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-line bg-surface p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-ink lg:hidden"
        aria-label="Search"
      >
        <Search className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/20 pt-[12vh]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="w-[min(620px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-pop"
            role="dialog"
            aria-label="Global search"
          >
            <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-ink-subtle" strokeWidth={2} />
              <input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Search returns, clients, documents, or a line on the return…"
                className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-subtle"
              />
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 rounded p-1 text-ink-subtle hover:bg-surface-sunken hover:text-ink"
                aria-label="Close search"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-auto">
              {query.trim() === "" ? (
                <EmptyHint />
              ) : hits.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-ink-subtle">
                  Nothing matches “{query}”.
                </div>
              ) : (
                groupHits(hits).map(([kind, group]) => (
                  <div key={kind}>
                    <div className="sticky top-0 border-b border-line bg-surface-sunken px-3.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-subtle">
                      {KIND_META[kind].label}
                      {group.length > 1 ? "s" : ""}
                    </div>
                    {group.map((hit) => {
                      const idx = hits.indexOf(hit);
                      const { Icon } = KIND_META[hit.kind];
                      return (
                        <button
                          key={`${hit.kind}-${hit.id}`}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => go(hit)}
                          className={cx(
                            "flex w-full items-center gap-3 px-3.5 py-2 text-left",
                            idx === safeActive ? "bg-primary-soft" : "hover:bg-surface-sunken",
                          )}
                        >
                          <Icon
                            className={cx(
                              "h-4 w-4 shrink-0",
                              idx === safeActive ? "text-primary" : "text-ink-subtle",
                            )}
                            strokeWidth={2}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium">
                              {hit.title}
                            </span>
                            <span className="block truncate text-[11px] text-ink-subtle">
                              {hit.sub}
                            </span>
                          </span>
                          {idx === safeActive && (
                            <CornerDownLeft
                              className="h-3.5 w-3.5 shrink-0 text-primary"
                              strokeWidth={2}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-line bg-surface-sunken px-3.5 py-1.5 text-[11px] text-ink-subtle">
              <span>
                <Key>↑</Key> <Key>↓</Key> navigate
              </span>
              <span>
                <Key>↵</Key> open
              </span>
              <span>
                <Key>esc</Key> close
              </span>
              {hits.length > 0 && (
                <span className="ml-auto tnum">
                  {hits.length} result{hits.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function groupHits(hits: Hit[]): Array<[Hit["kind"], Hit[]]> {
  const order: Hit["kind"][] = ["return", "field", "document"];
  return order
    .map((k) => [k, hits.filter((h) => h.kind === k)] as [Hit["kind"], Hit[]])
    .filter(([, g]) => g.length > 0);
}

function EmptyHint() {
  return (
    <div className="px-3.5 py-4 text-[12.5px] text-ink-subtle">
      <div className="mb-2 font-medium text-ink-muted">Try searching for</div>
      <ul className="space-y-1">
        <li>
          <span className="font-mono text-ink">Delgado</span> — a client
        </li>
        <li>
          <span className="font-mono text-ink">RET-2088</span> — a return by ID
        </li>
        <li>
          <span className="font-mono text-ink">capital gain</span> — jumps to that line with its
          source document
        </li>
        <li>
          <span className="font-mono text-ink">1099</span> — a source document
        </li>
      </ul>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-surface px-1 font-mono text-[10px] text-ink-muted">
      {children}
    </kbd>
  );
}

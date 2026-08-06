"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  MessageSquare,
  Search,
  ChevronRight,
  Building2,
} from "lucide-react";
import { cx } from "@/lib/cx";

const NAV = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard, soon: false },
  { href: "/returns", label: "Returns", Icon: FolderOpen, soon: false },
  { href: "/documents", label: "Documents", Icon: FileText, soon: true },
  { href: "/messages", label: "Messages", Icon: MessageSquare, soon: true },
];

export interface Crumb {
  label: string;
  href?: string;
}

export function AppShell({
  breadcrumb,
  actions,
  children,
}: {
  breadcrumb: Crumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left rail */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-surface">
            <span className="font-mono text-[15px] font-semibold">L</span>
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">Ledgerline</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-subtle">
              Return Workbench
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ href, label, Icon, soon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            if (soon) {
              return (
                <div
                  key={href}
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-ink-subtle/70"
                  title="Not part of this prototype"
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  {label}
                  <span className="ml-auto rounded-sm border border-line px-1 text-[9px] uppercase tracking-wide text-ink-subtle">
                    Soon
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-[12px] font-semibold text-ink-muted ring-1 ring-line">
              PA
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium">Priya Anand</div>
              <div className="flex items-center gap-1 text-[11px] text-ink-subtle">
                <Building2 className="h-3 w-3" strokeWidth={2} />
                Preparer · Meridian CPA
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-5">
          <nav className="flex min-w-0 items-center gap-1.5 text-[13px]">
            {breadcrumb.map((c, i) => {
              const last = i === breadcrumb.length - 1;
              return (
                <span key={i} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-subtle" strokeWidth={2} />
                  )}
                  {c.href && !last ? (
                    <Link href={c.href} className="truncate text-ink-muted hover:text-ink">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={cx("truncate", last ? "font-medium text-ink" : "text-ink-muted")}>
                      {c.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-line bg-surface-sunken px-2.5 py-1.5 text-[13px] text-ink-subtle md:flex">
              <Search className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Search returns, clients, documents…</span>
              <kbd className="ml-2 rounded border border-line bg-surface px-1 font-mono text-[10px]">/</kbd>
            </div>
            {actions}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

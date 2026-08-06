import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell";

/**
 * A 404 that keeps you inside the product. Landing on Next's bare default —
 * no sidebar, no way back — is a jarring dead end, and global search makes a
 * mistyped return ID easy to hit.
 */
export default function NotFound() {
  return (
    <AppShell breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Not found" }]}>
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-sunken text-ink-subtle ring-1 ring-line">
          <FileQuestion className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="mt-4 text-[18px] font-semibold tracking-tight">
          We couldn&apos;t find that
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-muted">
          The return or page you followed doesn&apos;t exist. It may have been filed under a
          different ID, or the link is out of date.
        </p>
        <div className="mt-5 flex gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-surface hover:bg-primary-strong"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back to dashboard
          </Link>
          <Link
            href="/returns"
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
          >
            Browse all returns
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

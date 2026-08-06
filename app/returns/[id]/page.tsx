import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell";
import { ReturnView } from "@/components/return/return-view";
import { ReturnOverview } from "@/components/return/return-overview";
import { returnsById, FLAGSHIP_RETURN_ID } from "@/lib/data";

export default async function Page({ params, searchParams }: PageProps<"/returns/[id]">) {
  const { id } = await params;
  const ret = returnsById[id];
  if (!ret) notFound();

  // Deep links (e.g. from the Documents library) preselect a field.
  const sp = await searchParams;
  const raw = sp?.field;
  const initialField = Array.isArray(raw) ? raw[0] : raw;

  const isFlagship = id === FLAGSHIP_RETURN_ID;

  return (
    <AppShell
      breadcrumb={[
        { label: "Dashboard", href: "/" },
        { label: "Returns", href: "/returns" },
        { label: ret.client },
      ]}
    >
      {isFlagship ? (
        <ReturnView ret={ret} initialField={initialField} />
      ) : (
        <ReturnOverview ret={ret} />
      )}
    </AppShell>
  );
}

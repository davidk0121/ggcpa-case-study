import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell";
import { ReturnView } from "@/components/return/return-view";
import { ReturnOverview } from "@/components/return/return-overview";
import { returnsById, FLAGSHIP_RETURN_ID } from "@/lib/data";

export default async function Page({ params }: PageProps<"/returns/[id]">) {
  const { id } = await params;
  const ret = returnsById[id];
  if (!ret) notFound();

  const isFlagship = id === FLAGSHIP_RETURN_ID;

  return (
    <AppShell
      breadcrumb={[
        { label: "Dashboard", href: "/" },
        { label: "Returns", href: "/returns" },
        { label: ret.client },
      ]}
    >
      {isFlagship ? <ReturnView ret={ret} /> : <ReturnOverview ret={ret} />}
    </AppShell>
  );
}

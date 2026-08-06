import { AppShell } from "@/components/shell";
import { ReturnsList } from "@/components/returns-list";

export default function Page() {
  return (
    <AppShell breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Returns" }]}>
      <ReturnsList />
    </AppShell>
  );
}

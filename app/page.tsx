import { AppShell } from "@/components/shell";
import { Dashboard } from "@/components/dashboard";

export default function Page() {
  return (
    <AppShell breadcrumb={[{ label: "Dashboard" }]}>
      <Dashboard />
    </AppShell>
  );
}

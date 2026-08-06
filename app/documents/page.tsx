import { AppShell } from "@/components/shell";
import { DocumentsLibrary } from "@/components/documents-library";

export default function Page() {
  return (
    <AppShell breadcrumb={[{ label: "Dashboard", href: "/" }, { label: "Documents" }]}>
      <DocumentsLibrary />
    </AppShell>
  );
}

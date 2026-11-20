import { PageHeader } from "@/components/business-admin/ui";
import { AutomationsView } from "@/components/business-admin/automation/AutomationsView";

export default function AutomationsPage() {
  return (
    <>
      <PageHeader title="Automations" description="Send approved WhatsApp templates automatically when something happens. Manage templates and see every run." />
      <AutomationsView />
    </>
  );
}

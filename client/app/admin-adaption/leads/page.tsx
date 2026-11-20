import { Target } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/business-admin/ui";

export default function LeadsPage() {
  return (
    <>
      <PageHeader title="CRM & Leads" description="Track enquiries from the website and WhatsApp through to a booked demo." />
      <EmptyState
        icon={Target}
        title="No lead data is connected to this panel yet"
        description="Lead capture (for example Book Demo requests) is not wired into Business Admin, so nothing is listed here and no sample leads are shown."
        points={[
          "Lead list with status, product interest and source",
          "WhatsApp consent status per lead",
          "Notes and follow-up tracking",
        ]}
        note="WhatsApp conversations can already be read under WhatsApp Inbox."
      />
    </>
  );
}

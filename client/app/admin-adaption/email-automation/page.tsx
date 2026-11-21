import { PageHeader } from "@/components/business-admin/ui";
import { EmailAutomation } from "@/components/business-admin/email/EmailAutomation";

export default function EmailAutomationPage() {
  return (
    <>
      <PageHeader title="Email Automation" description="Create email templates, set up automations and scheduled emails, and see every message sent through Resend." />
      {/* The shared component carries its own "Email Automation" heading (it labels the section for screen readers); hide it visually here so the page title is not repeated. */}
      <div className="[&_#email-automation-heading]:sr-only [&>section]:mt-0">
        <EmailAutomation />
      </div>
    </>
  );
}

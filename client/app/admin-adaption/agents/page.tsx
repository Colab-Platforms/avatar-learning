import { Bot } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/business-admin/ui";

export default function AgentsPage() {
  return (
    <>
      <PageHeader title="AI Agents" description="Configure the assistants that handle conversations on your behalf." />
      <EmptyState
        icon={Bot}
        title="No AI agents are configured"
        description="AI agents are not connected to WhatsApp or any other channel in this platform yet."
        points={["Agent instructions and knowledge", "Channels each agent answers on", "Human hand-off rules"]}
        note="Nothing here sends messages. Any agent that replies to customers will need explicit activation and consent checks first."
      />
    </>
  );
}

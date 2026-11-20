"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Contact, FileText, MessageCircle } from "lucide-react";
import { useBusinessAdmin } from "../BusinessAdminShell";
import { TemplateManager } from "../automation/TemplateManager";
import { ContactsTab } from "./ContactsTab";
import { InboxView } from "./InboxView";

type Tab = "chats" | "contacts" | "templates";
const TABS: Array<{ id: Tab; label: string; icon: typeof MessageCircle }> = [
  { id: "chats", label: "Chats", icon: MessageCircle },
  { id: "contacts", label: "Contacts", icon: Contact },
  { id: "templates", label: "Templates", icon: FileText },
];
const isTab = (v: string | null): v is Tab => v === "chats" || v === "contacts" || v === "templates";

/** WhatsApp Inbox: Chats, Contacts and Templates. The tab lives in the URL (?tab=) so links and the old /customers redirect work. */
export function InboxTabs() {
  useBusinessAdmin();
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTabState] = useState<Tab>(() => (isTab(params.get("tab")) ? (params.get("tab") as Tab) : "chats"));
  const [openWaId, setOpenWaId] = useState<string | null>(null);
  const setTab = useCallback(
    (t: Tab) => {
      setTabState(t);
      router.replace(t === "chats" ? "/admin-adaption/inbox" : `/admin-adaption/inbox?tab=${t}`, { scroll: false });
    },
    [router],
  );
  const clearOpen = useCallback(() => setOpenWaId(null), []);

  return (
    <div className="flex h-[calc(100dvh-3.5rem-3.25rem)] min-h-[28rem] flex-col lg:h-full">
      <div role="tablist" aria-label="WhatsApp Inbox sections" className="flex shrink-0 gap-1 border-b border-white/6 bg-ink-900 px-3 sm:px-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            id={`inbox-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`inbox-panel-${id}`}
            onClick={() => setTab(id)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-medium ${tab === id ? "border-brand-400 bg-brand-500/10 font-bold text-white" : "border-transparent text-white/65 hover:text-white"}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      {/* Chats stays mounted so switching tabs never loses the open conversation or scroll position. */}
      <div role="tabpanel" id="inbox-panel-chats" aria-labelledby="inbox-tab-chats" hidden={tab !== "chats"} className="min-h-0 flex-1">
        <InboxView openWaId={openWaId} onOpened={clearOpen} />
      </div>
      {tab === "contacts" && (
        <div role="tabpanel" id="inbox-panel-contacts" aria-labelledby="inbox-tab-contacts" className="min-h-0 flex-1 overflow-y-auto">
          <ContactsTab
            onOpenChat={(waId) => {
              setOpenWaId(waId);
              setTab("chats");
            }}
          />
        </div>
      )}
      {tab === "templates" && (
        <div role="tabpanel" id="inbox-panel-templates" aria-labelledby="inbox-tab-templates" className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
            <TemplateManager />
          </div>
        </div>
      )}
    </div>
  );
}

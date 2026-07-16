import { User, MapPin, BookOpen, FileText, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab } from "./shared";

const TAB_DEFS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="h-3.5 w-3.5" /> },
  { id: "location", label: "Location", icon: <MapPin className="h-3.5 w-3.5" /> },
  { id: "courses", label: "My Courses", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: "resume", label: "Resume", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "partners", label: "Partners", icon: <Handshake className="h-3.5 w-3.5" /> },
];

export function ProfileTabs({
  activeTab, onChange, coursesCount,
}: { activeTab: Tab; onChange: (tab: Tab) => void; coursesCount: number }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-white p-1 overflow-x-auto hide-scrollbar shadow-sm">
      {TAB_DEFS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium whitespace-nowrap shrink-0",
            "transition-all duration-250",
            activeTab === t.id
              ? "bg-brand-50 border border-brand-200 text-brand-700"
              : "text-text-subtle hover:text-text hover:bg-surface-alt border border-transparent"
          )}
        >
          {t.icon} {t.label}{t.id === "courses" && coursesCount > 0 ? ` (${coursesCount})` : ""}
        </button>
      ))}
    </div>
  );
}

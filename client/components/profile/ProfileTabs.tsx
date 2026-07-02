import { User, MapPin, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab } from "./shared";

const TAB_DEFS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "personal", label: "Personal", icon: <User className="h-3.5 w-3.5" /> },
  { id: "location", label: "Location", icon: <MapPin className="h-3.5 w-3.5" /> },
  { id: "courses", label: "My Courses", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: "resume", label: "Resume", icon: <FileText className="h-3.5 w-3.5" /> },
];

export function ProfileTabs({
  activeTab, onChange, coursesCount,
}: { activeTab: Tab; onChange: (tab: Tab) => void; coursesCount: number }) {
  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-white/6 p-1 overflow-x-auto hide-scrollbar"
      style={{ background: "linear-gradient(145deg, rgba(9,21,37,0.90) 0%, rgba(6,13,26,0.96) 100%)" }}
    >
      {TAB_DEFS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-lg text-[12px] sm:text-[13px] font-medium whitespace-nowrap shrink-0",
            "transition-all duration-250",
            activeTab === t.id
              ? "bg-brand-500/12 border border-brand-500/25 text-brand-300"
              : "text-white/35 hover:text-white/60 hover:bg-white/4 border border-transparent"
          )}
        >
          {t.icon} {t.label}{t.id === "courses" && coursesCount > 0 ? ` (${coursesCount})` : ""}
        </button>
      ))}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui";

export type Tab = "personal" | "location" | "courses" | "resume";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export function initials(first: string | null, last: string | null, email: string) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export const inputCls = cn(
  "w-full rounded-xl border px-4 py-2.5 text-[14px] text-white",
  "placeholder-white/20 border-white/10 bg-white/[0.04]",
  "focus:outline-none focus:border-brand-500/60 focus:bg-ink-900",
  "focus:ring-2 focus:ring-brand-500/15",
  "transition-all duration-200"
);

export function Field({
  label, value, editing, inputNode,
}: { label: string; value: React.ReactNode; editing: boolean; inputNode: React.ReactNode }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
      {editing ? inputNode : (
        <div className="text-[15px] text-white/85 font-medium leading-snug break-words">
          {value || <span className="text-white/20 font-normal">Not set</span>}
        </div>
      )}
    </div>
  );
}

export function ReadOnlyRow({
  icon, label, value, badge,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
      <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-4 py-2.5 min-w-0">
        {icon}
        <span className="text-[15px] text-white/65 flex-1 min-w-0 truncate">
          {value || <span className="text-white/20">Not set</span>}
        </span>
        {badge}
      </div>
    </div>
  );
}

export function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border border-white/7 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(9,21,37,0.92) 0%, rgba(6,13,26,0.97) 100%)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(0,200,255,0.05)",
        animation: "fade-up-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  icon, title, editing,
}: { icon: React.ReactNode; title: string; editing?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-white/5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/15
                        flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h2 className="text-[15px] font-semibold text-white truncate">{title}</h2>
      </div>
      {editing && (
        <span className="shrink-0 text-[11px] text-brand-400/70 border border-brand-500/20
                         bg-brand-500/8 rounded-full px-2.5 py-0.5">
          Editing
        </span>
      )}
    </div>
  );
}

export function EditActions({
  loading, onSave, onCancel,
}: { loading: boolean; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
      <Button variant="primary" size="sm" disabled={loading} onClick={onSave}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        {loading ? "Saving…" : "Save Changes"}
      </Button>
      <Button variant="ghost-dark" size="sm" disabled={loading} onClick={onCancel}>
        <X className="h-3.5 w-3.5" /> Cancel
      </Button>
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui";

export type Tab = "personal" | "location" | "courses" | "resume" | "partners";

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
  "w-full rounded-xl border px-4 py-2.5 text-[14px] text-text",
  "placeholder-text-subtle border-border bg-white",
  "focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/15",
  "transition-all duration-200"
);

export function Field({
  label, value, editing, inputNode,
}: { label: string; value: React.ReactNode; editing: boolean; inputNode: React.ReactNode }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-text-subtle">{label}</p>
      {editing ? inputNode : (
        <div className="text-[15px] text-text font-medium leading-snug break-words">
          {value || <span className="text-text-subtle font-normal">Not set</span>}
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
      <p className="text-[11px] font-semibold uppercase tracking-widest text-text-subtle">{label}</p>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt px-4 py-2.5 min-w-0">
        {icon}
        <span className="text-[15px] text-text-muted flex-1 min-w-0 truncate">
          {value || <span className="text-text-subtle">Not set</span>}
        </span>
        {badge}
      </div>
    </div>
  );
}

export function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
      {children}
    </div>
  );
}

export function PanelHeader({
  icon, title, editing,
}: { icon: React.ReactNode; title: string; editing?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-7 w-7 rounded-lg bg-brand-50 border border-brand-200
                        flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h2 className="text-[15px] font-semibold text-text truncate">{title}</h2>
      </div>
      {editing && (
        <span className="shrink-0 text-[11px] text-brand-600 border border-brand-200
                         bg-brand-50 rounded-full px-2.5 py-0.5">
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
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
      <Button variant="primary" size="sm" disabled={loading} onClick={onSave}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        {loading ? "Saving…" : "Save Changes"}
      </Button>
      <Button variant="ghost" size="sm" disabled={loading} onClick={onCancel}>
        <X className="h-3.5 w-3.5" /> Cancel
      </Button>
    </div>
  );
}

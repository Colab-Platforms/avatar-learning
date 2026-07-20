import {
  Mail, Phone, MapPin, Globe, Calendar,
  BadgeCheck, ShieldCheck, Pencil, X, Check,
  Loader2, LogOut, Camera, BookOpen, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/store/authSlice";
import { formatDate, initials } from "./shared";

export function ProfileSidebar({
  user, editing, loading, coursesCount, completedCount,
  onEdit, onSave, onCancel, onLogout,
}: {
  user: AuthUser;
  editing: boolean;
  loading: boolean;
  coursesCount: number;
  completedCount: number;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onLogout: () => void;
}) {
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  const av = initials(user.firstName, user.lastName, user.email);

  return (
    <aside className="space-y-4 min-w-0">

      {/* Avatar card */}
      <div className="relative rounded-2xl border border-border bg-white overflow-hidden shadow-sm">

        {/* banner gradient */}
        <div className="h-24 relative overflow-hidden bg-gradient-to-br from-brand-50 via-brand-100/60 to-brand-50">
          <div className="absolute inset-0 dot-grid opacity-50" />
        </div>

        <div className="px-5 sm:px-6 pb-6">
          {/* avatar overlap */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative group shrink-0">
              <div
                className="h-20 w-20 rounded-2xl border-4 border-white flex items-center
                           justify-center text-2xl font-black text-white select-none
                           shadow-md"
                style={{ background: "linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-600) 100%)" }}
              >
                {av}
              </div>
              <button
                disabled
                title="Upload photo — coming soon"
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg border border-border
                           bg-white flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Camera className="h-3 w-3 text-text-subtle" />
              </button>
            </div>

            {/* badges */}
            <div className="flex flex-row items-center gap-1.5 pb-1 shrink-0">
              {user.isEmailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200
                                 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 whitespace-nowrap">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
                user.isActive
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-border bg-surface-alt text-text-subtle"
              )}>
                <ShieldCheck className="h-3 w-3" />
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* name + email */}
          <h1 className="text-[18px] font-bold text-text tracking-tight leading-tight break-words">
            {displayName}
          </h1>
          <p className="text-[13px] text-text-muted mt-0.5 truncate">{user.email}</p>

          {/* divider */}
          <div className="my-4 h-px bg-border" />

          {/* meta rows */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-[13px] text-text-muted min-w-0">
              <Calendar className="h-3.5 w-3.5 text-brand-500 shrink-0" />
              <span className="truncate">Joined {formatDate(user.createdAt)}</span>
            </div>
            {(user.state || user.country) && (
              <div className="flex items-center gap-2.5 text-[13px] text-text-muted min-w-0">
                <Globe className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <span className="truncate">{[user.state, user.country].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {user.phoneNo && (
              <div className="flex items-center gap-2.5 text-[13px] text-text-muted min-w-0">
                <Phone className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <span className="truncate">{user.phoneNo}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-2.5 text-[13px] text-text-muted min-w-0">
                <Mail className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
          </div>

          {/* divider */}
          <div className="my-4 h-px bg-border" />

          {/* sidebar actions */}
          <div className="space-y-2">
            {!editing ? (
              <button
                onClick={onEdit}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4
                           text-[13px] font-medium border border-brand-200 text-brand-700
                           bg-brand-50 hover:bg-brand-100 hover:border-brand-300
                           transition-all duration-250"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={onSave} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5
                             text-[13px] font-semibold bg-brand-500 text-white
                             hover:bg-brand-600 disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {loading ? "Saving" : "Save"}
                </button>
                <button
                  onClick={onCancel} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5
                             text-[13px] border border-border text-text-muted
                             hover:border-border-strong hover:text-text transition-all duration-200"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            )}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4
                         text-[13px] font-medium border border-border text-text-subtle
                         hover:border-red-200 hover:bg-red-50 hover:text-red-600
                         transition-all duration-250"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Quick-stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Courses", value: coursesCount.toString(), icon: <BookOpen className="h-4 w-4" /> },
          { label: "Completed", value: completedCount.toString(), icon: <Sparkles className="h-4 w-4" /> },
        ].map((s) => (
          <div key={s.label}
            className="min-w-0 rounded-xl border border-border bg-white p-3 sm:p-4 text-center card-lift"
          >
            <div className="flex justify-center text-brand-500 mb-2">{s.icon}</div>
            <p className="text-[22px] font-bold text-text">{s.value}</p>
            <p className="text-[11px] text-text-subtle uppercase tracking-wider mt-0.5 truncate">{s.label}</p>
          </div>
        ))}
      </div>

    </aside>
  );
}

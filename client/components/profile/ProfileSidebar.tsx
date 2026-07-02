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
      <div
        className="relative rounded-2xl border border-white/8 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, rgba(9,21,37,0.95) 0%, rgba(6,13,26,0.98) 100%)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(0,200,255,0.07)",
        }}
      >
        {/* neon top accent */}
        <div className="absolute top-0 inset-x-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.5) 40%, rgba(0,128,255,0.6) 60%, transparent)" }} />

        {/* banner gradient */}
        <div className="h-24 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(0,60,140,0.6) 0%, rgba(0,200,255,0.18) 50%, rgba(0,30,90,0.5) 100%)" }}>
          <div className="absolute inset-0 dot-grid opacity-40" />
          {/* subtle scan line */}
          <div className="absolute inset-0 neon-scan" />
        </div>

        <div className="px-5 sm:px-6 pb-6">
          {/* avatar overlap */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative group shrink-0">
              <div
                className="h-20 w-20 rounded-2xl border-[3px] border-[#060D1A] flex items-center
                           justify-center text-2xl font-black text-ink-950 select-none
                           shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                style={{ background: "linear-gradient(135deg, #00C8FF 0%, #0080FF 100%)" }}
              >
                {av}
              </div>
              <button
                disabled
                title="Upload photo — coming soon"
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg border border-white/15
                           bg-ink-800 flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Camera className="h-3 w-3 text-white/40" />
              </button>
            </div>

            {/* badges */}
            <div className="flex flex-col items-end gap-1.5 pb-1 shrink-0">
              {user.isEmailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25
                                 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 whitespace-nowrap">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
                user.isActive
                  ? "border-brand-500/20 bg-brand-500/8 text-brand-300"
                  : "border-white/10 bg-white/4 text-white/30"
              )}>
                <ShieldCheck className="h-3 w-3" />
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* name + email */}
          <h1 className="text-[18px] font-bold text-white tracking-tight leading-tight break-words">
            {displayName}
          </h1>
          <p className="text-[13px] text-white/38 mt-0.5 truncate">{user.email}</p>

          {/* divider */}
          <div className="my-4 divider-glow" />

          {/* meta rows */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-[13px] text-white/45 min-w-0">
              <Calendar className="h-3.5 w-3.5 text-brand-400/60 shrink-0" />
              <span className="truncate">Joined {formatDate(user.createdAt)}</span>
            </div>
            {(user.state || user.country) && (
              <div className="flex items-center gap-2.5 text-[13px] text-white/45 min-w-0">
                <Globe className="h-3.5 w-3.5 text-brand-400/60 shrink-0" />
                <span className="truncate">{[user.state, user.country].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {user.phoneNo && (
              <div className="flex items-center gap-2.5 text-[13px] text-white/45 min-w-0">
                <Phone className="h-3.5 w-3.5 text-brand-400/60 shrink-0" />
                <span className="truncate">{user.phoneNo}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-2.5 text-[13px] text-white/45 min-w-0">
                <Mail className="h-3.5 w-3.5 text-brand-400/60 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
          </div>

          {/* divider */}
          <div className="my-4 divider-glow" />

          {/* sidebar actions */}
          <div className="space-y-2">
            {!editing ? (
              <button
                onClick={onEdit}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4
                           text-[13px] font-medium border border-brand-500/30 text-brand-300
                           bg-brand-500/6 hover:bg-brand-500/12 hover:border-brand-500/50
                           transition-all duration-250"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={onSave} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5
                             text-[13px] font-semibold bg-brand-500 text-ink-950
                             hover:bg-brand-400 disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {loading ? "Saving" : "Save"}
                </button>
                <button
                  onClick={onCancel} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5
                             text-[13px] border border-white/10 text-white/50
                             hover:border-white/20 hover:text-white/75 transition-all duration-200"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            )}
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4
                         text-[13px] font-medium border border-white/8 text-white/35
                         hover:border-red-500/30 hover:bg-red-500/6 hover:text-red-400
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
            className="min-w-0 rounded-xl border border-white/6 p-3 sm:p-4 text-center
                       hover:border-brand-500/20 transition-colors duration-300"
            style={{ background: "linear-gradient(145deg, rgba(13,23,39,0.85) 0%, rgba(9,18,32,0.95) 100%)" }}
          >
            <div className="flex justify-center text-brand-400/50 mb-2">{s.icon}</div>
            <p className="text-[22px] font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-white/30 uppercase tracking-wider mt-0.5 truncate">{s.label}</p>
          </div>
        ))}
      </div>

    </aside>
  );
}

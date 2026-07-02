import { cn } from "@/lib/utils";
import type { AuthUser } from "@/store/authSlice";
import { formatDate } from "./shared";

export function AccountDetails({ user }: { user: AuthUser }) {
  return (
    <div
      className="rounded-2xl border border-white/6 p-4 sm:p-5"
      style={{ background: "linear-gradient(145deg, rgba(9,21,37,0.88) 0%, rgba(6,13,26,0.95) 100%)" }}
    >
      <h3 className="text-[12px] font-semibold uppercase tracking-widest text-white/30 mb-4">
        Account Details
      </h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="min-w-0">
          <p className="text-[11px] text-white/25 uppercase tracking-wider mb-1">User ID</p>
          <p className="text-[12px] font-mono text-white/45 truncate">{user.id}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-white/25 uppercase tracking-wider mb-1">Member Since</p>
          <p className="text-[13px] text-white/65 truncate">{formatDate(user.createdAt)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-white/25 uppercase tracking-wider mb-1">Account Status</p>
          <p className={cn("text-[13px] font-medium truncate", user.isActive ? "text-brand-300" : "text-white/35")}>
            {user.isActive ? "Active" : "Inactive"}
          </p>
        </div>
      </div>
    </div>
  );
}

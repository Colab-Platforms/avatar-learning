import { cn } from "@/lib/utils";
import type { AuthUser } from "@/store/authSlice";
import { formatDate } from "./shared";

export function AccountDetails({ user }: { user: AuthUser }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-sm">
      <h3 className="text-[12px] font-semibold uppercase tracking-widest text-text-subtle mb-4">
        Account Details
      </h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="min-w-0">
          <p className="text-[11px] text-text-subtle uppercase tracking-wider mb-1">User ID</p>
          <p className="text-[12px] font-mono text-text-muted truncate">{user.id}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-text-subtle uppercase tracking-wider mb-1">Member Since</p>
          <p className="text-[13px] text-text truncate">{formatDate(user.createdAt)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-text-subtle uppercase tracking-wider mb-1">Account Status</p>
          <p className={cn("text-[13px] font-medium truncate", user.isActive ? "text-brand-600" : "text-text-subtle")}>
            {user.isActive ? "Active" : "Inactive"}
          </p>
        </div>
      </div>
    </div>
  );
}

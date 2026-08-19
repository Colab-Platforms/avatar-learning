"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError, completeProfile, logoutThunk } from "@/store/authSlice";

const primaryBtn = [
  "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
  "text-[14px] font-semibold text-white",
  "hover:brightness-110 active:scale-95 transition-all duration-200",
  "disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer",
].join(" ");

const inputCls = cn(
  "w-full rounded-xl border px-4 py-3 text-[14px] text-slate-800",
  "placeholder-slate-300 border-slate-200",
  "bg-white",
  "focus:outline-none focus:border-blue-400 focus:bg-white",
  "focus:ring-2 focus:ring-blue-500/15",
  "transition-all duration-200",
);

const PHONE_PATTERN = /^[6-9]\d{9}$/;

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function buildFullName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function CompleteProfileForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, error, hasHydrated } = useAppSelector((s) => s.auth);

  const [fullName, setFullName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.profileCompleted === true) {
      router.replace(redirectTo);
    }
  }, [hasHydrated, user, router, redirectTo]);

  useEffect(() => {
    if (!user || initialized) return;
    setFullName(buildFullName(user.firstName, user.lastName));
    setPhoneNo(user.phoneNo ?? "");
    setInitialized(true);
  }, [user, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    dispatch(clearError());

    const { firstName, lastName } = splitFullName(fullName);
    if (!firstName.trim()) {
      setLocalError("Full name is required");
      return;
    }
    if (!PHONE_PATTERN.test(phoneNo.trim())) {
      setLocalError("Enter a valid 10-digit Indian mobile number");
      return;
    }

    const result = await dispatch(
      completeProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNo: phoneNo.trim(),
      }),
    );

    if (completeProfile.fulfilled.match(result)) {
      router.replace(redirectTo);
    }
  };

  // const handleLogout = () => {
  //   dispatch(logoutThunk());
  //   router.replace("/login");
  // };

  if (!hasHydrated || !user || user.profileCompleted === true) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const displayError = localError ?? error;

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Complete Your Profile
        </h2>
        <p className="text-[13px] text-slate-400">
          We just need a few more details before you continue.
        </p>
      </div>

      <div className="h-px bg-slate-100" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="fullName"
            className="text-[12px] font-semibold tracking-wide uppercase text-slate-400"
          >
            Full name* 
          </label>
          <input
            id="fullName"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="phone"
            className="text-[12px] font-semibold tracking-wide uppercase text-slate-400"
          >
            Phone number*
          </label>
          <input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="numeric"
            maxLength={10}
            value={phoneNo}
            onChange={(e) =>
              setPhoneNo(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="9876543210"
            className={inputCls}
          />
        </div>

        {displayError && (
          <p className="text-[13px] text-red-500 text-center">{displayError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={primaryBtn}
          style={{
            background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)",
          }}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* <p className="text-center text-[13px]">
        <button
          type="button"
          onClick={handleLogout}
          className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
        >
          Sign out
        </button>
      </p> */}
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      }
    >
      <CompleteProfileForm />
    </Suspense>
  );
}

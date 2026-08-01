"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError, completeProfile, logoutThunk } from "@/store/authSlice";
import {
  getCountries,
  getStatesForCountry,
  getCitiesForState,
  DEFAULT_COUNTRY_CODE,
} from "@/data/countries";

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

export default function CompleteProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, loading, error, hasHydrated } = useAppSelector((s) => s.auth);

  const [fullName, setFullName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [country, setCountry] = useState(DEFAULT_COUNTRY_CODE);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const countries = useMemo(() => getCountries(), []);
  const states = useMemo(() => getStatesForCountry(country), [country]);
  const cities = useMemo(
    () => getCitiesForState(country, state),
    [country, state],
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.profileCompleted === true) {
      router.replace("/");
    }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (!user || initialized) return;
    setFullName(buildFullName(user.firstName, user.lastName));
    setPhoneNo(user.phoneNo ?? "");
    setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "");
    setInitialized(true);
  }, [user, initialized]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
    setState("");
    setCity("");
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setState(e.target.value);
    setCity("");
  };

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
    if (!state) {
      setLocalError("State is required");
      return;
    }
    if (!city) {
      setLocalError("City is required");
      return;
    }
    if (!dateOfBirth) {
      setLocalError("Date of birth is required");
      return;
    }

    const countryName =
      countries.find((c) => c.isoCode === country)?.name ?? country;
    const stateName = states.find((s) => s.isoCode === state)?.name ?? state;

    const result = await dispatch(
      completeProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNo: phoneNo.trim(),
        country: countryName,
        state: stateName,
        city,
        dateOfBirth,
      }),
    );

    if (completeProfile.fulfilled.match(result)) {
      router.replace("/");
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
            Full name
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
            Phone number
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

        <div className="space-y-1.5">
          <label
            htmlFor="dateOfBirth"
            className="text-[12px] font-semibold tracking-wide uppercase text-slate-400"
          >
            Date of birth
          </label>
          <input
            id="dateOfBirth"
            type="date"
            required
            value={dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="country"
              className="text-[12px] font-semibold tracking-wide uppercase text-slate-400"
            >
              Country
            </label>
            <select
              id="country"
              required
              value={country}
              onChange={handleCountryChange}
              className={cn(
                inputCls,
                "appearance-none cursor-pointer bg-white",
              )}
            >
              {countries.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="state"
              className="text-[12px] font-semibold tracking-wide uppercase text-slate-400"
            >
              State
            </label>
            <select
              id="state"
              required
              value={state}
              onChange={handleStateChange}
              disabled={states.length === 0}
              className={cn(
                inputCls,
                "appearance-none cursor-pointer bg-white disabled:opacity-50",
              )}
            >
              <option value="">
                {states.length === 0 ? "No states" : "Select state"}
              </option>
              {states.map((s) => (
                <option key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="city"
              className="text-[12px] font-semibold tracking-wide uppercase text-slate-400"
            >
              City
            </label>
            <select
              id="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!state || cities.length === 0}
              className={cn(
                inputCls,
                "appearance-none cursor-pointer bg-white disabled:opacity-50",
              )}
            >
              <option value="">
                {!state
                  ? "Select state"
                  : cities.length === 0
                    ? "No cities"
                    : "Select city"}
              </option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Phone, MapPin, Globe, Calendar,
  BadgeCheck, ShieldCheck, Pencil, X, Check,
  Loader2, LogOut, Camera, Sparkles, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser, logoutThunk, clearError } from "@/store/authSlice";
import type { UpdateUserBody } from "@/store/authSlice";

/* ─────────────────────────── helpers ─────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function initials(first: string | null, last: string | null, email: string) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

/* ─────────────────────────── sub-components ──────────────────── */

const inputCls = cn(
  "w-full rounded-xl border px-4 py-2.5 text-[14px] text-white",
  "placeholder-white/20 border-white/10 bg-white/[0.04]",
  "focus:outline-none focus:border-brand-500/60 focus:bg-white/[0.06]",
  "focus:ring-2 focus:ring-brand-500/15",
  "transition-all duration-200"
);

function Field({
  label, value, editing, inputNode,
}: { label: string; value: React.ReactNode; editing: boolean; inputNode: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
      {editing ? inputNode : (
        <div className="text-[15px] text-white/85 font-medium leading-snug">
          {value || <span className="text-white/20 font-normal">Not set</span>}
        </div>
      )}
    </div>
  );
}

type Tab = "personal" | "location";

/* ─────────────────────────── page ────────────────────────────── */
export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { user, loading, error } = useAppSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [editing,   setEditing]   = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [form,      setForm]      = useState<UpdateUserBody>({});

  useEffect(() => { if (!user) router.replace("/login"); }, [user, router]);

  useEffect(() => {
    if (user && editing) {
      setForm({
        firstName: user.firstName ?? "",
        lastName:  user.lastName  ?? "",
        phoneNo:   user.phoneNo   ?? "",
        address:   user.address   ?? "",
        gender:    user.gender    ?? "",
        state:     user.state     ?? "",
        country:   user.country   ?? "",
      });
    }
  }, [user, editing]);

  if (!user) return null;

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";
  const av          = initials(user.firstName, user.lastName, user.email);

  const set = (field: keyof UpdateUserBody) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    dispatch(clearError());
    setSaveOk(false);
    const result = await dispatch(updateUser({ id: user.id, ...form }));
    if (updateUser.fulfilled.match(result)) {
      setSaveOk(true);
      setEditing(false);
      setTimeout(() => setSaveOk(false), 3500);
    }
  };

  const handleCancel = () => { setEditing(false); dispatch(clearError()); };

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/");
  };

  /* ── tab definitions ── */
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "personal", label: "Personal",  icon: <User     className="h-3.5 w-3.5" /> },
    { id: "location", label: "Location",  icon: <MapPin   className="h-3.5 w-3.5" /> },
  ];

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen text-white overflow-x-hidden pt-16"
        style={{ background: "linear-gradient(160deg,#060D1A 0%,#091220 30%,#060D1A 60%,#091525 100%)" }}
      >
        {/* fixed ambient glows */}
        <div className="pointer-events-none fixed inset-0 dot-grid-dark opacity-25" aria-hidden />
        <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] opacity-[0.13]"
          style={{ background: "radial-gradient(ellipse at top, rgba(0,200,255,0.35) 0%, transparent 65%)", filter: "blur(60px)" }} aria-hidden />
        <div className="pointer-events-none fixed bottom-0 right-0 w-[500px] h-[400px] opacity-[0.08]"
          style={{ background: "radial-gradient(ellipse at bottom right, rgba(0,80,200,0.6) 0%, transparent 65%)", filter: "blur(90px)" }} aria-hidden />

        <div className="relative container-x py-10 max-w-6xl">

          {/* ── toast banners ── */}
          <div className="space-y-3 mb-6">
            {saveOk && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/25
                              bg-emerald-500/8 px-4 py-3 text-[13px] text-emerald-300"
                style={{ animation: "fade-up-in 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
                <Check className="h-4 w-4 shrink-0" /> Profile updated successfully!
              </div>
            )}
            {error && !saveOk && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-500/25
                              bg-red-500/8 px-4 py-3 text-[13px] text-red-300"
                style={{ animation: "fade-up-in 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
                <X className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
          </div>


          {/* ════════════════════════════════════════════
              MAIN LAYOUT — sidebar + content
          ════════════════════════════════════════════ */}
          <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">

            {/* ─── LEFT SIDEBAR ─── */}
            <aside className="space-y-4">

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

                <div className="px-6 pb-6">
                  {/* avatar overlap */}
                  <div className="flex items-end justify-between -mt-10 mb-4">
                    <div className="relative group">
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
                    <div className="flex flex-col items-end gap-1.5 pb-1">
                      {user.isEmailVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25
                                         bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
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
                  <h1 className="text-[18px] font-bold text-white tracking-tight leading-tight">
                    {displayName}
                  </h1>
                  <p className="text-[13px] text-white/38 mt-0.5 truncate">{user.email}</p>

                  {/* divider */}
                  <div className="my-4 divider-glow" />

                  {/* meta rows */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 text-[13px] text-white/45">
                      <Calendar className="h-3.5 w-3.5 text-brand-400/60 shrink-0" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                    {(user.state || user.country) && (
                      <div className="flex items-center gap-2.5 text-[13px] text-white/45">
                        <Globe className="h-3.5 w-3.5 text-brand-400/60 shrink-0" />
                        <span>{[user.state, user.country].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                    {user.phoneNo && (
                      <div className="flex items-center gap-2.5 text-[13px] text-white/45">
                        <Phone className="h-3.5 w-3.5 text-brand-400/60 shrink-0" />
                        <span>{user.phoneNo}</span>
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
                        onClick={() => setEditing(true)}
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
                          onClick={handleSave} disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5
                                     text-[13px] font-semibold bg-brand-500 text-ink-950
                                     hover:bg-brand-400 disabled:opacity-50 transition-all duration-200"
                        >
                          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          {loading ? "Saving" : "Save"}
                        </button>
                        <button
                          onClick={handleCancel} disabled={loading}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5
                                     text-[13px] border border-white/10 text-white/50
                                     hover:border-white/20 hover:text-white/75 transition-all duration-200"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
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
                  { label: "Courses",    value: "0",    icon: <BookOpen   className="h-4 w-4" /> },
                  { label: "Completed",  value: "0",    icon: <Sparkles   className="h-4 w-4" /> },
                ].map((s) => (
                  <div key={s.label}
                    className="rounded-xl border border-white/6 p-4 text-center
                               hover:border-brand-500/20 transition-colors duration-300"
                    style={{ background: "linear-gradient(145deg, rgba(13,23,39,0.85) 0%, rgba(9,18,32,0.95) 100%)" }}
                  >
                    <div className="flex justify-center text-brand-400/50 mb-2">{s.icon}</div>
                    <p className="text-[22px] font-bold text-white">{s.value}</p>
                    <p className="text-[11px] text-white/30 uppercase tracking-wider mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

            </aside>


            {/* ─── RIGHT CONTENT ─── */}
            <div className="space-y-5">

              {/* Tab bar */}
              <div
                className="flex items-center gap-1 rounded-xl border border-white/6 p-1"
                style={{ background: "linear-gradient(145deg, rgba(9,21,37,0.90) 0%, rgba(6,13,26,0.96) 100%)" }}
              >
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-medium",
                      "transition-all duration-250",
                      activeTab === t.id
                        ? "bg-brand-500/12 border border-brand-500/25 text-brand-300"
                        : "text-white/35 hover:text-white/60 hover:bg-white/4 border border-transparent"
                    )}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* ── PERSONAL TAB ── */}
              {activeTab === "personal" && (
                <div
                  className="rounded-2xl border border-white/7 overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, rgba(9,21,37,0.92) 0%, rgba(6,13,26,0.97) 100%)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(0,200,255,0.05)",
                    animation: "fade-up-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  {/* section header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/15
                                      flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-brand-400" />
                      </div>
                      <h2 className="text-[15px] font-semibold text-white">Personal Information</h2>
                    </div>
                    {editing && (
                      <span className="text-[11px] text-brand-400/70 border border-brand-500/20
                                       bg-brand-500/8 rounded-full px-2.5 py-0.5">
                        Editing
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-5">
                    {/* name row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field
                        label="First Name"
                        value={user.firstName}
                        editing={editing}
                        inputNode={<input value={form.firstName ?? ""} onChange={set("firstName")} placeholder="First name" className={inputCls} />}
                      />
                      <Field
                        label="Last Name"
                        value={user.lastName}
                        editing={editing}
                        inputNode={<input value={form.lastName ?? ""} onChange={set("lastName")} placeholder="Last name" className={inputCls} />}
                      />
                    </div>

                    <div className="divider-glow" />

                    {/* email — read-only row */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Email Address</p>
                      <div className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-4 py-2.5">
                        <Mail className="h-4 w-4 text-white/20 shrink-0" />
                        <span className="text-[15px] text-white/65 flex-1">{user.email}</span>
                        {user.isEmailVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400
                                           bg-emerald-500/8 border border-emerald-500/20 rounded-full px-2 py-0.5">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="divider-glow" />

                    {/* phone + gender */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field
                        label="Phone Number"
                        value={user.phoneNo}
                        editing={editing}
                        inputNode={<input value={form.phoneNo ?? ""} onChange={set("phoneNo")} placeholder="+91 98765 43210" className={inputCls} />}
                      />
                      <Field
                        label="Gender"
                        value={user.gender}
                        editing={editing}
                        inputNode={
                          <select value={form.gender ?? ""} onChange={set("gender")}
                            className={cn(inputCls, "cursor-pointer")}>
                            <option value="">Prefer not to say</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        }
                      />
                    </div>

                    {/* save bar inside panel */}
                    {editing && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <Button variant="primary" size="sm" disabled={loading} onClick={handleSave}>
                          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          {loading ? "Saving…" : "Save Changes"}
                        </Button>
                        <Button variant="ghost-dark" size="sm" disabled={loading} onClick={handleCancel}>
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* ── LOCATION TAB ── */}
              {activeTab === "location" && (
                <div
                  className="rounded-2xl border border-white/7 overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, rgba(9,21,37,0.92) 0%, rgba(6,13,26,0.97) 100%)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(0,200,255,0.05)",
                    animation: "fade-up-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/15
                                      flex items-center justify-center">
                        <MapPin className="h-3.5 w-3.5 text-brand-400" />
                      </div>
                      <h2 className="text-[15px] font-semibold text-white">Location</h2>
                    </div>
                    {editing && (
                      <span className="text-[11px] text-brand-400/70 border border-brand-500/20
                                       bg-brand-500/8 rounded-full px-2.5 py-0.5">
                        Editing
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-5">
                    <Field
                      label="Street Address"
                      value={user.address}
                      editing={editing}
                      inputNode={<input value={form.address ?? ""} onChange={set("address")} placeholder="123 Main Street" className={inputCls} />}
                    />

                    <div className="divider-glow" />

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field
                        label="State / Province"
                        value={user.state}
                        editing={editing}
                        inputNode={<input value={form.state ?? ""} onChange={set("state")} placeholder="Maharashtra" className={inputCls} />}
                      />
                      <Field
                        label="Country"
                        value={user.country}
                        editing={editing}
                        inputNode={<input value={form.country ?? ""} onChange={set("country")} placeholder="India" className={inputCls} />}
                      />
                    </div>

                    {/* map placeholder — tasteful empty state */}
                    {!editing && !user.state && !user.country && (
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
                        <Globe className="h-8 w-8 text-white/10 mx-auto mb-2" />
                        <p className="text-[13px] text-white/25">No location set yet</p>
                        <button
                          onClick={() => setEditing(true)}
                          className="mt-2 text-[12px] text-brand-400/60 hover:text-brand-400 transition-colors duration-200"
                        >
                          Add your location →
                        </button>
                      </div>
                    )}

                    {editing && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <Button variant="primary" size="sm" disabled={loading} onClick={handleSave}>
                          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          {loading ? "Saving…" : "Save Changes"}
                        </Button>
                        <Button variant="ghost-dark" size="sm" disabled={loading} onClick={handleCancel}>
                          <X className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Account info read-only card — always visible */}
              <div
                className="rounded-2xl border border-white/6 p-5"
                style={{ background: "linear-gradient(145deg, rgba(9,21,37,0.88) 0%, rgba(6,13,26,0.95) 100%)" }}
              >
                <h3 className="text-[12px] font-semibold uppercase tracking-widest text-white/30 mb-4">
                  Account Details
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] text-white/25 uppercase tracking-wider mb-1">User ID</p>
                    <p className="text-[12px] font-mono text-white/45 truncate">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/25 uppercase tracking-wider mb-1">Member Since</p>
                    <p className="text-[13px] text-white/65">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/25 uppercase tracking-wider mb-1">Account Status</p>
                    <p className={cn("text-[13px] font-medium", user.isActive ? "text-brand-300" : "text-white/35")}>
                      {user.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>

            </div>
            {/* end right content */}

          </div>
          {/* end grid */}

        </div>
      </main>
      <Footer />
    </>
  );
}

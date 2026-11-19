"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { adoptionAuth, type AdoptionUser } from "@/lib/adoptionSession";

/** Navbar "My Account" button shown in place of "Login" once signed in. */
export function AccountMenu({ user }: { user: AdoptionUser }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const name = user.fullName;
  const initial = (user.fullName || user.email || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onFocus = (e: FocusEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  const onLogout = async () => {
    setBusy(true);
    await adoptionAuth.logout(); // revokes the AI Adoption session on the server and clears it here
    setBusy(false);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`My Account${name ? `: ${name}` : ""}`}
        onClick={() => setOpen((o) => !o)}
        className="border border-white/[0.14] bg-white/[0.03] text-[#f4f6f8] transition-colors hover:border-white/30 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef]"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 42, boxSizing: "border-box", padding: "0 14px 0 6px", borderRadius: 999, fontSize: 15, fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer" }}
      >
        <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(111,227,239,.12)", color: "#8fe9f2", fontSize: 13, fontWeight: 600 }}>
          {initial}
        </span>
        My Account
      </button>
      {open && (
        <div
          role="menu"
          style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", minWidth: 240, padding: 6, borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "#0f1218", boxShadow: "0 20px 50px rgba(0,0,0,.6)", zIndex: 60 }}
        >
          <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: 4 }}>
            {name && <div style={{ fontSize: 14, color: "#f4f6f8", fontWeight: 500 }}>{name}</div>}
            <div style={{ fontSize: 13, color: "#8a939e", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
          <Link
            href="/account"
            role="menuitem"
            autoFocus
            onClick={() => setOpen(false)}
            className="text-[#f4f6f8] hover:bg-white/[0.05] focus-visible:bg-white/[0.07] focus-visible:outline-none"
            style={{ display: "block", padding: "10px 12px", borderRadius: 8, fontSize: 14, textDecoration: "none" }}
          >
            My account
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            disabled={busy}
            className="text-[#f4f6f8] hover:bg-white/[0.05] focus-visible:bg-white/[0.07] focus-visible:outline-none disabled:opacity-60"
            style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: 0, background: "transparent", fontSize: 14, cursor: "pointer" }}
          >
            {busy ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

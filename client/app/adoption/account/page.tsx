"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adoptionAuth, useAdoptionSession } from "@/lib/adoptionSession";
import { Heading, focusRing, secondaryHover } from "../_components/ui";
import { smallSecondary } from "./_sections/shared";
import { ToolsSection } from "./_sections/Tools";
import { DemoRequestsSection } from "./_sections/DemoRequests";
import { ProfileSection } from "./_sections/Profile";
import { SettingsSection } from "./_sections/Settings";
import { HelpSection } from "./_sections/Help";

const TABS = [
  { id: "tools", label: "My tools" },
  { id: "demos", label: "Demo requests" },
  { id: "profile", label: "Profile" },
  { id: "settings", label: "Settings" },
  { id: "help", label: "Help & support" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/**
 * AI Adoption "My Account" (protected; /account redirects here). Everything is
 * loaded from the signed-in account's own backend records.
 */
export default function AdoptionAccountPage() {
  const router = useRouter();
  const { status, user } = useAdoptionSession();
  const [tab, setTab] = useState<TabId>("tools");

  useEffect(() => {
    if (status === "signedOut") router.replace("/adoption/login?next=/adoption/account");
  }, [status, router]);

  // Deep links like /account#profile open that tab.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1) as TabId;
      if (TABS.some((t) => t.id === h)) setTab(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const choose = (id: TabId) => {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
  };

  const shell = (children: React.ReactNode) => (
    <div style={{ width: "100%", maxWidth: 860, borderRadius: 24, padding: 1, background: "linear-gradient(180deg,rgba(143,233,242,.4),rgba(255,255,255,.06) 50%)" }}>
      <div style={{ borderRadius: 23, background: "#0b0d12", padding: "clamp(22px,4.5vw,40px)", display: "flex", flexDirection: "column", gap: 26 }}>{children}</div>
    </div>
  );

  if (status !== "signedIn" || !user) {
    return shell(<p style={{ margin: 0, color: "#a3abb5" }} aria-live="polite">{status === "loading" ? "Loading your account…" : "Taking you to sign in…"}</p>);
  }

  const details = [user.jobRole, user.companyName, user.companySize].filter(Boolean).join(" · ");

  return shell(
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Heading title={`Welcome, ${user.fullName.split(" ")[0]}`} subtitle={user.email} />
          {details && <p style={{ margin: 0, fontSize: 13.5, color: "#8a939e" }}>{details}</p>}
        </div>
        <button
          type="button"
          onClick={async () => {
            await adoptionAuth.logout();
            router.replace("/");
          }}
          className={`${focusRing} ${secondaryHover}`}
          style={smallSecondary}
        >
          Log out
        </button>
      </div>

      <div role="tablist" aria-label="My Account sections" style={{ display: "flex", gap: 6, overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,.08)", margin: "0 -4px", padding: "0 4px" }}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => choose(t.id)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const i = TABS.findIndex((x) => x.id === t.id);
                const n = TABS[(i + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length];
                choose(n.id);
                document.getElementById(`tab-${n.id}`)?.focus();
              }}
              className={`${focusRing} transition-colors`}
              style={{
                flex: "none",
                padding: "10px 12px",
                marginBottom: -1,
                border: 0,
                borderBottom: `2px solid ${on ? "#6fe3ef" : "transparent"}`,
                background: "transparent",
                color: on ? "#f4f6f8" : "#8a939e",
                fontSize: 14.5,
                fontWeight: on ? 500 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "tools" && <ToolsSection />}
        {tab === "demos" && <DemoRequestsSection />}
        {tab === "profile" && <ProfileSection user={user} />}
        {tab === "settings" && <SettingsSection user={user} />}
        {tab === "help" && <HelpSection user={user} />}
      </div>
    </>,
  );
}

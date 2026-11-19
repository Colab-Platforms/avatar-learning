"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PRODUCTS } from "./data";
import styles from "./ecosystem.module.css";
import { submitDemoRequest } from "@/lib/adoptionSession";
import { saveDemoConfirmation } from "@/lib/demoConfirmation";

/**
 * The Book a Demo form. One component, used by the homepage "Get in touch"
 * section and by /adoption/book-demo. Requests go to POST /api/adoption/demo-requests,
 * which saves them (linked to the account when signed in, so they show under
 * My Account → Demo requests) and copies them to the admin Contacts inbox.
 */

const fieldStyle: React.CSSProperties = {
  height: 48,
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.03)",
  color: "#f4f6f8",
  padding: "0 14px",
  fontSize: 15,
  outline: "none",
  transition: "border-color .2s, box-shadow .2s",
};

// Dropdowns share the input look, with a chevron in place of the native arrow.
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3abb5' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`;
const selectStyle: React.CSSProperties = {
  ...fieldStyle,
  appearance: "none",
  WebkitAppearance: "none",
  paddingRight: 38,
  backgroundImage: CHEVRON,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  color: "#8a939e", // placeholder grey until a value is picked
  cursor: "pointer",
};
const optionStyle: React.CSSProperties = { background: "#0b0d12", color: "#f4f6f8" };

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "#a3abb5" };

const ERROR_COLOR = "#ff8a8a";

export const ROLES = [
  "Founder / Business Owner",
  "CEO / Director",
  "Manager",
  "HR Manager",
  "Sales Manager",
  "Operations Manager",
  "IT Manager",
  "Other",
];

export const COMPANY_SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "501–1000 employees",
  "1000+ employees",
];

// Same products, same order as the Tools section; the slug is what gets submitted.
export const TOOL_OPTIONS = PRODUCTS.map((p) => ({ id: p.slug, label: p.slug === "custom" ? "Custom Tools" : p.name }));

/** Accepts form slugs (crm, orders…) or AI Adoption product keys (CRM, OMS…). */
const KEY_TO_SLUG: Record<string, string> = { CRM: "crm", OMS: "orders", SCRIPT_AUTOMATION: "script", LMS: "learning", RECRUITMENT_CRM: "recruitment", HRMS: "hrms", IMS: "inventory", CUSTOM: "custom" };
const SLUG_TO_KEY: Record<string, string> = Object.fromEntries(Object.entries(KEY_TO_SLUG).map(([k, v]) => [v, k]));
export const toolSlugs = (list: string[]) => {
  const valid = new Set(TOOL_OPTIONS.map((o) => o.id));
  return [...new Set(list.map((t) => KEY_TO_SLUG[t.trim().toUpperCase()] ?? t.trim().toLowerCase()))].filter((t) => valid.has(t));
};

function onFocusGlow(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "#6fe3ef";
  e.currentTarget.style.boxShadow = "0 0 0 4px rgba(111,227,239,.12)";
}
function onBlurGlow(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = e.currentTarget.getAttribute("aria-invalid") === "true" ? ERROR_COLOR : "rgba(255,255,255,.1)";
  e.currentTarget.style.boxShadow = "none";
}

const pickedColor = (e: React.ChangeEvent<HTMLSelectElement>) => (e.currentTarget.style.color = "#f4f6f8");

/** Multi-select dropdown with checkboxes, styled like the other inputs. */
function ToolsSelect({ value, onChange, invalid }: { value: string[]; onChange: (v: string[]) => void; invalid: boolean }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Close on outside click/tap, when keyboard focus moves outside, or on Escape.
  // (Not on blur: pressing an option's text blurs the button with no new focus
  // target, and closing then would swallow the click on that option.)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onFocusIn = (e: FocusEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : TOOL_OPTIONS.filter((o) => o.id === id || value.includes(o.id)).map((o) => o.id));
  const chosen = TOOL_OPTIONS.filter((o) => value.includes(o.id));
  const shown = chosen.slice(0, 3);

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative" }}
    >
      <button
        ref={btnRef}
        type="button"
        id="demo-tools"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="demo-tools-list"
        aria-invalid={invalid}
        aria-describedby={invalid ? "demo-tools-error" : undefined}
        aria-labelledby="demo-tools-label demo-tools"
        onClick={() => setOpen((o) => !o)}
        onFocus={onFocusGlow}
        onBlur={onBlurGlow}
        style={{
          ...selectStyle,
          display: "flex",
          alignItems: "center",
          gap: 6,
          textAlign: "left",
          overflow: "hidden",
          borderColor: invalid ? ERROR_COLOR : "rgba(255,255,255,.1)",
        }}
      >
        {chosen.length === 0 ? (
          <span style={{ color: "#8a939e" }}>Select one or more tools</span>
        ) : (
          <>
            {shown.map((o) => (
              <span key={o.id} style={{ flex: "none", padding: "3px 10px", borderRadius: 999, border: "1px solid rgba(111,227,239,.35)", background: "rgba(111,227,239,.08)", color: "#cfeff3", fontSize: 13, whiteSpace: "nowrap" }}>
                {o.label}
              </span>
            ))}
            {chosen.length > shown.length && <span style={{ flex: "none", fontSize: 13, color: "#a3abb5" }}>+{chosen.length - shown.length}</span>}
          </>
        )}
      </button>

      {open && (
        <div
          id="demo-tools-list"
          role="group"
          aria-labelledby="demo-tools-label"
          style={{
            position: "absolute",
            zIndex: 10,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,170px),1fr))",
            gap: 2,
            padding: 6,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.12)",
            background: "#0f1218",
            boxShadow: "0 20px 50px rgba(0,0,0,.6)",
          }}
        >
          {TOOL_OPTIONS.map((o) => {
            const on = value.includes(o.id);
            return (
              <label
                key={o.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 14, color: on ? "#f4f6f8" : "#a3abb5", background: on ? "rgba(111,227,239,.06)" : "transparent" }}
                onMouseEnter={(e) => !on && (e.currentTarget.style.background = "rgba(255,255,255,.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = on ? "rgba(111,227,239,.06)" : "transparent")}
              >
                <input type="checkbox" name="interestedTools" value={o.id} checked={on} onChange={() => toggle(o.id)} style={{ width: 16, height: 16, margin: 0, accentColor: "#6fe3ef", cursor: "pointer" }} />
                {o.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}


type Prefill = { name?: string; email?: string; company?: string };

export function DemoRequestForm({ prefill, initialTools = [] }: { prefill?: Prefill; initialTools?: string[] }) {
  const [sent, setSent] = useState(false);
  const [tools, setTools] = useState<string[]>(() => toolSlugs(initialTools));
  const [toolsError, setToolsError] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const inFlight = useRef(false);

  // Product buttons elsewhere on the page can tick tools (keeps any already chosen).
  useEffect(() => {
    const onTools = (e: Event) => {
      const add = (e as CustomEvent<string[]>).detail ?? [];
      setTools((prev) => TOOL_OPTIONS.map((o) => o.id).filter((id) => prev.includes(id) || add.includes(id)));
      setToolsError(false);
      setSent(false);
    };
    window.addEventListener("avatar:demo-tools", onTools);
    return () => window.removeEventListener("avatar:demo-tools", onTools);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inFlight.current) return; // no duplicate submissions
    if (tools.length === 0) {
      setToolsError(true);
      document.getElementById("demo-tools")?.focus();
      return;
    }
    const f = new FormData(e.currentTarget);
    const val = (k: string) => String(f.get(k) ?? "").trim();
    inFlight.current = true;
    setSending(true);
    setSubmitError("");
    try {
      // Saved as an AI Adoption demo request (linked to the account when signed in)
      // and copied to the admin Contacts inbox by the backend.
      const saved = await submitDemoRequest({
        name: val("name"),
        email: val("email"),
        company: val("company") || undefined,
        phone: val("phone") || undefined,
        role: val("role"),
        companySize: val("companySize"),
        tools: tools.map((t) => SLUG_TO_KEY[t]).filter(Boolean),
        customRequirement: tools.includes("custom") ? val("customRequirements") : undefined,
        message: val("message") || undefined,
      });
      // Only after the server has saved it: hand the confirmation to /thank-you.
      saveDemoConfirmation({ id: saved.id, tools: saved.tools, createdAt: saved.createdAt });
      setSent(true);
      // A full page load (not in-app navigation), so /thank-you registers as a real
      // page view for GTM page-view triggers and URL-based ad conversions.
      window.location.assign("/thank-you");
    } catch (err) {
      setSubmitError((err as Error).message || "We couldn't send your request. Please try again.");
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  return !sent ? (
            <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 16 }}>
              <label style={labelStyle}>
                Name
                <input required name="name" type="text" placeholder="Your name" defaultValue={prefill?.name ?? ""} style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
              </label>
              <label style={labelStyle}>
                <span>
                  Company <span style={{ color: "#8a939e" }}>(optional)</span>
                </span>
                <input name="company" type="text" placeholder="Company name" defaultValue={prefill?.company ?? ""} style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
              </label>
              <label style={labelStyle}>
                Work email
                <input required name="email" type="email" placeholder="you@company.com" defaultValue={prefill?.email ?? ""} style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
              </label>
              <label style={labelStyle}>
                <span>
                  Phone <span style={{ color: "#8a939e" }}>(optional)</span>
                </span>
                <input name="phone" type="tel" placeholder="+91" style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
              </label>
              <label style={labelStyle}>
                Your Role
                <select required name="role" defaultValue="" style={selectStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} onChange={pickedColor}>
                  <option value="" disabled style={optionStyle}>
                    Select your role
                  </option>
                  {ROLES.map((r) => (
                    <option key={r} value={r} style={optionStyle}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label style={labelStyle}>
                Company Size
                <select required name="companySize" defaultValue="" style={selectStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} onChange={pickedColor}>
                  <option value="" disabled style={optionStyle}>
                    Select company size
                  </option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s} value={s} style={optionStyle}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ ...labelStyle, gridColumn: "1 / -1" }}>
                <span id="demo-tools-label">Which tools would you like a demo of?</span>
                <ToolsSelect
                  value={tools}
                  invalid={toolsError}
                  onChange={(v) => {
                    setTools(v);
                    if (v.length) setToolsError(false);
                  }}
                />
                {toolsError && (
                  <span id="demo-tools-error" role="alert" style={{ fontSize: 13, color: ERROR_COLOR }}>
                    Please choose at least one tool.
                  </span>
                )}
              </div>
              {/* Only rendered while Custom Tools is ticked; unticking unmounts it, which clears its value and validation state. */}
              {tools.includes("custom") && (
                <label className={styles.fadeIn} style={{ ...labelStyle, gridColumn: "1 / -1" }}>
                  Which custom tool are you looking for?
                  <input
                    required
                    pattern=".*\S.*"
                    title="Please describe the tool you need."
                    name="customRequirements"
                    type="text"
                    placeholder="e.g. Billing software, ERP, custom CRM"
                    aria-describedby="demo-custom-help"
                    style={fieldStyle}
                    onFocus={onFocusGlow}
                    onBlur={onBlurGlow}
                  />
                  <span id="demo-custom-help" style={{ fontSize: 13, color: "#8a939e" }}>
                    Briefly describe the software or automation solution your business needs.
                  </span>
                </label>
              )}
              <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
                How can we help?
                <textarea
                  data-contact-message
                  name="message"
                  rows={4}
                  placeholder="Tell us a little about your business"
                  style={{ ...fieldStyle, height: "auto", padding: "12px 14px", resize: "vertical" }}
                  onFocus={onFocusGlow}
                  onBlur={onBlurGlow}
                />
              </label>
              {submitError && (
                <div role="alert" style={{ gridColumn: "1 / -1", borderRadius: 12, padding: "12px 14px", fontSize: 14, lineHeight: 1.45, color: ERROR_COLOR, border: "1px solid rgba(255,138,138,.3)", background: "rgba(255,138,138,.06)" }}>
                  {submitError}
                </div>
              )}
              <button
                type="submit"
                disabled={sending}
                aria-busy={sending}
                style={{ gridColumn: "1 / -1", opacity: sending ? 0.6 : 1, cursor: sending ? "default" : "pointer", height: 52, border: 0, borderRadius: 999, background: "#f4f6f8", color: "#07080b", fontSize: 15, fontWeight: 500, transition: "box-shadow .3s" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.boxShadow = "0 0 32px rgba(111,227,239,.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f4f6f8";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {sending ? "Sending…" : "Send message"}
              </button>
              <p style={{ gridColumn: "1 / -1", margin: "-4px 0 0", textAlign: "center", fontSize: 13, color: "#98a1ac" }}>
                We reply within 1 business day.
              </p>
            </form>
  ) : (
            <div className={styles.fadeIn} style={{ minHeight: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 14 }}>
              <div className={styles.glow} style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid rgba(111,227,239,.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8fe9f2", fontSize: 22 }}>
                ✓
              </div>
              <strong style={{ fontSize: 22, fontWeight: 600, color: "#f4f6f8" }}>Thanks, we&apos;ve got your message</strong>
              <span style={{ color: "#a3abb5" }}>Our team will be in touch shortly.</span>
            </div>
  );
}

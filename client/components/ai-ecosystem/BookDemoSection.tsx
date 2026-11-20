"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { CONTACT, PRODUCTS } from "./data";
import { bookDemo } from "@/lib/demoApi";
import { buildDemoPayload, confirmationLines, describeBookingError, formatPreferred, todayInIst, validateDemoForm, type DemoFormErrors } from "@/lib/demoBooking";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

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

const ROLES = [
  "Founder / Business Owner",
  "CEO / Director",
  "Manager",
  "HR Manager",
  "Sales Manager",
  "Operations Manager",
  "IT Manager",
  "Other",
];

const COMPANY_SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "501–1000 employees",
  "1000+ employees",
];

// Same products, same order as the Tools section; the slug is what gets submitted.
const TOOL_OPTIONS = PRODUCTS.map((p) => ({ id: p.slug, label: p.slug === "custom" ? "Custom Tools" : p.name }));

const CONTACT_LINKS = [
  { label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: "Phone", value: CONTACT.phone, href: `tel:+${CONTACT.phone.replace(/\D/g, "")}` },
  { label: "WhatsApp", value: CONTACT.whatsapp, href: `https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}` },
];

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

export function BookDemoSection() {
  const [done, setDone] = useState<{ when: string; consent: boolean; duplicate: boolean } | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const [toolsError, setToolsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<DemoFormErrors>({});
  const today = todayInIst();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (tools.length === 0) {
      setToolsError(true);
      document.getElementById("demo-tools")?.focus();
      return;
    }
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "");
    const values = {
      name: str("name"),
      company: str("company"),
      email: str("email"),
      phone: str("phone"),
      role: str("role"),
      companySize: str("companySize"),
      preferredDate: str("preferredDate"),
      preferredTime: str("preferredTime"),
      interestedTools: tools, // product slugs, e.g. ["crm", "hrms"]
      customRequirements: str("customRequirements"),
      message: str("message"),
      whatsappConsent: f.get("whatsappConsent") === "on",
    };
    const problems = validateDemoForm(values);
    setFieldErrors(problems);
    if (problems.phone || problems.preferredAt) {
      document.getElementById(problems.phone ? "demo-phone" : "demo-date")?.focus();
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // The confirmation below is shown only after the booking is SAVED. WhatsApp is separate and can never fail it.
      const r = await bookDemo(buildDemoPayload(values));
      setDone({ when: formatPreferred(values.preferredDate, values.preferredTime), consent: values.whatsappConsent, duplicate: r.duplicate });
    } catch (err) {
      setError(describeBookingError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" data-screen-label="09 Get in touch" style={{ scrollMarginTop: 68, position: "relative", overflowX: "clip", overflowY: "visible", padding: "clamp(56px,7vw,96px) 24px" }}>
      <div
        className={styles.breathe}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: -200,
          top: "10%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(107,124,255,.14),transparent 60%)",
          pointerEvents: "none",
          animationDuration: "8s",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,400px),1fr))",
          gap: "clamp(40px,6vw,72px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <motion.div
            {...reveal(0)}
            style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            Get in touch
          </motion.div>
          <motion.h2
            {...reveal(80)}
            style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, textWrap: "balance", background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            Let&apos;s talk about your business
          </motion.h2>
          <motion.p {...reveal(160)} style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "#a3abb5" }}>
            Tell us what you&apos;d like to improve. We&apos;ll get back to you shortly.
          </motion.p>
          <motion.div {...reveal(240)} style={{ display: "flex", flexDirection: "column", marginTop: 8, borderTop: "1px solid rgba(255,255,255,.08)" }}>
            {CONTACT_LINKS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.label === "WhatsApp" ? "_blank" : undefined}
                rel={c.label === "WhatsApp" ? "noopener" : undefined}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 4px", borderBottom: "1px solid rgba(255,255,255,.08)", color: "#f4f6f8" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#f4f6f8")}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 12, color: "#98a1ac" }}>{c.label}</span>
                  {c.value}
                </span>
                <span style={{ color: "#6fe3ef" }}>↗</span>
              </a>
            ))}
          </motion.div>
        </div>

        <motion.div
          id="demo-form"
          {...reveal(0)}
          style={{ scrollMarginTop: 76, borderRadius: 24, padding: 1, background: "linear-gradient(180deg,rgba(143,233,242,.4),rgba(255,255,255,.06) 50%)" }}
        >
          <div style={{ borderRadius: 23, background: "#0b0d12", padding: "clamp(24px,3.5vw,40px)", height: "100%", boxSizing: "border-box" }}>
            {!done ? (
              <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: 16 }}>
                <label style={labelStyle}>
                  Name
                  <input required name="name" type="text" placeholder="Your name" style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                </label>
                <label style={labelStyle}>
                  <span>
                    Company <span style={{ color: "#8a939e" }}>(optional)</span>
                  </span>
                  <input name="company" type="text" placeholder="Company name" style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                </label>
                <label style={labelStyle}>
                  Work email
                  <input required name="email" type="email" placeholder="you@company.com" style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                </label>
                <label style={labelStyle}>
                  Phone
                  <input id="demo-phone" required name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? "demo-phone-error" : undefined} style={fieldStyle} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                  {fieldErrors.phone && (
                    <span id="demo-phone-error" role="alert" style={{ fontSize: 13, color: ERROR_COLOR }}>
                      {fieldErrors.phone}
                    </span>
                  )}
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
                <label style={labelStyle}>
                  Preferred demo date
                  <input id="demo-date" required name="preferredDate" type="date" min={today} aria-invalid={!!fieldErrors.preferredAt} aria-describedby={fieldErrors.preferredAt ? "demo-when-error" : undefined} style={{ ...fieldStyle, colorScheme: "dark" }} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                </label>
                <label style={labelStyle}>
                  Preferred time <span style={{ color: "#8a939e" }}>(India time)</span>
                  <input required name="preferredTime" type="time" aria-invalid={!!fieldErrors.preferredAt} aria-describedby={fieldErrors.preferredAt ? "demo-when-error" : undefined} style={{ ...fieldStyle, colorScheme: "dark" }} onFocus={onFocusGlow} onBlur={onBlurGlow} />
                </label>
                {fieldErrors.preferredAt && (
                  <span id="demo-when-error" role="alert" style={{ gridColumn: "1 / -1", fontSize: 13, color: ERROR_COLOR, marginTop: -8 }}>
                    {fieldErrors.preferredAt}
                  </span>
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
                {/* Unchecked by default and never pre-selected: a WhatsApp opt-in must be a deliberate tick. */}
                <label style={{ gridColumn: "1 / -1", display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.45, color: "#a3abb5", cursor: "pointer" }}>
                  <input type="checkbox" name="whatsappConsent" style={{ width: 16, height: 16, marginTop: 2, accentColor: "#6fe3ef", cursor: "pointer", flexShrink: 0 }} />
                  <span>Yes, you may send me WhatsApp messages about this demo booking. I can reply STOP at any time. (Optional)</span>
                </label>
                {error && (
                  <p role="alert" style={{ gridColumn: "1 / -1", margin: 0, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,138,138,.4)", background: "rgba(255,138,138,.08)", color: ERROR_COLOR, fontSize: 14 }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  style={{ gridColumn: "1 / -1", cursor: submitting ? "progress" : "pointer", opacity: submitting ? 0.7 : 1, height: 52, border: 0, borderRadius: 999, background: "#f4f6f8", color: "#07080b", fontSize: 15, fontWeight: 500, transition: "box-shadow .3s" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.boxShadow = "0 0 32px rgba(111,227,239,.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f4f6f8";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {submitting ? "Booking…" : "Book my demo"}
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
                {(() => {
                  const c = confirmationLines({ whatsappConsent: done.consent, when: done.when, duplicate: done.duplicate });
                  return (
                    <div role="status" data-testid="demo-confirmation" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <strong style={{ fontSize: 22, fontWeight: 600, color: "#f4f6f8" }}>{c.title}</strong>
                      {c.lines.map((l) => (
                        <span key={l} style={{ color: "#a3abb5" }}>
                          {l}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { CONTACT } from "@/components/ai-ecosystem/data";
import type { AdoptionUser } from "@/lib/adoptionSession";
import { focusRing, secondaryHover } from "../../_components/ui";
import { card, muted, sectionTitle, smallSecondary } from "./shared";

/** Reuses the site's existing support contacts (components/ai-ecosystem/data.ts). */
export function HelpSection({ user }: { user: AdoptionUser }) {
  const mail = (subject: string) => `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`\n\n—\nAccount: ${user.email}`)}`;
  const topics = [
    { title: "Contact support", text: "Questions about your account or anything else.", href: mail("Support request – AI Adoption account") },
    { title: "Product access help", text: "Trouble opening a tool, or need access for your team.", href: mail("Product access help") },
    { title: "Demo enquiries", text: "Questions about a demo you booked or want to book.", href: mail("Demo enquiry") },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section aria-labelledby="help-h" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="help-h" style={sectionTitle}>How can we help?</h2>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
          {topics.map((t) => (
            <li key={t.title} style={card}>
              <strong style={{ fontSize: 15, fontWeight: 600, color: "#f4f6f8" }}>{t.title}</strong>
              <p style={muted}>{t.text}</p>
              <a href={t.href} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>Email us</a>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="reach-h" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 id="reach-h" style={sectionTitle}>Reach us directly</h2>
        <div style={{ ...card, gap: 6, fontSize: 14, color: "#a3abb5" }}>
          <span>Email: <a href={`mailto:${CONTACT.email}`} className="text-[#6fe3ef] hover:text-[#8fe9f2]">{CONTACT.email}</a></span>
          <span>Phone: <a href={`tel:+${CONTACT.phone.replace(/\D/g, "")}`} className="text-[#6fe3ef] hover:text-[#8fe9f2]">{CONTACT.phone}</a></span>
          <span>WhatsApp: <a href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-[#6fe3ef] hover:text-[#8fe9f2]">{CONTACT.whatsapp}</a></span>
        </div>
        <Link href="/book-demo" className="text-[#6fe3ef] hover:text-[#8fe9f2]" style={{ fontSize: 14, alignSelf: "flex-start" }}>Prefer a call? Book a demo →</Link>
      </section>
    </div>
  );
}

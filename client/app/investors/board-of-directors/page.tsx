"use client";

import { Fragment, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/ui";
import { EcosystemHeader } from "@/components/ai-ecosystem/EcosystemHeader";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";
import { CursorGlow } from "@/components/ai-ecosystem/CursorGlow";

interface OtherDirectorship {
  name: string;
  designation: string;
}

interface MemberRow {
  name: string;
  designation: string;
  date: string;
  bio?: string;
  otherDirectorships?: OtherDirectorship[];
}

const BOARD_AND_KMP: MemberRow[] = [
  {
    name: "Ms. Richa Rathod",
    designation: "Managing Director & CFO",
    date: "23/04/2026",
    bio: "Mrs. Richa Rathod is a finance professional with practical experience in corporate finance, financial planning & analysis, regulatory compliance, and overall financial operations. She has been actively involved in the finance function, gaining hands-on exposure to accounting processes, financial reporting, budgeting, and internal controls. With her sound understanding of financial management and operational processes, she has consistently contributed to strengthening financial discipline and improving organizational efficiency. Considering her experience, leadership capabilities, and familiarity with the Company's operations, she is well-suited for the role of Managing Director and is expected to effectively lead the Company towards its strategic and operational objectives.",
    otherDirectorships: [{ name: "G 9 HORECA LLP", designation: "Designated Partner" }],
  },
  {
    name: "Mr. Kiran Dilip Thakore",
    designation: "Non - Executive Director",
    date: "27/08/2024",
    bio: "Mr. Kiran Thakore possesses over two decades of extensive experience in business administration, logistics, human resources, and operations management. Throughout his professional career, he has demonstrated strong leadership, managerial, and strategic planning skills across various business functions. He has also provided consultancy services to numerous businesses, leveraging his expertise to support operational efficiency, organizational growth, and business development. His rich experience and professional insight are expected to contribute significantly to the growth and governance of the Company.",
    otherDirectorships: [
      { name: "Shreekrishna Biotech Limited", designation: "Add. Director" },
      { name: "Skybridge Incap Advisory LLP", designation: "Designated Partner" },
      { name: "Skybridge Interactive LLP", designation: "Designated Partner" },
      { name: "Skybridge Lifespaces LLP", designation: "Designated Partner" },
      { name: "Aadhaar Ventures India Limited", designation: "Director" },
      { name: "ASL E-Ventures Private Limited", designation: "Director" },
    ],
  },
  {
    name: "Mr. Yatish Poojary",
    designation: "Non - Executive Independent Director",
    date: "14/08/2025",
    bio: "Mr. Yatish Poojary possesses experience in handling corporate programs and has demonstrated strong organizational and interpersonal skills throughout his professional career. His expertise in coordination, communication, and corporate management is expected to contribute effectively to the Company's operations and governance. As an Independent Director, he is expected to provide objective oversight and strategic guidance, leveraging his experience and professional skills for the overall growth and development of the Company.",
    otherDirectorships: [
      { name: "ASL E-Ventures Private Limited", designation: "Director" },
      { name: "ASL Infineon Ventures Private Limited", designation: "Director" },
    ],
  },
  {
    name: "Mrs. Karina Jadhav",
    designation: "Non- Executive Independent Director",
    date: "12/02/2026",
    bio: "Mrs. Karina Jadhav possesses experience in handling corporate programs and has demonstrated strong organizational and interpersonal skills throughout her professional career. Her expertise in coordination, communication, and corporate management is expected to contribute positively to the Company. As an Independent Director, she will provide objective oversight and valuable guidance to support the Company's strategic growth and governance practices.",
    otherDirectorships: [],
  },
  { name: "Ms. Mansi Vora", designation: "Company Secretary and Compliance Officer", date: "3/12/2025" },
];

const AUDIT_COMMITTEE: MemberRow[] = [
  { name: "Mr. Yatish Poojary", designation: "Chairman and Non - Executive Independent Director", date: "14/08/2025" },
  { name: "Mr. Kiran Dilip Thakore", designation: "Non - Executive Director", date: "27/08/2024" },
  { name: "Mrs. Karina Jadhav", designation: "Non- Executive Independent Director", date: "12/02/2026" },
];

const NRC_COMMITTEE: MemberRow[] = [
  { name: "Mr. Yatish Poojary", designation: "Chairman and Non - Executive Independent Director", date: "14/08/2025" },
  { name: "Mr. Kiran Dilip Thakore", designation: "Non - Executive Director", date: "27/08/2024" },
  { name: "Mrs. Karina Jadhav", designation: "Non- Executive Independent Director", date: "12/02/2026" },
];

const STAKEHOLDERS_COMMITTEE: MemberRow[] = [
  { name: "Mr. Kiran Dilip Thakore", designation: "Chairman and Non - Executive Director", date: "27/08/2024" },
  { name: "Mr. Yatish Poojary", designation: "Non - Executive Independent Director", date: "14/08/2025" },
  { name: "Mrs. Karina Jadhav", designation: "Non- Executive Independent Director", date: "12/02/2026" },
];

const GRIEVANCE_REDRESSAL = {
  name: "Ms. Mansi Vora",
  designation: "Company Secretary and Compliance Officer",
  contact: "8097207334",
  email: "infoaslindustries@gmail.com",
};

  // ─── Dark theme (AI Adoption) table frame ──────────────────────────────────
  // Horizontal scroller for the dark tables. On narrow screens the table keeps a
  // readable minimum width (columns are no longer crushed) and a soft fade on the
  // right edge shows there is more to swipe; the fade is hidden once tables fit.
  // Used only by the dark (?theme=dark) view; the light view below is unchanged.
  function DarkTableScroll({ children }: { children: React.ReactNode }) {
    return (
      <div className="relative after:pointer-events-none after:absolute after:inset-y-px after:right-px after:w-10 after:rounded-r-2xl after:bg-[linear-gradient(to_left,#0c0e13,transparent)] after:content-[''] min-[760px]:after:hidden">
        <div
          style={{
            overflowX: "auto",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,.08)",
            background: "rgba(12,14,19,.75)",
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // ─── Dark Theme Member Table ────────────────────────────────────────────────
  function DarkMemberTable({ rows }: { rows: MemberRow[] }) {
    const [openRow, setOpenRow] = useState<string | null>(null);

    return (
      <DarkTableScroll>
        <table style={{ width: "100%", minWidth: 600, fontSize: 14, borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
              <th style={{ padding: "14px 18px", fontWeight: 600, color: "#d0d6de", whiteSpace: "nowrap" }}>
                Name of Member
              </th>
              <th style={{ padding: "14px 18px", fontWeight: 600, color: "#d0d6de" }}>Designation</th>
              <th style={{ padding: "14px 18px", fontWeight: 600, color: "#d0d6de", whiteSpace: "nowrap" }}>
                Date of Appointment
              </th>
              <th style={{ width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const key = `${row.name}-${row.designation}`;
              const expandable = Boolean(row.bio);
              const isOpen = expandable && openRow === key;
              return (
                <Fragment key={key}>
                  <tr
                    onClick={() => expandable && setOpenRow(isOpen ? null : key)}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,.05)",
                      cursor: expandable ? "pointer" : "default",
                      background: isOpen ? "rgba(111,227,239,.04)" : "transparent",
                      transition: "background .2s",
                    }}
                  >
                    <td style={{ padding: "14px 18px", color: "#f4f6f8", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {row.name}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#a3abb5" }}>{row.designation}</td>
                    <td style={{ padding: "14px 18px", color: "#8a939e", whiteSpace: "nowrap" }}>{row.date}</td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      {expandable && (
                        <ChevronDown
                          style={{
                            width: 16,
                            height: 16,
                            color: isOpen ? "#6fe3ef" : "#8a939e",
                            transform: isOpen ? "rotate(180deg)" : "none",
                            transition: "transform .2s ease",
                          }}
                        />
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr style={{ background: "rgba(255,255,255,.02)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                      <td colSpan={4} style={{ padding: "18px 22px" }}>
                        <p style={{ margin: 0, color: "#a3abb5", lineHeight: 1.65, fontSize: 14 }}>{row.bio}</p>
                        {row.otherDirectorships && row.otherDirectorships.length > 0 && (
                          <div style={{ marginTop: 16 }}>
                            <h4
                              style={{
                                margin: "0 0 10px",
                                fontSize: 12,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: "#6fe3ef",
                              }}
                            >
                              Other Directorship Details
                            </h4>
                            <div
                              style={{
                                overflowX: "auto",
                                borderRadius: 10,
                                border: "1px solid rgba(255,255,255,.08)",
                                background: "rgba(7,8,11,.6)",
                              }}
                            >
                              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                                <thead>
                                  <tr
                                    style={{
                                      borderBottom: "1px solid rgba(255,255,255,.06)",
                                      background: "rgba(255,255,255,.02)",
                                    }}
                                  >
                                    <th style={{ padding: "8px 14px", color: "#8a939e", textAlign: "left" }}>
                                      Names of Companies / Firms
                                    </th>
                                    <th
                                      style={{
                                        padding: "8px 14px",
                                        color: "#8a939e",
                                        textAlign: "left",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      Designation
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.otherDirectorships.map((d) => (
                                    <tr key={d.name} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                                      <td style={{ padding: "8px 14px", color: "#f4f6f8" }}>{d.name}</td>
                                      <td style={{ padding: "8px 14px", color: "#a3abb5", whiteSpace: "nowrap" }}>
                                        {d.designation}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {row.otherDirectorships && row.otherDirectorships.length === 0 && (
                          <p
                            style={{
                              margin: "12px 0 0",
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              color: "#8a939e",
                            }}
                          >
                            Other Directorship Details: NIL
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </DarkTableScroll>
    );
  }

    // ─── Light Theme Member Table ────────────────────────────────────────────────
    function LightMemberTable({ rows }: { rows: MemberRow[] }) {
      const [openRow, setOpenRow] = useState<string | null>(null);

      return (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                    Name of Member
                  </th>
                  <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700">Designation</th>
                  <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                    Date of Appointment
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const key = `${row.name}-${row.designation}`;
                  const expandable = Boolean(row.bio);
                  const isOpen = expandable && openRow === key;
                  return (
                    <Fragment key={key}>
                      <tr
                        onClick={() => expandable && setOpenRow(isOpen ? null : key)}
                        className={`transition-colors ${expandable ? "cursor-pointer hover:bg-slate-50/60" : ""}`}
                        aria-expanded={expandable ? isOpen : undefined}
                      >
                        <td className="px-4 sm:px-5 py-3 text-slate-800 font-medium whitespace-nowrap">{row.name}</td>
                        <td className="px-4 sm:px-5 py-3 text-slate-600">{row.designation}</td>
                        <td className="px-4 sm:px-5 py-3 text-slate-600 whitespace-nowrap">{row.date}</td>
                        <td className="px-2 py-3 text-slate-400">
                          {expandable && (
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={4} className="px-4 sm:px-5 py-4">
                            <p className="text-slate-600 leading-relaxed">{row.bio}</p>
                            {row.otherDirectorships && row.otherDirectorships.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                  Other Directorship Details
                                </h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                  <table className="w-full text-sm">
                                    <thead className="bg-white border-b border-slate-200">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-700">
                                          Names of Companies / Firms
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">
                                          Designation
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {row.otherDirectorships.map((d) => (
                                        <tr key={d.name}>
                                          <td className="px-3 py-2 text-slate-600">{d.name}</td>
                                          <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{d.designation}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                            {row.otherDirectorships && row.otherDirectorships.length === 0 && (
                              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Other Directorship Details: NIL
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          );
}

            function BoardOfDirectorsContent() {
              const searchParams = useSearchParams();
              const isDark = searchParams.get("theme") === "dark";

              // ─── DARK THEME ───────────────────────────────────────────────────────────
              if (isDark) {
                return (
                  <div
                    className={`${GeistSans.variable} ${GeistMono.variable}`}
                    style={{
                      position: "relative",
                      zIndex: 0,
                      minHeight: "100vh",
                      background: "#07080b",
                      color: "#f4f6f8",
                      overflowX: "clip",
                      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <CursorGlow />
                    <EcosystemHeader />

                    <main style={{ flex: 1, padding: "clamp(48px, 6vw, 80px) 24px" }}>
                      <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexDirection: "column", gap: 36 }}>
                        {/* Header */}
                        <div
                          style={{
                            position: "relative",
                            borderRadius: 24,
                            border: "1px solid rgba(255,255,255,.1)",
                            background: "radial-gradient(ellipse 70% 60% at 50% -20%, rgba(107,124,255,.14), transparent 70%), #0c0e13",
                            padding: "clamp(32px, 5vw, 48px)",
                            overflow: "hidden",
                          }}
                        >
                          <Link
                            href="/investors?theme=dark"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 14,
                              color: "#6fe3ef",
                              textDecoration: "none",
                              marginBottom: 16,
                            }}
                          >
                            <ArrowLeft style={{ width: 14, height: 14 }} />
                            Back to Investor Corner
                          </Link>

                          <h1
                            style={{
                              margin: 0,
                              fontSize: "clamp(32px, 5vw, 44px)",
                              fontWeight: 700,
                              letterSpacing: "-0.03em",
                              lineHeight: 1.1,
                              background: "linear-gradient(180deg,#fff 40%,#98a1ac)",
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              color: "transparent",
                            }}
                          >
                            Board of Directors
                          </h1>

                          <p style={{ margin: "14px 0 0", maxWidth: 640, fontSize: 16, lineHeight: 1.6, color: "#a3abb5" }}>
                            Composition of the Board of Directors, statutory committees, and official grievance redressal contact.
                          </p>
                        </div>

                        {/* Content */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8fe9f2" }}>
                              1. Composition of Board of Directors and Key Managerial Personnel
                            </h2>
                            <DarkMemberTable rows={BOARD_AND_KMP} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8fe9f2" }}>
                              2. Composition of Audit Committee
                            </h2>
                            <DarkMemberTable rows={AUDIT_COMMITTEE} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8fe9f2" }}>
                              3. Composition of Nomination and Remuneration Committee
                            </h2>
                            <DarkMemberTable rows={NRC_COMMITTEE} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8fe9f2" }}>
                              4. Composition of Stakeholders Relationship Committee
                            </h2>
                            <DarkMemberTable rows={STAKEHOLDERS_COMMITTEE} />
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8fe9f2" }}>
                              5. Grievance Redressal
                            </h2>
                            <DarkTableScroll>
                              <table style={{ width: "100%", minWidth: 640, fontSize: 14, borderCollapse: "collapse", textAlign: "left" }}>
                                <thead>
                                  <tr
                                    style={{
                                      background: "rgba(255,255,255,.03)",
                                      borderBottom: "1px solid rgba(255,255,255,.08)",
                                    }}
                                  >
                                    <th style={{ padding: "14px 18px", color: "#d0d6de", whiteSpace: "nowrap" }}>
                                      Name of Member
                                    </th>
                                    <th style={{ padding: "14px 18px", color: "#d0d6de" }}>Designation</th>
                                    <th style={{ padding: "14px 18px", color: "#d0d6de", whiteSpace: "nowrap" }}>Contact No.</th>
                                    <th style={{ padding: "14px 18px", color: "#d0d6de" }}>Email ID</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ padding: "14px 18px", color: "#f4f6f8", fontWeight: 600, whiteSpace: "nowrap" }}>
                                      {GRIEVANCE_REDRESSAL.name}
                                    </td>
                                    <td style={{ padding: "14px 18px", color: "#a3abb5" }}>{GRIEVANCE_REDRESSAL.designation}</td>
                                    <td style={{ padding: "14px 18px", color: "#8a939e", whiteSpace: "nowrap" }}>
                                      {GRIEVANCE_REDRESSAL.contact}
                                    </td>
                                    <td style={{ padding: "14px 18px" }}>
                                      <a
                                        href={`mailto:${GRIEVANCE_REDRESSAL.email}`}
                                        style={{ color: "#6fe3ef", textDecoration: "none" }}
                                      >
                                        {GRIEVANCE_REDRESSAL.email}
                                      </a>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </DarkTableScroll>
                          </div>
                        </div>
                      </div>
                    </main>

                    <EcosystemFooter />
                  </div>
                );
              }

              // ─── LIGHT THEME ──────────────────────────────────────────────────────────
              return (
                  <main className="min-h-screen overflow-x-hidden bg-white text-slate-800">
                    <Navbar />

                          {/* Header */}
                          <section className="border-b border-slate-200 bg-slate-50">
                            <div className="container-x pt-28 pb-10 sm:pt-32 sm:pb-12">
                              <ScrollReveal>
                                <Link
                                  href="/investors"
                                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-5"
                                >
                                  <ArrowLeft className="h-4 w-4" />
                                  Back to Investor Corner
                                </Link>
                                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Board of Directors</h1>
                                  <p className="mt-3 text-slate-500 max-w-xl">
                                    Composition of the Board, its committees, and grievance redressal contact details.
                                  </p>
                              </ScrollReveal>
                            </div>
                          </section>

                            {/* Content */}
                            <section className="container-x py-10 sm:py-14">
                              <div className="max-w-4xl mx-auto space-y-10">
                                <ScrollReveal>
                                  <div className="space-y-3">
                                    <h2 className="text-sm sm:text-base font-bold text-brand-700 uppercase tracking-wide">
                                      1. Composition of Board of Directors and Key Managerial Personnel of the Company
                                    </h2>
                                    <LightMemberTable rows={BOARD_AND_KMP} />
                                  </div>
                                </ScrollReveal>

                                <ScrollReveal>
                                  <div className="space-y-3">
                                    <h2 className="text-sm sm:text-base font-bold text-brand-700 uppercase tracking-wide">
                                      2. Composition of Audit Committee of the Company
                                    </h2>
                                    <LightMemberTable rows={AUDIT_COMMITTEE} />
                                  </div>
                                </ScrollReveal>

                                <ScrollReveal>
                                  <div className="space-y-3">
                                    <h2 className="text-sm sm:text-base font-bold text-brand-700 uppercase tracking-wide">
                                      3. Composition of Nomination and Remuneration Committee of the Company
                                    </h2>
                                    <LightMemberTable rows={NRC_COMMITTEE} />
                                  </div>
                                </ScrollReveal>

                                <ScrollReveal>
                                  <div className="space-y-3">
                                    <h2 className="text-sm sm:text-base font-bold text-brand-700 uppercase tracking-wide">
                                      4. Composition of Stakeholders Relationship Committee of the Company
                                    </h2>
                                    <LightMemberTable rows={STAKEHOLDERS_COMMITTEE} />
                                  </div>
                                </ScrollReveal>

                                            <ScrollReveal>
                                              <div className="space-y-3">
                                                <h2 className="text-sm sm:text-base font-bold text-brand-700 uppercase tracking-wide">
                                                  5. Grievance Redressal
                                                </h2>
                                                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                                                  <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 border-b border-slate-200">
                                                      <tr>
                                                        <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                                                          Name of Member
                                                        </th>
                                                        <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700">Designation</th>
                                                        <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                                                          Contact No.
                                                        </th>
                                                        <th className="px-4 sm:px-5 py-3 text-left font-semibold text-slate-700">Email ID</th>
                                                      </tr>
                                                    </thead>
                                                          <tbody className="divide-y divide-slate-100">
                                                            <tr className="hover:bg-slate-50/60 transition-colors">
                                                              <td className="px-4 sm:px-5 py-3 text-slate-800 font-medium whitespace-nowrap">
                                                                {GRIEVANCE_REDRESSAL.name}
                                                              </td>
                                                                <td className="px-4 sm:px-5 py-3 text-slate-600">{GRIEVANCE_REDRESSAL.designation}</td>
                                                                <td className="px-4 sm:px-5 py-3 text-slate-600 whitespace-nowrap">
                                                                  {GRIEVANCE_REDRESSAL.contact}
                                                                </td>
                                                                  <td className="px-4 sm:px-5 py-3">
                                                                    <a
                                                                      href={`mailto:${GRIEVANCE_REDRESSAL.email}`}
                                                                      className="text-brand-600 hover:underline"
                                                                    >
                                                                      {GRIEVANCE_REDRESSAL.email}
                                                                    </a>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </div>
                                                    </div>
                                                  </ScrollReveal>
                                                </div>
                                            </section>

                                          <Footer />
                                        </main>
                                        );
}

                                        export default function BoardOfDirectorsPage() {
  return (
                                        <Suspense fallback={<div className="min-h-screen bg-white" />}>
                                          <BoardOfDirectorsContent />
                                        </Suspense>
                                        );
}

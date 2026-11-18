"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import {
  ChevronDown,
  FileText,
  Landmark,
  Search,
  ExternalLink,
  ArrowRight,
  Plus,
  Minus,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/ui";
import { EcosystemHeader } from "@/components/ai-ecosystem/EcosystemHeader";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";
import { CursorGlow } from "@/components/ai-ecosystem/CursorGlow";
import {
  fetchInvestorCategories,
  type InvestorCategory,
} from "@/lib/investorsApi";

  function InvestorsContent() {
    const searchParams = useSearchParams();
    const isDark = searchParams.get("theme") === "dark";

    const [categories, setCategories] = useState<InvestorCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

    useEffect(() => {
      fetchInvestorCategories()
        .then((cats) => {
          setCategories(cats || []);
            // Start with all collapsed on light, or first open on dark
            if (isDark && cats && cats.length > 0) {
              setSelectedId(cats[0].id);
            } else {
              setSelectedId(null);
            }
          })
        .catch((err) => {
          console.error("Failed to fetch investor categories:", err);
        })
        .finally(() => setLoading(false));
  }, [isDark]);

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null;

  const extractYearFromName = (name: string) => {
    const matches = name.match(/20\d{2}/g);
    return matches ? matches[matches.length - 1] : null;
  };

  const extractYear = (doc: { name: string; createdAt: string }) =>
    extractYearFromName(doc.name) ?? String(new Date(doc.createdAt).getFullYear());

  const filteredDocuments = useMemo(() => {
    if (!selectedCategory) return [];
    if (!searchQuery.trim()) return selectedCategory.documents;
    const q = searchQuery.toLowerCase();
    return selectedCategory.documents.filter((doc) =>
      doc.name.toLowerCase().includes(q)
    );
  }, [selectedCategory, searchQuery]);

      const yearGroups = useMemo(() => {
        const map = new Map<string, typeof filteredDocuments>();
        for (const doc of filteredDocuments) {
          const year = extractYear(doc);
          if (!map.has(year)) map.set(year, []);
          map.get(year)!.push(doc);
}
return Array.from(map.entries()).sort(([a], [b]) => Number(b) - Number(a));
  }, [filteredDocuments]);

const toggleYear = (year: string) =>
  setExpandedYears((prev) => {
    const next = new Set(prev);
    if (next.has(year)) next.delete(year);
    else next.add(year);
    return next;
  });

  // ─── DARK THEME (Navigated from AI Adoption Ecosystem) ────────────────────
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
            {/* Header Banner */}
            <div
              style={{
                position: "relative",
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,.1)",
                background: "radial-gradient(ellipse 70% 60% at 50% -20%, rgba(111,227,239,.14), transparent 70%), #0c0e13",
                padding: "clamp(32px, 5vw, 48px)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(111,227,239,.3)",
                  background: "rgba(111,227,239,.08)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#8fe9f2",
                  marginBottom: 16,
                }}
              >
                <Landmark style={{ width: 14, height: 14 }} />
                Official Disclosures & Filings
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  background: "linear-gradient(180deg,#fff 40%,#98a1ac)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Investor Corner
              </h1>

              <p
                style={{
                  margin: "16px 0 24px",
                  maxWidth: 640,
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "#a3abb5",
                }}
              >
                Access and download statutory filings, quarterly financial statements, shareholding patterns,
                and official announcements for Avatar India.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <Link
                  href="/investors/board-of-directors?theme=dark"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 18px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#f4f6f8",
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.12)",
                    textDecoration: "none",
                    transition: "all .2s ease",
                  }}
                >
                  <Users style={{ width: 15, height: 15, color: "#6fe3ef" }} />
                  Board of Directors & Committees
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>

                <Link
                  href="/"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 18px",
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#a3abb5",
                    textDecoration: "none",
                    transition: "color .2s",
                  }}
                >
                  ← Back to Adoption Ecosystem
                </Link>
              </div>
            </div>

            {/* Categories & Documents */}
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 72,
                      borderRadius: 16,
                      background: "rgba(255,255,255,.03)",
                      border: "1px solid rgba(255,255,255,.06)",
                    }}
                  />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div
                style={{
                  padding: "64px 24px",
                  borderRadius: 20,
                  border: "1px dashed rgba(255,255,255,.1)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#8a939e",
                  }}
                >
                  <Landmark style={{ width: 26, height: 26 }} />
                </div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "#f4f6f8" }}>
                  No investor documents published yet.
                </p>
                <span style={{ fontSize: 14, color: "#8a939e" }}>
                  Filings and statements will appear here once officially indexed.
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {categories.map((cat) => {
                  const isOpen = cat.id === selectedId;
                  return (
                    <div
                      key={cat.id}
                      style={{
                        borderRadius: 18,
                        border: `1px solid ${isOpen ? "rgba(111,227,239,.35)" : "rgba(255,255,255,.08)"}`,
                        background: isOpen ? "rgba(12,14,19,.9)" : "rgba(12,14,19,.5)",
                        boxShadow: isOpen ? "0 10px 30px rgba(0,0,0,.4), 0 0 20px rgba(111,227,239,.06)" : "none",
                        overflow: "hidden",
                        transition: "all .25s ease",
                      }}
                    >
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isOpen) {
                            setSelectedId(null);
                          } else {
                            setSelectedId(cat.id);
                            setExpandedYears(new Set());
                            setSearchQuery("");
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "20px 24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: isOpen ? "rgba(255,255,255,.02)" : "transparent",
                          border: 0,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <span
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: isOpen ? "rgba(111,227,239,.14)" : "rgba(255,255,255,.04)",
                              border: `1px solid ${isOpen ? "rgba(111,227,239,.35)" : "rgba(255,255,255,.08)"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: isOpen ? "#6fe3ef" : "#8a939e",
                              transition: "all .2s ease",
                            }}
                          >
                            <Landmark style={{ width: 18, height: 18 }} />
                          </span>
                          <strong
                            style={{
                              fontSize: "clamp(16px, 2vw, 18px)",
                              color: isOpen ? "#f4f6f8" : "#d0d6de",
                              fontWeight: 600,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {cat.name}
                          </strong>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 999,
                              background: isOpen ? "rgba(111,227,239,.15)" : "rgba(255,255,255,.05)",
                              color: isOpen ? "#8fe9f2" : "#8a939e",
                              border: `1px solid ${isOpen ? "rgba(111,227,239,.25)" : "rgba(255,255,255,.07)"}`,
                            }}
                          >
                            {cat.documents.length} {cat.documents.length === 1 ? "file" : "files"}
                          </span>
                          <ChevronDown
                            style={{
                              width: 18,
                              height: 18,
                              color: isOpen ? "#6fe3ef" : "#8a939e",
                              transform: isOpen ? "rotate(180deg)" : "none",
                              transition: "transform .25s ease, color .2s",
                            }}
                          />
                        </div>
                      </button>

                      {/* Category Content: Search & Documents */}
                      {isOpen && (
                        <div
                          style={{
                            padding: "0 24px 24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            borderTop: "1px solid rgba(255,255,255,.06)",
                            paddingTop: 20,
                          }}
                        >
                          {/* Search Bar */}
                          <div style={{ position: "relative" }}>
                            <Search
                              style={{
                                position: "absolute",
                                left: 14,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 16,
                                height: 16,
                                color: "#8a939e",
                              }}
                            />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={`Search through ${cat.name}...`}
                              style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "12px 16px 12px 42px",
                                borderRadius: 12,
                                background: "rgba(255,255,255,.03)",
                                border: "1px solid rgba(255,255,255,.1)",
                                color: "#f4f6f8",
                                fontSize: 14,
                                outline: "none",
                                transition: "border-color .2s",
                              }}
                            />
                          </div>

                          {/* Year Groups */}
                          {yearGroups.length === 0 ? (
                            <div
                              style={{
                                padding: "36px 16px",
                                borderRadius: 12,
                                border: "1px dashed rgba(255,255,255,.08)",
                                textAlign: "center",
                                color: "#8a939e",
                                fontSize: 14,
                              }}
                            >
                              {searchQuery
                                ? "No documents match your search query."
                                : "No documents in this category yet."}
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              {yearGroups.map(([year, docs]) => {
                                const isYearOpen =
                                  expandedYears.has(year) || Boolean(searchQuery);
                                return (
                                  <div
                                    key={year}
                                    style={{
                                      borderRadius: 14,
                                      border: "1px solid rgba(255,255,255,.06)",
                                      background: "rgba(255,255,255,.02)",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleYear(year)}
                                      style={{
                                        width: "100%",
                                        padding: "14px 18px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        background: "transparent",
                                        border: 0,
                                        cursor: "pointer",
                                        textAlign: "left",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span
                                          style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: isYearOpen ? "#6fe3ef" : "rgba(255,255,255,.2)",
                                            boxShadow: isYearOpen ? "0 0 8px #6fe3ef" : "none",
                                            transition: "all .2s ease",
                                          }}
                                        />
                                        <strong
                                          style={{
                                            fontSize: 15,
                                            color: isYearOpen ? "#f4f6f8" : "#a3abb5",
                                            fontWeight: 600,
                                          }}
                                        >
                                          Financial Year {year}
                                        </strong>
                                      </div>

                                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span
                                          style={{
                                            fontSize: 12,
                                            color: "#8a939e",
                                            padding: "2px 8px",
                                            borderRadius: 999,
                                            background: "rgba(255,255,255,.05)",
                                          }}
                                        >
                                          {docs.length} {docs.length === 1 ? "filing" : "filings"}
                                        </span>
                                        {isYearOpen ? (
                                          <Minus style={{ width: 15, height: 15, color: "#6fe3ef" }} />
                                        ) : (
                                          <Plus style={{ width: 15, height: 15, color: "#8a939e" }} />
                                        )}
                                      </div>
                                    </button>

                                    {isYearOpen && (
                                      <div
                                        style={{
                                          padding: "0 18px 16px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 8,
                                        }}
                                      >
                                        {docs.map((doc) => (
                                          <div
                                            key={doc.id}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              gap: 16,
                                              padding: "12px 14px",
                                              borderRadius: 10,
                                              background: "rgba(255,255,255,.03)",
                                              border: "1px solid rgba(255,255,255,.06)",
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                                minWidth: 0,
                                              }}
                                            >
                                              <div
                                                style={{
                                                  width: 32,
                                                  height: 32,
                                                  borderRadius: 8,
                                                  background: "rgba(255,90,90,.1)",
                                                  border: "1px solid rgba(255,90,90,.25)",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  color: "#ff7b7b",
                                                  flexShrink: 0,
                                                }}
                                              >
                                                <FileText style={{ width: 16, height: 16 }} />
                                              </div>
                                              <span
                                                style={{
                                                  fontSize: 14,
                                                  color: "#f4f6f8",
                                                  fontWeight: 500,
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}
                                                title={doc.name}
                                              >
                                                {doc.name}
                                              </span>
                                            </div>

                                            <a
                                              href={doc.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 6,
                                                padding: "6px 14px",
                                                borderRadius: 8,
                                                background: "rgba(111,227,239,.12)",
                                                border: "1px solid rgba(111,227,239,.3)",
                                                color: "#8fe9f2",
                                                fontSize: 13,
                                                fontWeight: 600,
                                                textDecoration: "none",
                                                flexShrink: 0,
                                                transition: "all .2s ease",
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "#6fe3ef";
                                                e.currentTarget.style.color = "#07080b";
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "rgba(111,227,239,.12)";
                                                e.currentTarget.style.color = "#8fe9f2";
                                              }}
                                            >
                                              View PDF
                                              <ExternalLink style={{ width: 13, height: 13 }} />
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <EcosystemFooter />
      </div >
    );
  }

// ─── LIGHT THEME (Navigated from Avatar Learning) ─────────────────────────
return (
  <main className="min-h-screen overflow-x-hidden bg-slate-50/50 text-slate-800 flex flex-col justify-between">
    <div>
      <Navbar />

      {/* Content Section */}
      <section className="container-x pt-28 pb-16 sm:pt-32">
        <ScrollReveal>
          {loading ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Title Skeleton */}
              <div className="space-y-3">
                <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-4 w-full max-w-xl bg-slate-200 rounded-md animate-pulse" />
              </div>
              {/* Accordion Skeletons */}
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-slate-100 border border-slate-200/60 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center mb-4">
                <Landmark className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">
                No investor documents published yet.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Premium Header Section */}
              <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,transparent_70%)] blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,transparent_70%)] blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-500/10 border border-brand-500/20 text-brand-300 mb-4 animate-pulse">
                    <Landmark className="h-3.5 w-3.5" />
                    Official Disclosures
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    Investor Corner
                  </h1>
                  <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
                    Access and download corporate filings, quarterly financial statements, shareholding patterns, and statutory disclosures.
                  </p>

                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      href="/investors/board-of-directors"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
                    >
                      <Users className="h-4 w-4 text-brand-400" />
                      Board of Directors
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Category List */}
              <div className="space-y-4">
                {categories.map((cat) => {
                  const isOpen = cat.id === selectedId;
                  return (
                    <div
                      key={cat.id}
                      className={`transition-all duration-305 border rounded-2xl overflow-hidden bg-white ${isOpen
                          ? "border-brand-500/30 shadow-lg shadow-brand-500/5 ring-1 ring-brand-500/5"
                          : "border-slate-200/80 hover:border-slate-350/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5"
                        }`}
                    >
                      {/* Category Header Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isOpen) {
                            setSelectedId(null);
                          } else {
                            setSelectedId(cat.id);
                            setExpandedYears(new Set());
                            setSearchQuery("");
                          }
                        }}
                        className={`w-full flex items-center justify-between gap-4 px-6 py-5.5 transition-colors cursor-pointer ${isOpen
                            ? "bg-slate-50/60 border-b border-slate-100"
                            : "bg-white hover:bg-slate-50/20"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${isOpen
                                ? "bg-brand-500 border-brand-600 text-white shadow-md shadow-brand-500/25 scale-105"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                              }`}
                          >
                            <Landmark className="h-5 w-5" />
                          </span>
                          <span className="text-base sm:text-lg font-bold text-slate-800 text-left tracking-tight">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all duration-300 ${isOpen
                                ? "bg-brand-50 border-brand-200 text-brand-700"
                                : "bg-slate-100 border-slate-200/60 text-slate-500"
                              }`}
                          >
                            {cat.documents.length}{" "}
                            {cat.documents.length === 1 ? "file" : "files"}
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-brand-500" : ""
                              }`}
                          />
                        </div>
                      </button>

                      {/* Category Content: Years & Documents */}
                      {isOpen && (
                        <div className="p-6 sm:p-8 space-y-6 bg-white">
                          {/* Search Bar */}
                          <div className="relative animate-fadeIn">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={`Search through ${cat.name}...`}
                              className="w-full pl-11 pr-4 py-3 border border-slate-200/95 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 text-sm placeholder-slate-400 bg-slate-50/30 transition-all shadow-inner"
                            />
                          </div>

                          {/* Year Timeline */}
                          {yearGroups.length === 0 ? (
                            <div className="border border-dashed border-slate-200 rounded-2xl px-6 py-12 text-center bg-slate-50/50">
                              <p className="text-sm text-slate-400 font-semibold">
                                {searchQuery
                                  ? "No documents match your search query."
                                  : "No documents in this category yet."}
                              </p>
                            </div>
                          ) : (
                            <div className="relative pl-6 sm:pl-8 border-l border-slate-200/80 ml-3.5 space-y-6.5 animate-fadeIn">
                              {yearGroups.map(([year, docs]) => {
                                const isYearOpen =
                                  expandedYears.has(year) ||
                                  Boolean(searchQuery);
                                return (
                                  <div key={year} className="relative">
                                    {/* Timeline dot */}
                                    <span
                                      className={`absolute left-0 -translate-x-1/2 top-2.5 h-3.5 w-3.5 rounded-full border-2 bg-white transition-all duration-300 ${isYearOpen
                                          ? "border-brand-500 scale-125 ring-4 ring-brand-500/10 shadow-sm"
                                          : "border-slate-300 hover:border-slate-400"
                                        }`}
                                    />

                                    {/* Year toggle button */}
                                    <button
                                      type="button"
                                      onClick={() => toggleYear(year)}
                                      className="pl-4 flex items-center justify-between w-full text-left py-1 hover:text-brand-600 group/year transition-colors cursor-pointer"
                                    >
                                      <span className="text-sm sm:text-base font-extrabold text-slate-800 group-hover/year:text-brand-600 tracking-tight">
                                        Financial Year {year}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                                          {docs.length}{" "}
                                          {docs.length === 1 ? "document" : "documents"}
                                        </span>
                                        <span className="h-5 w-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover/year:border-brand-300 group-hover/year:text-brand-500 transition-colors">
                                          {isYearOpen ? (
                                            <Minus className="h-3 w-3" />
                                          ) : (
                                            <Plus className="h-3 w-3" />
                                          )}
                                        </span>
                                      </div>
                                    </button>

                                    {/* Document cards */}
                                    {isYearOpen && (
                                      <div className="mt-3 pl-4 space-y-3 animate-fadeIn">
                                        {docs.map((doc) => (
                                          <div
                                            key={doc.id}
                                            className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl border border-slate-100 hover:border-brand-500/20 bg-slate-50/20 hover:bg-brand-500/5 transition-all duration-200 shadow-2xs hover:shadow-sm"
                                          >
                                            <div className="flex items-center gap-4 min-w-0">
                                              <span className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100/50 group-hover:bg-red-500 group-hover:text-white transition-colors duration-200 shadow-2xs">
                                                <FileText className="h-5 w-5" />
                                              </span>
                                              <div className="min-w-0">
                                                <a
                                                  href={doc.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-sm font-semibold text-slate-800 hover:text-brand-600 flex items-center gap-1.5 min-w-0 transition-colors"
                                                >
                                                  <span className="truncate break-all sm:break-normal">
                                                    {doc.name}
                                                  </span>
                                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                              </div>
                                            </div>

                                            <div className="flex justify-end shrink-0">
                                              <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-brand-600 hover:text-white bg-brand-50 hover:bg-brand-500 rounded-lg transition-all duration-200 border border-brand-100/50 shadow-2xs"
                                              >
                                                View PDF
                                                <ArrowRight className="h-3.5 w-3.5" />
                                              </a>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                          );
                                })}
                        </div>
                      )}
                    </div>
                  )
                }
                      </div>
);
                  })}
                </div >
              </div >
            )}
          </ScrollReveal >
        </section >
      </div >

  <Footer />
    </main >
  );
}

export default function InvestorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080b]" />}>
      <InvestorsContent />
    </Suspense>
  );
}

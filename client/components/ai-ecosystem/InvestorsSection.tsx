"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Landmark,
  FileText,
  Search,
  ExternalLink,
  ChevronDown,
  Plus,
  Minus,
  ShieldCheck,
  TrendingUp,
  Users,
  ArrowRight,
} from "lucide-react";
import {
  fetchInvestorCategories,
  type InvestorCategory,
} from "@/lib/investorsApi";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 100px 0px" },
  transition: { duration: 0.8, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

export function InvestorsSection() {
  const [categories, setCategories] = useState<InvestorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInvestorCategories()
      .then((cats) => {
        setCategories(cats || []);
        if (cats && cats.length > 0) {
          // Open the first category by default for easy viewing
          setSelectedId(cats[0].id);
        }
      })
      .catch((err) => {
        console.error("Failed to load investor categories:", err);
      })
      .finally(() => setLoading(false));
  }, []);

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

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  return (
    <section
      id="investors"
      data-screen-label="09 Investors"
      style={{
        scrollMarginTop: 68,
        position: "relative",
        padding: "clamp(64px,8vw,112px) 24px clamp(48px,6vw,80px)",
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(107,124,255,.07), transparent 70%), #07080b",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(32px,5vw,56px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 18,
          }}
        >
          <motion.div
            {...reveal(0)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.03)",
              fontSize: 15,
              color: "#a3abb5",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#6fe3ef",
                boxShadow: "0 0 10px #6fe3ef",
              }}
            />
            Investor Relations
          </motion.div>

          <motion.h2
            {...reveal(80)}
            style={{
              margin: 0,
              fontSize: "clamp(32px,4.5vw,52px)",
              lineHeight: 1.08,
              letterSpacing: "-0.04em",
              fontWeight: 600,
              textWrap: "balance",
              background: "linear-gradient(180deg,#fff 40%,#8e98a4)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Corporate governance & disclosures
          </motion.h2>

          <motion.p
            {...reveal(140)}
            style={{
              margin: 0,
              maxWidth: 680,
              fontSize: "clamp(16px,2vw,18px)",
              lineHeight: 1.6,
              color: "#a3abb5",
            }}
          >
            Avatar is backed by an NSE-listed parent enterprise. Access official
            statutory filings, financial statements, shareholding patterns, and regulatory disclosures.
          </motion.p>
        </div>

        {/* Pillars / Governance Highlights */}
        <motion.div
          {...reveal(180)}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: "24px 22px",
              borderRadius: 16,
              background: "rgba(12,14,19,.7)",
              border: "1px solid rgba(255,255,255,.08)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(111,227,239,.1)",
                border: "1px solid rgba(111,227,239,.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6fe3ef",
              }}
            >
              <TrendingUp style={{ width: 19, height: 19 }} />
            </div>
            <strong style={{ fontSize: 17, color: "#f4f6f8", fontWeight: 600 }}>
              NSE-Listed Parent
            </strong>
            <p style={{ margin: 0, fontSize: 14, color: "#a3abb5", lineHeight: 1.55 }}>
              Operates under stringent public market governance, transparency, and regular audited accounting.
            </p>
          </div>

          <div
            style={{
              padding: "24px 22px",
              borderRadius: 16,
              background: "rgba(12,14,19,.7)",
              border: "1px solid rgba(255,255,255,.08)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(107,124,255,.12)",
                border: "1px solid rgba(107,124,255,.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8fa1ff",
              }}
            >
              <ShieldCheck style={{ width: 19, height: 19 }} />
            </div>
            <strong style={{ fontSize: 17, color: "#f4f6f8", fontWeight: 600 }}>
              Statutory Disclosures
            </strong>
            <p style={{ margin: 0, fontSize: 14, color: "#a3abb5", lineHeight: 1.55 }}>
              Regular quarterly financials, board intimations, compliance certificates, and shareholder updates.
            </p>
          </div>

          <div
            style={{
              padding: "24px 22px",
              borderRadius: 16,
              background: "rgba(12,14,19,.7)",
              border: "1px solid rgba(255,255,255,.08)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(111,227,239,.1)",
                border: "1px solid rgba(111,227,239,.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6fe3ef",
              }}
            >
              <Users style={{ width: 19, height: 19 }} />
            </div>
            <strong style={{ fontSize: 17, color: "#f4f6f8", fontWeight: 600 }}>
              Board Governance
            </strong>
            <p style={{ margin: 0, fontSize: 14, color: "#a3abb5", lineHeight: 1.55 }}>
              Active oversight from audit, stakeholder relationship, and nomination & remuneration committees.
            </p>
          </div>
        </motion.div>

        {/* Interactive Categories & Filings Browser */}
        <motion.div
          {...reveal(220)}
          style={{
            borderRadius: 22,
            border: "1px solid rgba(255,255,255,.1)",
            background: "rgba(10,12,16,.9)",
            padding: "clamp(20px, 3.5vw, 36px)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 20px 50px rgba(0,0,0,.5)",
          }}
        >
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px 0" }}>
              <div
                style={{
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(255,255,255,.05)",
                  animation: "pulse 1.5s infinite",
                }}
              />
              <div
                style={{
                  height: 120,
                  borderRadius: 14,
                  background: "rgba(255,255,255,.03)",
                  animation: "pulse 1.5s infinite",
                }}
              />
            </div>
          ) : categories.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 16px",
                textAlign: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(255,255,255,.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8a939e",
                }}
              >
                <Landmark style={{ width: 24, height: 24 }} />
              </div>
              <p style={{ margin: 0, color: "#f4f6f8", fontSize: 16, fontWeight: 500 }}>
                Official Filings Portal
              </p>
              <p style={{ margin: 0, color: "#8a939e", fontSize: 14, maxWidth: 440 }}>
                Documents are being uploaded and indexed. You can view board composition or query our investor desk.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Category selector pills */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  paddingBottom: 12,
                  borderBottom: "1px solid rgba(255,255,255,.07)",
                }}
              >
                {categories.map((cat) => {
                  const isActive = cat.id === selectedId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(cat.id);
                        setExpandedYears(new Set());
                        setSearchQuery("");
                      }}
                      style={{
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 500,
                        border: `1px solid ${isActive ? "rgba(111,227,239,.45)" : "rgba(255,255,255,.08)"
                          }`,
                        background: isActive
                          ? "rgba(111,227,239,.12)"
                          : "rgba(255,255,255,.03)",
                        color: isActive ? "#e9fdff" : "#a3abb5",
                        boxShadow: isActive ? "0 0 16px rgba(111,227,239,.15)" : "none",
                        transition: "all .2s ease",
                      }}
                    >
                      <Landmark style={{ width: 14, height: 14, color: isActive ? "#6fe3ef" : "#8a939e" }} />
                      <span>{cat.name}</span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "1px 6px",
                          borderRadius: 999,
                          background: isActive ? "rgba(111,227,239,.2)" : "rgba(255,255,255,.06)",
                          color: isActive ? "#6fe3ef" : "#8a939e",
                        }}
                      >
                        {cat.documents.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Category Display */}
              {selectedCategory && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Search within category */}
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
                      placeholder={`Search within ${selectedCategory.name}...`}
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

                  {/* Documents Grouped by Financial Year */}
                  {yearGroups.length === 0 ? (
                    <div
                      style={{
                        padding: "36px 16px",
                        borderRadius: 14,
                        border: "1px dashed rgba(255,255,255,.1)",
                        textAlign: "center",
                        color: "#8a939e",
                        fontSize: 14,
                      }}
                    >
                      {searchQuery
                        ? "No disclosures matched your search."
                        : "No documents published in this category yet."}
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
                              border: "1px solid rgba(255,255,255,.07)",
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
          )}
        </motion.div>

        {/* Bottom Navigation & Secondary Actions */}
        <motion.div
          {...reveal(260)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            padding: "20px 24px",
            borderRadius: 16,
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.07)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <strong style={{ fontSize: 15, color: "#f4f6f8", fontWeight: 600 }}>
              Board of Directors & Committees
            </strong>
            <span style={{ fontSize: 13, color: "#8a939e" }}>
              Explore executive leadership, independent directorships, and committee mandates.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/investors/board-of-directors"
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.12)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,.06)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,.12)";
              }}
            >
              Board of Directors
              <ArrowRight style={{ width: 14, height: 14, color: "#6fe3ef" }} />
            </Link>

            <Link
              href="/investors"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                color: "#07080b",
                background: "#6fe3ef",
                border: "1px solid #6fe3ef",
                textDecoration: "none",
                boxShadow: "0 0 20px rgba(111,227,239,.35)",
                transition: "all .2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#8fe9f2";
                e.currentTarget.style.boxShadow = "0 0 28px rgba(111,227,239,.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#6fe3ef";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(111,227,239,.35)";
              }}
            >
              Investor Portal
              <ExternalLink style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

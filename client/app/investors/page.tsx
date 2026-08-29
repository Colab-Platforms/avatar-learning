"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  FileText,
  Landmark,
  Search,
  ExternalLink,
  Calendar,
  ArrowRight,
  Plus,
  Minus,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/ui";
import {
  fetchInvestorCategories,
  type InvestorCategory,
} from "@/lib/investorsApi";

export default function InvestorsPage() {
  const [categories, setCategories] = useState<InvestorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInvestorCategories()
      .then((cats) => {
        setCategories(cats);
        // Start with all categories collapsed (selectedId = null)
        setSelectedId(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null;

  // Extract a 4-digit year from a document name, e.g. "FY 2024-25" -> "2024",
  // "BM_Intimation_22_03_2025_signed" -> "2025" (last match wins - dates are day_month_year)
  const extractYearFromName = (name: string) => {
    const matches = name.match(/20\d{2}/g);
    return matches ? matches[matches.length - 1] : null;
  };

  // Fall back to the upload date's year when the name has no year in it
  const extractYear = (doc: { name: string; createdAt: string }) =>
    extractYearFromName(doc.name) ?? String(new Date(doc.createdAt).getFullYear());

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "";
    }
  };

  // Client-side search filtering within the selected category
  const filteredDocuments =
    selectedCategory?.documents.filter((doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  // Group filtered documents by year for the accordion
  const yearGroups = Array.from(
    filteredDocuments.reduce((map, doc) => {
      const year = extractYear(doc);
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(doc);
      return map;
    }, new Map<string, typeof filteredDocuments>()),
  ).sort(([a], [b]) => Number(b) - Number(a));

  const toggleYear = (year: string) =>
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });

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
                  {/* Decorative background light flares */}
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
                  </div>
                </div>

                {/* Category List */}
                <div className="space-y-4">
                  {categories.map((cat) => {
                    const isOpen = cat.id === selectedId;
                    return (
                      <div
                        key={cat.id}
                        className={`transition-all duration-305 border rounded-2xl overflow-hidden bg-white ${
                          isOpen
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
                          className={`w-full flex items-center justify-between gap-4 px-6 py-5.5 transition-colors cursor-pointer ${
                            isOpen
                              ? "bg-slate-50/60 border-b border-slate-100"
                              : "bg-white hover:bg-slate-50/20"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                              isOpen
                                ? "bg-brand-500 border-brand-600 text-white shadow-md shadow-brand-500/25 scale-105"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                            }`}>
                              <Landmark className="h-5 w-5" />
                            </span>
                            <span className="text-base sm:text-lg font-bold text-slate-800 text-left tracking-tight">
                              {cat.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all duration-300 ${
                              isOpen
                                ? "bg-brand-50 border-brand-200 text-brand-700"
                                : "bg-slate-100 border-slate-200/60 text-slate-500"
                            }`}>
                              {cat.documents.length}{" "}
                              {cat.documents.length === 1 ? "file" : "files"}
                            </span>
                            <ChevronDown
                              className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                                isOpen ? "rotate-180 text-brand-500" : ""
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
                                      <span className={`absolute left-0 -translate-x-1/2 top-2.5 h-3.5 w-3.5 rounded-full border-2 bg-white transition-all duration-300 ${
                                        isYearOpen
                                          ? "border-brand-500 scale-125 ring-4 ring-brand-500/10 shadow-sm"
                                          : "border-slate-300 hover:border-slate-400"
                                      }`} />

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
                                                {/* PDF file icon wrapper */}
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
                                                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-350" />
                                                    <span>Published: {formatDate(doc.createdAt)}</span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Action button */}
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
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ScrollReveal>
        </section>
      </div>

      <Footer />
    </main>
  );
}

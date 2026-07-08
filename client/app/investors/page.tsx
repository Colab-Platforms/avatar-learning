"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Download, Landmark, FolderOpen, Check } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal } from "@/components/ui";
import { fetchInvestorCategories, type InvestorCategory } from "@/lib/investorsApi";

export default function InvestorsPage() {
  const [categories, setCategories] = useState<InvestorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInvestorCategories()
      .then((cats) => {
        setCategories(cats);
        setSelectedId(cats[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-800">
      <Navbar />

      {/* Header */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-x pt-28 pb-10 sm:pt-32 sm:pb-12">
          <ScrollReveal>
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                         bg-brand-50 border border-brand-200 mb-5"
            >
              <Landmark className="h-4 w-4 text-brand-600" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
                Investor Relations
              </p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Investor Corner
            </h1>
            <p className="mt-3 text-slate-500 max-w-xl">
              Annual reports, returns, and other disclosures for our shareholders and investors.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-8 sm:py-10">
        {loading ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center mb-4">
              <Landmark className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-slate-500">No investor documents published yet.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Category dropdown */}
            <div ref={dropdownRef} className="relative mb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Select Category
              </label>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-slate-200 bg-white hover:border-brand-300 transition-colors"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <FolderOpen className="h-4 w-4 text-brand-600" />
                  </span>
                  <span className="text-base font-semibold text-slate-900 truncate">
                    {selectedCategory?.name}
                  </span>
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">
                    {selectedCategory?.documents.length ?? 0}{" "}
                    {selectedCategory?.documents.length === 1 ? "file" : "files"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60 overflow-hidden max-h-80 overflow-y-auto">
                  {categories.map((cat) => {
                    const isSelected = cat.id === selectedId;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(cat.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors ${
                          isSelected ? "bg-brand-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`text-sm truncate ${
                            isSelected ? "font-semibold text-brand-700" : "text-slate-700"
                          }`}
                        >
                          {cat.name}
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400">
                            {cat.documents.length} {cat.documents.length === 1 ? "file" : "files"}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-brand-600" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Documents for selected category */}
            {selectedCategory && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {selectedCategory.documents.length === 0 ? (
                  <p className="px-5 sm:px-6 py-8 text-sm text-slate-400 text-center">
                    No documents in this category yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedCategory.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 hover:bg-slate-50 transition-colors group"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-brand-50 transition-colors">
                            <FileText className="h-4 w-4 text-brand-600" />
                          </span>
                          <span className="text-sm font-medium text-slate-700 truncate">{doc.name}</span>
                        </span>
                        <Download className="h-4 w-4 text-slate-300 group-hover:text-brand-600 transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}

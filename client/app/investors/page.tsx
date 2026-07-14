"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  FileText,
  Landmark,
  Check,
  Search,
  ExternalLink,
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null;

  // Client-side search filtering within the selected category
  const filteredDocuments =
    selectedCategory?.documents.filter((doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-800 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Content Section */}
        <section className="container-x pt-28 pb-16 sm:pt-32">
          <ScrollReveal>
            {loading ? (
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Skeleton for Sidebar */}
                <div className="hidden md:block col-span-1 space-y-3">
                  <div className="h-6 w-20 bg-slate-100 rounded-md animate-pulse" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-10 bg-slate-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                </div>
                {/* Skeleton for Main Area */}
                <div className="col-span-1 md:col-span-3 space-y-6">
                  <div className="h-10 w-48 bg-slate-100 rounded-md animate-pulse" />
                  <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                </div>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center mb-4">
                  <Landmark className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-slate-500">
                  No investor documents published yet.
                </p>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Category Sidebar - Desktop Only */}
                <aside className="hidden md:block col-span-1 border-r border-slate-200 pr-6 min-h-[500px]">
                  <div className="sticky top-28 space-y-4">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-2">
                      Categories
                    </h2>
                    <nav className="max-h-[65vh] overflow-y-auto pr-2 space-y-1.5 scrollbar-thin">
                      {categories.map((cat) => {
                        const isSelected = cat.id === selectedId;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(cat.id);
                              setSearchQuery("");
                            }}
                            className={`w-full text-left py-2.5 px-4 rounded-lg text-[13px] font-semibold tracking-wide transition-all duration-200 ${
                              isSelected
                                ? "font-semibold text-white shadow-xs bg-[linear-gradient(135deg,#153C66_0%,#2A78CC_100%)] "
                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </aside>

                {/* Category Dropdown - Mobile/Tablet Only */}
                <div
                  className="block md:hidden relative mb-4"
                  ref={dropdownRef}
                >
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Select Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {selectedCategory?.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-medium">
                        {selectedCategory?.documents.length ?? 0}{" "}
                        {selectedCategory?.documents.length === 1
                          ? "file"
                          : "files"}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-72 overflow-y-auto py-1">
                      {categories.map((cat) => {
                        const isSelected = cat.id === selectedId;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedId(cat.id);
                              setSearchQuery("");
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors ${
                              isSelected
                                ? "font-semibold text-white shadow-xs bg-[linear-gradient(135deg,#153C66_0%,#2A78CC_100%)] "
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-slate-900 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Main Content Area */}
                <div className="col-span-1 md:col-span-3 space-y-6">
                  {selectedCategory && (
                    <>
                      {/* Title and Badge */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                          {selectedCategory.name}
                        </h1>
                        <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200/40">
                          {selectedCategory.documents.length}{" "}
                          {selectedCategory.documents.length === 1
                            ? "document"
                            : "documents"}
                        </span>
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={`Search ${selectedCategory.name} documents...`}
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 text-sm placeholder-slate-400 bg-slate-50/50"
                        />
                      </div>

                      {/* Document List / Table */}
                      <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                        {/* Table Header */}
                        <div className="bg-slate-50/50 border-b border-slate-200/80 px-6 py-3.5 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Document Name
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">
                            Action
                          </span>
                        </div>

                        {/* Table Body */}
                        {filteredDocuments.length === 0 ? (
                          <div className="px-6 py-12 text-center">
                            <p className="text-sm text-slate-400 font-medium">
                              {searchQuery
                                ? "No documents match your search query."
                                : "No documents in this category yet."}
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {filteredDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4.5 hover:bg-slate-50/30 transition-colors group"
                              >
                                {/* Left: Document Name with Icon */}
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                  <span className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-slate-400 group-hover:text-brand-600 transition-colors">
                                    <FileText className="h-4.5 w-4.5" />
                                  </span>
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-[#1e40af] hover:text-blue-800 flex items-center gap-1.5 min-w-0"
                                  >
                                    <span className="truncate break-all sm:break-normal">
                                      {doc.name}
                                    </span>
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                                  </a>
                                </div>

                                {/* Right: View PDF Button */}
                                <div className="flex justify-end shrink-0">
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto text-center px-4.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs"
                                  >
                                    View PDF
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
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

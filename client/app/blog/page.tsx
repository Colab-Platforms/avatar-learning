"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BlogCard } from "@/components/blog/BlogCard";
import { BLOG_ARTICLES } from "@/data/blogData";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: "all", label: "All Stories" },
    { id: "beginners", label: "Beginners" },
    { id: "career", label: "Career Strategy" },
    { id: "placement", label: "Placement & Jobs" },
    { id: "skills", label: "Practical Skills" },
  ];

  const filteredArticles =
    activeCategory === "all"
      ? BLOG_ARTICLES
      : BLOG_ARTICLES.filter((a) => a.category === activeCategory);

  const scrollMobile = (direction: "left" | "right") => {
    if (!mobileTrackRef.current) return;
    const distance = 300;
    mobileTrackRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* ── Standard Site Navbar ── */}
      <Navbar />

      {/* ── Main Content: Starts directly with the blogs ── */}
      <main className="flex-1 w-full pt-24 md:pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header & Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider bg-brand-50 text-brand-600 border border-brand-200 uppercase">
                  <Sparkles className="w-3 h-3" />
                  Editorial Stories
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
                Latest Insights & Perspectives
              </h1>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer shrink-0 ${
                    activeCategory === cat.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              DESKTOP VIEW: Alternating 2-Card Row Layout (4 Blogs)
              Row 0: Small (col-span-5, diagonal-left) + Big (col-span-7, diagonal-right)
              Row 1: Big (col-span-7, diagonal-left) + Small (col-span-5, diagonal-right)
          ══════════════════════════════════════════════════ */}
          <div className="hidden md:grid grid-cols-12 gap-6 lg:gap-8">
            {filteredArticles.map((article, idx) => {
              const isSingle = filteredArticles.length === 1;
              const rowIndex = Math.floor(idx / 2);
              const colIndex = idx % 2;
              // Row 0: col 0 is small, col 1 is big
              // Row 1: col 0 is big, col 1 is small
              const isEvenRow = rowIndex % 2 === 0;
              const isBig = isSingle ? true : (isEvenRow ? colIndex === 1 : colIndex === 0);
              const colSpanClass = isSingle
                ? "col-span-12 lg:col-span-8"
                : (isBig ? "col-span-7" : "col-span-5");

              // Edge styling matching the screenshot:
              // Left card: diagonal-left (top-left & bottom-right curved)
              // Right card: diagonal-right (top-right & bottom-left curved)
              const edgeType =
                colIndex === 0 ? "diagonal-left" : "diagonal-right";

              return (
                <div
                  key={article.id}
                  className={`${colSpanClass} h-[500px] lg:h-[540px]`}
                >
                  <BlogCard
                    article={article}
                    index={idx}
                    isBig={isBig}
                    edgeType={edgeType}
                    forceImage={false}
                  />
                </div>
              );
            })}
          </div>

          {/* ══════════════════════════════════════════════════
              PHONE / MOBILE VIEW:
              Horizontal Draggable Track (matching video desktop mode)
              Images shown by default (forceImage={true})
          ══════════════════════════════════════════════════ */}
          <div className="md:hidden">
            {/* Mobile Swipe Navigation Controls */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
              <span>Swipe horizontally to explore stories</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollMobile("left")}
                  className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-700"
                  aria-label="Previous story"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => scrollMobile("right")}
                  className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-700"
                  aria-label="Next story"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Horizontal Cards Slider Track */}
            <div
              ref={mobileTrackRef}
              className="flex items-stretch gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {filteredArticles.map((article, idx) => (
                <div
                  key={article.id}
                  className="w-[84vw] max-w-[340px] h-[500px] shrink-0 snap-start"
                >
                  <BlogCard
                    article={article}
                    index={idx}
                    edgeType={
                      idx % 2 === 0 ? "diagonal-left" : "diagonal-right"
                    }
                    forceImage={true}
                    isBig={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Standard Site Footer ── */}
      <Footer />
    </div>
  );
}

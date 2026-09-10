"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { BlogCard } from "./BlogCard";
import type { BlogArticle } from "@/data/blogData";

interface BlogCarouselProps {
  articles: BlogArticle[];
  onSelectArticle: (article: BlogArticle) => void;
}

export function BlogCarousel({ articles, onSelectArticle }: BlogCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredArticles =
    activeCategory === "all"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  // Custom Cursor state (replicating the trailing cursor dot seen in video 00:14-00:22)
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 300 };
  const smoothCursorX = useSpring(cursorX, springConfig);
  const smoothCursorY = useSpring(cursorY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      cursorX.set(e.clientX - rect.left);
      cursorY.set(e.clientY - rect.top);
    }
  };

  // Drag scroll state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  useEffect(() => {
    const updateMaxScroll = () => {
      if (trackRef.current && containerRef.current) {
        const scrollWidth = trackRef.current.scrollWidth;
        const clientWidth = containerRef.current.clientWidth;
        setMaxScroll(Math.max(0, scrollWidth - clientWidth));
      }
    };

    updateMaxScroll();
    window.addEventListener("resize", updateMaxScroll);
    return () => window.removeEventListener("resize", updateMaxScroll);
  }, [filteredArticles]);

  const slide = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const cardWidth = 420; // approximate card width + gap
    const newPos =
      direction === "left"
        ? Math.max(0, scrollPosition - cardWidth)
        : Math.min(maxScroll, scrollPosition + cardWidth);

    setScrollPosition(newPos);
    containerRef.current.scrollTo({
      left: newPos,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollLeft);
    }
  };

  const categories = [
    { id: "all", label: "ALL STORIES" },
    { id: "beginners", label: "BEGINNERS" },
    { id: "career", label: "CAREER STRATEGY" },
    { id: "placement", label: "PLACEMENT & JOBS" },
    { id: "skills", label: "PRACTICAL SKILLS" },
  ];

  return (
    <div className="w-full relative py-6 md:py-10 bg-white">
      {/* ── Category Filter Bar & Navigation Controls ── */}
      <div className="px-4 sm:px-8 md:px-12 mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setScrollPosition(0);
                if (containerRef.current) containerRef.current.scrollLeft = 0;
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer shrink-0 ${
                activeCategory === cat.id
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Carousel Navigation Arrows & Drag Hint */}
        <div className="hidden sm:flex items-center gap-3 ml-auto">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase hidden lg:inline-block">
            DRAG OR CLICK TO SLIDE
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => slide("left")}
              disabled={scrollPosition <= 5}
              aria-label="Previous articles"
              className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => slide("right")}
              disabled={scrollPosition >= maxScroll - 5}
              aria-label="Next articles"
              className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:border-slate-400 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Cards Scroll / Drag Track Container ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHoveringCarousel(true)}
        onMouseLeave={() => {
          setIsHoveringCarousel(false);
          setIsDragging(false);
        }}
        onScroll={handleScroll}
        className="relative w-full overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing scroll-smooth select-none px-4 sm:px-8 md:px-12 py-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Custom Trailing Mouse Dot (as seen in video 00:14-00:20) */}
        {isHoveringCarousel && (
          <motion.div
            style={{
              x: smoothCursorX,
              y: smoothCursorY,
              translateX: "-50%",
              translateY: "-50%",
            }}
            className="pointer-events-none absolute top-0 left-0 z-30 hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/20 backdrop-blur-xs border border-slate-900/30 transition-opacity duration-200"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
          </motion.div>
        )}

        {/* 3-Column Card Track */}
        <div
          ref={trackRef}
          className="flex items-stretch gap-5 sm:gap-6 md:gap-7 pb-4 w-max"
        >
          {filteredArticles.map((article, idx) => (
            <div
              key={article.id}
              className="w-[85vw] sm:w-[380px] md:w-[410px] lg:w-[440px] shrink-0 transition-transform duration-200"
            >
              <BlogCard
                article={article}
                onSelect={onSelectArticle}
                index={idx}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Swipe / Drag Indicator */}
      <div className="sm:hidden px-4 pt-3 flex items-center justify-between text-xs text-slate-400">
        <span>← Swipe horizontally to explore</span>
        <span className="font-mono text-[11px]">
          {filteredArticles.length} ARTICLES
        </span>
      </div>
    </div>
  );
}

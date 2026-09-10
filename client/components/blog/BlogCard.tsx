"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { BlogArticle } from "@/data/blogData";

interface BlogCardProps {
  article: BlogArticle;
  index: number;
  onSelect?: (article: BlogArticle) => void;
  forceImage?: boolean;
  isBig?: boolean;
  edgeType?: "diagonal-left" | "diagonal-right";
}

export function BlogCard({
  article,
  index,
  forceImage = false,
  isBig = false,
  edgeType = "diagonal-left",
}: BlogCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // If forceImage is true (e.g. mobile mode), image is always visible
  const isImageActive = forceImage || isHovered;

  // Custom asymmetrical rounded edges matching user screenshot:
  // "diagonal-left": Top-Left & Bottom-Right are curved; Top-Right & Bottom-Left are sharp.
  // "diagonal-right": Top-Right & Bottom-Left are curved; Top-Left & Bottom-Right are sharp.
  const edgeClasses =
    edgeType === "diagonal-right"
      ? "rounded-tr-[44px] md:rounded-tr-[54px] rounded-bl-[44px] md:rounded-bl-[54px] rounded-tl-md rounded-br-md"
      : "rounded-tl-[44px] md:rounded-tl-[54px] rounded-br-[44px] md:rounded-br-[54px] rounded-tr-md rounded-bl-md";

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="block h-full group outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-3xl"
      aria-label={`Read article: ${article.title}`}
    >
      <div
        className={`relative w-full h-full min-h-[480px] md:min-h-[520px] ${edgeClasses} border border-[#D3DCE6] bg-white overflow-hidden select-none cursor-pointer shadow-xs transition-all duration-300 group-hover:border-brand-400 group-hover:shadow-xl group-hover:shadow-brand-500/10 flex flex-col justify-between`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ── Background Image Layer ── */}
        <div
          className={`absolute inset-0 z-0 transition-opacity duration-500 ease-out ${
            isImageActive ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 50vw"
            className={`object-cover transition-transform duration-700 ease-out ${
              isHovered ? "scale-105" : "scale-100"
            }`}
            priority={index < 2}
          />
          {/* Dark Editorial Scrim Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/45 to-black/85" />
        </div>

        {/* ── Card Content Container ── */}
        <div
          className={`relative z-10 p-6 ${
            isBig ? "md:p-10" : "md:p-8"
          } flex flex-col justify-between h-full`}
        >
          {/* Top Bar: Pill Tag */}
          <div className="flex items-center justify-between">
            <div
              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] md:text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                isImageActive
                  ? "bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-sm"
                  : "bg-slate-100 border border-slate-300/80 text-slate-700"
              }`}
            >
              <span>{isImageActive ? article.hoverTag : article.tag}</span>
            </div>

            <span
              className={`text-[11px] font-mono tracking-widest transition-colors duration-300 ${
                isImageActive ? "text-white/70" : "text-slate-400"
              }`}
            >
              0{index + 1}
            </span>
          </div>

          {/* Middle Body */}
          <div className="my-auto py-5">
            <AnimatePresence mode="wait">
              {isImageActive ? (
                <motion.div
                  key="image-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <h3
                    className={`font-extrabold text-white tracking-tight leading-snug drop-shadow-sm ${
                      isBig
                        ? "text-2xl md:text-3xl lg:text-4xl"
                        : "text-xl md:text-2xl lg:text-3xl"
                    }`}
                  >
                    {article.title}
                  </h3>
                  <p className="text-white/90 text-sm md:text-base lg:text-lg font-medium leading-relaxed drop-shadow-xs">
                    {article.hoverDescription}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs font-semibold text-brand-200 tracking-wider uppercase">
                      {article.readTime}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/50" />
                    <span className="text-xs text-white/80">
                      {article.date}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="default-content"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-4 md:space-y-5"
                >
                  {/* Optional circular image cutout for card 2 */}
                  {article.circleImage && (
                    <div className="flex justify-center my-2">
                      <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-slate-200 shadow-inner">
                        <Image
                          src={article.circleImage}
                          alt="Still life preview"
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    </div>
                  )}

                  <h3
                    className={`font-extrabold text-slate-900 tracking-tight leading-snug ${
                      isBig
                        ? "text-2xl md:text-3xl lg:text-4xl"
                        : "text-xl md:text-2xl lg:text-3xl"
                    }`}
                  >
                    {article.title}
                  </h3>

                  {/* Summary / Excerpt */}
                  <p
                    className={`text-slate-600 font-normal leading-relaxed line-clamp-3 ${
                      isBig
                        ? "text-sm md:text-base lg:text-lg"
                        : "text-sm md:text-base"
                    }`}
                  >
                    {article.summary || article.hoverDescription}
                  </p>

                  {/* Author & Reading Metadata */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-3 pt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-slate-300 shrink-0">
                        <Image
                          src={article.author.avatar}
                          alt={article.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[11px] md:text-xs font-bold tracking-wider text-slate-800 uppercase">
                        {article.author.name}
                      </span>
                    </div>

                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline-block" />

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span>{article.date}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="font-semibold text-brand-600">
                        {article.readTime}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Bar */}
          <div
            className={`pt-4 border-t flex items-center justify-between transition-colors duration-300 ${
              isImageActive ? "border-white/20" : "border-slate-200"
            }`}
          >
            <span
              className={`text-xs md:text-sm font-bold tracking-wider uppercase transition-colors duration-300 ${
                isImageActive ? "text-white" : "text-slate-700"
              }`}
            >
              {article.bottomLabel}
            </span>

            {/* Circular Arrow Button */}
            <div
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                isImageActive
                  ? "bg-brand-500 border-brand-400 text-white scale-105 shadow-md shadow-brand-500/40"
                  : "border-slate-300 bg-transparent text-slate-700 group-hover:bg-brand-500 group-hover:border-brand-500 group-hover:text-white"
              }`}
            >
              <ArrowRight
                className={`w-4 h-4 transition-transform duration-300 ${
                  isHovered ? "translate-x-0.5" : ""
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

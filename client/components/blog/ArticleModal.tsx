"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, Clock, Calendar, Share2, ArrowLeft, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { BlogArticle } from "@/data/blogData";

interface ArticleModalProps {
  article: BlogArticle | null;
  onClose: () => void;
}

export function ArticleModal({ article, onClose }: ArticleModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (article) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [article, onClose]);

  if (!article) return null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Article link copied to clipboard!");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-[#D3DCE6] flex flex-col overflow-hidden"
        >
          {/* Top Bar with back / close buttons */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 backdrop-blur-xs">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-700 hover:text-brand-500 uppercase transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Stories</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-full border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                title="Share article"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto p-6 md:p-10 space-y-8">
            {/* Header Meta */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-brand-50 text-brand-600 border border-brand-200 uppercase">
                  {article.hoverTag}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {article.date}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {article.readTime}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {article.title}
              </h1>

              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                {article.hoverDescription}
              </p>
            </div>

            {/* Author Byline */}
            <div className="flex items-center gap-3.5 py-4 border-y border-slate-200">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-slate-300">
                <Image
                  src={article.author.avatar}
                  alt={article.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {article.author.name}
                </p>
                <p className="text-xs text-slate-500">
                  {article.author.role || "Editorial Contributor"}
                </p>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative w-full h-[280px] md:h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Article Content */}
            <div className="space-y-5 text-slate-700 text-base md:text-lg leading-relaxed">
              <p className="whitespace-pre-line">{article.bodyMarkdown}</p>

              {/* Editorial Pull Quote */}
              <div className="my-8 p-6 rounded-2xl bg-brand-50/70 border-l-4 border-brand-500">
                <p className="text-base md:text-lg font-semibold text-brand-900 italic">
                  &ldquo;{article.summary}&rdquo;
                </p>
              </div>
            </div>

            {/* Bottom Footer Callout */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                AVATAR EDITORIAL PERSPECTIVE
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-brand-500 text-white text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

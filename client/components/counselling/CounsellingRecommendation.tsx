"use client";

import { useState } from "react";
import type {
  CourseRecommendation,
  CounsellingProfile,
  RecommendationStatus,
} from "@/lib/counselling/counsellingApi";
import { buildCounsellingResponseSections } from "@/lib/counselling/counsellingResponses";
import {
  Sparkles,
  TrendingUp,
  Target,
  FileText,
  X,
  Check,
  Calendar,
  ArrowRight,
  Compass,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CounsellingRecommendationProps {
  profile: CounsellingProfile;
  recommendation: CourseRecommendation | null;
  recommendationStatus: RecommendationStatus;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function CounsellingRecommendation({
  profile,
  recommendation,
  recommendationStatus,
}: CounsellingRecommendationProps) {
  const [showResponses, setShowResponses] = useState(false);
  const sections = buildCounsellingResponseSections(profile);
  const submittedAt = formatDate(profile.submittedAt);
  const generatedAt = formatDate(recommendation?.generatedAt ?? null);

  return (
    <div className="space-y-6 text-slate-700">
      {/* Success Notification Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 rounded-2xl border border-emerald-500/10 bg-gradient-to-r from-emerald-500/5 to-emerald-500/0 px-6 py-5 sm:flex-row sm:items-center sm:justify-between shadow-xs backdrop-blur-xs"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shadow-inner">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Assessment Completed Successfully
            </p>
            <p className="mt-0.5 text-xs text-emerald-700/80">
              {submittedAt ? `Submitted on ${submittedAt} · ` : ""}Your assessment is complete and saved across all your enrolled courses.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowResponses(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-600/20 bg-white/80 hover:bg-emerald-50 px-5 py-2.5 text-xs font-semibold text-emerald-700 shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          View Your Responses
        </button>
      </motion.div>

      {/* Responses Modal */}
      <AnimatePresence>
        {showResponses && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResponses(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.section
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Your Responses
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Everything you shared in your AI assessment questionnaire.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResponses(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {sections.map((section) => (
                  <div key={section.id} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                      {section.title}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {section.items.map((item) => (
                        <div
                          key={`${section.id}-${item.label}`}
                          className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50"
                        >
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {item.label}
                          </dt>
                          <dd className="mt-1.5 text-sm font-medium text-slate-700">
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* Main AI Recommendation Card */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6 sm:space-y-8"
      >
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between border-b border-slate-100 pb-5"
        >
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Your Assessment Analysis
              </h2>
              <p className="text-xs text-slate-500">
                A summary of your profile, strengths and growth areas
              </p>
            </div>
          </div>
        </motion.div>

        {recommendationStatus === "pending" && !recommendation && (
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Analysis In Progress
              </p>
              <p className="mt-1 text-xs text-amber-700 leading-normal">
                Your responses have been saved successfully. Your AI assessment
                analysis is being generated. Please refresh this page after a
                few moments.
              </p>
            </div>
          </motion.div>
        )}

        {recommendation && (
          <div className="space-y-6 sm:space-y-8">
            {/* Overview */}
            {recommendation.summary && (
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-blue-500/10 bg-blue-50/40 p-5 sm:p-6"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-blue-500" />
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                    Overview
                  </h4>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 font-medium">
                  {recommendation.summary}
                </p>
              </motion.div>
            )}

            {/* Profile Analysis Section */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 sm:p-6"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-slate-500" />
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                  Profile Analysis
                </h4>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 font-normal">
                {recommendation.reasoning}
              </p>
            </motion.div>

            {/* Strengths & Growth Areas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendation.studentStrengths &&
                recommendation.studentStrengths.length > 0 && (
                  <motion.div
                    variants={itemVariants}
                    className="rounded-xl border border-emerald-500/10 bg-white p-5 sm:p-6 space-y-4 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                        Identified Strengths
                      </h4>
                    </div>
                    <ul className="space-y-2.5">
                      {recommendation.studentStrengths.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 rounded-xl border border-emerald-100/50 bg-emerald-50/30 px-3.5 py-3 text-xs font-medium text-emerald-800"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

              {recommendation.growthAreas &&
                recommendation.growthAreas.length > 0 && (
                  <motion.div
                    variants={itemVariants}
                    className="rounded-xl border border-amber-500/10 bg-white p-5 sm:p-6 space-y-4 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Compass className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                        Growth Areas
                      </h4>
                    </div>
                    <ul className="space-y-2.5">
                      {recommendation.growthAreas.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 rounded-xl border border-amber-100/50 bg-amber-50/30 px-3.5 py-3 text-xs font-medium text-amber-900"
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
            </div>

            {/* Generated Date / Footer */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 text-[10px] text-slate-400 gap-2"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Generated: {generatedAt ?? "—"}</span>
              </div>
              <span className="font-medium">
                Direct2Hire AI Assessment Suite
              </span>
            </motion.div>
          </div>
        )}
      </motion.section>
    </div>
  );
}

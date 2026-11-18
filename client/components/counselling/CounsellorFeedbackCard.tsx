"use client";

import { motion } from "framer-motion";
import { MessageSquareQuote } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  getCounsellingFeedbackLabel,
  type CounsellingFeedback,
} from "@/lib/counselling/counsellingFeedbackConstants";

function FeedbackField({
  label,
  badgeLabel,
  delay = 0,
}: {
  label: string;
  badgeLabel: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="mt-2">
        <Badge variant="freeLight" className="normal-case tracking-normal text-xs">
          {badgeLabel}
        </Badge>
      </div>
    </motion.div>
  );
}

export function CounsellorFeedbackCard({
  feedback,
}: {
  feedback: CounsellingFeedback;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <MessageSquareQuote size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Counsellor Feedback</h2>
          <p className="mt-1 text-sm text-slate-500">
            Insights from your 1-on-1 counselling session to guide your learning path.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FeedbackField
          label="Assessment Alignment"
          badgeLabel={getCounsellingFeedbackLabel(
            "assessmentAlignment",
            feedback.assessmentAlignment,
          )}
          delay={0.05}
        />
        <FeedbackField
          label="Recommended Learning Path"
          badgeLabel={getCounsellingFeedbackLabel(
            "recommendedCourse",
            feedback.recommendedCourse,
          )}
          delay={0.1}
        />
        <FeedbackField
          label="Communication Skills"
          badgeLabel={getCounsellingFeedbackLabel(
            "communicationRating",
            feedback.communicationRating,
          )}
          delay={0.15}
        />
        <FeedbackField
          label="Motivation Level"
          badgeLabel={getCounsellingFeedbackLabel(
            "motivationLevel",
            feedback.motivationLevel,
          )}
          delay={0.2}
        />
        <FeedbackField
          label="Overall Potential"
          badgeLabel={getCounsellingFeedbackLabel(
            "overallPotential",
            feedback.overallPotential,
          )}
          delay={0.25}
        />
      </div>

      {feedback.description?.trim() ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.3 }}
          className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Additional Notes
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {feedback.description}
          </p>
        </motion.div>
      ) : null}
    </motion.section>
  );
}

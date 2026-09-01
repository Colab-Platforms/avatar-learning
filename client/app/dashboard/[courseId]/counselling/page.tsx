"use client";

import { useParams } from "next/navigation";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Map,
  User,
  Phone,
  Video,
  Clock,
  Send,
  CheckCircle,
  Loader2,
  CalendarClock,
  User2,
  ExternalLink,
  ChevronDown,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { useCounsellingBooking } from "@/hooks/queries/useCounsellingBooking";
import { useCounsellingFeedback } from "@/hooks/queries/useCounsellingFeedback";
import { useCounsellingProfile } from "@/hooks/queries/useCounsellingProfile";
import { useCreateCounsellingBooking } from "@/hooks/mutations/useCreateCounsellingBooking";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { CounsellorFeedbackCard } from "@/components/counselling/CounsellorFeedbackCard";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/ui";

const FAQS = [
  {
    q: "What will we discuss?",
    a: "Your background, goals, strengths, and which AI path (Fundamentals or Social Media) makes most sense. You'll get a simple action plan.",
  },
  {
    q: "Is this a sales call?",
    a: "No. This is a genuine counseling session focused on giving you clarity, not selling you anything.",
  },
  {
    q: "Voice call or Video call?",
    a: "You can choose either when you request the session. Both options are available.",
  },
  {
    q: "How long is the session?",
    a: "Around 30 minutes. We keep it focused and practical.",
  },
  {
    q: "Can I reschedule?",
    a: "Yes, once free of charge if you inform us at least 12 hours in advance.",
  },
];

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CounsellingPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: booking, isLoading: bookingLoading } =
    useCounsellingBooking(courseId);
  const { data: counsellingData, isLoading: profileLoading } =
    useCounsellingProfile(courseId);
  const createBookingMutation = useCreateCounsellingBooking();
  const { data: d2hStatus } = useD2HStatus();
  const hasFullAccess = d2hStatus?.enrollment?.status === "PAID";
  const counsellingCompleted = booking?.counsellingCompleted ?? false;
  const { data: feedback, isLoading: feedbackLoading } = useCounsellingFeedback(
    counsellingCompleted,
  );

  const [preferredMode, setPreferredMode] = useState<"VOICE" | "VIDEO">("VOICE");
  const [notes, setNotes] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBookingMutation.mutate({
      preferredMode,
      notes,
      courseId,
    });
  };

  if (
    bookingLoading ||
    profileLoading ||
    (counsellingCompleted && feedbackLoading)
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasAssessment = !!counsellingData?.profile?.isSubmitted;

  if (!hasAssessment) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <ClipboardCheck size={26} />
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          Complete your AI Assessment first
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          We use your assessment answers to match you with the right
          counsellor and build your profile summary. It only takes about 5
          minutes.
        </p>
        <Link
          href={`/dashboard/${courseId}/assessment`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Go to AI Assessment <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const isBooked = !!booking;
  const bookingStatus = booking?.status || "NOT_BOOKED";

  if (counsellingCompleted) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-wider text-blue-600 uppercase">
            Direct2Hire Programme
          </span>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Counselling Complete
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your 1-on-1 session is done. Here&apos;s your counsellor&apos;s
            feedback — continue with your enrolled course whenever you&apos;re
            ready.
          </p>
        </div>
        {feedback ? <CounsellorFeedbackCard feedback={feedback} /> : null}
        {hasFullAccess ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  You&apos;re all set
                </h2>
                <p className="mt-0.5 text-sm text-slate-600">
                  Your Direct2Hire course is available in your AI Learning
                  section.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/learning"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Learning <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-6">
            <h2 className="text-base font-bold text-slate-900">
              Unlock the full programme
            </h2>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              Assessment and counselling are done. Learning, internship and
              placement need the full Direct2Hire programme — you&apos;ve already
              paid ₹99, so it&apos;s just ₹900 more.
            </p>
            <Link
              href={`/courses/${courseId}/enroll?plan=d2h`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Upgrade Now <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Badge / Pill */}
      <div className="mb-2">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-wider text-blue-600 uppercase">
          Direct2Hire Programme
        </span>
      </div>

      {/* Main Title and Subtitle */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          1-on-1 Counseling
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Complete 8 weekly tasks to earn your 2-month Internship Certificate.
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        
        {/* Left Column - Information & FAQs */}
        <div className="space-y-8 lg:col-span-8">
          
          {/* What this counseling is about */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">
              What this counseling is about
            </h2>
            
            <div className="space-y-6">
              {/* Item 1 */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Career Clarity
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Understand which AI roles suit your background and get honest feedback on where you currently stand.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Map size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Personalized Roadmap
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Leave with a clear 30–90 day plan: which course to take, what skills to build next, and how to prepare for internships.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    1-on-1 Expert Session
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    30-minute conversation (voice or video) with a career counselor who understands AI careers and the Direct2Hire path.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">
              FAQs
            </h2>
            
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {FAQS.map((faq, i) => {
                const open = openFaq === i;
                return (
                  <AnimateOnScroll key={faq.q} delay={i * 60}>
                    <div
                      className={cn(
                        "rounded-2xl border bg-white transition-all duration-300",
                        open
                          ? "border-brand-300 shadow-sm"
                          : "border-border hover:border-border-strong",
                      )}
                    >
                      <button
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left cursor-pointer"
                        aria-expanded={open}
                      >
                        <span
                          className={cn(
                            "text-[15px] font-medium transition-colors duration-250",
                            open ? "text-brand-600" : "text-text",
                          )}
                        >
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-300",
                            open
                              ? "rotate-180 text-brand-600"
                              : "text-text-subtle",
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          "grid transition-all duration-300 ease-out",
                          open
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="px-6 pb-5 text-[13.5px] text-text-muted leading-relaxed whitespace-pre-line">
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Status & Booking */}
        <div className="space-y-6 lg:col-span-4">
          
          {/* Card 1: Your Counseling Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              Your Counseling Status
            </h2>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={bookingStatus}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {bookingStatus === "NOT_BOOKED" && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-800">
                    <Clock size={18} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold">Not Booked Yet</p>
                      <p className="text-xs mt-0.5 text-amber-700/80">Request a session to get started</p>
                    </div>
                  </div>
                )}

                {bookingStatus === "PENDING" && (
                  <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-blue-800">
                    <Clock size={18} className="mt-0.5 shrink-0 text-blue-600 animate-pulse" />
                    <div>
                      <p className="text-sm font-bold">Pending Confirmation</p>
                      <p className="text-xs mt-0.5 text-blue-700/80">We'll confirm within 24 hours</p>
                    </div>
                  </div>
                )}

                {bookingStatus === "CONFIRMED" && booking && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-800">
                      <CheckCircle size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold">Session Confirmed</p>
                        <p className="text-xs mt-0.5 text-emerald-700/80 font-medium">Your request has been accepted</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <User2 size={14} className="shrink-0 text-slate-400" />
                        <span className="font-semibold">{booking.counsellorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <CalendarClock size={14} className="shrink-0 text-slate-400" />
                        <span>{formatDateTime(booking.scheduledAt)}</span>
                      </div>
                      {booking.preferredMode === "VOICE" ? (
                        booking.phoneNumber && (
                          <a
                            href={`tel:${booking.phoneNumber}`}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            <Phone size={14} className="shrink-0" />
                            <span className="truncate">{booking.phoneNumber}</span>
                          </a>
                        )
                      ) : (
                        booking.meetingLink && (
                          <a
                            href={booking.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            <Video size={14} className="shrink-0" />
                            <span className="truncate">Join Google Meet</span>
                            <ExternalLink size={12} className="shrink-0" />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Card 2: Request a Session Form */}
          {bookingStatus === "NOT_BOOKED" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Request a Session
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose voice or video call
              </p>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Preferred Mode Selection */}
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Preferred Mode
                  </span>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPreferredMode("VOICE")}
                      className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-3.5 px-2 text-center transition-all ${
                        preferredMode === "VOICE"
                          ? "border-blue-600 bg-blue-50/30 text-blue-700 font-bold"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <Phone size={18} className={preferredMode === "VOICE" ? "text-blue-600" : "text-slate-400"} />
                      <span className="text-xs">Voice Call</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreferredMode("VIDEO")}
                      className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border-2 py-3.5 px-2 text-center transition-all ${
                        preferredMode === "VIDEO"
                          ? "border-blue-600 bg-blue-50/30 text-blue-700 font-bold"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <Video size={18} className={preferredMode === "VIDEO" ? "text-blue-600" : "text-slate-400"} />
                      <span className="text-xs">Video Call</span>
                    </button>
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Anything you'd like us to know? (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="E.g. I'm more interested in AI for marketing..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={createBookingMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {createBookingMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-slate-400">
                  We'll confirm within 24 hours
                </p>
              </form>
            </div>
          )}

          {/* Card 3: Session Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              Session Details
            </h2>

            <div className="divide-y divide-slate-100 text-sm">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-800">30 minutes</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Mode</span>
                <span className="font-semibold text-slate-800">
                  {isBooked
                    ? `${booking.preferredMode === "VOICE" ? "Voice" : "Video"} Call (Selected)`
                    : "Voice or Video"}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Language</span>
                <span className="font-semibold text-slate-800">English / Hindi</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Reschedule</span>
                <span className="font-semibold text-slate-800">Free (once)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

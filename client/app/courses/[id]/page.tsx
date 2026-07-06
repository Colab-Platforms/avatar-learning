"use client";

import { use, useState, useCallback } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Clock,
  Users,
  BadgeCheck,
  Zap,
  ChevronDown,
  ArrowRight,
  Download,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button, ScrollReveal, AnimateOnScroll } from "@/components/ui";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { enrollCourse, type DBCourseDetail } from "@/lib/coursesApi";
import { useCourse } from "@/hooks/queries/useCourse";
import { useEnrollment } from "@/hooks/queries/useEnrollment";
import { useAppSelector } from "@/store/hooks";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCashfree } from "@/hooks/useCashfree";
import { useCreateOrder } from "@/hooks/mutations/useCreateOrder";
import { useVerifyPayment } from "@/hooks/mutations/useVerifyPayment";
import type { CreateOrderResponse } from "@/lib/paymentApi";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CoursePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [openWeek, setOpenWeek] = useState<number | null>(0);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const { user } = useAppSelector((s) => s.auth);

  const razorpayLoaded = useRazorpay();
  const cashfreeLoaded = useCashfree();
  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  const { data: course, isLoading, isError } = useCourse(id);
  const { data: enrollmentData, refetch: refetchEnrollment } = useEnrollment(
    course?.id ?? "",
  );
  const enrolled = enrollmentData?.enrolled ?? false;
  const isFree = course?.price === 0;

  const showMsg = (msg: string, type: "success" | "error" = "success") => {
    setEnrollMsg(msg);
    setMsgType(type);
  };

  const handleFreeEnroll = useCallback(async () => {
    if (!course) return;
    setEnrolling(true);
    showMsg("");
    try {
      await enrollCourse(course.id);
      showMsg("You're enrolled! Access your course below.", "success");
      await refetchEnrollment();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message ?? "Enrollment failed. Please try again.";
      if (msg.toLowerCase().includes("already enrolled")) {
        await refetchEnrollment();
      } else {
        showMsg(msg, "error");
      }
    } finally {
      setEnrolling(false);
    }
  }, [course, refetchEnrollment]);

  const handleRazorpayCheckout = useCallback(
    async (order: CreateOrderResponse) => {
      if (!course || !user) return;

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "Avatar India",
          description: course.title,
          image: course.thumbnail ?? undefined,
          order_id: order.orderId,
          prefill: {
            name: `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim(),
            email: (user as any).email ?? "",
          },
          theme: { color: "#00C8FF" },
          retry: { enabled: true, max_count: 3 },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await verifyPayment({
                courseId: course.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await refetchEnrollment();
              showMsg("Payment successful! Redirecting to your course…", "success");
              setTimeout(() => router.push(`/courses/${id}/learn`), 1500);
              resolve();
            } catch (verifyErr: unknown) {
              const e = verifyErr as { response?: { data?: { message?: string } } };
              reject(new Error(e?.response?.data?.message ?? "Payment verification failed"));
            }
          },
          modal: {
            ondismiss: () => reject(new Error("cancelled")),
          },
        });

        rzp.open();
      });
    },
    [course, user, verifyPayment, refetchEnrollment, id, router],
  );

  const handleCashfreeCheckout = useCallback(
    async (order: CreateOrderResponse) => {
      if (!course) return;
      if (!order.paymentSessionId) {
        throw new Error("Missing Cashfree payment session");
      }

      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not loaded");
      }
      const cashfree = window.Cashfree({ mode: order.mode ?? "sandbox" });
      const result = await cashfree.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_modal",
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Payment failed");
      }

      await verifyPayment({
        courseId: course.id,
        order_id: order.orderId,
      });
      await refetchEnrollment();
      showMsg("Payment successful! Redirecting to your course…", "success");
      setTimeout(() => router.push(`/courses/${id}/learn`), 1500);
    },
    [course, verifyPayment, refetchEnrollment, id, router],
  );

  const handlePaidEnroll = useCallback(async () => {
    if (!course || !user) return;

    setEnrolling(true);
    showMsg("");

    try {
      const order = await createOrder(course.id);

      if (order.provider === "cashfree") {
        if (!cashfreeLoaded) {
          showMsg("Payment SDK is still loading. Please try again.", "error");
          return;
        }
        await handleCashfreeCheckout(order);
        return;
      }

      if (!razorpayLoaded) {
        showMsg("Payment SDK is still loading. Please try again.", "error");
        return;
      }
      await handleRazorpayCheckout(order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      if (msg === "cancelled") {
        showMsg("Payment was cancelled.", "error");
      } else {
        showMsg(msg, "error");
      }
    } finally {
      setEnrolling(false);
    }
  }, [
    course,
    user,
    razorpayLoaded,
    cashfreeLoaded,
    createOrder,
    handleRazorpayCheckout,
    handleCashfreeCheckout,
  ]);

  const handleEnroll = useCallback(async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (enrolled) {
      router.push(`/courses/${id}/learn`);
      return;
    }
    if (!course) return;
    if (isFree) {
      await handleFreeEnroll();
    } else {
      await handlePaidEnroll();
    }
  }, [user, enrolled, course, id, router, isFree, handleFreeEnroll, handlePaidEnroll]);

  if (isLoading)
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-50">
          <div className="h-[340px] sm:h-[440px] md:h-[520px] bg-slate-200 animate-pulse" />
          <div className="container-x pt-10 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl bg-slate-100 animate-pulse ${i === 0 ? "h-32" : "h-20"}`}
              />
            ))}
          </div>
        </main>
        <Footer />
      </>
    );

  if (isError || !course) return notFound();

  const weekData = [...course.lessons].sort(
    (a, b) => a.weekNumber - b.weekNumber,
  );
  const whatYouLearn = course.whatYouLearn ?? [];
  const audience = course.audience ?? [];

  const enrollBtnLabel = enrolling
    ? "Processing Payment…"
    : enrolled
      ? "Go to Course →"
      : isFree
        ? "Enroll Free"
        : `Enroll Now — ₹${(course.price).toLocaleString("en-IN")}`;

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen text-slate-800 overflow-x-hidden pb-20 md:pb-0"
        style={{ background: "#FFFFFF" }}
      >
        {/* ── BANNER ── */}
        <div className="relative w-full h-[260px] sm:h-[340px] md:h-[400px] overflow-hidden">
          {course.bannerImage ? (
            <Image
              src={course.bannerImage}
              alt={course.title}
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,60,140,0.05) 0%, rgba(0,200,255,0.02) 100%)",
              }}
            />
          )}
          {/* Subtle top overlay for navbar contrast */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 container-x">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-[12px] mt-10 text-white/80 hover:text-white
                         transition-colors duration-200 bg-black/25 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10 shadow-sm"
            >
              ← All Courses
            </Link>
          </div>
        </div>

        {/* ── HERO INFO ── */}
        <section className="relative pt-4 pb-10 overflow-hidden">
          <div
            className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(0,128,255,0.06) 0%, transparent 65%)",
              filter: "blur(60px)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-40 right-0 w-[500px] h-[400px] opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at right, rgba(0,128,255,0.08) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 dot-grid opacity-[0.12]"
            aria-hidden
          />

          <div className="relative container-x pt-4">
            <div className="grid md:grid-cols-[1fr_380px] gap-14 items-start">
              {/* LEFT */}
              <div>
                <ScrollReveal animation="fade-up" delay={0} duration={700}>
                  <div
                    className="inline-flex items-center gap-2 rounded-full border border-blue-500/20
                                  bg-blue-500/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase
                                  tracking-widest text-blue-600 mb-5 cursor-default"
                  >
                    <Zap className="h-3 w-3" /> AI Learning Course
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={60} duration={700}>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {isFree && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 shadow-sm">
                        FREE
                      </span>
                    )}
                    <Badge
                      className={cn(
                        "font-semibold",
                        course.level === "BEGINNER" &&
                          "bg-emerald-50 text-emerald-700 border-emerald-200",
                        course.level === "INTERMEDIATE" &&
                          "bg-amber-50 text-amber-700 border-amber-200",
                        course.level === "ADVANCED" &&
                          "bg-rose-50 text-rose-700 border-rose-200",
                      )}
                    >
                      {course.level}
                    </Badge>
                    {course.certificate && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-150
                                       bg-blue-50/60 px-3 py-0.5 text-[11px] font-semibold text-blue-700"
                      >
                        <BadgeCheck className="h-3 w-3 text-blue-600" />{" "}
                        Certificate Included
                      </span>
                    )}
                    {enrolled && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200
                                       bg-emerald-50 px-3 py-0.5 text-[11px] font-semibold text-emerald-700"
                      >
                        <CheckCircle className="h-3 w-3" /> Enrolled
                      </span>
                    )}
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={120} duration={800}>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-5 text-slate-900">
                    {course.title}
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={180} duration={750}>
                  <p className="text-slate-600 text-[16px] leading-relaxed max-w-xl mb-6">
                    {course.description}
                  </p>
                </ScrollReveal>

                {/* Tool tags — left side only */}
                {course.tools?.length > 0 && (
                  <ScrollReveal animation="fade-up" delay={220} duration={700}>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {course.tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px]
                                     font-medium text-slate-500 hover:border-blue-500/30 hover:bg-blue-50/30
                                     hover:text-blue-700 transition-all duration-250 cursor-default"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </ScrollReveal>
                )}

                {/* Mobile-only CTA — visible below description on small screens */}
                <div className="md:hidden mt-5 space-y-3">
                  {enrollMsg && (
                    <div
                      className={`rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${
                        enrollMsg.includes("enrolled")
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      {enrollMsg.includes("enrolled") ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : null}
                      {enrollMsg}
                    </div>
                  )}
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold
                               transition-all duration-250 disabled:opacity-60 text-white hover:brightness-110 active:scale-95 shadow-md cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
                  >
                    {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!enrolling && enrolled && <CheckCircle className="h-4 w-4" />}
                    {enrollBtnLabel}
                    {!enrolling && !enrolled && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all duration-200 shadow-sm cursor-pointer">
                    <Download className="h-4 w-4" /> Download Syllabus
                  </button>
                </div>
              </div>

              {/* RIGHT — sticky card */}
              <ScrollReveal
                animation="fade-left"
                delay={200}
                duration={900}
                className="hidden md:block"
              >
                <div className="sticky top-24 space-y-4">
                  {/* Hero image */}
                  <div className="relative">
                    <div
                      className="relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200
                                    group hover:border-blue-500/30 transition-all duration-500"
                      style={{
                        background:
                          "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
                      }}
                    >
                      {course.heroImage ? (
                        <Image
                          src={course.heroImage}
                          alt={course.title}
                          fill
                          sizes="380px"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(0,60,140,0.1) 0%, rgba(0,200,255,0.05) 100%)",
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-slate-900/20 via-transparent to-transparent" />
                    </div>
                    {course._count.enrollments > 0 && (
                      <div
                        className="absolute -bottom-4 -left-4 rounded-xl border border-slate-200
                                      bg-white/95 backdrop-blur-sm px-4 py-3 shadow-sm
                                      hover:border-blue-500/25 transition-colors duration-300"
                      >
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                          Students enrolled
                        </p>
                        <p className="text-2xl font-bold text-slate-800 mt-0.5">
                          {course._count.enrollments.toLocaleString("en-IN")}+
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info card below image */}
                  <div
                    className="rounded-2xl border border-slate-200 p-5 mt-6 space-y-4"
                    style={{ background: "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)" }}
                  >
                    {/* Rating row */}
                    {(course.rating || course.sessions || course.seats) && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        {course.rating && (
                          <span className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${s <= Math.round(course.rating!) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                              />
                            ))}
                            <span className="ml-1 font-semibold text-slate-800 text-[13px]">
                              {course.rating}
                            </span>
                            {course.reviews && (
                              <span className="text-slate-400 text-[12px]">
                                ({course.reviews})
                              </span>
                            )}
                          </span>
                        )}
                        {course.sessions && (
                          <span className="flex items-center gap-1 text-slate-500 text-[13px]">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {course.sessions}
                          </span>
                        )}
                        {course.seats && (
                          <span className="flex items-center gap-1 text-slate-500 text-[13px]">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {course.seats}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-col gap-1.5 text-[12px] text-slate-500 border-t border-slate-200/80 pt-3">
                      {course.startDate && (
                        <span>
                          <span className="text-slate-400 mr-1">Starts:</span>
                          <span className="text-slate-700 font-medium">{course.startDate}</span>
                        </span>
                      )}
                      <span>
                        <span className="text-slate-400 mr-1">Duration:</span>
                        <span className="text-slate-700 font-medium">{course.totalWeeks} Weeks</span>
                      </span>
                      <span>
                        <span className="text-slate-400 mr-1">Mode:</span>
                        <span className="text-slate-700 font-medium">Live + Recorded</span>
                      </span>
                    </div>

                    {/* Enrollment message */}
                    {enrollMsg && (
                      <div
                        className={`rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${
                          enrollMsg.includes("enrolled")
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-800"
                        }`}
                      >
                        {enrollMsg.includes("enrolled") ? (
                          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : null}
                        {enrollMsg}
                      </div>
                    )}

                    {/* CTAs */}
                    <div className="flex flex-col gap-2.5 pt-1">
                      <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
                                   transition-all duration-250 disabled:opacity-60 text-white hover:brightness-110 active:scale-95 shadow-sm cursor-pointer"
                        style={{
                          background:
                            "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)",
                        }}
                      >
                        {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
                        {!enrolling && enrolled && <CheckCircle className="h-4 w-4" />}
                        {enrollBtnLabel}
                        {!enrolling && !enrolled && <ArrowRight className="h-4 w-4" />}
                      </button>
                      <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 active:scale-98 shadow-sm cursor-pointer">
                        <Download className="h-4 w-4" /> Download Syllabus
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── WHAT YOU'LL LEARN ── */}
        {whatYouLearn.length > 0 && (
          <section className="py-10 border-t border-slate-100 relative overflow-hidden" style={{ background: "#FFFFFF" }}>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 20% 50%, rgba(99,102,241,0.05) 0%, transparent 65%)",
              }}
              aria-hidden
            />
            <div className="relative container-x">
              <ScrollReveal animation="fade-up" duration={700}>
                <div className="text-center mb-10">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-3">
                    Curriculum Overview
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-850">
                    What You&apos;ll Learn
                  </h2>
                  <p className="mt-3 text-slate-500 max-w-xl mx-auto">
                    Practical real-world skills you can apply in your work
                    immediately.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {whatYouLearn.map((item, i) => (
                  <AnimateOnScroll key={i} delay={i * 100}>
                    <div
                      className="group h-full rounded-2xl border border-slate-200 p-6 cursor-default hover:border-blue-500/30 hover:-translate-y-1.5 transition-all duration-350 shadow-sm hover:shadow-md"
                      style={{
                        background:
                          "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
                      }}
                    >
                      <h3 className="font-semibold text-[15px] text-slate-855 mb-2 leading-snug group-hover:text-blue-600 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-slate-500 leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── PROGRAM STRUCTURE ── */}
        {weekData.length > 0 && (
          <section className="py-10 border-t border-slate-100 relative overflow-hidden" style={{ background: "#FAFAFA" }}>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(99,102,241,0.03) 0%, rgba(59,130,246,0.04) 50%, rgba(99,102,241,0.02) 100%)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 dot-grid opacity-[0.08]"
              aria-hidden
            />
            <div className="relative container-x">
              <ScrollReveal animation="fade-up" duration={700}>
                <div className="text-center mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-3">
                    Curriculum
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-850">
                    Program Structure
                  </h2>
                  <p className="mt-3 text-slate-500 max-w-xl mx-auto">
                    A structured week-by-week path — each milestone builds
                    directly on the last.
                  </p>
                </div>
              </ScrollReveal>
              <div className="max-w-3xl mx-auto space-y-3">
                {weekData.map((week, i) => (
                  <AnimateOnScroll key={week.id} delay={i * 80}>
                    <div
                      className="rounded-2xl border overflow-hidden transition-all duration-300"
                      style={{
                        borderColor:
                          openWeek === i
                            ? "rgba(37,99,235,0.25)"
                            : "rgba(226,232,240,1)",
                        background:
                          openWeek === i
                            ? "linear-gradient(145deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,1) 100%)"
                            : "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
                      }}
                    >
                      <button
                        onClick={() => setOpenWeek(openWeek === i ? null : i)}
                        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50/50 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[13px] font-bold">
                            {week.weekNumber}
                          </span>
                          <span className="font-semibold text-[15px] text-slate-800">
                            {week.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-[12px] text-slate-400 hidden sm:inline">
                            {week.modules.length} modules
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 text-slate-455 transition-transform duration-400 ${openWeek === i ? "rotate-180 text-blue-600" : ""}`}
                          />
                        </div>
                      </button>
                      <div
                        className="overflow-hidden transition-all duration-500"
                        style={{ maxHeight: openWeek === i ? "600px" : "0px" }}
                      >
                        <div className="px-6 pb-5 border-t border-slate-100 bg-slate-50/30">
                          <ul className="mt-4 space-y-3">
                            {week.modules.map((mod, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-3 text-[14px] text-slate-600 hover:text-slate-800 transition-colors duration-200"
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                                  {j + 1}
                                </span>
                                {mod}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── WHO THIS IS FOR ── */}
        {audience.length > 0 && (
          <section className="py-10 border-t border-slate-100 relative overflow-hidden" style={{ background: "#FFFFFF" }}>
            <div
              className="pointer-events-none absolute inset-0 line-grid opacity-5"
              aria-hidden
            />
            <div className="relative container-x">
              <ScrollReveal animation="fade-up" duration={700}>
                <div className="text-center mb-14">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-3">
                    Audience
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-850">
                    Who This Program Is For
                  </h2>
                  <p className="mt-3 text-slate-500 max-w-xl mx-auto">
                    Designed for anyone ready to thrive in an AI-powered world.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {audience.map((item, i) => (
                  <AnimateOnScroll key={i} delay={i * 100}>
                    <div
                      className="group h-full rounded-2xl border border-slate-200 p-6 cursor-default hover:border-blue-500/30 hover:-translate-y-1.5 transition-all duration-350 shadow-sm hover:shadow-md"
                      style={{
                        background:
                          "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
                      }}
                    >
                      <h3 className="font-semibold text-[15px] text-slate-850 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-slate-500 leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── ENROLL CTA ── */}
        <section className="py-10 border-t border-slate-100 relative overflow-hidden" style={{ background: "#FAFAFA" }}>
          <div className="container-x">
            <ScrollReveal animation="zoom-in" duration={800}>
              <div
                className="relative rounded-3xl overflow-hidden border border-blue-200/80 p-10 sm:p-16 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)",
                  boxShadow:
                    "0 10px 40px rgba(0, 128, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 60% 55% at 50% 55%, rgba(0,128,255,0.03) 0%, transparent 70%)",
                  }}
                />
                <div
                  className="absolute top-0 inset-x-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(59,130,246,0.3) 30%, rgba(37,99,235,0.4) 50%, rgba(59,130,246,0.3) 70%, transparent)",
                  }}
                />
                <p className="relative text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-3">
                  {enrolled
                    ? "Continue Learning"
                    : isFree
                      ? "100% Free"
                      : "Enroll Now"}
                </p>
                <h2 className="relative text-3xl sm:text-4xl font-bold mb-4 text-slate-900">
                  {enrolled
                    ? "You're enrolled — let's go!"
                    : "Ready to start your AI journey?"}
                </h2>
                <p className="relative text-slate-500 max-w-md mx-auto mb-8 text-[15px]">
                  {enrolled
                    ? "Access all your course materials, videos and resources below."
                    : "Join learners who are already building real skills with Avatar India."}
                </p>
                <div className="relative flex flex-wrap justify-center gap-3">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold
                               transition-colors disabled:opacity-60 text-white hover:brightness-110 active:scale-95 shadow-md cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)",
                    }}
                  >
                    {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
                    {enrolled
                      ? "Go to Course"
                      : isFree
                        ? "Enroll for Free"
                        : `Enroll Now — ₹${course.price.toLocaleString("en-IN")}`}
                    {!enrolling && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <Link href="/courses">
                    <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors duration-200 shadow-sm cursor-pointer">
                      View All Courses
                    </button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Sticky bottom bar — mobile only */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 flex gap-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <button
          onClick={handleEnroll}
          disabled={enrolling || (course.price > 0 && !enrolled)}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold
                     transition-all duration-250 disabled:opacity-60 text-white hover:brightness-110 active:scale-95 shadow-sm cursor-pointer"
          style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
        >
          {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
          {!enrolling && enrolled && <CheckCircle className="h-4 w-4" />}
          {enrollBtnLabel}
          {!enrolling && !enrolled && <ArrowRight className="h-4 w-4" />}
        </button>
        <button className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all duration-200 shadow-sm cursor-pointer shrink-0">
          <Download className="h-4 w-4" />
        </button>
      </div>

      <Footer />
    </>
  );
}
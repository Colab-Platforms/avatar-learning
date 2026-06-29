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
import { Badge, Button, ScrollReveal, AnimateOnScroll } from "@/components/ui";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { enrollCourse, type DBCourseDetail } from "@/lib/coursesApi";
import { useCourse } from "@/hooks/queries/useCourse";
import { useEnrollment } from "@/hooks/queries/useEnrollment";
import { useAppSelector } from "@/store/hooks";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCreateOrder } from "@/hooks/mutations/useCreateOrder";
import { useVerifyPayment } from "@/hooks/mutations/useVerifyPayment";

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

  const handlePaidEnroll = useCallback(async () => {
    if (!course || !user) return;
    if (!razorpayLoaded) {
      showMsg("Payment SDK is still loading. Please try again.", "error");
      return;
    }

    setEnrolling(true);
    showMsg("");

    try {
      const order = await createOrder(course.id);

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
  }, [course, user, razorpayLoaded, createOrder, verifyPayment, refetchEnrollment, id, router]);

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
        <main
          className="min-h-screen"
          style={{
            background:
              "linear-gradient(160deg, #060D1A 0%, #091220 25%, #060D1A 50%, #091525 75%, #060D1A 100%)",
          }}
        >
          <div className="h-[340px] sm:h-[440px] md:h-[520px] bg-ink-800 animate-pulse" />
          <div className="container-x pt-10 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl bg-ink-800 animate-pulse ${i === 0 ? "h-32" : "h-20"}`}
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
        className="min-h-screen text-white overflow-x-hidden"
        style={{
          background:
            "linear-gradient(160deg, #060D1A 0%, #091220 25%, #060D1A 50%, #091525 75%, #060D1A 100%)",
        }}
      >
        {/* ── BANNER ── */}
        <div className="relative w-full h-[340px] sm:h-[440px] md:h-[520px] overflow-hidden">
          {course.bannerImage ? (
            <Image
              src={course.bannerImage}
              alt={course.title}
              fill
              sizes="100vw"
              className="object-cover object-center scale-[1.04] transition-transform duration-[8000ms] ease-out"
              style={{ transformOrigin: "center 40%" }}
              priority
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,60,140,0.5) 0%, rgba(0,200,255,0.1) 100%)",
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-[#060D1A]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 70% at 55% 35%, rgba(0,128,255,0.22) 0%, transparent 65%)",
            }}
          />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#060D1A] to-transparent" />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 container-x">
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-[12px] mt-10 text-white/50 hover:text-white/80
                         transition-colors duration-200 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10"
            >
              ← All Courses
            </Link>
          </div>
        </div>

        {/* ── HERO INFO ── */}
        <section className="relative -mt-28 pb-20 overflow-hidden">
          <div
            className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(0,200,255,0.12) 0%, transparent 65%)",
              filter: "blur(60px)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-40 right-0 w-[500px] h-[400px] opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at right, rgba(0,80,200,0.5) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 dot-grid-dark opacity-35"
            aria-hidden
          />

          <div className="relative container-x pt-10">
            <div className="grid md:grid-cols-[1fr_380px] gap-14 items-start">
              {/* LEFT */}
              <div>
                <ScrollReveal animation="fade-up" delay={0} duration={700}>
                  <div
                    className="inline-flex items-center gap-2 rounded-full border border-brand-500/30
                                  bg-brand-500/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase
                                  tracking-widest text-brand-300 mb-5 cursor-default"
                  >
                    <Zap className="h-3 w-3" /> AI Learning Course
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={60} duration={700}>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {isFree && <Badge variant="free">FREE</Badge>}
                    {!isFree && (
                      <Badge variant="level-dark" className="text-brand-300">
                        ₹{course.price.toLocaleString("en-IN")}
                      </Badge>
                    )}
                    <Badge variant="level-light">{course.level}</Badge>
                    {course.certificate && (
                      <Badge
                        variant="level-dark"
                        className="flex items-center gap-1"
                      >
                        <BadgeCheck className="h-3 w-3 text-emerald-400" />{" "}
                        Certificate Included
                      </Badge>
                    )}
                    {enrolled && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30
                                       bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-400"
                      >
                        <CheckCircle className="h-3 w-3" /> Enrolled
                      </span>
                    )}
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={120} duration={800}>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-5">
                    {course.title}
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={180} duration={750}>
                  <p className="text-white/55 text-[16px] leading-relaxed max-w-xl mb-6">
                    {course.description}
                  </p>
                </ScrollReveal>

                {/* Rating row */}
                {(course.rating || course.sessions || course.seats) && (
                  <ScrollReveal animation="fade-up" delay={230} duration={700}>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm mb-6">
                      {course.rating && (
                        <span className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${s <= Math.round(course.rating!) ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
                            />
                          ))}
                          <span className="ml-1 font-semibold text-white">
                            {course.rating}
                          </span>
                          {course.reviews && (
                            <span className="text-white/40">
                              ({course.reviews})
                            </span>
                          )}
                        </span>
                      )}
                      {course.sessions && (
                        <span className="flex items-center gap-1.5 text-white/45">
                          <Clock className="h-4 w-4" />
                          {course.sessions}
                        </span>
                      )}
                      {course.seats && (
                        <span className="flex items-center gap-1.5 text-white/45">
                          <Users className="h-4 w-4" />
                          {course.seats}
                        </span>
                      )}
                    </div>
                  </ScrollReveal>
                )}

                {/* Meta row */}
                <ScrollReveal animation="fade-up" delay={280} duration={700}>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/45 border-t border-white/6 pt-5 mb-8">
                    {course.startDate && (
                      <span>
                        <span className="text-white/25 mr-1">Starts:</span>
                        <span className="text-white/65 font-medium">
                          {course.startDate}
                        </span>
                      </span>
                    )}
                    <span>
                      <span className="text-white/25 mr-1">Duration:</span>
                      <span className="text-white/65 font-medium">
                        {course.totalWeeks} Weeks
                      </span>
                    </span>
                    <span>
                      <span className="text-white/25 mr-1">Mode:</span>
                      <span className="text-white/65 font-medium">
                        Live + Recorded
                      </span>
                    </span>
                  </div>
                </ScrollReveal>

                {/* Enrollment message */}
                {enrollMsg && (
                  <ScrollReveal animation="fade-up" delay={0} duration={400}>
                    <div
                      className={`mb-4 rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${
                        msgType === "success"
                          ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-300"
                          : "border-red-500/25 bg-red-500/8 text-red-300"
                      }`}
                    >
                      {msgType === "success" && (
                        <CheckCircle className="h-4 w-4 shrink-0" />
                      )}
                      {enrollMsg}
                    </div>
                  </ScrollReveal>
                )}

                {/* CTAs */}
                <ScrollReveal animation="fade-up" delay={330} duration={700}>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
                                 transition-all duration-250 disabled:opacity-60
                                 bg-brand-500 text-ink-950 hover:bg-brand-400
                                 shadow-[0_4px_20px_rgba(0,200,255,0.3)]"
                    >
                      {enrolling && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {!enrolling && enrolled && (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {enrollBtnLabel}
                      {!enrolling && !enrolled && (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </button>
                    <Button variant="ghost-light" size="lg">
                      <Download className="h-4 w-4" /> Download Syllabus
                    </Button>
                  </div>
                </ScrollReveal>

                {/* Tool tags */}
                {course.tools?.length > 0 && (
                  <ScrollReveal animation="fade-up" delay={380} duration={700}>
                    <div className="flex flex-wrap gap-2">
                      {course.tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-[11px]
                                     font-medium text-white/40 hover:border-brand-500/35 hover:bg-brand-500/8
                                     hover:text-brand-300 transition-all duration-250 cursor-default"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </ScrollReveal>
                )}
              </div>

              {/* RIGHT — sticky card */}
              <ScrollReveal
                animation="fade-left"
                delay={200}
                duration={900}
                className="hidden md:block"
              >
                <div className="sticky top-24">
                  <div
                    className="relative aspect-4/3 rounded-2xl overflow-hidden border border-white/8
                                  group hover:border-brand-500/30 transition-all duration-500"
                    style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.55)" }}
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
                            "linear-gradient(135deg, rgba(0,60,140,0.5) 0%, rgba(0,200,255,0.1) 100%)",
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/65 via-transparent to-transparent" />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background:
                          "radial-gradient(ellipse 70% 60% at 50% 80%, rgba(0,200,255,0.08) 0%, transparent 70%)",
                      }}
                    />
                  </div>
                  {course._count.enrollments > 0 && (
                    <div
                      className="absolute -bottom-4 -left-4 rounded-xl border border-white/10
                                    bg-ink-800/90 backdrop-blur-sm px-4 py-3 shadow-lg
                                    hover:border-brand-500/25 transition-colors duration-300"
                    >
                      <p className="text-[11px] text-white/35 uppercase tracking-wider">
                        Students enrolled
                      </p>
                      <p className="text-2xl font-bold text-white mt-0.5">
                        {course._count.enrollments.toLocaleString("en-IN")}+
                      </p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── WHAT YOU'LL LEARN ── */}
        {whatYouLearn.length > 0 && (
          <section className="py-24 border-t border-white/5 relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 20% 50%, rgba(0,80,160,0.12) 0%, transparent 65%)",
              }}
              aria-hidden
            />
            <div className="relative container-x">
              <ScrollReveal animation="fade-up" duration={700}>
                <div className="text-center mb-14">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">
                    Curriculum Overview
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    What You&apos;ll Learn
                  </h2>
                  <p className="mt-3 text-white/40 max-w-xl mx-auto">
                    Practical real-world skills you can apply in your work
                    immediately.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {whatYouLearn.map((item, i) => (
                  <AnimateOnScroll key={i} delay={i * 100}>
                    <div
                      className="group h-full rounded-2xl border border-white/6 p-6 cursor-default hover:border-brand-500/30 hover:-translate-y-1.5 transition-all duration-350"
                      style={{
                        background:
                          "linear-gradient(145deg, rgba(13,23,39,0.85) 0%, rgba(9,18,32,0.95) 100%)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.30)",
                      }}
                    >
                      <h3 className="font-semibold text-[15px] text-white mb-2 leading-snug group-hover:text-brand-300 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-white/40 leading-relaxed">
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
          <section className="py-24 border-t border-white/5 relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(6,13,26,0) 0%, rgba(9,21,37,0.7) 50%, rgba(6,13,26,0) 100%)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 dot-grid-dark opacity-25"
              aria-hidden
            />
            <div className="relative container-x">
              <ScrollReveal animation="fade-up" duration={700}>
                <div className="text-center mb-14">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">
                    Curriculum
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    Program Structure
                  </h2>
                  <p className="mt-3 text-white/40 max-w-xl mx-auto">
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
                            ? "rgba(0,200,255,0.20)"
                            : "rgba(255,255,255,0.06)",
                        background:
                          openWeek === i
                            ? "linear-gradient(145deg, rgba(0,200,255,0.04) 0%, rgba(9,18,32,0.98) 100%)"
                            : "linear-gradient(145deg, rgba(13,23,39,0.85) 0%, rgba(9,18,32,0.95) 100%)",
                      }}
                    >
                      <button
                        onClick={() => setOpenWeek(openWeek === i ? null : i)}
                        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.02] transition-colors duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/12 text-brand-400 text-[13px] font-bold">
                            {week.weekNumber}
                          </span>
                          <span className="font-semibold text-[15px] text-white">
                            {week.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-[12px] text-white/30 hidden sm:inline">
                            {week.modules.length} modules
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 text-white/40 transition-transform duration-400 ${openWeek === i ? "rotate-180 text-brand-400" : ""}`}
                          />
                        </div>
                      </button>
                      <div
                        className="overflow-hidden transition-all duration-500"
                        style={{ maxHeight: openWeek === i ? "600px" : "0px" }}
                      >
                        <div className="px-6 pb-5 border-t border-white/5">
                          <ul className="mt-4 space-y-3">
                            {week.modules.map((mod, j) => (
                              <li
                                key={j}
                                className="flex items-start gap-3 text-[14px] text-white/55 hover:text-white/80 transition-colors duration-200"
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/8 text-brand-400 text-[10px] font-semibold">
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
          <section className="py-24 border-t border-white/5 relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 line-grid opacity-20"
              aria-hidden
            />
            <div className="relative container-x">
              <ScrollReveal animation="fade-up" duration={700}>
                <div className="text-center mb-14">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">
                    Audience
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    Who This Program Is For
                  </h2>
                  <p className="mt-3 text-white/40 max-w-xl mx-auto">
                    Designed for anyone ready to thrive in an AI-powered world.
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {audience.map((item, i) => (
                  <AnimateOnScroll key={i} delay={i * 100}>
                    <div
                      className="group h-full rounded-2xl border border-white/6 p-6 cursor-default hover:border-brand-500/30 hover:-translate-y-1.5 transition-all duration-350"
                      style={{
                        background:
                          "linear-gradient(145deg, rgba(13,23,39,0.85) 0%, rgba(9,18,32,0.95) 100%)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                      }}
                    >
                      <h3 className="font-semibold text-[15px] text-white mb-2 group-hover:text-brand-300 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-white/40 leading-relaxed">
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
        <section className="py-24 border-t border-white/5 relative overflow-hidden">
          <div className="container-x">
            <ScrollReveal animation="zoom-in" duration={800}>
              <div
                className="relative rounded-3xl overflow-hidden border border-brand-500/20 p-10 sm:p-16 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(9,21,37,0.97) 0%, rgba(6,13,26,0.99) 100%)",
                  boxShadow:
                    "0 0 100px rgba(0,200,255,0.07), inset 0 1px 0 rgba(0,200,255,0.10)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 60% 55% at 50% 55%, rgba(0,200,255,0.08) 0%, transparent 70%)",
                  }}
                />
                <div
                  className="absolute top-0 inset-x-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(0,200,255,0.4) 30%, rgba(0,128,255,0.5) 50%, rgba(0,200,255,0.4) 70%, transparent)",
                  }}
                />
                <p className="relative text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">
                  {enrolled
                    ? "Continue Learning"
                    : isFree
                      ? "100% Free"
                      : "Enrol Now"}
                </p>
                <h2 className="relative text-3xl sm:text-4xl font-bold mb-4">
                  {enrolled
                    ? "You're enrolled — let's go!"
                    : "Ready to start your AI journey?"}
                </h2>
                <p className="relative text-white/45 max-w-md mx-auto mb-8 text-[15px]">
                  {enrolled
                    ? "Access all your course materials, videos and resources below."
                    : "Join learners who are already building real skills with Avatar India."}
                </p>
                <div className="relative flex flex-wrap justify-center gap-3">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold
                               bg-brand-500 text-ink-950 hover:bg-brand-400 transition-colors disabled:opacity-60
                               shadow-[0_4px_20px_rgba(0,200,255,0.3)]"
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
                    <Button variant="ghost-light" size="lg">
                      View All Courses
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAdminBasicStudent } from "@/hooks/queries/useAdminBasicStudent";
import { UserAvatar } from "@/components/ui/UserAvatar";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function TierBadge({ tier }: { tier: "BASIC" | "BOTH" }) {
  return (
    <span
      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
        tier === "BOTH"
          ? "bg-amber-500/10 text-amber-400"
          : "bg-white/6 text-white/40"
      }`}
    >
      {tier === "BOTH" ? "Upgraded · Basic + D2H" : "Basic ₹499"}
    </span>
  );
}

export default function AdminBasicStudentProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { data, isLoading, isError, error } = useAdminBasicStudent(userId);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-6 w-40 rounded bg-ink-700/40 animate-pulse" />
        <div className="h-24 rounded-2xl bg-ink-700/40 animate-pulse" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-ink-700/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    const status = (
      error as { response?: { status?: number; data?: { message?: string } } }
    )?.response?.status;
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ??
      (status === 401 || status === 403
        ? "You are not authorized to view this page."
        : status === 404
          ? "Student not found."
          : "Failed to load student profile. Please try again.");

    return (
      <div className="p-8 space-y-4">
        <Link
          href="/admin/direct2hire/basic-enrollments"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80"
        >
          <ChevronLeft size={16} />
          Back to Basic Plan
        </Link>
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {message}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, courses } = data;
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Unnamed";

  return (
    <div className="p-8 space-y-6">
      <Link
        href="/admin/direct2hire/basic-enrollments"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Basic Plan
      </Link>

      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <UserAvatar
              profileImage={user.profileImage}
              firstName={user.firstName}
              lastName={user.lastName}
              email={user.email}
              size="lg"
              rounded="2xl"
              showSkeleton
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white">{fullName}</h1>
              <p className="text-sm text-white/40 mt-0.5">
                {user.email}
                {user.phoneNo && ` · ${user.phoneNo}`}
              </p>
            </div>
          </div>
          <p className="text-xs text-white/30 mt-3">
            Joined {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-ink-800 border border-white/6 rounded-2xl p-6">
          <p className="text-sm text-white/35">
            This student has not purchased any Basic plan course yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.courseId}
              className="bg-ink-800 border border-white/6 rounded-2xl p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white/90">
                    {course.courseTitle}
                  </h2>
                  <TierBadge tier={course.tier} />
                </div>
                <span className="text-xs text-white/40">
                  Enrolled {formatDate(course.enrolledAt)} · {course.progress}%
                  {course.isCompleted && " · Completed"}
                </span>
              </div>

              {course.payments.length === 0 ? (
                <p className="text-sm text-white/35">No payment record found.</p>
              ) : (
                <div className="space-y-3">
                  {course.payments.map((payment) => (
                    <div
                      key={payment.gatewayOrderId}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 rounded-xl border border-white/5 bg-white/[0.015] p-4"
                    >
                      <Field
                        label="Amount Paid"
                        value={`₹${(payment.amount / 100).toLocaleString("en-IN")}`}
                      />
                      <Field label="Product" value={payment.productType} />
                      <Field label="Provider" value={payment.provider} />
                      <Field
                        label="Transaction ID"
                        value={payment.gatewayPaymentId ?? undefined}
                      />
                      <Field
                        label="Paid On"
                        value={payment.paidAt ? formatDate(payment.paidAt) : undefined}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

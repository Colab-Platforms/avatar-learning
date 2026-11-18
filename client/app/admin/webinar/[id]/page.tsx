"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Video } from "lucide-react";
import { useAdminWebinarRegistration } from "@/hooks/queries/useAdminWebinarRegistration";

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

function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-ink-800 border border-white/6 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}
    >
      {title && <h2 className="text-sm font-semibold text-white/80 mb-4">{title}</h2>}
      {children}
    </div>
  );
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

const STATUS_CLASSES: Record<string, string> = {
  PAID: "bg-brand-500/10 text-brand-400",
  PENDING: "bg-white/5 text-white/30",
  FAILED: "bg-red-500/10 text-red-400",
  REFUNDED: "bg-red-500/10 text-red-400",
};

export default function AdminWebinarRegistrationPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, isError, error } = useAdminWebinarRegistration(id);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-6 w-40 rounded bg-ink-700/40 animate-pulse" />
        <div className="h-24 rounded-2xl bg-ink-700/40 animate-pulse" />
        <div className="h-40 rounded-2xl bg-ink-700/40 animate-pulse" />
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
          ? "Registration not found."
          : "Failed to load registration. Please try again.");

    return (
      <div className="p-8 space-y-4">
        <Link
          href="/admin/webinar"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80"
        >
          <ChevronLeft size={16} />
          Back to Webinar Registrations
        </Link>
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {message}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8 space-y-6">
      <Link
        href="/admin/webinar"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Webinar Registrations
      </Link>

      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
              <Video size={20} className="text-brand-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white">{data.name}</h1>
              <p className="text-sm text-white/40 mt-0.5">
                {data.email} &middot; {data.phoneNumber}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full w-fit ${
              STATUS_CLASSES[data.status] ?? "bg-white/5 text-white/30"
            }`}
          >
            {data.status}
          </span>
        </div>
        <p className="text-xs text-white/30 mt-3">
          Registered {formatDateTime(data.createdAt)}
        </p>
      </div>

      <Card title="Payment Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field
            label="Amount"
            value={`${data.currency === "INR" ? "₹" : data.currency + " "}${(
              data.amount / 100
            ).toLocaleString("en-IN")}`}
          />
          <Field label="Status" value={data.status} />
          <Field label="Paid On" value={formatDateTime(data.paidAt)} />
          <Field label="Razorpay Order ID" value={data.razorpayOrderId} />
          <Field label="Razorpay Payment ID" value={data.razorpayPaymentId} />
          <Field label="Razorpay Signature" value={data.razorpaySignature} />
        </div>
      </Card>

      <Card title="Contact Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Full Name" value={data.name} />
          <Field label="Email" value={data.email} />
          <Field label="Phone / WhatsApp" value={data.phoneNumber} />
        </div>
      </Card>
    </div>
  );
}

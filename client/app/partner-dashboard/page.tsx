"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Users,
  Copy,
  Check,
  Loader2,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAppSelector } from "@/store/hooks";
import {
  getMyPartner,
  getMyReferrals,
  requestClaim,
  type Partner,
  type PartnerReferral,
} from "@/lib/partnersApi";

/* ─── Commission model (mirrors backend partner.service.ts) ─────────────
   INDIVIDUAL: flat 10% credited instantly on every referral.
   INSTITUTE: bracket/milestone commission. Referrals 1–10 pay nothing
   individually. The referral that CROSSES INTO a new tier (#11, #26, #51,
   #101, #201, #501) pays a lump sum sized by the width of the tier just
   completed, at the new tier's rate — every other referral in between pays
   ₹0 on its own. Past #501 (no next threshold to wait for) it's flat ₹599
   per referral. */
const D2H_AMOUNT = 999;
const INSTITUTE_TIERS = [
  { min: 1,   max: 10,  rate: 0 },
  { min: 11,  max: 25,  rate: 20 },
  { min: 26,  max: 50,  rate: 25 },
  { min: 51,  max: 100, rate: 30 },
  { min: 101, max: 200, rate: 40 },
  { min: 201, max: 500, rate: 50 },
];
const UNCAPPED_MIN = 501;
const UNCAPPED_RATE = 60;

const milestoneAmount = (precedingWidth: number, rate: number) =>
  Math.round(precedingWidth * D2H_AMOUNT * (rate / 100));

const getRate = (credited: number, type: string) => {
  if (type === "INDIVIDUAL") return 10;
  if (credited >= UNCAPPED_MIN) return UNCAPPED_RATE;
  return INSTITUTE_TIERS.find((t) => credited >= t.min && credited <= t.max)?.rate ?? 0;
};

// Returns the partner's next lump-sum milestone: how many more referrals
// until it fires, and how big the bonus will be. null once past #500
// (flat per-referral crediting applies from there, no next milestone).
const getNextMilestone = (credited: number) => {
  if (credited >= UNCAPPED_MIN) return null;
  const idx = INSTITUTE_TIERS.findIndex((t) => credited >= t.min && credited <= t.max);
  if (idx === -1) return null;
  const currentTier = INSTITUTE_TIERS[idx];
  const nextTier =
    idx < INSTITUTE_TIERS.length - 1
      ? INSTITUTE_TIERS[idx + 1]
      : { min: UNCAPPED_MIN, max: Infinity, rate: UNCAPPED_RATE };
  const precedingWidth = currentTier.max - currentTier.min + 1;
  return {
    atCount: nextTier.min,
    remaining: nextTier.min - credited,
    rate: nextTier.rate,
    amount: milestoneAmount(precedingWidth, nextTier.rate),
  };
};

/* ─── FAQ data ───────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "How are referral bonuses calculated?",
    a: "Individual partners earn a flat 10% on every referral, credited instantly. Institute partners earn milestone bonuses instead — referrals 1–10 don't pay individually, then hitting referral #11, #26, #51, #101, #201, or #501 each unlocks one lump-sum bonus covering that whole range. Referrals in between pay ₹0 on their own. Past referral #500, it switches to a flat ₹599 per referral.",
  },
  {
    q: "When can I request a withdrawal?",
    a: "You can request a withdrawal anytime your wallet balance is above ₹0. Our team processes payouts manually and will contact you on the email registered with your partner profile.",
  },
  {
    q: "What happens if a referred student drops out?",
    a: "Commission is only credited once a student completes payment for the Direct2Hire package. If they don't pay, no commission is credited to your wallet.",
  },
  {
    q: "How will I know when my referral converts?",
    a: "A referral only appears in your list once the student's payment is confirmed and credited — you'll see the commission amount and your wallet updates immediately.",
  },
];

/* ─── helpers ────────────────────────────────────────────────────────── */
function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-3",
        accent
          ? "border-brand-200 bg-brand-50"
          : "border-border bg-white",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-subtle">
          {label}
        </span>
        <span
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            accent ? "bg-brand-100 text-brand-600" : "bg-surface-alt text-text-subtle",
          )}
        >
          {icon}
        </span>
      </div>
      <p className={cn("text-3xl font-bold", accent ? "text-brand-700" : "text-text")}>
        {value}
      </p>
      {sub && <p className="text-[12px] text-text-subtle">{sub}</p>}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="w-full text-left rounded-xl border border-border bg-white px-5 py-4
                 hover:border-brand-200 hover:bg-brand-50/40 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] font-medium text-text">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-text-subtle shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-subtle shrink-0" />
        )}
      </div>
      {open && (
        <p className="mt-3 text-[13px] text-text-muted leading-relaxed border-t border-border pt-3">
          {a}
        </p>
      )}
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAppSelector((s) => s.auth);

  const [partner,   setPartner]   = useState<Partner | null | undefined>(undefined);
  const [referrals, setReferrals] = useState<PartnerReferral[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [copied,    setCopied]    = useState(false);
  const [claiming,  setClaiming]  = useState(false);
  const [claimMsg,  setClaimMsg]  = useState<{ ok: boolean; text: string } | null>(null);

  const PAGE_SIZE = 10;

  /* auth guard */
  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
  }, [hasHydrated, user, router]);

  /* fetch partner */
  useEffect(() => {
    getMyPartner().then(setPartner).catch(() => setPartner(null));
  }, []);

  /* fetch referrals when approved */
  useEffect(() => {
    if (partner?.status !== "APPROVED") return;
    getMyReferrals(page, PAGE_SIZE)
      .then((r) => {
        setReferrals(r.data);
        setTotal(r.totalRecords ?? r.data.length);
      })
      .catch(() => {});
  }, [partner, page]);

  if (!hasHydrated || !user || partner === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </main>
      </div>
    );
  }

  /* ── Not a partner yet ── */
  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm px-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto">
              <Handshake className="h-8 w-8 text-brand-500" />
            </div>
            <h1 className="text-xl font-semibold text-text">You haven&apos;t applied yet</h1>
            <p className="text-[14px] text-text-muted">
              Join the Direct2Hire Partner Programme to get your referral code and start earning.
            </p>
            <Link
              href="/partners"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white px-5 py-2.5 rounded-xl"
              style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
            >
              Apply Now <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Pending / Rejected ── */
  if (partner.status !== "APPROVED") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm px-4">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
              <Handshake className="h-8 w-8 text-amber-500" />
            </div>
            {partner.status === "PENDING" ? (
              <>
                <h1 className="text-xl font-semibold text-text">Application under review</h1>
                <p className="text-[14px] text-text-muted">
                  We&apos;re reviewing your partner application. You&apos;ll get your referral link once it&apos;s approved — usually within 48 hours.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-text">Application not approved</h1>
                <p className="text-[14px] text-text-muted">
                  Your last application wasn&apos;t approved. You&apos;re welcome to apply again with updated details.
                </p>
                {partner.reviewNote && (
                  <p className="text-[13px] text-text-muted bg-surface-alt border border-border rounded-lg px-4 py-2.5 text-left">
                    <span className="font-semibold text-text">Reason: </span>
                    {partner.reviewNote}
                  </p>
                )}
                <Link
                  href="/partners"
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-white px-5 py-2.5 rounded-xl"
                  style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
                >
                  Apply Again <ArrowUpRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Approved ── */
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${partner.referralCode}`
      : `https://avatarindia.com/register?ref=${partner.referralCode}`;

  const creditedReferrals = referrals.filter((r) => r.creditedAt);
  const creditedCount     = creditedReferrals.length;
  const totalEarnings     = referrals.reduce((s, r) => s + r.commissionEarned, 0);
  const thisMonthEarnings = referrals
    .filter((r) => r.creditedAt && new Date(r.creditedAt).getMonth() === new Date().getMonth())
    .reduce((s, r) => s + r.commissionEarned, 0);
  const thisMonthCount = referrals.filter(
    (r) => new Date(r.createdAt).getMonth() === new Date().getMonth(),
  ).length;

  const currentRate = getRate(creditedCount, partner.type);
  const nextMilestone = partner.type === "INSTITUTE" ? getNextMilestone(creditedCount) : null;
  const conversionPct =
    total > 0 ? Math.round((creditedCount / total) * 100) : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = async () => {
    if (partner.walletBalance <= 0) return;
    setClaiming(true);
    setClaimMsg(null);
    try {
      await requestClaim();
      setClaimMsg({
        ok: true,
        text: "Claim requested — our team will reach out to process your payout.",
      });
      setPartner((p) => (p ? { ...p, walletBalance: 0 } : p));
    } catch (err: any) {
      setClaimMsg({
        ok: false,
        text: err?.response?.data?.message ?? "Something went wrong. Please try again.",
      });
    } finally {
      setClaiming(false);
    }
  };

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const orgName     = partner.organizationName ?? partner.contactPerson ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9FC]">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container-x max-w-6xl mx-auto space-y-8">

          {/* ── Page header ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest
                              text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full">
                Direct2Hire Partner Programme
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text tracking-tight">Partner Dashboard</h1>
              <p className="text-[14px] text-text-muted">
                Welcome back, {user.firstName ?? "Partner"}! Here&apos;s your partnership performance at a glance.
              </p>
            </div>
            <Link
              href="/profile"
              className="self-start inline-flex items-center gap-2 text-[13px] font-medium text-text-muted
                         border border-border bg-white rounded-xl px-4 py-2.5
                         hover:border-brand-300 hover:text-brand-600 transition-all duration-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Main Profile
            </Link>
          </div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Profile card */}
            <div className="rounded-2xl border border-border bg-white p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-text-subtle">
                  Your Profile
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600
                                 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  <Check className="h-3 w-3" /> Verified
                </span>
              </div>

              {/* avatar */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
                >
                  {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-semibold text-text">{displayName}</p>
                  {orgName && (
                    <p className="text-[13px] text-text-muted mt-0.5">{orgName}</p>
                  )}
                  <span className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-widest
                                   text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">
                    {partner.type.charAt(0) + partner.type.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-border text-[13px]">
                <div className="flex justify-between py-2.5">
                  <span className="text-text-subtle">Email</span>
                  <span className="text-text font-medium truncate max-w-[160px]">{partner.email}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-text-subtle">Phone</span>
                  <span className="text-text font-medium">{partner.phone}</span>
                </div>
                {user.state && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-text-subtle">Location</span>
                    <span className="text-text font-medium">{user.state}</span>
                  </div>
                )}
                <div className="flex justify-between py-2.5">
                  <span className="text-text-subtle">Current tier</span>
                  <span className="text-brand-600 font-semibold">{currentRate}%</span>
                </div>
              </div>

              {partner.type === "INDIVIDUAL" ? (
                <div className="rounded-xl bg-surface-alt border border-border px-4 py-3 text-[12px] text-text-muted">
                  <span className="font-medium text-text">Flat rate: 10%</span>
                  {" "}on every referral, credited instantly
                </div>
              ) : creditedCount >= UNCAPPED_MIN ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-[12px] text-emerald-700 font-medium">
                  🎉 Past referral #500 — earning ₹{milestoneAmount(1, UNCAPPED_RATE)} per referral from here
                </div>
              ) : nextMilestone ? (
                <div className="rounded-xl bg-surface-alt border border-border px-4 py-3 text-[12px] text-text-muted">
                  <span className="font-medium text-text">
                    {nextMilestone.remaining} more referral{nextMilestone.remaining === 1 ? "" : "s"}
                  </span>
                  {" "}unlocks a{" "}
                  <span className="font-medium text-brand-600">{formatCurrency(nextMilestone.amount)}</span>
                  {" "}bonus at referral #{nextMilestone.atCount}
                </div>
              ) : null}

              <Link
                href="/profile"
                className="w-full flex items-center justify-center gap-2 text-[13px] font-medium
                           border border-border rounded-xl px-4 py-2.5 text-text-muted
                           hover:border-brand-300 hover:text-brand-600 transition-all duration-200"
              >
                Edit Profile
              </Link>
            </div>

            {/* Centre + Right: referral code + wallet */}
            <div className="lg:col-span-2 space-y-5">

              {/* Referral code card */}
              <div className="rounded-2xl border border-border bg-white p-6 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-subtle">
                    Your Unique Referral Code
                  </p>
                  <p className="text-[18px] font-semibold text-text mt-0.5">Share this code with students</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt px-4 py-3">
                  <span className="flex-1 min-w-0 truncate text-[13px] text-text-muted font-mono">
                    {referralLink}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px]
                               font-semibold text-white transition-all duration-200"
                    style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <StatCard
                  label="Successful Enrollments"
                  value={String(creditedCount)}
                  sub={`+${thisMonthCount} this month · ${conversionPct}% of total referrals converted`}
                  icon={<Users className="h-4 w-4" />}
                />
                <StatCard
                  label="Total Earnings"
                  value={formatCurrency(totalEarnings)}
                  sub={`+${formatCurrency(thisMonthEarnings)} this month · Lifetime earnings across all referrals`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              </div>

              {/* Wallet card */}
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-[12px] font-medium text-white/70">Available for Withdrawal</span>
                </div>
                <div>
                  <p className="text-[36px] font-bold text-white leading-none">
                    {formatCurrency(partner.walletBalance)}
                  </p>
                  <p className="text-[12px] text-white/60 mt-1.5">Min. withdrawal: ₹1</p>
                </div>

                {claimMsg && (
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3 text-[13px] font-medium",
                      claimMsg.ok
                        ? "bg-emerald-500/20 text-emerald-100"
                        : "bg-red-500/20 text-red-100",
                    )}
                  >
                    {claimMsg.text}
                  </div>
                )}

                <button
                  onClick={handleClaim}
                  disabled={claiming || partner.walletBalance <= 0}
                  className="w-full flex items-center justify-center gap-2 bg-white rounded-xl
                             px-5 py-3 text-[14px] font-semibold text-brand-700
                             hover:bg-white/90 active:scale-95 transition-all duration-200
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {claiming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  {claiming ? "Requesting…" : `Request Withdrawal`}
                </button>
                <p className="text-center text-[12px] text-white/50">
                  Next payout date: 5th of next month
                </p>
              </div>

            </div>
          </div>

          {/* ── FAQ ── */}
          <div className="space-y-4">
            <h2 className="text-[18px] font-semibold text-text">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

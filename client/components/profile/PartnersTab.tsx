"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Handshake, Loader2, ArrowUpRight, Wallet, Users } from "lucide-react";
import { TabPanel, PanelHeader } from "./shared";
import { getMyPartner, type Partner } from "@/lib/partnersApi";

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  PENDING: {
    title: "Application under review",
    body: "We're reviewing your partner application. You'll get your referral link once it's approved.",
  },
  REJECTED: {
    title: "Application not approved",
    body: "Your last application wasn't approved. You're welcome to apply again with updated details.",
  },
};

export function PartnersTab() {
  const [partner, setPartner] = useState<Partner | null | undefined>(undefined);

  useEffect(() => {
    getMyPartner().then(setPartner).catch(() => setPartner(null));
  }, []);

  return (
    <TabPanel>
      <PanelHeader icon={<Handshake className="h-3.5 w-3.5 text-brand-600" />} title="Partners" />

      {partner === undefined ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-text-subtle" />
        </div>
      ) : !partner ? (
        <div className="py-16 text-center px-4">
          <Handshake className="h-10 w-10 text-text-subtle mx-auto mb-3" />
          <p className="text-[14px] text-text-muted mb-1">You haven&apos;t applied for partnership yet.</p>
          <Link href="/partners" className="mt-2 inline-block text-[13px] text-brand-600 hover:text-brand-700 transition-colors">
            Apply for Partnership →
          </Link>
        </div>
      ) : partner.status !== "APPROVED" ? (
        <div className="py-14 text-center px-6">
          <p className="text-[15px] font-semibold text-text mb-1.5">{STATUS_COPY[partner.status].title}</p>
          <p className="text-[13px] text-text-subtle max-w-sm mx-auto leading-relaxed">
            {STATUS_COPY[partner.status].body}
          </p>
          {partner.status === "REJECTED" && partner.reviewNote && (
            <p className="text-[13px] text-text-muted bg-surface-alt border border-border rounded-lg px-4 py-2.5 max-w-sm mx-auto text-left">
              <span className="font-semibold text-text">Reason: </span>
              {partner.reviewNote}
            </p>
          )}
          {partner.status === "REJECTED" && (
            <Link href="/partners" className="mt-4 inline-block text-[13px] text-brand-600 hover:text-brand-700 transition-colors">
              Apply Again →
            </Link>
          )}
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-6 text-text-subtle">
              <div className="flex items-center gap-1.5 text-[13px]">
                <Users className="h-4 w-4" />
                Referral code <span className="font-mono font-bold text-text">{partner.referralCode}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px]">
                <Wallet className="h-4 w-4" />
                Wallet <span className="font-bold text-text">₹{partner.walletBalance.toLocaleString("en-IN")}</span>
              </div>
            </div>
            <p className="text-[13px] text-text-subtle">
              Your referral link, earnings, and payout history live on the full Partner Dashboard.
            </p>
            <Link
              href="/partner-dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white
                         hover:brightness-110 active:scale-[0.98] transition-all duration-200"
              style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
            >
              Open Partner Dashboard <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </TabPanel>
  );
}

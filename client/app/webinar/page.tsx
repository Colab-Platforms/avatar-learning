"use client";

import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import HeaderBanner from "./_components/HeaderBanner";
import HeroSection from "./_components/HeroSection";
import AiGapSection from "./_components/AiGapSection";
import AgendaSection from "./_components/AgendaSection";
import NoTheorySection from "./_components/NoTheorySection";
import HandsOnSection from "./_components/HandsOnSection";
import WalkAwaySection from "./_components/WalkAwaySection";
import CertificateSection from "./_components/CertificateSection";
import PricingSection from "./_components/PricingSection";
import SuccessStories from "./_components/SuccessStories";
import FAQSection from "./_components/FAQSection";
import FooterCtaSection from "./_components/FooterCtaSection";
import StickyBottomBar from "./_components/StickyBottomBar";
import { Navbar } from "@/components/layout";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export default function WebinarPage() {
  return (
    <div
      className={`${plusJakarta.className} min-h-screen bg-white text-gray-900 selection:bg-blue-600/10 selection:text-blue-900`}
    >
      {/* 1. Header Banner */}
      <HeaderBanner />

      {/* 2. Navigation bar */}
      <Navbar />

      {/* 3. Hero Section (Includes Copy, detail badges, image, and desktop/mobile form) */}
      <HeroSection />

      {/* 4. AI Gap Section ("Why Now") */}
      <AiGapSection />

      {/* 5. Agenda Section ("Exactly what we'll cover") */}
      <AgendaSection />

      {/* 6. No Theory Section ("You'll watch it built live") */}
      <NoTheorySection />

      {/* 7. Hands-on Section ("Real tools opened live") */}
      <HandsOnSection />

      {/* 8. Walk Away Section ("Walk out able to do this" & "Who it's for") */}
      <WalkAwaySection />

      {/* 9. Certificate & Instructor Section */}
      <CertificateSection />

      {/* 11. Pricing Section ("₹3000+ of training. Yours for ₹7") */}
      <PricingSection />

      {/* 12. Success Stories Testimonials */}
      <SuccessStories />

      {/* 13. FAQ Accordion & Commitment Banner */}
      <FAQSection />

      {/* 14. Footer CTA & Copyright statement */}
      <FooterCtaSection />

      {/* 15. Sticky scroll-triggered registration bottom bar */}
      <StickyBottomBar />
    </div>
  );
}

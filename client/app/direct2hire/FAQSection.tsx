"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle, ArrowRight, HelpCircle } from "lucide-react";
import { ScrollReveal, ShinyText } from "@/components/ui";
import { cn } from "@/lib/utils";

const WHATSAPP_NUMBER = "918976830780";
const WHATSAPP_MESSAGE =
  "Hi! I'd like to know more about the Direct2Hire program.";

const FAQ_DATA = [
  {
    question: "What's the actual difference between the ₹499 and ₹4,999 plans?",
    answer:
      "₹499 gives you one AI course for a week. Time to try a skill and find out if it works for you. ₹4,999 Is the 120-day journey: an assessment helps you choose your path then you get an internship and help with getting a job along with the learning. Imagine ₹499 as a test, ₹4,999, as the career path.",
  },
  {
    question: "Can I upgrade from Practitioner to Career+ later?",
    answer:
      "Yes. Many students start with the ₹499 course to get comfortable. After they have finished the ₹499 course they move into Career+ when they have decided which AI track to pursue. The ₹499 course still counts toward their learning either way.",
  },
  {
    question: "Do I need to pick a plan before I know which AI track suits me?",
    answer:
      "No. If you are unsure Career+ starts with an assessment and one‑on‑one counseling that works out your path, for you before any learning begins. You do not need to know your track to enroll.",
  },
  {
    question: "How is this different from free advice online?",
    answer:
      "Free content is often generic. Doesn't take you into account. Direct2Hire begins with an assessment of your background and your career goals. It connects you with a mentor who can guide you. It supports your learning with an internship and job placement help. This is more than information. It's a structured path, to getting a job.",
  },
  {
    question: "Is this only for final-year students?",
    answer:
      "No, not all. Direct2Hire helps students of any year recent graduates and early professionals who wish to switch into AI roles. Direct2Hire’s assessment tailors the recommended track to match the starting point of each person.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "If you're not happy, with your experience let us know within 7 days of signing up. We'll handle a refund according to our policy. It's simple. Just send your enrollment details to support. No long conversations needed.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <section className="py-13 sm:py-16 bg-white border-t border-border">
      <div className="container-x">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* left */}
          <div className="lg:col-span-4">
            <ScrollReveal animation="fade-up">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                  <ShinyText
                    text="Frequently Asked Questions"
                    color="#1d4ed8"
                    shineColor="#93c5fd"
                    speed={2.5}
                  />
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text">
                Got questions?{" "}
                <span className="text-blue-600">
                  We&apos;ve got you covered.
                </span>
              </h2>

              <div className="mt-8 rounded-2xl border border-border bg-white p-5 sm:p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <MessageCircle className="h-4.5 w-4.5" />
                </span>
                <p className="mt-4 font-bold text-[15px] text-text">
                  Still have questions?
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
                  We&apos;re here to help — reach out to our team and we&apos;ll
                  help you out.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[12.5px] font-semibold text-text hover:bg-surface-alt transition-colors"
                >
                  Contact Support
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* right */}
          <div className="lg:col-span-8">
            <div className="space-y-3">
              {FAQ_DATA.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <ScrollReveal
                    key={faq.question}
                    animation="fade-up"
                    delay={idx * 30}
                  >
                    <div
                      className={cn(
                        "rounded-2xl border overflow-hidden transition-colors",
                        isOpen
                          ? "border-brand-200 bg-brand-50/40"
                          : "border-border bg-white",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <span className="font-semibold text-[14px] sm:text-[15px] text-text">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-text-subtle transition-transform duration-200",
                            isOpen && "rotate-180 text-brand-600",
                          )}
                        />
                      </button>

                      <div
                        className={cn(
                          "grid transition-all duration-300 ease-in-out",
                          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="overflow-hidden">
                          <p className="px-5 sm:px-6 pb-4 sm:pb-5 text-[13px] sm:text-[13.5px] leading-relaxed text-text-muted">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import React, { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { ShinyText } from "@/components/ui";

const faqData = [
  {
    question: "Do I need any AI experience?",
    answer: "No prior AI knowledge or coding experience is required. This live online workshop is designed from the ground up for absolute beginners.",
  },
  {
    question: "Is it really just ₹7?",
    answer: "Yes, it is exactly ₹7. This is a nominal fee charged simply to confirm your seat, filter out casual registrants, and ensure commitment so slots remain available for serious learners.",
  },
  {
    question: "Will there be a recording?",
    answer: "This is a live, interactive workshop where we build real-world prompts together. To receive the certificate and bonus resources, you must attend live.",
  },
  {
    question: "What happens after I register?",
    answer: "You will receive an instant confirmation message on WhatsApp and Email with the joining links and next steps.",
  },
  {
    question: "Do I get a certificate?",
    answer: "Yes, you will get an official Certificate of Participation from Avatar India, which you can easily add to your LinkedIn or resume.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-white py-16 sm:py-20 border-b border-gray-100">
      {/* Outer container spanning the full page width matching other cards (max-w-7xl) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        {/* Shield commitment badge box */}
        <div className="bg-[#EBF9F1] border border-[#D1F2DC] rounded-[24px] p-6 flex items-center gap-6 text-left w-full">
          <img
            src="/webinar/shield.png"
            alt="Commitment Shield"
            className="w-[42px] h-[48px] object-contain shrink-0"
          />
          <div>
            <h4 className="font-extrabold text-[#065F46] text-[15px] sm:text-base mb-1 leading-snug">
              Just ₹7 to hold your seat
            </h4>
            <p className="text-[#047857] text-[11px] sm:text-[13px] leading-relaxed font-medium">
              The nominal fee keeps no-shows out so serious learners get a spot. Show up live and everything &mdash; the session, the certificate and all four bonuses &mdash; is yours to keep.
            </p>
          </div>
        </div>
      </div>

      {/* Inner container for the FAQ Accordion (max-w-3xl for optimal readability) */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-white/80 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
            <ShinyText text="Questions" color="#1d4ed8" shineColor="#93c5fd" speed={2.5} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B132B] mt-3 tracking-tight">
            Questions, answered.
          </h2>
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-4">
          {faqData.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-[#E2E8F0] rounded-[16px] overflow-hidden bg-[#F4F6F9] hover:bg-[#EDF0F5] hover:border-[#CBD5E1] transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 focus:outline-none cursor-pointer"
                >
                  <span className="font-bold text-[#0B132B] text-[15px] sm:text-[17px] leading-snug">
                    {faq.question}
                  </span>
                  <span className="shrink-0 text-[#1E6BFA] transition-colors">
                    {isOpen ? (
                      <Minus className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Plus className="w-4 h-4 stroke-[3]" />
                    )}
                  </span>
                </button>

                {/* Animated expandable content */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[300px] border-t border-[#E2E8F0]" : "max-h-0"
                  }`}
                >
                  <div className="px-6 py-5 text-slate-600 text-xs sm:text-sm leading-relaxed bg-[#F4F6F9]">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


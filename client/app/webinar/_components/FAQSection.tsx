"use client";

import React, { useState } from "react";
import { ShieldCheck, Plus, Minus } from "lucide-react";

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
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Shield commitment badge box */}
        <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-5 mb-12 flex gap-4 text-left">
          <div className="w-10 h-10 bg-green-150 border border-green-200 rounded-xl flex items-center justify-center text-green-600 shrink-0 shadow-inner">
            <ShieldCheck className="w-5 h-5 fill-green-600/10 stroke-[2]" />
          </div>
          <div>
            <h4 className="font-extrabold text-green-900 text-sm sm:text-base mb-1">
              Just ₹7 to hold your seat
            </h4>
            <p className="text-green-700 text-xs sm:text-sm leading-relaxed font-medium">
              The nominal fee keeps no-shows out so serious learners get a spot. Show up live and everything &mdash; the session, the certificate and all four bonuses &mdash; is yours to keep.
            </p>
          </div>
        </div>

        {/* Section Header */}
        <div className="mb-8 text-left">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1E6BFA]">
            &sect; QUESTIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            Questions, <span className="text-gray-400 font-medium italic">answered.</span>
          </h2>
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-3.5">
          {faqData.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-gray-150 rounded-2xl overflow-hidden bg-white hover:border-gray-300 transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4.5 text-left flex justify-between items-center gap-4 focus:outline-none cursor-pointer"
                >
                  <span className="font-extrabold text-gray-900 text-sm sm:text-base leading-snug">
                    {faq.question}
                  </span>
                  <span className="shrink-0 text-gray-500 hover:text-gray-900 transition-colors">
                    {isOpen ? <Minus className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                  </span>
                </button>

                {/* Animated expandable content */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-40 border-t border-gray-100" : "max-h-0"
                  }`}
                >
                  <div className="px-6 py-4 text-gray-600 text-xs sm:text-sm leading-relaxed">
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { ScrollReveal, ShinyText } from "@/components/ui";
import { cn } from "@/lib/utils";
import { TestimonialCard } from "./TestimonialCard";
import { TESTIMONIALS } from "./testimonials.data";

const SWIPE_THRESHOLD = 48;
const SWIPE_VELOCITY = 400;

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoOpenIndex, setVideoOpenIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const total = TESTIMONIALS.length;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      setVideoOpenIndex(null);
      setActiveIndex((index + total) % total);
    },
    [total],
  );

  const goPrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  const goNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    },
    [goNext, goPrev],
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!isMobile) return;

    const { offset, velocity } = info;
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
      goNext();
    } else if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
      goPrev();
    }
  };

  const activeTestimonial = TESTIMONIALS[activeIndex];

  return (
    <section
      className="relative bg-white py-12 sm:py-16 md:py-20 overflow-hidden"
      aria-label="Learner testimonials"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(42,120,204,0.06) 0%, transparent 65%)",
          }}
        />
      </div>

      <div className="container-x relative z-10">
        <ScrollReveal animation="fade-up">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-4">
            <Quote className="h-3.5 w-3.5 text-blue-600" />
            <ShinyText
              text="Success Stories"
              color="#1d4ed8"
              shineColor="#93c5fd"
              speed={2.5}
            />
          </div>
          <h2 className="h-display text-text max-w-3xl">
            What Our Learners <span className="text-gradient-brand">Say</span>
          </h2>
          <p className="mt-4 max-w-2xl text-text-muted text-[15px] sm:text-base leading-relaxed">
            Real stories from learners who transformed their careers with Avatar
            India
          </p>
        </ScrollReveal>

        <div className="mt-10 sm:mt-12 md:mt-14">
          <div
            className="relative flex min-h-[640px] flex-col sm:min-h-[680px] lg:min-h-[420px] lg:block"
            role="region"
            aria-roledescription="carousel"
            aria-label="Testimonial carousel"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {/* Navigation arrows */}
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-0 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white p-3 text-text shadow-md transition-all duration-200 hover:border-brand-300 hover:text-brand-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 lg:flex"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-0 top-1/2 z-20 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-text p-3 text-white shadow-md transition-all duration-200 hover:bg-brand-700 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 lg:flex"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <motion.div
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={handleDragEnd}
              className="touch-pan-y flex-1"
            >
              <AnimatePresence mode="wait">
                <TestimonialCard
                  key={activeTestimonial.id}
                  testimonial={activeTestimonial}
                  isActive
                  isVideoOpen={videoOpenIndex === activeIndex}
                  onVideoOpen={() => setVideoOpenIndex(activeIndex)}
                  onVideoClose={() => setVideoOpenIndex(null)}
                  activeIndex={activeIndex}
                  total={total}
                  onDotClick={goToSlide}
                  className="mx-0 lg:mx-6"
                />
              </AnimatePresence>
            </motion.div>

            {/* Mobile arrow controls — pinned to bottom of stable-height track */}
            <div className="mt-auto flex shrink-0 items-center justify-center gap-3 pt-5 lg:hidden">
              <button
                type="button"
                onClick={goPrev}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-text-muted shadow-sm transition-all duration-200 hover:border-brand-300 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                )}
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full bg-text text-white shadow-sm transition-all duration-200 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                )}
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

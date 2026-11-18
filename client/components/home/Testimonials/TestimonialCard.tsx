"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { TestimonialVideo } from "./TestimonialVideo";
import type { Testimonial } from "./testimonials.data";
import { cn } from "@/lib/utils";
import PretextAnimatedHeight from "@/components/counselling/PretextAnimatedHeight";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 15,
    },
  },
} as const;

interface TestimonialCardProps {
  testimonial: Testimonial;
  isActive: boolean;
  isVideoOpen: boolean;
  onVideoOpen: () => void;
  onVideoClose: () => void;
  activeIndex: number;
  total: number;
  onDotClick: (index: number) => void;
  className?: string;
}

export function TestimonialCard({
  testimonial,
  isActive,
  isVideoOpen,
  onVideoOpen,
  onVideoClose,
  activeIndex,
  total,
  onDotClick,
  className,
}: TestimonialCardProps) {
  if (!isActive) return null;

  return (
    <motion.article
      key={testimonial.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "rounded-3xl border border-border/70 bg-surface-alt shadow-sm min-h-[560px] sm:min-h-[600px] lg:min-h-[380px]",
        className,
      )}
      aria-roledescription="slide"
      aria-label={`Testimonial ${activeIndex + 1} of ${total}`}
    >
      <div className="flex h-full min-h-[inherit] flex-col lg:flex-row lg:items-stretch">
        {/* Mobile / tablet: video first */}
        <div className="order-1 shrink-0 p-4 pb-0 sm:p-6 sm:pb-0 lg:order-2 lg:flex lg:w-[55%] lg:items-center lg:p-8 lg:pl-4">
          <TestimonialVideo
            thumbnail={testimonial.thumbnail}
            videoUrl={testimonial.videoUrl}
            name={testimonial.name}
            role={testimonial.role}
            isActive={isActive}
            isVideoOpen={isVideoOpen}
            onVideoOpen={onVideoOpen}
            onVideoClose={onVideoClose}
            className="w-full"
          />
        </div>

        {/* Content */}
        <div className="order-2 flex min-h-0 flex-1 flex-col justify-between p-6 pt-5 sm:p-8 sm:pt-6 lg:order-1 lg:w-[45%] lg:py-10 lg:pl-10 lg:pr-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4 sm:space-y-5"
          >
            {/* Pretext / Intro label */}
            {/* <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 text-xs font-bold tracking-wider text-brand-600 uppercase"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Quote className="h-2.5 w-2.5 fill-brand-600/10 text-brand-600" />
              </span>
              <span>Success Story</span>
            </motion.div> */}

            {/* The Quote */}
            <motion.blockquote
              variants={itemVariants}
              className="min-h-[7.5rem] sm:min-h-[8.5rem] lg:min-h-[9.5rem] text-base font-normal leading-relaxed text-text-muted sm:text-lg lg:text-[1.125rem] lg:leading-[1.65]"
            >
              <PretextAnimatedHeight
                text={testimonial.quote}
                font={
                  typeof window !== "undefined" && window.innerWidth >= 1024
                    ? "400 18px Inter"
                    : typeof window !== "undefined" && window.innerWidth >= 640
                      ? "400 18px Inter"
                      : "400 16px Inter"
                }
                lineHeight={
                  typeof window !== "undefined" && window.innerWidth >= 1024
                    ? 30
                    : 27
                }
              >
                &ldquo;{testimonial.quote}&rdquo;
              </PretextAnimatedHeight>
            </motion.blockquote>

            {/* Author info (desktop) */}
            <motion.div
              variants={itemVariants}
              className="hidden lg:block pt-10"
            >
              <p className="text-base font-semibold text-text">
                {testimonial.name}
              </p>
              <p className="mt-1 text-sm text-text-muted">{testimonial.role}</p>
            </motion.div>
          </motion.div>

          {/* Mobile attribution */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mt-5 lg:hidden"
          >
            <p className="text-base font-semibold text-text">
              {testimonial.name}
            </p>
            <p className="mt-1 text-sm text-text-muted">{testimonial.role}</p>
          </motion.div>

          {/* Pagination dots — desktop: bottom-left of content column */}
          <div
            className="mt-6 hidden shrink-0 items-center gap-2 lg:flex"
            role="tablist"
            aria-label="Testimonial slides"
          >
            {Array.from({ length: total }).map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to testimonial ${index + 1}`}
                onClick={() => onDotClick(index)}
                className={cn(
                  "rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                  index === activeIndex
                    ? "h-2 w-8 bg-brand-500"
                    : "h-2 w-2 bg-border-strong hover:bg-brand-300",
                )}
              />
            ))}
          </div>

          {/* Pagination dots — mobile: centered below content */}
          <div
            className="mt-6 flex shrink-0 items-center justify-center gap-2 lg:hidden"
            role="tablist"
            aria-label="Testimonial slides"
          >
            {Array.from({ length: total }).map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to testimonial ${index + 1}`}
                onClick={() => onDotClick(index)}
                className={cn(
                  "rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                  index === activeIndex
                    ? "h-2 w-8 bg-brand-500"
                    : "h-2 w-2 bg-border-strong hover:bg-brand-300",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

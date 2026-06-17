import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 rounded-full font-medium",
    "transition-all duration-250 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40 select-none",
    "active:scale-[0.96] active:duration-75",
    /* shimmer sweep on hover */
    "overflow-hidden",
    "after:absolute after:inset-0 after:rounded-full",
    "after:bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.12)_50%,transparent_60%)]",
    "after:translate-x-[-100%] hover:after:translate-x-[100%]",
    "after:transition-transform after:duration-500 after:ease-in-out",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-brand-500 text-white",
          "hover:bg-brand-600 hover:scale-[1.05]",
          "shadow-[0_2px_12px_rgba(47,123,255,0.35)]",
          "hover:shadow-[0_4px_28px_rgba(47,123,255,0.55)]",
        ].join(" "),
        "ghost-light": [
          "border border-white/15 text-white",
          "hover:bg-white/10 hover:border-white/30 hover:scale-[1.04]",
          "backdrop-blur-sm",
        ].join(" "),
        "ghost-dark": [
          "border border-ink-900/12 text-ink-900",
          "hover:bg-ink-900/5 hover:border-ink-900/25 hover:scale-[1.04]",
        ].join(" "),
        dark: [
          "bg-ink-900 text-white",
          "hover:bg-ink-800 hover:scale-[1.05]",
          "shadow-[0_2px_12px_rgba(0,0,0,0.3)]",
          "hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
        ].join(" "),
        outline: [
          "border border-brand-500/40 text-brand-500",
          "hover:bg-brand-500/8 hover:border-brand-500/70 hover:scale-[1.04]",
        ].join(" "),
      },
      size: {
        xs:   "px-3.5 py-1.5 text-xs",
        sm:   "px-5 py-2.5 text-sm",
        md:   "px-6 py-3 text-[15px]",
        lg:   "px-7 py-3.5 text-base",
        icon: "h-9 w-9 p-0 shrink-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonProps = ComponentPropsWithoutRef<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

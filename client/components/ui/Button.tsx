import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 rounded-full font-medium",
    "transition-all duration-250 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
    "disabled:pointer-events-none disabled:opacity-40 select-none",
    "active:scale-[0.96] active:duration-75",
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
          "bg-brand-500 text-ink-950 font-semibold",
          "hover:bg-brand-400 hover:scale-[1.05]",
          "shadow-[0_2px_16px_rgba(0,200,255,0.40),0_0_0_1px_rgba(0,200,255,0.25)]",
          "hover:shadow-[0_4px_32px_rgba(0,200,255,0.65),0_0_0_1px_rgba(0,200,255,0.45)]",
        ].join(" "),
        "ghost-light": [
          "border border-white/15 text-white",
          "hover:bg-white/8 hover:border-brand-500/30 hover:text-brand-300 hover:scale-[1.04]",
          "backdrop-blur-sm",
        ].join(" "),
        "ghost-dark": [
          "border border-white/10 text-white/60",
          "hover:bg-brand-500/8 hover:border-brand-500/25 hover:scale-[1.04] hover:text-brand-300",
        ].join(" "),
        dark: [
          "bg-ink-800 text-white border border-white/8",
          "hover:bg-ink-700 hover:scale-[1.05] hover:border-brand-500/20",
          "shadow-[0_2px_12px_rgba(0,0,0,0.5)]",
        ].join(" "),
        outline: [
          "border border-brand-500/40 text-brand-400",
          "hover:bg-brand-500/10 hover:border-brand-500/70 hover:scale-[1.04]",
          "hover:shadow-[0_0_16px_rgba(0,200,255,0.20)]",
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

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1",
  {
    variants: {
      variant: {
        free: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
        "level-dark": "bg-white/8 text-white/70 border border-white/12",
        "level-light": "bg-brand-500/10 text-brand-300 border border-brand-500/20",
      },
    },
    defaultVariants: {
      variant: "level-light",
    },
  }
);

type BadgeProps = ComponentPropsWithoutRef<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1",
  {
    variants: {
      variant: {
        free: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        "level-dark": "bg-white/10 text-white/80 border border-white/15",
        "level-light": "bg-ink-900/5 text-ink-900/70 border border-ink-900/10",
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

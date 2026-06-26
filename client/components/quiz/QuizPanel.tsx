import { cn } from "@/lib/utils";

interface QuizPanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

/** Glass card shell matching the landing-page QuizBanner aesthetic. */
export function QuizPanel({ children, className, padding = true }: QuizPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-ink-800/70 backdrop-blur-xl text-white",
        className,
      )}
      style={{
        boxShadow:
          "0 40px 100px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(0,200,255,0.08)",
      }}
    >
      <div
        className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,200,255,0.22) 0%, transparent 65%)", filter: "blur(65px)" }}
        aria-hidden
      />
      <div
        className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,128,255,0.18) 0%, transparent 65%)", filter: "blur(55px)" }}
        aria-hidden
      />

      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-brand-400/55 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/6 to-transparent" />
      <div className="absolute inset-0 dot-grid-dark opacity-35 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 noise-overlay opacity-25 pointer-events-none" aria-hidden />

      <div className={cn("relative z-10", padding && "p-8 sm:p-10 lg:p-12")}>{children}</div>
    </div>
  );
}

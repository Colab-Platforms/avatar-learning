import { cn } from "@/lib/utils";

interface PageBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "rich";
}

/** Shared ambient background used on courses, contact, about, and quiz pages. */
export function PageBackground({ children, className, variant = "default" }: PageBackgroundProps) {
  const rich = variant === "rich";

  return (
    <div
      className={cn("relative min-h-screen text-white overflow-x-hidden", className)}
      style={{
        background:
          "linear-gradient(160deg, #060D1A 0%, #091220 25%, #060D1A 55%, #091525 80%, #060D1A 100%)",
      }}
    >
      {rich && (
        <>
          <div className="pointer-events-none fixed inset-0 mesh-gradient opacity-35" aria-hidden />
          <div className="pointer-events-none fixed inset-0 line-grid opacity-[0.12]" aria-hidden />
          <div className="pointer-events-none fixed inset-0 noise-overlay opacity-[0.14]" aria-hidden />
        </>
      )}

      <div className={cn("pointer-events-none fixed inset-0 dot-grid-dark", rich ? "opacity-30" : "opacity-20")} aria-hidden />
      <div
        className={cn(
          "pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px]",
          rich ? "opacity-[0.20]" : "opacity-[0.11]",
        )}
        style={{
          background: "radial-gradient(ellipse at top, rgba(0,200,255,0.45) 0%, transparent 65%)",
          filter: "blur(70px)",
        }}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none fixed bottom-0 right-0 w-[600px] h-[500px]",
          rich ? "opacity-[0.14]" : "opacity-[0.07]",
        )}
        style={{
          background: "radial-gradient(ellipse at bottom right, rgba(0,80,200,0.7) 0%, transparent 65%)",
          filter: "blur(90px)",
        }}
        aria-hidden
      />

      {rich && (
        <>
          <div
            className="pointer-events-none fixed top-1/4 -left-40 w-[520px] h-[520px] opacity-[0.14]"
            style={{
              background: "radial-gradient(circle, rgba(0,200,255,0.55) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none fixed bottom-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.08]"
            style={{
              background: "radial-gradient(ellipse, rgba(0,128,255,0.6) 0%, transparent 70%)",
              filter: "blur(90px)",
            }}
            aria-hidden
          />
        </>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

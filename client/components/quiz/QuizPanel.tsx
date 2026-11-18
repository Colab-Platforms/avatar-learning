import { cn } from "@/lib/utils";

interface QuizPanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

/** Light card shell matching the site's redesigned light theme. */
export function QuizPanel({ children, className, padding = true }: QuizPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-white shadow-sm",
        className,
      )}
    >
      <div className={cn(padding && "p-8 sm:p-10 lg:p-12")}>{children}</div>
    </div>
  );
}

interface SectionEyebrowProps {
  number: string;
  label: string;
  className?: string;
  /** Overrides the default text-[13px] size for this instance. */
  textSize?: string;
}

/** Numbered eyebrow label with a vertical divider, reused across sections for a consistent "index" feel. */
export function SectionEyebrow({ number, label, className = "text-violet-300", textSize = "text-[18px] sm:text-[20px]" }: SectionEyebrowProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className={`${textSize} font-bold ${className}`}>{number}</span>
      <span className="h-3.5 w-px bg-white/20" aria-hidden />
      <span className={`${textSize} font-bold uppercase tracking-[0.18em] ${className}`}>{label}</span>
    </div>
  );
}

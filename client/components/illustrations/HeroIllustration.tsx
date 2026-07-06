
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 400"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Browser frame */}
      <rect x="20" y="20" width="400" height="300" rx="16" fill="#FFFFFF" stroke="#D3DCE6" strokeWidth="2" />
      <rect x="20" y="20" width="400" height="40" rx="16" fill="#F1F5F9" />
      <rect x="20" y="44" width="400" height="16" fill="#F1F5F9" />
      <circle cx="42" cy="40" r="5" fill="#D3DCE6" />
      <circle cx="60" cy="40" r="5" fill="#D3DCE6" />
      <circle cx="78" cy="40" r="5" fill="#D3DCE6" />

      {/* Progress bar */}
      <rect x="48" y="84" width="344" height="10" rx="5" fill="#F1F5F9" />
      <rect x="48" y="84" width="230" height="10" rx="5" fill="#2A78CC" />
      <text x="48" y="76" fontSize="11" fontFamily="Inter, sans-serif" fill="#475569">Your progress — Week 5 of 8</text>

      {/* Course cards */}
      <g>
        <rect x="48" y="112" width="164" height="92" rx="12" fill="#F8FAFC" stroke="#D3DCE6" strokeWidth="1.5" />
        <circle cx="76" cy="140" r="16" fill="#D9E7F6" />
        <path d="M71 133l12 7-12 7z" fill="#2A78CC" />
        <rect x="60" y="164" width="120" height="8" rx="4" fill="#AAB9C8" />
        <rect x="60" y="180" width="80" height="8" rx="4" fill="#D3DCE6" />
      </g>

      <g>
        <rect x="228" y="112" width="164" height="92" rx="12" fill="#F8FAFC" stroke="#D3DCE6" strokeWidth="1.5" />
        <circle cx="256" cy="140" r="16" fill="#D9E7F6" />
        <path d="M251 133l12 7-12 7z" fill="#2A78CC" />
        <rect x="240" y="164" width="120" height="8" rx="4" fill="#AAB9C8" />
        <rect x="240" y="180" width="70" height="8" rx="4" fill="#D3DCE6" />
      </g>

      {/* Lower row: avatar + checkmark row */}
      <g>
        <rect x="48" y="224" width="344" height="66" rx="12" fill="#F8FAFC" stroke="#D3DCE6" strokeWidth="1.5" />
        <circle cx="80" cy="257" r="18" fill="#2A78CC" />
        <path d="M72 257l6 6 12-13" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="112" y="246" width="160" height="9" rx="4.5" fill="#AAB9C8" />
        <rect x="112" y="264" width="110" height="8" rx="4" fill="#D3DCE6" />
        <rect x="316" y="240" width="60" height="34" rx="17" fill="#F0F6FB" stroke="#B4D0ED" strokeWidth="1.5" />
        <text x="330" y="261" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif" fill="#153C66">Live</text>
      </g>

      {/* Floating certificate card */}
      <g>
        <rect x="300" y="270" width="150" height="96" rx="14" fill="#FFFFFF" stroke="#D3DCE6" strokeWidth="2" />
        <circle cx="330" cy="300" r="16" fill="#F0F6FB" stroke="#B4D0ED" strokeWidth="1.5" />
        <path d="M323 300l5 5 9-10" stroke="#2A78CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="316" y="326" width="118" height="8" rx="4" fill="#AAB9C8" />
        <rect x="316" y="342" width="80" height="8" rx="4" fill="#D3DCE6" />
        <text x="316" y="318" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif" fill="#0F172A">Certificate earned</text>
      </g>
    </svg>
  );
}

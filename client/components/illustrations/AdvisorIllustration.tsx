/* Flat illustration of a 1:1 advisor video call — used in AdvisorCTA in
   place of the old dark neon plexus map of India. */
export function AdvisorIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Call frame */}
      <rect x="20" y="20" width="340" height="240" rx="18" fill="#FFFFFF" stroke="#D3DCE6" strokeWidth="2" />
      <rect x="20" y="20" width="340" height="36" rx="18" fill="#F1F5F9" />
      <rect x="20" y="40" width="340" height="16" fill="#F1F5F9" />
      <circle cx="40" cy="38" r="4.5" fill="#D3DCE6" />
      <circle cx="56" cy="38" r="4.5" fill="#D3DCE6" />
      <circle cx="72" cy="38" r="4.5" fill="#D3DCE6" />

      {/* Advisor tile (left) */}
      <rect x="40" y="76" width="150" height="164" rx="14" fill="#F8FAFC" stroke="#D3DCE6" strokeWidth="1.5" />
      <circle cx="115" cy="140" r="34" fill="#D9E7F6" />
      <circle cx="115" cy="128" r="14" fill="#2A78CC" />
      <path d="M89 168c6-20 46-20 52 0" stroke="#2A78CC" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="80" y="204" width="70" height="9" rx="4.5" fill="#AAB9C8" />

      {/* Student tile (right) */}
      <rect x="200" y="76" width="140" height="164" rx="14" fill="#F8FAFC" stroke="#D3DCE6" strokeWidth="1.5" />
      <circle cx="270" cy="140" r="30" fill="#F0F6FB" />
      <circle cx="270" cy="130" r="12" fill="#5F9AD9" />
      <path d="M247 165c5-17 40-17 45 0" stroke="#5F9AD9" strokeWidth="2.2" strokeLinecap="round" fill="none" />

      {/* Chat bubble accent */}
      <g>
        <rect x="210" y="90" width="70" height="30" rx="10" fill="#2A78CC" />
        <path d="M222 120l-6 10v-10z" fill="#2A78CC" />
        <circle cx="230" cy="105" r="2.5" fill="#FFFFFF" />
        <circle cx="243" cy="105" r="2.5" fill="#FFFFFF" />
        <circle cx="256" cy="105" r="2.5" fill="#FFFFFF" />
      </g>

      {/* Call controls */}
      <rect x="150" y="252" width="120" height="8" rx="4" fill="#D3DCE6" />
    </svg>
  );
}

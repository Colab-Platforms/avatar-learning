/* Flat illustration of a quiz/checklist card — used in QuizBanner in place
   of the old dark neon circuit-board photo. */
export function QuizIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 320"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Card */}
      <rect x="30" y="30" width="260" height="260" rx="20" fill="#FFFFFF" stroke="#D3DCE6" strokeWidth="2" />

      {/* Question-mark badge */}
      <circle cx="160" cy="90" r="30" fill="#F0F6FB" stroke="#B4D0ED" strokeWidth="2" />
      <text
        x="160"
        y="101"
        textAnchor="middle"
        fontSize="30"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
        fill="#2A78CC"
      >
        ?
      </text>

      {/* Checklist rows */}
      <g>
        <rect x="56" y="148" width="22" height="22" rx="6" fill="#2A78CC" />
        <path d="M62 159l4 4 8-9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="90" y="153" width="150" height="10" rx="5" fill="#AAB9C8" />
      </g>

      <g>
        <rect x="56" y="188" width="22" height="22" rx="6" fill="#F1F5F9" stroke="#AAB9C8" strokeWidth="1.5" />
        <rect x="90" y="193" width="130" height="10" rx="5" fill="#D3DCE6" />
      </g>

      <g>
        <rect x="56" y="228" width="22" height="22" rx="6" fill="#F1F5F9" stroke="#AAB9C8" strokeWidth="1.5" />
        <rect x="90" y="233" width="110" height="10" rx="5" fill="#D3DCE6" />
      </g>

      {/* Results pill, floating bottom-right of the card */}
      <rect x="200" y="262" width="110" height="40" rx="20" fill="#2A78CC" />
      <text
        x="255"
        y="287"
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fontFamily="Inter, sans-serif"
        fill="#FFFFFF"
      >
        See results
      </text>
    </svg>
  );
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base}>
      <path d="M3.5 10h13M11.5 5l5 5-5 5" />
    </svg>
  );
}

export function CardIcon({ name, className }: { name: string; className?: string }) {
  if (name === "book")
    return (
      <svg viewBox="0 0 32 32" className={className} {...base}>
        <path d="M16 9.5c-2.6-1.8-6.1-2.4-10-2v15.5c3.9-.4 7.4.2 10 2 2.6-1.8 6.1-2.4 10-2V7.5c-3.9-.4-7.4.2-10 2Z" />
        <path d="M16 9.5V24.5" />
      </svg>
    );
  if (name === "team")
    return (
      <svg viewBox="0 0 32 32" className={className} {...base}>
        <circle cx="12" cy="11.5" r="3.6" />
        <path d="M5 24.5c.6-3.7 3.4-6 7-6s6.4 2.3 7 6" />
        <circle cx="21.5" cy="12.5" r="3" />
        <path d="M20.5 18.6c3.2-.3 5.9 1.6 6.5 5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 32 32" className={className} {...base}>
      <rect x="6.5" y="6.5" width="8" height="8" rx="1" />
      <rect x="17.5" y="6.5" width="8" height="8" rx="1" />
      <rect x="6.5" y="17.5" width="8" height="8" rx="1" />
      <rect x="17.5" y="17.5" width="8" height="8" rx="1" />
    </svg>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} {...base}>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  );
}

export function TrustIcon({ name, className }: { name: string; className?: string }) {
  if (name === "chart")
    return (
      <svg viewBox="0 0 24 24" className={className} {...base}>
        <path d="M4 19h16M6.5 15l4-4 3 3 5-6" />
        <path d="M15 8h3.5v3.5" />
      </svg>
    );
  if (name === "layers")
    return (
      <svg viewBox="0 0 24 24" className={className} {...base}>
        <path d="M12 4 3.5 8.5 12 13l8.5-4.5L12 4Z" />
        <path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.9L12 18.5l-1.8-5.8-5.7-1.9L10.2 9 12 3.5Z" />
      <path d="M19 16.5v3M17.5 18h3" />
    </svg>
  );
}

export function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d="m10 2.5 2.3 4.8 5.2.7-3.8 3.7.9 5.2L10 14.4l-4.6 2.5.9-5.2L2.5 8l5.2-.7L10 2.5Z" />
    </svg>
  );
}

export function ContactIcon({ name, className }: { name: string; className?: string }) {
  if (name === "mail")
    return (
      <svg viewBox="0 0 24 24" className={className} {...base}>
        <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
        <path d="m4 6.5 8 6 8-6" />
      </svg>
    );
  if (name === "phone")
    return (
      <svg viewBox="0 0 24 24" className={className} {...base}>
        <path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.3 18.6l-3.8.9Z" />
      <path d="M9 10.5h6M9 13.5h4" />
    </svg>
  );
}

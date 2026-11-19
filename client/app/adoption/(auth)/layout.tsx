/** The centred sign-in card used by /adoption/login, /login/email, /signup and /forgot-password. */
export default function AdoptionAuthCardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: "100%", maxWidth: 440, borderRadius: 24, padding: 1, background: "linear-gradient(180deg,rgba(143,233,242,.4),rgba(255,255,255,.06) 50%)" }}>
      <div style={{ borderRadius: 23, background: "#0b0d12", padding: "clamp(24px,5vw,40px)" }}>{children}</div>
    </div>
  );
}

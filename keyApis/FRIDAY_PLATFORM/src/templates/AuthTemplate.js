export default function AuthTemplate({ children }) {
  return (
    <main className="friday-auth-stage relative min-h-screen overflow-hidden">
      <video className="friday-auth-video" autoPlay muted loop playsInline preload="metadata" poster="/logo.svg">
        <source src="/video/FIRDAY.mp4" type="video/mp4" />
        <source src="/video/FRIDAY2.mp4" type="video/mp4" />
      </video>
      <div className="friday-auth-overlay" />
      <div className="friday-auth-grid" />
      <div className="friday-auth-scanline" />

      <section className="relative z-10 flex min-h-screen items-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] xl:gap-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 shadow-glow">
              INTERNAL GATEWAY
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              FRIDAY Platform
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Secure access for internal API key management.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Issue, rotate, revoke, and monitor FRIDAY gateway keys without exposing model provider secrets to client applications.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {["API Gateway Ready", "Token Guard Active", "One-time Secret Reveal"].map((label) => (
                <span key={label} className="friday-status-chip">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.95)]" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
              <div className="friday-auth-metric">
                <span>Gateway</span>
                <strong>Online</strong>
              </div>
              <div className="friday-auth-metric">
                <span>Secrets</span>
                <strong>Vaulted</strong>
              </div>
              <div className="friday-auth-metric">
                <span>Session</span>
                <strong>Protected</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

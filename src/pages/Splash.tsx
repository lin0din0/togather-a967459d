import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasOnboarded } from "./Welcome";
import holdingHands from "@/assets/holding-hands.svg";

const Splash = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  if (!loading && user) return <Navigate to="/home" replace />;
  if (!loading && !user && !hasOnboarded()) return <Navigate to="/welcome" replace />;

  return (
    <main
      aria-labelledby="splash-headline"
      className="bg-gradient-splash relative flex min-h-full flex-col overflow-hidden px-6 pb-8 pt-5"
    >
      {/* Ambient depth — decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary-soft opacity-60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-ai-soft opacity-50 blur-3xl"
      />

      {/* Top brand row */}
      <header className="anim-fade-up relative z-10 flex items-center justify-between">
        <span className="font-display text-[20px] font-semibold tracking-tight text-foreground">
          togather
        </span>
        <span className="rounded-full border border-foreground/10 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink2 backdrop-blur">
          Beta
        </span>
      </header>

      {/* Hero illustration */}
      <div className="anim-fade-up relative z-10 mt-2 flex justify-center">
        <img
          src={holdingHands}
          alt=""
          aria-hidden
          className="-mx-6 w-[112%] max-w-none object-contain drop-shadow-[0_24px_40px_hsl(13_60%_40%_/_0.18)]"
        />
      </div>

      {/* Editorial copy block */}
      <section className="relative z-10 -mt-2 flex flex-col items-center text-center">
        <span className="anim-fade-up anim-d1 mb-4 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-ink2 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Less planning. More presence.
        </span>

        <h1
          id="splash-headline"
          className="anim-fade-up anim-d1 font-display mb-4 text-[44px] font-semibold leading-[0.98] tracking-tight text-foreground"
        >
          Spend your time
          <br />
          <em className="bg-gradient-to-r from-primary to-pink bg-clip-text not-italic text-transparent">
            intentionally.
          </em>
        </h1>

        <p className="anim-fade-up anim-d2 mb-8 max-w-[300px] text-[15px] leading-[1.55] text-ink2">
          Togather finds the time, plans the activity, and coordinates real
          connection — so you just show up.
        </p>

        {/* CTAs */}
        <div className="anim-fade-up anim-d3 w-full max-w-[340px] space-y-3">
          <button
            onClick={() => nav("/auth?mode=signup")}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground px-6 py-4 text-[15px] font-semibold text-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
          >
            <span>Get started — it's free</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              <path
                d="M3 8h10m0 0L9 4m4 4l-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <Link
            to="/auth?mode=signin"
            className="block w-full rounded-full border border-foreground/15 bg-white/60 px-6 py-3.5 text-center text-[14px] font-medium text-foreground backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            I already have an account
          </Link>
        </div>

        {/* Trust microcopy */}
        <p className="anim-fade-up anim-d4 mt-5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M6 1l1.5 3L11 4.5 8.5 7l.6 3.5L6 9l-3.1 1.5L3.5 7 1 4.5 4.5 4 6 1z"
              fill="hsl(var(--warning))"
            />
          </svg>
          Loved by 5 intentional hackatoners
        </p>
      </section>
    </main>
  );
};

export default Splash;

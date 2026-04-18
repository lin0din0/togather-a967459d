import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Heart, Sparkles, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

type Slide = {
  icon: typeof Calendar;
  iconBg: string;
  iconColor: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: Heart,
    iconBg: "bg-primary-bg",
    iconColor: "text-primary",
    eyebrow: "People first",
    title: (
      <>
        Stay close to the
        <br />
        <em className="text-primary">people who matter.</em>
      </>
    ),
    body: "Add the friends and family you want to see more of. Togather keeps the thread alive between meet-ups.",
  },
  {
    icon: Calendar,
    iconBg: "bg-ai-bg",
    iconColor: "text-ai",
    eyebrow: "Free time, found",
    title: (
      <>
        We read your calendar,
        <br />
        <em className="text-ai">never your life.</em>
      </>
    ),
    body: "Free/busy only — no event names, no details. We surface the slots that actually fit you both.",
  },
  {
    icon: Sparkles,
    iconBg: "bg-success-bg",
    iconColor: "text-success",
    eyebrow: "Time, intentionally",
    title: (
      <>
        Plans that respect
        <br />
        <em className="text-success">your boundaries.</em>
      </>
    ),
    body: "Set how much social time you want each week and your monthly budget. We'll never ask for more.",
  },
];

const ONBOARDED_KEY = "togather:onboarded";

export const markOnboarded = () => {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    /* noop */
  }
};

export const hasOnboarded = () => {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
};

const Welcome = () => {
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const Icon = slide.icon;
  const isLast = i === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      markOnboarded();
      nav("/auth?mode=signup");
    } else {
      setI((n) => n + 1);
    }
  };

  const skip = () => {
    markOnboarded();
    nav("/");
  };

  return (
    <div className="bg-gradient-splash flex min-h-full flex-col px-7 pb-8 pt-[60px]">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-foreground bg-white">
            <Logo size={16} />
          </div>
          <span className="text-[13px] font-semibold tracking-tight">Togather</span>
        </div>
        <button
          onClick={skip}
          className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip
        </button>
      </div>

      {/* Slide */}
      <div key={i} className="anim-fade-up flex flex-1 flex-col items-center justify-center text-center">
        <div
          className={cn(
            "mb-7 flex h-[88px] w-[88px] items-center justify-center rounded-[26px] border-[1.5px] border-foreground shadow-card",
            slide.iconBg,
          )}
        >
          <Icon className={cn("h-9 w-9", slide.iconColor)} strokeWidth={1.6} />
        </div>
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {slide.eyebrow}
        </div>
        <h1 className="font-display mb-4 max-w-[320px] text-[32px] font-semibold leading-[1.12] text-foreground">
          {slide.title}
        </h1>
        <p className="max-w-[300px] text-[14px] leading-[1.6] text-muted-foreground">{slide.body}</p>
      </div>

      {/* Dots */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {SLIDES.map((_, n) => (
          <button
            key={n}
            onClick={() => setI(n)}
            aria-label={`Go to slide ${n + 1}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              n === i ? "w-6 bg-foreground" : "w-1.5 bg-ink4 hover:bg-muted-foreground",
            )}
          />
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={next}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-[15px] font-semibold text-white shadow-glow transition-transform active:scale-[0.99]"
      >
        {isLast ? "Get started" : "Continue"}
        <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
      </button>
      {!isLast && (
        <button
          onClick={() => {
            markOnboarded();
            nav("/auth?mode=signin");
          }}
          className="mt-3 w-full text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          I already have an account
        </button>
      )}
    </div>
  );
};

export default Welcome;

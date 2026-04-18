import { useNavigate } from "react-router-dom";
import { ChevronRight, Lock, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StepHeader } from "@/components/StepHeader";

const CalendarConnect = () => {
  const { user, refreshProfile } = useAuth();
  const nav = useNavigate();

  const pick = async (provider: "google" | "apple" | "none") => {
    if (user) {
      await supabase.from("profiles").update({ calendar_provider: provider }).eq("user_id", user.id);
      await refreshProfile();
    }
    nav("/budget");
  };

  return (
    <div className="flex min-h-full flex-col bg-white px-6 pb-8 pt-[70px]">
      <StepHeader step={1} totalSteps={3} back="/auth?mode=signin" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display anim-fade-up text-[30px] font-semibold leading-[1.15] tracking-tight">
          Connect your calendar
        </h1>
        <p className="anim-fade-up anim-d1 mt-3 text-[14px] leading-[1.55] text-muted-foreground">
          Togather only reads when you're free — never event names or details.
        </p>
      </div>

      {/* Hero illustration */}
      <div className="anim-fade-up anim-d2 mb-8 flex items-center justify-center py-6">
        <div className="flex items-center gap-5">
          <div className="grid h-[96px] w-[96px] grid-cols-4 grid-rows-4 gap-1 rounded-2xl bg-white p-2 shadow-card ring-1 ring-border/60">
            <div className="col-span-4 rounded-md bg-primary text-center text-[8px] font-semibold leading-[14px] text-white">
              May
            </div>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[3px]"
                style={{
                  background: [3, 7, 9].includes(i)
                    ? "hsl(var(--success-soft))"
                    : i === 1
                    ? "hsl(var(--primary))"
                    : "hsl(var(--secondary))",
                }}
              />
            ))}
          </div>
          <div className="flex h-px w-6 items-center justify-center bg-border" />
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-[1.5px] border-ai-soft bg-ai-bg">
            <Lock className="h-[18px] w-[18px] text-ai" strokeWidth={1.75} />
          </div>
        </div>
      </div>

      {/* Trust points */}
      <ul className="anim-fade-up anim-d3 mb-8 space-y-2.5">
        {[
          "Read-only access to free/busy times",
          "Event names stay private",
          "Disconnect anytime in settings",
        ].map((t) => (
          <li key={t} className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-ink2">
            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-success-bg">
              <Check className="h-2.5 w-2.5 text-success" strokeWidth={3} />
            </span>
            {t}
          </li>
        ))}
      </ul>

      {/* Action area */}
      <div className="mt-auto">
        <div className="anim-fade-up anim-d4">
          <CalOpt label="Connect Google Calendar" icon={<GoogleIcon />} onClick={() => pick("google")} />
        </div>
        <button
          onClick={() => pick("none")}
          className="mt-4 block w-full text-center text-[12px] font-medium text-muted-foreground underline-offset-4 hover:underline"
        >
          Skip for now — connect later
        </button>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.5 35.6 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"/>
  </svg>
);

const CalOpt = ({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-border bg-white px-4 py-4 text-left transition-all hover:border-foreground hover:shadow-card"
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white">
      {icon}
    </span>
    <span className="flex-1 text-[14.5px] font-medium text-foreground">{label}</span>
    <ChevronRight className="h-4 w-4 text-ink4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
  </button>
);

export default CalendarConnect;

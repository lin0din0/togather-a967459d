import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Heart, Briefcase, Users, Palette } from "lucide-react";
import { useAuth, initialsOf } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StepHeader } from "@/components/StepHeader";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TYPES = [
  { key: "Close family", Icon: Users, desc: "Quality time, low-key plans", tint: "coral" as const },
  { key: "Work colleague", Icon: Briefcase, desc: "Coffees, networking, lunches", tint: "neutral" as const },
  { key: "Romantic partner", Icon: Heart, desc: "Date nights, weekend trips", tint: "pink" as const },
  { key: "Hobby buddy", Icon: Palette, desc: "Classes, shared interests", tint: "violet" as const },
];

const FREQS = [
  { key: "Weekly", helper: "Often — once a week" },
  { key: "1× / month", helper: "Steady — once a month" },
  { key: "2× / month", helper: "Twice a month" },
  { key: "Occasionally", helper: "Whenever it fits" },
];

const colors: Array<"coral" | "violet" | "teal" | "neutral"> = ["coral", "violet", "teal", "neutral"];

const AddConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<string>("Close family");
  const [freq, setFreq] = useState<string>("1× / month");
  const [saving, setSaving] = useState(false);

  const firstName = name.trim().split(/\s+/)[0] || "them";
  const valid = name.trim().length > 0;

  const send = async () => {
    if (!user || !valid) {
      toast({ title: "Add a name first", description: "Tell us who you'd like to plan with.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { count } = await supabase.from("people").select("id", { head: true, count: "exact" }).eq("user_id", user.id);
    const idx = (count ?? 0) % colors.length;
    const colorMap: Record<typeof colors[number], string> = {
      coral: "13 100% 60%",
      violet: "252 100% 68%",
      teal: "169 71% 37%",
      neutral: "0 0% 60%",
    };
    const { error } = await supabase.from("people").insert({
      user_id: user.id,
      name: name.trim(),
      email: email.trim(),
      relation: type === "Work colleague" ? "Colleague" : type === "Close family" ? "Family" : "Friend",
      connection_type: type,
      cadence: freq,
      initials: initialsOf(name.trim()),
      avatar_color: colorMap[colors[idx]],
      example_idea: "Coffee catch-up",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    nav("/invite-sent", { state: { name: name.trim(), type, freq } });
  };

  return (
    <div className="bg-white px-6 pb-6 pt-[70px]">
      <StepHeader step={3} totalSteps={3} back="/budget" />

      {/* Warmer heading */}
      <header className="mb-6">
        <h1 className="font-display anim-fade-up text-[28px] font-semibold leading-[1.15] tracking-tight text-foreground">
          Who's your first plus-one?
        </h1>
        <p className="anim-fade-up anim-d1 mt-2 text-[14px] leading-[1.55] text-ink2">
          Add someone you want to see more of. We'll send a soft invite — no pressure.
        </p>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="space-y-7"
      >
        {/* Identity */}
        <section className="anim-fade-up anim-d2 space-y-4" aria-labelledby="who-section">
          <SectionLabel id="who-section">Their details</SectionLabel>

          <div>
            <label htmlFor="name" className="mb-1.5 block text-[12.5px] font-medium text-ink2">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maja Eriksen"
              autoComplete="name"
              required
              className="w-full rounded-[14px] border-[1.5px] border-border bg-white px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-ink4 focus:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-medium text-ink2">
              Email <span className="font-normal text-ink4">(optional — we'll send the invite here)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maja@email.com"
              autoComplete="email"
              className="w-full rounded-[14px] border-[1.5px] border-border bg-white px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-ink4 focus:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
          </div>

          {/* Live preview card — shows recap as user fills */}
          {valid && (
            <div className="anim-fade-up flex items-center gap-3 rounded-2xl border-[1.5px] border-border bg-gradient-soft p-3.5">
              <InitialsAvatar initials={initialsOf(name)} size={44} bordered />
              <div className="flex-1 min-w-0">
                <div className="truncate text-[14px] font-semibold text-foreground">{name}</div>
                <div className="mt-0.5 truncate text-[12px] text-ink2">
                  {type} · {freq.toLowerCase()}
                </div>
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success" aria-hidden>
                <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
              </div>
            </div>
          )}
        </section>

        {/* Connection type */}
        <section className="anim-fade-up anim-d3" aria-labelledby="type-section">
          <SectionLabel id="type-section">How do you know each other?</SectionLabel>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="type-section">
            {TYPES.map(({ key, Icon, desc, tint }) => {
              const sel = type === key;
              const tintBg = tint === "coral" ? "bg-primary-bg text-primary"
                : tint === "violet" ? "bg-ai-bg text-ai"
                : tint === "pink" ? "bg-pink-bg text-pink"
                : "bg-secondary text-ink2";
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => setType(key)}
                  className={cn(
                    "relative rounded-2xl border-[1.5px] p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    sel
                      ? "border-primary bg-primary-bg shadow-sm"
                      : "border-border bg-white hover:border-foreground/30 active:scale-[0.98]",
                  )}
                >
                  <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-full transition-colors", tintBg)}>
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div className="text-[13px] font-semibold leading-tight text-foreground">{key}</div>
                  <div className="mt-1 text-[12px] leading-[1.4] text-ink2">{desc}</div>
                  {sel && (
                    <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white" aria-hidden>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Frequency */}
        <section className="anim-fade-up anim-d4" aria-labelledby="freq-section">
          <SectionLabel id="freq-section">
            How often would you like to see {firstName}?
          </SectionLabel>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="freq-section">
            {FREQS.map(({ key, helper }) => {
              const on = freq === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setFreq(key)}
                  className={cn(
                    "rounded-2xl border-[1.5px] px-3.5 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    on
                      ? "border-foreground bg-foreground text-white shadow-sm"
                      : "border-border bg-white text-foreground hover:border-foreground/40 active:scale-[0.98]",
                  )}
                >
                  <div className="text-[13px] font-semibold leading-tight">{key}</div>
                  <div className={cn("mt-0.5 text-[11.5px] leading-tight", on ? "text-white/70" : "text-ink2")}>
                    {helper}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sticky CTA */}
        <div className="anim-fade-up anim-d5 sticky bottom-0 -mx-6 mt-2 border-t border-border bg-white/95 px-6 pb-5 pt-4 backdrop-blur">
          <button
            type="submit"
            disabled={saving || !valid}
            className="w-full rounded-full bg-primary px-6 py-4 text-[14px] font-semibold text-white shadow-glow transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {saving ? "Sending…" : valid ? `Send invite to ${firstName}` : "Add a name to continue"}
          </button>
          <button
            type="button"
            onClick={() => nav("/home")}
            className="mt-2.5 block w-full rounded-full px-6 py-2 text-center text-[13px] font-medium text-ink2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
};

const SectionLabel = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h2 id={id} className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink2">
    {children}
  </h2>
);

export default AddConnection;

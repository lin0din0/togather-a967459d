import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StepHeader } from "@/components/StepHeader";
import { cn } from "@/lib/utils";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"]; // Mon..Sun
const PREFS = ["Outdoor", "Free / low cost", "Indoor", "Active", "Cultural events", "Food & drink", "Creative", "Classes / learning"];

const PREF_KEYWORDS: Array<[string[], string]> = [
  [["outdoor", "outside", "nature", "hike", "hiking", "walk", "park", "trail"], "Outdoor"],
  [["free", "cheap", "low cost", "low-cost", "budget", "affordable"], "Free / low cost"],
  [["indoor", "inside", "cozy", "home", "café", "cafe"], "Indoor"],
  [["active", "sport", "sports", "gym", "run", "running", "bike", "cycling", "yoga", "swim"], "Active"],
  [["culture", "cultural", "museum", "gallery", "theatre", "theater", "concert", "exhibition"], "Cultural events"],
  [["food", "drink", "dinner", "lunch", "brunch", "wine", "beer", "cocktail", "restaurant"], "Food & drink"],
  [["creative", "art", "paint", "craft", "music", "draw", "writing", "pottery"], "Creative"],
  [["class", "classes", "learn", "learning", "course", "workshop", "study"], "Classes / learning"],
];

type Msg = { role: "user" | "assistant"; content: string };

// Reordered: hours/week → days/week → days/month
type Unit = "hours_week" | "days_week" | "days_month";

const UNIT_ORDER: Unit[] = ["hours_week", "days_week", "days_month"];

const UNIT_META: Record<Unit, { label: string; min: number; max: number; step: number; defaultVal: number; suffix: (n: number) => string; helper: string }> = {
  hours_week: {
    label: "Hours / week", min: 1, max: 40, step: 1, defaultVal: 6,
    suffix: (n) => `hr${n === 1 ? "" : "s"}`,
    helper: "Total social hours you'd like each week.",
  },
  days_week: {
    label: "Days / week", min: 1, max: 7, step: 1, defaultVal: 2,
    suffix: (n) => `day${n === 1 ? "" : "s"}`,
    helper: "Togather will never plan more than this per week.",
  },
  days_month: {
    label: "Days / month", min: 1, max: 30, step: 1, defaultVal: 8,
    suffix: (n) => `day${n === 1 ? "" : "s"}`,
    helper: "Total social days you're up for each month.",
  },
};

const toDaysPerWeek = (val: number, unit: Unit) => {
  if (unit === "days_week") return Math.max(1, Math.min(7, val));
  if (unit === "days_month") return Math.max(1, Math.min(7, Math.round(val / 4.345)));
  return Math.max(1, Math.min(7, Math.round(val / 2)));
};

const Budget = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [unit, setUnit] = useState<Unit>("hours_week");
  const [value, setValue] = useState(6);
  const [protectedIdx, setProtectedIdx] = useState<number[]>([6]);
  const [prefs, setPrefs] = useState<string[]>(["Outdoor", "Free / low cost"]);
  const [saving, setSaving] = useState(false);

  const meta = UNIT_META[unit];

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey! Tell me what you enjoy — outdoor adventures, cosy cafés, gigs, gym sessions… I'll tick the matching tags for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    setValue(profile.free_days_per_week ?? 2);
    setUnit("days_week");
    const pd = (profile.protected_days as string[]) ?? ["S"];
    const idxs: number[] = [];
    pd.forEach((letter) => {
      const i = DAYS.findIndex((d, idx) => d === letter && !idxs.includes(idx));
      if (i !== -1) idxs.push(i);
    });
    if (idxs.length) setProtectedIdx(idxs);
    if ((profile.activity_prefs as string[])?.length) setPrefs(profile.activity_prefs as string[]);
  }, [profile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, streaming]);

  const switchUnit = (next: Unit) => {
    setUnit(next);
    setValue(UNIT_META[next].defaultVal);
  };

  const clamp = (n: number) => Math.max(meta.min, Math.min(meta.max, n));
  const setFromPct = (pctVal: number) => {
    const raw = meta.min + pctVal * (meta.max - meta.min);
    setValue(clamp(Math.round(raw / meta.step) * meta.step));
  };
  const onTrack = (e: React.MouseEvent) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return;
    setFromPct(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };
  const pct = useMemo(() => ((value - meta.min) / (meta.max - meta.min)) * 100, [value, meta]);

  const toggleDay = (i: number) =>
    setProtectedIdx((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const togglePref = (pref: string) => {
    setPrefs((cur) => {
      const isOn = cur.includes(pref);
      const next = isOn ? cur.filter((x) => x !== pref) : [...cur, pref];
      // Mirror the change into the chat so both inputs feel connected
      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          content: isOn
            ? `Got it — removed "${pref}". Tell me more about what you'd rather do instead.`
            : `Nice — added "${pref}" ✨ Want to go deeper? Describe the kind of ${pref.toLowerCase()} moments you love.`,
        },
      ]);
      return next;
    });
  };

  const extractAndApplyPrefs = (text: string) => {
    const lower = text.toLowerCase();
    const matched = new Set<string>();
    PREF_KEYWORDS.forEach(([kws, pref]) => {
      if (kws.some((kw) => lower.includes(kw))) matched.add(pref);
    });
    if (matched.size === 0) return [];
    setPrefs((cur) => Array.from(new Set([...cur, ...matched])));
    return Array.from(matched);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const newPrefs = extractAndApplyPrefs(text);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are helping someone pick activity preferences for a social-planning app. Reply in 1 short sentence acknowledging what they like. If you noticed clear preferences, briefly confirm them (e.g. 'Got it — outdoor and creative ✨'). Never list options. Never ask follow-ups longer than one short question.",
            },
            ...next,
          ],
        }),
      });

      if (resp.status === 429) {
        toast({ title: "Slow down", description: "Too many requests — try again shortly.", variant: "destructive" });
        setStreaming(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "AI credits needed", description: "Add credits to keep chatting.", variant: "destructive" });
        setStreaming(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      setMessages((p) => [...p, { role: "assistant", content: "" }]);
      let finished = false;

      while (!finished) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            finished = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              acc += delta;
              setMessages((p) => p.map((m, i) => (i === p.length - 1 ? { ...m, content: acc } : m)));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (newPrefs.length) {
        toast({ title: "Tags added", description: newPrefs.join(", ") });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Connection issue", description: "Please try again.", variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        free_days_per_week: toDaysPerWeek(value, unit),
        protected_days: protectedIdx.map((i) => DAYS[i]),
        activity_prefs: prefs,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (!error) {
      await refreshProfile();
      nav("/add-connection");
    }
  };

  return (
    <div className="bg-white px-6 pb-10 pt-[70px]">
      <StepHeader step={2} totalSteps={3} back="/calendar-connect" />

      {/* Page heading */}
      <header className="mb-8">
        <h1 className="font-display anim-fade-up text-[28px] font-semibold leading-[1.15] tracking-tight text-foreground">
          Set your Social Bandwidth
        </h1>
        <p className="anim-fade-up anim-d1 mt-2 text-[14px] leading-[1.55] text-muted-foreground">
          How much time of yours is free for togetherness? This boundary is yours, we coordinate it.
        </p>
      </header>

      {/* SECTION 1 — Time available */}
      <section className="anim-fade-up anim-d2 mb-10">
        <SectionLabel>Time available</SectionLabel>

        {/* Unit segmented control — reordered: hours → days/wk → days/mo */}
        <div
          role="tablist"
          aria-label="Choose unit"
          className="mb-6 grid grid-cols-3 gap-1 rounded-full border border-border bg-secondary/50 p-1"
        >
          {UNIT_ORDER.map((u) => {
            const on = unit === u;
            return (
              <button
                key={u}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => switchUnit(u)}
                className={cn(
                  "rounded-full py-2 text-[12px] font-medium transition-all",
                  on
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {UNIT_META[u].label}
              </button>
            );
          })}
        </div>

        {/* Big value display + steppers */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setValue((v) => clamp(v - meta.step))}
            disabled={value <= meta.min}
            aria-label="Decrease"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border bg-white text-foreground transition-all hover:border-foreground active:scale-95 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" strokeWidth={2.2} />
          </button>

          <div className="flex flex-1 flex-col items-center">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[56px] font-semibold leading-none tracking-tight text-primary tabular-nums">
                {value}
              </span>
              <span className="text-[14px] font-medium text-muted-foreground">
                {meta.suffix(value)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setValue((v) => clamp(v + meta.step))}
            disabled={value >= meta.max}
            aria-label="Increase"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border bg-white text-foreground transition-all hover:border-foreground active:scale-95 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Slider */}
        <div
          ref={trackRef}
          onClick={onTrack}
          role="slider"
          aria-label="Time commitment"
          aria-valuemin={meta.min}
          aria-valuemax={meta.max}
          aria-valuenow={value}
          className="relative h-1.5 cursor-pointer rounded-full bg-border"
        >
          <div
            className="h-full rounded-full bg-gradient-coral-fill transition-[width]"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-[-9px] h-6 w-6 -translate-x-1/2 cursor-grab rounded-full border-[2.5px] border-white bg-primary shadow-glow transition-[left]"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[11px] font-medium text-muted-foreground">
          <span>{meta.min}</span>
          <span>{meta.max}</span>
        </div>

        {/* Helper */}
        <p className="mt-4 text-[12.5px] leading-[1.5] text-muted-foreground">
          {meta.helper}
        </p>
      </section>

      {/* SECTION 2 — Protected days */}
      <section className="anim-fade-up anim-d3 mb-10">
        <SectionLabel>Days left untouched</SectionLabel>
        <p className="mb-4 text-[12.5px] leading-[1.5] text-muted-foreground">
          We'll never schedule on these days.
        </p>
        <div className="flex gap-2">
          {DAYS.map((d, i) => {
            const on = protectedIdx.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                aria-pressed={on}
                aria-label={`Toggle day ${i + 1}`}
                className={cn(
                  "flex-1 rounded-xl border-[1.5px] py-3 text-[13px] font-semibold transition-all",
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground hover:border-foreground/40",
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 3 — Activity preferences */}
      <section className="anim-fade-up anim-d3 mb-8">
        <SectionLabel>Activity preferences</SectionLabel>
        <p className="mb-4 text-[12.5px] leading-[1.5] text-muted-foreground">
          Tap what energises you — or chat below for a deeper take. Both stay in sync.
        </p>
        <div className="flex flex-wrap gap-2">
          {PREFS.map((p) => {
            const on = prefs.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePref(p)}
                aria-pressed={on}
                className={cn(
                  "rounded-full border-[1.5px] px-4 py-2 text-[12.5px] font-medium transition-all",
                  on
                    ? "border-primary-soft bg-primary-bg text-primary"
                    : "border-border bg-white text-foreground hover:border-foreground/40",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </section>

      {/* AI chat */}
      <section className="anim-fade-up anim-d4 mb-8 overflow-hidden rounded-2xl border-[1.5px] border-border bg-gradient-violet">
        <div className="flex items-center gap-2.5 border-b border-border/60 bg-white/60 px-4 py-3 backdrop-blur">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ai">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold leading-tight text-foreground">
              Describe what you enjoy
            </div>
            <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
              You can adjust this later in your profile
            </div>
          </div>
        </div>

        <div className="max-h-[200px] space-y-2.5 overflow-y-auto px-3.5 py-3.5">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "anim-bubble max-w-[85%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-[1.5] shadow-sm",
                  m.role === "user"
                    ? "rounded-br-[6px] bg-primary text-white"
                    : "rounded-bl-[6px] border border-border bg-white text-foreground",
                )}
              >
                {m.content || (streaming ? <TypingDots /> : null)}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-border/60 bg-white/70 px-3 py-3 backdrop-blur"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. I love hiking and cosy cafés…"
            disabled={streaming}
            className="flex-1 rounded-full border-[1.5px] border-border bg-white px-4 py-2.5 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-glow transition-transform active:scale-95 disabled:opacity-50 disabled:shadow-none"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
          </button>
        </form>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="anim-fade-up anim-d4 w-full rounded-full bg-primary px-6 py-4 text-[14px] font-semibold text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save my commitment"}
      </button>
    </div>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
    {children}
  </div>
);

const TypingDots = () => (
  <span className="inline-flex gap-1">
    <span className="type-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0s" }} />
    <span className="type-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
    <span className="type-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0.4s" }} />
  </span>
);

export default Budget;

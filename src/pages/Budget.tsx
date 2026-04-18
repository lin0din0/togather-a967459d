import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Send,
  Sparkles,
  ChevronDown,
  Trees,
  Wallet,
  Home as HomeIcon,
  Dumbbell,
  Theater,
  UtensilsCrossed,
  Palette,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StepHeader } from "@/components/StepHeader";
import { cn } from "@/lib/utils";

// Distinct keys + accessible labels (the visible "T" appears twice but each button has a unique aria-label)
const DAYS: { key: string; short: string; long: string }[] = [
  { key: "Mon", short: "M", long: "Monday" },
  { key: "Tue", short: "T", long: "Tuesday" },
  { key: "Wed", short: "W", long: "Wednesday" },
  { key: "Thu", short: "T", long: "Thursday" },
  { key: "Fri", short: "F", long: "Friday" },
  { key: "Sat", short: "S", long: "Saturday" },
  { key: "Sun", short: "S", long: "Sunday" },
];
// Legacy single-letter mapping kept for profile.protected_days backwards-compat (M T W T F S S)
const LEGACY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const PREFS: { id: string; label: string; Icon: typeof Trees }[] = [
  { id: "Outdoor", label: "Outdoor", Icon: Trees },
  { id: "Free / low cost", label: "Easy on the wallet", Icon: Wallet },
  { id: "Indoor", label: "Cosy indoors", Icon: HomeIcon },
  { id: "Active", label: "Get moving", Icon: Dumbbell },
  { id: "Cultural events", label: "Culture & shows", Icon: Theater },
  { id: "Food & drink", label: "Food & drink", Icon: UtensilsCrossed },
  { id: "Creative", label: "Creative", Icon: Palette },
  { id: "Classes / learning", label: "Learn something", Icon: GraduationCap },
];

const PREF_KEYWORDS: Array<[string[], string]> = [
  [["outdoor", "outside", "nature", "hike", "hiking", "walk", "park", "trail"], "Outdoor"],
  [["free", "cheap", "low cost", "low-cost", "budget", "affordable"], "Free / low cost"],
  [["indoor", "inside", "cozy", "cosy", "home", "café", "cafe"], "Indoor"],
  [["active", "sport", "sports", "gym", "run", "running", "bike", "cycling", "yoga", "swim"], "Active"],
  [["culture", "cultural", "museum", "gallery", "theatre", "theater", "concert", "exhibition"], "Cultural events"],
  [["food", "drink", "dinner", "lunch", "brunch", "wine", "beer", "cocktail", "restaurant"], "Food & drink"],
  [["creative", "art", "paint", "craft", "music", "draw", "writing", "pottery"], "Creative"],
  [["class", "classes", "learn", "learning", "course", "workshop", "study"], "Classes / learning"],
];

type Msg = { role: "user" | "assistant"; content: string };
type Unit = "hours_week" | "days_week" | "days_month";

const UNIT_ORDER: Unit[] = ["hours_week", "days_week", "days_month"];

const UNIT_META: Record<Unit, { short: string; label: string; min: number; max: number; step: number; defaultVal: number; suffix: (n: number) => string; helper: string }> = {
  hours_week: {
    short: "Hours / wk", label: "Hours per week", min: 1, max: 40, step: 1, defaultVal: 6,
    suffix: (n) => `hour${n === 1 ? "" : "s"} a week`,
    helper: "Roughly how many hours feel good for seeing people each week.",
  },
  days_week: {
    short: "Days / wk", label: "Days per week", min: 1, max: 7, step: 1, defaultVal: 2,
    suffix: (n) => `day${n === 1 ? "" : "s"} a week`,
    helper: "We'll never plan more social days than this in a single week.",
  },
  days_month: {
    short: "Days / mo", label: "Days per month", min: 1, max: 30, step: 1, defaultVal: 8,
    suffix: (n) => `day${n === 1 ? "" : "s"} a month`,
    helper: "A monthly cap — handy if your weeks vary a lot.",
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
  const [protectedKeys, setProtectedKeys] = useState<string[]>(["Sun"]);
  const [prefs, setPrefs] = useState<string[]>(["Outdoor", "Free / low cost"]);
  const [saving, setSaving] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const meta = UNIT_META[unit];

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey! Tell me what you enjoy — outdoor walks, cosy cafés, gigs, the gym… I'll tick the matching tags for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hydrate from profile (back-compat with old single-letter storage)
  useEffect(() => {
    if (!profile) return;
    setValue(profile.free_days_per_week ?? 2);
    setUnit("days_week");
    const pd = (profile.protected_days as string[]) ?? ["Sun"];
    if (pd.length) {
      // Accept either "Mon" keys or legacy single letters; for legacy, map first occurrence
      const used = new Set<number>();
      const next: string[] = [];
      pd.forEach((tok) => {
        const direct = DAYS.findIndex((d) => d.key === tok);
        if (direct !== -1) { next.push(DAYS[direct].key); return; }
        const li = LEGACY_LETTERS.findIndex((l, idx) => l === tok && !used.has(idx));
        if (li !== -1) { used.add(li); next.push(DAYS[li].key); }
      });
      if (next.length) setProtectedKeys(next);
    }
    if ((profile.activity_prefs as string[])?.length) setPrefs(profile.activity_prefs as string[]);
  }, [profile]);

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, streaming, chatOpen]);

  const switchUnit = (next: Unit) => {
    setUnit(next);
    setValue(UNIT_META[next].defaultVal);
  };

  const clamp = (n: number) => Math.max(meta.min, Math.min(meta.max, n));
  const setFromPct = (pctVal: number) => {
    const raw = meta.min + pctVal * (meta.max - meta.min);
    setValue(clamp(Math.round(raw / meta.step) * meta.step));
  };

  // Drag + click slider
  const updateFromClientX = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return;
    setFromPct(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  };
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };
  const onSliderKey = (e: React.KeyboardEvent) => {
    const big = Math.max(meta.step, Math.round((meta.max - meta.min) / 10));
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { setValue((v) => clamp(v + meta.step)); e.preventDefault(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setValue((v) => clamp(v - meta.step)); e.preventDefault(); }
    else if (e.key === "PageUp") { setValue((v) => clamp(v + big)); e.preventDefault(); }
    else if (e.key === "PageDown") { setValue((v) => clamp(v - big)); e.preventDefault(); }
    else if (e.key === "Home") { setValue(meta.min); e.preventDefault(); }
    else if (e.key === "End") { setValue(meta.max); e.preventDefault(); }
  };

  const pct = useMemo(() => ((value - meta.min) / (meta.max - meta.min)) * 100, [value, meta]);

  const toggleDay = (key: string) =>
    setProtectedKeys((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  // Quiet toggle — no chat spam on every tap
  const togglePref = (id: string) =>
    setPrefs((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

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
                "You are helping someone pick activity preferences for a social-planning app. Reply in 1 short, warm sentence acknowledging what they like. If you noticed clear preferences, briefly confirm them (e.g. 'Got it — outdoor and creative ✨'). Never list options. Never ask follow-ups longer than one short question.",
            },
            ...next,
          ],
        }),
      });

      if (resp.status === 429) {
        toast({ title: "One sec", description: "Too many messages — try again in a moment.", variant: "destructive" });
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
          if (json === "[DONE]") { finished = true; break; }
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
    // Persist legacy single-letter form for backwards-compat with existing data
    const legacyDays = protectedKeys
      .map((k) => DAYS.find((d) => d.key === k)?.short)
      .filter(Boolean) as string[];
    const { error } = await supabase
      .from("profiles")
      .update({
        free_days_per_week: toDaysPerWeek(value, unit),
        protected_days: legacyDays,
        activity_prefs: prefs,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (!error) {
      await refreshProfile();
      nav("/add-connection");
    }
  };

  // Live announcement for slider value
  const liveText = `${value} ${meta.suffix(value)}`;

  return (
    <div className="bg-white px-6 pb-6 pt-[70px]">
      <StepHeader step={2} totalSteps={3} back="/calendar-connect" />

      {/* Page heading — warmer + plainer */}
      <header className="mb-7">
        <h1 className="font-display anim-fade-up text-[28px] font-semibold leading-[1.15] tracking-tight text-foreground">
          How much togetherness feels right?
        </h1>
        <p className="anim-fade-up anim-d1 mt-2 text-[14px] leading-[1.55] text-ink2">
          Set the limits that fit your life. We'll plan inside them — never around them.
        </p>
      </header>

      {/* SECTION 1 — Time available */}
      <section className="anim-fade-up anim-d2 mb-9" aria-labelledby="time-available">
        <SectionLabel id="time-available">Your weekly rhythm</SectionLabel>

        {/* Unit segmented control */}
        <div
          role="tablist"
          aria-label="Choose how to set your limit"
          className="mb-7 grid grid-cols-3 gap-1 rounded-full border border-border bg-secondary/60 p-1"
        >
          {UNIT_ORDER.map((u) => {
            const on = unit === u;
            return (
              <button
                key={u}
                role="tab"
                aria-selected={on}
                aria-label={UNIT_META[u].label}
                type="button"
                onClick={() => switchUnit(u)}
                className={cn(
                  "rounded-full py-2 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  on
                    ? "bg-white text-foreground shadow-sm"
                    : "text-ink2 hover:text-foreground",
                )}
              >
                {UNIT_META[u].short}
              </button>
            );
          })}
        </div>

        {/* Big value display + steppers */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setValue((v) => clamp(v - meta.step))}
            disabled={value <= meta.min}
            aria-label={`Decrease ${meta.label}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border bg-white text-foreground transition-all hover:border-foreground active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Minus className="h-4 w-4" strokeWidth={2.2} />
          </button>

          <div className="flex flex-1 flex-col items-center" aria-live="polite" aria-atomic="true">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[60px] font-semibold leading-none tracking-tight text-primary tabular-nums">
                {value}
              </span>
            </div>
            <span className="mt-1.5 text-[13px] font-medium text-ink2">
              {meta.suffix(value)}
            </span>
            <span className="sr-only">{liveText}</span>
          </div>

          <button
            type="button"
            onClick={() => setValue((v) => clamp(v + meta.step))}
            disabled={value >= meta.max}
            aria-label={`Increase ${meta.label}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border bg-white text-foreground transition-all hover:border-foreground active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Slider — drag + keyboard */}
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onSliderKey}
          tabIndex={0}
          role="slider"
          aria-label={meta.label}
          aria-valuemin={meta.min}
          aria-valuemax={meta.max}
          aria-valuenow={value}
          aria-valuetext={liveText}
          className="group relative h-9 cursor-pointer touch-none select-none focus-visible:outline-none"
        >
          {/* hit area is 36px tall; visible track is centered */}
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-gradient-coral-fill transition-[width] duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div
            className="pointer-events-none absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-white bg-primary shadow-glow transition-[left] duration-150 group-focus-visible:ring-4 group-focus-visible:ring-primary/30"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[11.5px] font-medium text-ink2">
          <span>{meta.min}</span>
          <span>{meta.max}</span>
        </div>

        {/* Helper */}
        <p className="mt-4 text-[13px] leading-[1.55] text-ink2">
          {meta.helper}
        </p>
      </section>

      {/* SECTION 2 — Protected days */}
      <section className="anim-fade-up anim-d3 mb-9" aria-labelledby="protected-days">
        <SectionLabel id="protected-days">Days you'd rather keep</SectionLabel>
        <p className="mb-4 text-[13px] leading-[1.55] text-ink2">
          We'll never plan anything on these days — your time, untouched.
        </p>
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Protected days of the week">
          {DAYS.map((d) => {
            const on = protectedKeys.includes(d.key);
            return (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                aria-pressed={on}
                aria-label={`${d.long}${on ? ", protected" : ""}`}
                className={cn(
                  "flex h-12 items-center justify-center rounded-xl border-[1.5px] text-[13px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  on
                    ? "border-primary bg-primary text-white shadow-glow"
                    : "border-border bg-white text-foreground hover:border-foreground/40 active:scale-95",
                )}
              >
                {d.short}
              </button>
            );
          })}
        </div>
        {protectedKeys.length > 0 && (
          <p className="mt-3 text-[12px] text-ink2">
            Protected: <span className="font-medium text-foreground">{protectedKeys.map(k => DAYS.find(d => d.key === k)?.long).join(", ")}</span>
          </p>
        )}
      </section>

      {/* SECTION 3 — Activity preferences */}
      <section className="anim-fade-up anim-d3 mb-6" aria-labelledby="vibes">
        <SectionLabel id="vibes">Things that energise you</SectionLabel>
        <p className="mb-4 text-[13px] leading-[1.55] text-ink2">
          Pick a few — we'll lean on these when suggesting plans.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PREFS.map(({ id, label, Icon }) => {
            const on = prefs.includes(id);
            return (
              <button
                key={id}
                onClick={() => togglePref(id)}
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-2.5 rounded-2xl border-[1.5px] px-3.5 py-3 text-left text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  on
                    ? "border-primary bg-primary-bg text-primary shadow-sm"
                    : "border-border bg-white text-foreground hover:border-foreground/30 active:scale-[0.98]",
                )}
              >
                <Icon
                  className={cn("h-4 w-4 shrink-0 transition-colors", on ? "text-primary" : "text-ink2")}
                  strokeWidth={1.8}
                />
                <span className="leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* AI chat — collapsible to reduce noise */}
      <section className="anim-fade-up anim-d4 mb-7 overflow-hidden rounded-2xl border-[1.5px] border-border bg-gradient-violet">
        <button
          type="button"
          onClick={() => setChatOpen((o) => !o)}
          aria-expanded={chatOpen}
          aria-controls="vibes-chat"
          className="flex w-full items-center gap-2.5 bg-white/60 px-4 py-3 text-left backdrop-blur transition-colors hover:bg-white/80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ai">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold leading-tight text-foreground">
              Prefer to just describe it?
            </div>
            <div className="mt-0.5 text-[11.5px] leading-tight text-ink2">
              Tell our helper in your own words — we'll tick the right tags.
            </div>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-ink2 transition-transform", chatOpen && "rotate-180")}
            strokeWidth={2}
          />
        </button>

        {chatOpen && (
          <div id="vibes-chat" className="border-t border-border/60">
            <div className="max-h-[200px] space-y-2.5 overflow-y-auto px-3.5 py-3.5">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "anim-bubble max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-[1.5] shadow-sm",
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
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 border-t border-border/60 bg-white/70 px-3 py-3 backdrop-blur"
            >
              <label htmlFor="vibe-input" className="sr-only">Describe what you enjoy</label>
              <input
                id="vibe-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. I love hiking and cosy cafés…"
                disabled={streaming}
                className="flex-1 rounded-full border-[1.5px] border-border bg-white px-4 py-2.5 text-[13px] text-foreground outline-none placeholder:text-ink2 focus:border-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-glow transition-transform active:scale-95 disabled:opacity-50 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Sticky save bar with recap */}
      <div className="anim-fade-up anim-d5 sticky bottom-0 -mx-6 mt-2 border-t border-border bg-white/95 px-6 pb-5 pt-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between text-[12px]">
          <span className="text-ink2">Your commitment</span>
          <span className="font-medium text-foreground">
            {value} {meta.suffix(value)} · {protectedKeys.length} protected · {prefs.length} {prefs.length === 1 ? "vibe" : "vibes"}
          </span>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-full bg-primary px-6 py-4 text-[14px] font-semibold text-white shadow-glow transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {saving ? "Saving…" : "Save & continue"}
        </button>
      </div>
    </div>
  );
};

const SectionLabel = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <h2 id={id} className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink2">
    {children}
  </h2>
);

const TypingDots = () => (
  <span className="inline-flex gap-1" aria-label="Assistant is typing">
    <span className="type-dot h-1.5 w-1.5 rounded-full bg-ink2" style={{ animationDelay: "0s" }} />
    <span className="type-dot h-1.5 w-1.5 rounded-full bg-ink2" style={{ animationDelay: "0.2s" }} />
    <span className="type-dot h-1.5 w-1.5 rounded-full bg-ink2" style={{ animationDelay: "0.4s" }} />
  </span>
);

export default Budget;

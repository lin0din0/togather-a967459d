import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "ai" | "me"; text: string; chips?: string[] };

type DBPerson = { id: string; name: string; goal: string; example_idea: string };
type DBBlock = { date: string; start_hour: number; end_hour: number; label: string };

const PLACES = [
  "Café Lumière",
  "Riverside Park",
  "Blue Bottle on 5th",
  "The little ramen spot on Bergen",
  "Prospect Park entrance",
  "Sunday market",
];

const TIME_OPTIONS = [
  "Saturday 11am",
  "Sunday brunch (10:30am)",
  "Friday 6pm",
  "Tuesday evening",
  "Wednesday lunch",
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const detectPerson = (text: string, people: DBPerson[]) => {
  const lower = text.toLowerCase();
  return people.find((p) => lower.includes(p.name.toLowerCase()));
};

const detectIntent = (text: string): "confirm" | "decline" | "reschedule" | "place" | "open" => {
  const t = text.toLowerCase();
  if (/\b(yes|hold it|book|confirm|do it|sure|let's|sounds good)\b/.test(t)) return "confirm";
  if (/\b(no|not now|skip|cancel|nope)\b/.test(t)) return "decline";
  if (/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday|tomorrow|next week|instead|reschedule|another time)\b/.test(t)) return "reschedule";
  if (/\b(different place|somewhere else|venue|spot|café|park|restaurant)\b/.test(t)) return "place";
  return "open";
};

const Plan = () => {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const presetTime = params.get("time"); // e.g. "Sat 14:00"
  const presetWith = params.get("with"); // person name from People page

  const [people, setPeople] = useState<DBPerson[]>([]);
  const [busy, setBusy] = useState<DBBlock[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("people").select("id, name, goal, example_idea").then(({ data }) => {
      if (data) setPeople(data as DBPerson[]);
    });
    supabase.from("schedule_blocks").select("date, start_hour, end_hour, label").then(({ data }) => {
      if (data) setBusy(data as DBBlock[]);
    });
  }, []);

  // Build initial message once profile + people load
  useEffect(() => {
    if (messages.length > 0) return;
    const name = profile?.display_name ?? "friend";
    const matchedPreset = presetWith ? people.find((p) => p.name.toLowerCase() === presetWith.toLowerCase()) : null;
    const chips = people.length
      ? people.slice(0, 3).map((p) => `Brunch with ${p.name}`)
      : ["Brunch with Mom", "Coffee with a friend", "Solo walk"];
    let opener: string;
    if (matchedPreset) {
      opener = `Hi ${name} 🌸 Let's plan something with ${matchedPreset.name}. Their goal: ${matchedPreset.goal || "a low-key catch-up"}. Vibe?`;
    } else if (presetTime) {
      opener = `Hi ${name} 🌸 You tapped a free pocket on ${presetTime}. Who do you want to plan with?`;
    } else {
      opener = `Hi ${name} 🌸 Want me to plan something this week? Tell me who, and the vibe.`;
    }
    setMessages([{ role: "ai", text: opener, chips }]);
  }, [profile, people, presetTime, presetWith, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const replyTo = (text: string): Msg => {
    const intent = detectIntent(text);
    const person = detectPerson(text, people);

    if (intent === "confirm") {
      return {
        role: "ai",
        text: person
          ? `Done — I've held the spot for you and ${person.name}. They'll get a gentle nudge. Want me to suggest a backup in case it shifts?`
          : `Locked in. I'll send a soft reminder the morning of, and a calendar block. Anything else to plan?`,
        chips: ["Suggest a backup time", "Add to calendar", "Plan something else"],
      };
    }

    if (intent === "decline") {
      return {
        role: "ai",
        text: "No worries — I won't push. Want me to try a different time, or queue it for next week?",
        chips: ["Try next week", "Different time", "Skip for now"],
      };
    }

    if (intent === "reschedule") {
      const t = pick(TIME_OPTIONS);
      return {
        role: "ai",
        text: person
          ? `${person.name} also looks free ${t}. Want me to hold that instead?`
          : `How about ${t}? It looks open on your side.`,
        chips: ["Yes, hold it", "Try another time", "Suggest a place"],
      };
    }

    if (intent === "place") {
      const place = pick(PLACES);
      return {
        role: "ai",
        text: `${place} has good energy and a quiet corner. Quick walk from your usual spot. Shall I propose it?`,
        chips: ["Yes, propose it", "Somewhere quieter", "Outdoors instead"],
      };
    }

    // Open / planning intent
    if (person) {
      const goal = person.goal || "a low-key catch-up";
      const idea = person.example_idea || "coffee";
      const t = pick(TIME_OPTIONS);
      return {
        role: "ai",
        text: `Lovely. ${person.name}'s goal is ${goal.toLowerCase()} — ${idea} fits perfectly. ${t} works for both of you. Shall I hold it?`,
        chips: ["Yes, hold it", "Try a different time", "Suggest a different place"],
      };
    }

    if (people.length === 0) {
      return {
        role: "ai",
        text: "I don't see anyone in your circle yet — add a few people first and I'll match times against their cadence.",
        chips: ["Take me to People", "Plan solo time"],
      };
    }

    const someone = pick(people);
    return {
      role: "ai",
      text: `Tell me a bit more — who's it with? I noticed ${someone.name} hasn't been on your calendar in a while.`,
      chips: [`Plan with ${someone.name}`, ...people.slice(0, 2).filter((p) => p.id !== someone.id).map((p) => `Plan with ${p.name}`)],
    };
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    const me: Msg = { role: "me", text };
    setMessages((m) => [...m, me]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, replyTo(text)]);
      setThinking(false);
    }, 600 + Math.random() * 500);
  };

  const headerSub = useMemo(() => {
    const free = busy.length === 0 ? "Lots of openings" : `${busy.length} busy block${busy.length === 1 ? "" : "s"} this week`;
    return `${people.length} in circle · ${free}`;
  }, [people.length, busy.length]);

  return (
    <div className="animate-fade-in flex h-[calc(100vh-13rem)] flex-col">
      <header className="mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-ai text-ai-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Plan with AI</h1>
            <p className="text-xs text-muted-foreground">{headerSub}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-end overflow-hidden">
        <div className="space-y-3 overflow-y-auto pb-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex animate-fade-in", m.role === "me" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-card",
                  m.role === "me"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border bg-card",
                )}
              >
                <p className="leading-relaxed">{m.text}</p>
                {m.chips && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.chips.map((c) => (
                      <button
                        key={c}
                        onClick={() => send(c)}
                        className="rounded-full bg-ai-soft px-3 py-1 text-xs font-medium text-ai hover:bg-ai/15"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-3xl rounded-bl-md border border-border bg-card px-4 py-3 shadow-card">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "120ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "240ms" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-2 flex shrink-0 items-center gap-2 rounded-full border border-border bg-card p-1.5 shadow-card"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell the AI what you want to plan…"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-full bg-gradient-warm">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default Plan;

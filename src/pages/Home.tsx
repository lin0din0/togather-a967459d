import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Bell } from "lucide-react";
import { useAuth, initialsOf } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string; initials: string; connection_type: string; cadence: string; last_met: string; status: string };
type Reminder = { person_id?: string; person_name?: string; title?: string; message: string };

const today = new Date();
const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const weekStart = (() => { const d = new Date(today); const dow = (d.getDay()+6)%7; d.setDate(d.getDate()-dow); return d; })();

const Home = () => {
  const { profile } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);

  useEffect(() => {
    supabase.from("people").select("id,name,initials,connection_type,cadence,last_met,status").limit(8).then(({ data }) => {
      if (data) setPeople(data as Person[]);
    });

    // Fetch smart reminders for overdue cadences via n8n webhook
    supabase.functions.invoke("smart-reminder").then(({ data, error }) => {
      if (!error && data?.reminders) setReminders(data.reminders as Reminder[]);
      setRemindersLoading(false);
    }).catch(() => setRemindersLoading(false));
  }, []);

  const name = profile?.display_name ?? "friend";
  const todayLabel = today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const hero = people[0];
  const tints = ["bg-primary-bg", "bg-ai-bg", "bg-success-bg", "bg-warning-bg"];
  const variants = ["coral","violet","teal","neutral"] as const;

  return (
    <div className="bg-surface min-h-full pb-6 pt-[50px]">
      {/* Header */}
      <div className="bg-gradient-soft px-[22px] pb-4 pt-3.5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[12px] text-muted-foreground">{todayLabel}</div>
            <h1 className="font-display text-[24px] font-semibold leading-[1.1]">Hello, {name}</h1>
          </div>
          <Link to="/profile" className="relative flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-foreground bg-gradient-coral-fill text-[14px] font-semibold text-white">
            {initialsOf(name)}
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary" />
          </Link>
        </div>

        {/* Hero card */}
        <Link to={hero ? `/chat/${hero.id}` : "/add-connection"} className="block min-h-[160px] overflow-hidden rounded-[24px] border-[1.5px] border-foreground bg-primary p-[18px] text-white">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/65">
            {hero ? "Coming up · plan with" : "Get started"}
          </div>
          <div className="font-display mt-1 text-[24px] leading-[1.15]">
            {hero ? <>Plan · <em className="italic">{hero.name}</em></> : "Add your first connection"}
          </div>
          <div className="mt-2.5 flex gap-1.5">
            <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 text-[11px]">This week</span>
            {hero && <span className="rounded-full border border-white/25 bg-white/20 px-2.5 py-1 text-[11px]">{hero.cadence}</span>}
          </div>
        </Link>
      </div>

      {/* Week strip */}
      <div className="px-[22px] pt-3.5">
        <div className="flex gap-1.5">
          {days.map((d, i) => {
            const date = new Date(weekStart); date.setDate(date.getDate() + i);
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div key={i} className={cn(
                "flex-1 rounded-xl border-[1.5px] py-2 text-center",
                isToday ? "border-foreground bg-foreground" : "border-transparent bg-white",
              )}>
                <div className={cn("text-[9px] font-medium uppercase tracking-wider", isToday ? "text-white/55" : "text-ink4")}>{d}</div>
                <div className={cn("mt-0.5 text-[14px] font-semibold", isToday ? "text-white" : "text-foreground")}>{date.getDate()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI nudge */}
      <div className="px-[22px] pt-3.5">
        <Link to="/chat" className="flex gap-2.5 rounded-2xl border-[1.5px] border-foreground bg-ai-bg p-3.5">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-foreground bg-ai">
            <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={1.8} />
          </div>
          <div className="text-[12px] leading-[1.55] text-[#3A2680]">
            {people[1] ? `${people[1].name} is free this week and you haven't met in a while.` : "Add people and Togather will start finding free windows."}
            <div className="mt-1 text-[11px] font-semibold text-ai">Plan something →</div>
          </div>
        </Link>
      </div>

      {/* People bento */}
      <div className="mt-4 flex items-baseline justify-between px-[22px]">
        <div className="text-[20px] font-semibold tracking-tight">Your people</div>
        <Link to="/chat" className="text-[12px] font-medium text-primary">See all</Link>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 px-[22px]">
        {people.slice(0, 4).map((p, i) => (
          <Link key={p.id} to={`/chat/${p.id}`}
            className={cn("rounded-[20px] border-[1.5px] border-foreground p-3.5", tints[i % tints.length])}>
            <div className={cn(
              "mb-2.5 flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-white",
              variants[i % variants.length] === "coral" ? "bg-gradient-coral-fill" :
              variants[i % variants.length] === "violet" ? "bg-ai" :
              variants[i % variants.length] === "teal" ? "bg-success" : "bg-ink4"
            )}>{p.initials}</div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-foreground/40">{p.connection_type}</div>
            <div className="text-[15px] font-semibold leading-tight">{p.name}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">{p.cadence}</div>
          </Link>
        ))}
      </div>
      <Link to="/add-connection" className="mx-[22px] mt-3 flex items-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-[#D0D0D0] p-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed border-[#CCC] text-ink4">+</div>
        <div>
          <div className="text-[13px] font-medium text-muted-foreground">Add a connection</div>
          <div className="text-[11px] text-ink4">Invite someone to plan with</div>
        </div>
      </Link>

      {/* Budget */}
      <div className="mt-4 px-[22px]">
        <div className="rounded-[20px] border-[1.5px] border-foreground bg-foreground p-4 text-white">
          <div className="mb-2 flex justify-between">
            <div className="text-[13px] font-semibold">Free time this week</div>
            <Link to="/budget" className="text-[11px] font-medium text-primary">Edit</Link>
          </div>
          <div className="mb-2 text-[26px] font-semibold tracking-tight">
            0 <span className="text-[15px] font-normal text-white/50">of {profile?.free_days_per_week ?? 2} days used</span>
          </div>
          <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-gradient-coral-fill" style={{ width: "0%" }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(profile?.activity_prefs ?? []).slice(0, 3).map((c, i) => (
              <span key={c} className={cn("rounded-full px-2.5 py-1 text-[10px] font-medium", i === 0 ? "bg-primary text-white" : "bg-white/10 text-white/60")}>{c}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

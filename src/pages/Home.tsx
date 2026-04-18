import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Bell, Plus, ArrowRight, CalendarDays } from "lucide-react";
import { useAuth, initialsOf } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Person = { id: string; name: string; initials: string; connection_type: string; cadence: string; last_met: string; status: string };
type Reminder = { person_id?: string; person_name?: string; title?: string; message: string };

const today = new Date();
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekStart = (() => {
  const d = new Date(today);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return d;
})();

const Home = () => {
  const { profile } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("people")
      .select("id,name,initials,connection_type,cadence,last_met,status")
      .limit(8)
      .then(({ data }) => {
        if (data) setPeople(data as Person[]);
      });

    supabase.functions
      .invoke("smart-reminder")
      .then(({ data, error }) => {
        if (!error && data?.reminders) setReminders(data.reminders as Reminder[]);
        setRemindersLoading(false);
      })
      .catch(() => setRemindersLoading(false));
  }, []);

  const name = profile?.display_name ?? "friend";
  const todayLabel = today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  const hero = people[0];
  const tints = ["bg-primary-bg", "bg-ai-bg", "bg-success-bg", "bg-warning-bg"];
  const variants = ["coral", "violet", "teal", "neutral"] as const;

  return (
    <div className="min-h-full bg-surface pb-8">
      {/* ===== HEADER — illustrated greeting ===== */}
      <header className="relative overflow-hidden bg-gradient-soft px-5 pb-6 pt-[60px]">
        {/* Top bar: date + avatar */}
        <div className="relative z-10 mb-4 flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {todayLabel}
            </p>
            <h1 className="font-display mt-1 text-[28px] font-normal leading-[1.05] text-foreground">
              Hello,<br />
              <span className="italic font-light">{name}</span>
            </h1>
          </div>
          <Link
            to="/profile"
            aria-label="Open profile"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-foreground bg-gradient-coral-fill text-[14px] font-semibold text-white shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {initialsOf(name)}
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-primary" />
          </Link>
        </div>

        {/* Hero card */}
        <Link
          to={hero ? `/chat/${hero.id}` : "/add-connection"}
          className="group relative z-10 mt-2 block overflow-hidden rounded-[24px] border-[1.5px] border-foreground bg-primary p-5 text-white shadow-soft transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                {hero ? "Coming up" : "Get started"}
              </p>
              <h2 className="font-display mt-1.5 text-[22px] leading-[1.15]">
                {hero ? (
                  <>
                    Plan with <em className="italic">{hero.name}</em>
                  </>
                ) : (
                  "Add your first connection"
                )}
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
                  This week
                </span>
                {hero?.cadence && (
                  <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
                    {hero.cadence}
                  </span>
                )}
              </div>
            </div>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform group-hover:translate-x-0.5"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </span>
          </div>
        </Link>
      </header>

      {/* ===== WEEK STRIP ===== */}
      <section aria-label="This week" className="px-5 pt-5">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            This week
          </h3>
          <Link
            to="/calendar"
            className="flex items-center gap-1 text-[12px] font-medium text-primary focus-visible:outline-none focus-visible:underline"
          >
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
            Calendar
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border-[1.5px] py-2 text-center transition-colors",
                  isToday
                    ? "border-foreground bg-foreground"
                    : "border-border bg-card hover:border-foreground/20",
                )}
              >
                <div
                  className={cn(
                    "text-[9px] font-semibold uppercase tracking-wider",
                    isToday ? "text-white/60" : "text-ink4",
                  )}
                >
                  {d}
                </div>
                <div
                  className={cn(
                    "mt-0.5 text-[14px] font-semibold tabular-nums",
                    isToday ? "text-white" : "text-foreground",
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== AI NUDGE ===== */}
      <section className="px-5 pt-4">
        <Link
          to="/chat"
          className="flex items-start gap-3 rounded-2xl border-[1.5px] border-foreground bg-ai-bg p-4 transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ai focus-visible:ring-offset-2"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-foreground bg-ai shadow-soft">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ai">
              Togather AI
            </p>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#3A2680]">
              {people[1]
                ? `${people[1].name} is free this week and you haven't met in a while.`
                : "Add people and Togather will start finding free windows."}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-ai">
              Plan something <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
            </p>
          </div>
        </Link>
      </section>

      {/* ===== SMART REMINDERS ===== */}
      {(remindersLoading || reminders.length > 0) && (
        <section className="px-5 pt-5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Gentle reminders
            </h3>
          </div>
          {remindersLoading ? (
            <div className="rounded-2xl border-[1.5px] border-border bg-card p-4">
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <div className="space-y-2">
              {reminders.slice(0, 3).map((r, i) => {
                const target = r.person_id ? `/chat/${r.person_id}` : "/chat";
                return (
                  <Link
                    key={i}
                    to={target}
                    className="block rounded-2xl border-[1.5px] border-foreground bg-card p-4 transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {r.person_name && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {r.person_name}
                      </p>
                    )}
                    {r.title && (
                      <p className="mt-0.5 text-[14px] font-semibold leading-tight text-foreground">
                        {r.title}
                      </p>
                    )}
                    <p className="mt-1 text-[13px] leading-[1.5] text-ink2">{r.message}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ===== PEOPLE BENTO ===== */}
      <section className="px-5 pt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-[22px] font-semibold tracking-tight">Your people</h2>
          <Link
            to="/chat"
            className="text-[12px] font-medium text-primary focus-visible:outline-none focus-visible:underline"
          >
            See all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {people.slice(0, 4).map((p, i) => (
            <Link
              key={p.id}
              to={`/chat/${p.id}`}
              className={cn(
                "rounded-[20px] border-[1.5px] border-foreground p-4 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                tints[i % tints.length],
              )}
            >
              <div
                className={cn(
                  "mb-3 flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold text-white shadow-soft",
                  variants[i % variants.length] === "coral"
                    ? "bg-gradient-coral-fill"
                    : variants[i % variants.length] === "violet"
                    ? "bg-ai"
                    : variants[i % variants.length] === "teal"
                    ? "bg-success"
                    : "bg-ink4",
                )}
              >
                {p.initials}
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground/45">
                {p.connection_type}
              </p>
              <p className="mt-0.5 text-[15px] font-semibold leading-tight text-foreground">
                {p.name}
              </p>
              <p className="mt-1 text-[10.5px] text-muted-foreground">{p.cadence}</p>
            </Link>
          ))}

          {/* Add connection — fits the grid */}
          <Link
            to="/add-connection"
            className={cn(
              "flex flex-col items-start justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-foreground/25 bg-card p-4 transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              people.length % 2 === 0 ? "col-span-2" : "",
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-dashed border-foreground/30 text-ink4">
              <Plus className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Add a connection</p>
              <p className="text-[11px] text-muted-foreground">Invite someone to plan with</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ===== BUDGET ===== */}
      <section className="px-5 pt-5">
        <div className="rounded-[24px] border-[1.5px] border-foreground bg-foreground p-5 text-white shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold">Free time this week</p>
            <Link
              to="/budget"
              className="text-[11px] font-medium text-primary focus-visible:outline-none focus-visible:underline"
            >
              Edit
            </Link>
          </div>
          <p className="mb-3 text-[28px] font-semibold tracking-tight">
            0{" "}
            <span className="text-[15px] font-normal text-white/55">
              of {profile?.free_days_per_week ?? 2} days used
            </span>
          </p>
          <div
            className="mb-3 h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={0}
            aria-valuemin={0}
            aria-valuemax={profile?.free_days_per_week ?? 2}
          >
            <div className="h-full bg-gradient-coral-fill" style={{ width: "0%" }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(profile?.activity_prefs ?? []).slice(0, 3).map((c, i) => (
              <span
                key={c}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium",
                  i === 0 ? "bg-primary text-white" : "bg-white/10 text-white/65",
                )}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Ev = { id: string; title: string; event_date: string; start_time: string; end_time: string; location: string; cost_label: string; status: string };

const CalendarView = () => {
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<Ev[]>([]);

  const month = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const today = new Date();

  useEffect(() => {
    supabase.from("events").select("*").order("event_date").then(({ data }) => {
      if (data) setEvents(data as Ev[]);
    });
  }, []);

  const eventDates = new Set(events.map((e) => e.event_date));
  const cells: Array<{ d: number | null; iso?: string }> = [];
  for (let i = 0; i < startOffset; i++) cells.push({ d: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(anchor.getFullYear(), anchor.getMonth(), d).toISOString().slice(0, 10);
    cells.push({ d, iso });
  }

  return (
    <div className="bg-white px-[22px] pb-6 pt-[60px]">
      <div className="font-display mb-4 flex items-center justify-between text-[24px] font-semibold tracking-tight">
        {month}
        <div className="flex gap-1.5">
          <button onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-border">
            <ChevronLeft className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
          </button>
          <button onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-border">
            <ChevronRight className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="mb-2.5 flex items-center justify-between rounded-xl border border-success-soft bg-success-bg px-3.5 py-2.5">
        <span className="text-[12px] font-medium text-success">{events.length} planned this month</span>
        <span className="text-[11px] text-success underline">Edit budget</span>
      </div>

      <div className="mb-5 grid grid-cols-7 gap-1">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={i} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink4">{d}</div>
        ))}
        {cells.map((c, i) => {
          const isToday = c.iso && new Date(c.iso).toDateString() === today.toDateString();
          const hasEvent = c.iso && eventDates.has(c.iso);
          return (
            <div key={i} className={cn(
              "relative flex aspect-square items-center justify-center rounded-[10px] text-[13px] font-medium",
              !c.d && "text-ink4",
              isToday ? "bg-foreground text-white" : "text-foreground",
            )}>
              {c.d ?? ""}
              {hasEvent && !isToday && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
              {hasEvent && isToday && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white" />}
            </div>
          );
        })}
      </div>

      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink4">Upcoming</div>
      {events.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-muted-foreground">No events yet — start a chat to plan one.</div>
      ) : events.map((e) => (
        <div key={e.id} className="flex gap-2.5 border-b border-border py-3">
          <div className="min-w-[44px] pt-0.5 text-right text-[12px] font-semibold text-muted-foreground">
            {new Date(e.event_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </div>
          <div className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
            e.status === "confirmed" ? "bg-primary" : e.status === "proposed" ? "bg-ai" : "bg-success")} />
          <div className="flex-1">
            <div className="text-[13px] font-semibold">{e.title}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {e.start_time}{e.end_time ? `–${e.end_time}` : ""} · {e.location || "TBD"} · {e.cost_label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default CalendarView;

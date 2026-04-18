import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { events } from "@/data/mock";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i); // 7am – 8pm

type Block = {
  id: string;
  date: string;
  start_hour: number;
  end_hour: number;
  label: string;
  kind: "work" | "personal" | "family";
};

const fmtHour = (h: number) => {
  const hr = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 || h === 24 ? "am" : "pm";
  return `${hr}${h === 12 ? "" : ""}:00${h >= 12 && h < 24 ? "pm" : "am"}`.replace("am", "am").replace("pm", "pm");
};
const fmtH = (h: number) => {
  const hr = h % 12 === 0 ? 12 : h % 12;
  const suf = h < 12 ? "am" : "pm";
  return `${hr}${suf}`;
};

const startOfWeek = (d: Date) => {
  const out = new Date(d);
  const day = (out.getDay() + 6) % 7; // Mon = 0
  out.setDate(out.getDate() - day);
  out.setHours(0, 0, 0, 0);
  return out;
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const KIND_STYLES: Record<Block["kind"], string> = {
  work: "border-ai bg-ai-soft/60",
  family: "border-primary bg-primary-soft/60",
  personal: "border-secondary-foreground/40 bg-secondary/60",
};

const Schedule = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date("2026-04-18")));
  const [selectedIdx, setSelectedIdx] = useState(5); // default Saturday
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dialog, setDialog] = useState<{ open: boolean; hour: number | null }>({ open: false, hour: null });
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<Block["kind"]>("personal");
  const [duration, setDuration] = useState(1);

  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [anchor]);

  const selectedDate = week[selectedIdx];
  const dateStr = isoDate(selectedDate);

  const loadBlocks = async () => {
    if (!user) return;
    const start = isoDate(week[0]);
    const end = isoDate(week[6]);
    const { data, error } = await supabase
      .from("schedule_blocks")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("start_hour");
    if (error) { console.error(error); return; }
    setBlocks((data ?? []) as Block[]);
  };

  useEffect(() => { loadBlocks(); /* eslint-disable-next-line */ }, [user, anchor]);

  const dayEvents = events.filter((e) => e.date === dateStr);
  const dayBlocks = blocks.filter((b) => b.date === dateStr);

  const openAdd = (h: number) => {
    setDialog({ open: true, hour: h });
    setLabel("");
    setKind("personal");
    setDuration(1);
  };

  const saveBlock = async () => {
    if (!user || dialog.hour === null) return;
    const trimmed = label.trim() || "Busy";
    const { error } = await supabase.from("schedule_blocks").insert({
      user_id: user.id,
      date: dateStr,
      start_hour: dialog.hour,
      end_hour: Math.min(24, dialog.hour + duration),
      label: trimmed,
      kind,
    });
    if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Block added", description: `${trimmed} · ${fmtH(dialog.hour)}` });
    setDialog({ open: false, hour: null });
    loadBlocks();
  };

  const deleteBlock = async (id: string) => {
    const { error } = await supabase.from("schedule_blocks").delete().eq("id", id);
    if (error) { toast({ title: "Couldn't delete", description: error.message, variant: "destructive" }); return; }
    setBlocks((b) => b.filter((x) => x.id !== id));
  };

  const planFreeSlot = (h: number) => {
    navigate(`/plan?time=${encodeURIComponent(`${selectedDate.toLocaleDateString(undefined, { weekday: "short" })} ${fmtH(h)}`)}`);
  };

  const weekLabel = `${week[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${week[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="animate-fade-in">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your week</h1>
          <p className="text-sm text-muted-foreground">{weekLabel}</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" className="h-9 w-9 rounded-full" onClick={() => { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-9 w-9 rounded-full" onClick={() => { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d); }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mini week strip */}
      <div className="mb-6 grid grid-cols-7 gap-1.5">
        {week.map((d, i) => {
          const active = i === selectedIdx;
          const dayName = d.toLocaleDateString(undefined, { weekday: "short" });
          return (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`rounded-2xl p-2 text-center transition-all ${
                active ? "bg-gradient-warm text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase opacity-80">{dayName}</p>
              <p className="mt-0.5 text-lg font-bold">{d.getDate()}</p>
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2>
        <span className="text-xs text-muted-foreground">
          {dayEvents.length + dayBlocks.length} blocks
        </span>
      </div>

      <div className="space-y-1">
        {HOURS.map((h) => {
          const event = dayEvents.find((ev) => parseInt(ev.time) === h);
          const block = dayBlocks.find((b) => b.start_hour <= h && b.end_hour > h);
          const isBlockStart = block && block.start_hour === h;
          return (
            <div key={h} className="flex gap-3">
              <span className="w-12 shrink-0 pt-2 text-right text-xs font-medium text-muted-foreground">
                {fmtH(h)}
              </span>
              <div className="flex-1 border-t border-dashed border-border pt-1">
                {event ? (
                  <Link to={`/events/${event.id}`} className="block rounded-2xl bg-gradient-soft p-3 shadow-card">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{event.emoji}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                  </Link>
                ) : block ? (
                  isBlockStart ? (
                    <div className={cn("group flex items-center justify-between rounded-xl border-l-[3px] px-3 py-2", KIND_STYLES[block.kind])}>
                      <div>
                        <p className="text-sm font-medium">{block.label}</p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Busy · {fmtH(block.start_hour)}–{fmtH(block.end_hour)}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100" onClick={() => deleteBlock(block.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-9 rounded-xl bg-muted/30" />
                  )
                ) : (
                  <button
                    onClick={() => planFreeSlot(h)}
                    onContextMenu={(e) => { e.preventDefault(); openAdd(h); }}
                    className="group flex h-9 w-full items-center justify-between rounded-xl border border-dashed border-transparent px-3 transition-all hover:border-primary/40 hover:bg-primary-soft/30"
                  >
                    <span className="text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      <Sparkles className="mr-1 inline h-3 w-3" /> Plan something at {fmtH(h)}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); openAdd(h); }}
                      className="ml-auto rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground group-hover:opacity-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Tap a free slot to plan with AI · tap the + to add a busy block
      </p>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o, hour: o ? dialog.hour : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a busy block</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })} · starting at {dialog.hour !== null ? fmtH(dialog.hour) : ""}
            </p>
            <div>
              <Label htmlFor="lbl">What is it?</Label>
              <Input id="lbl" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Design review" className="mt-1.5 rounded-xl" autoFocus />
            </div>
            <div>
              <Label>Kind</Label>
              <div className="mt-1.5 flex gap-2">
                {(["personal", "work", "family"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                      kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground",
                    )}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Duration</Label>
              <div className="mt-1.5 flex gap-2">
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      duration === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground",
                    )}
                  >
                    {d}h
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog({ open: false, hour: null })}>Cancel</Button>
            <Button onClick={saveBlock}>Add block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;

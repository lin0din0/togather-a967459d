import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/Avatar";
import { events, people } from "@/data/mock";

const today = new Date("2026-04-18");
const formatWhen = (iso: string, time: string) => {
  const d = new Date(iso);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const prefix =
    diff === 0 ? "Today" : diff === 1 ? "Tomorrow" :
    d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  return `${prefix} · ${time}`;
};

const EventDetails = () => {
  const { id } = useParams();
  const event = events.find((e) => e.id === id) ?? events[0];
  const attendees = people.filter((p) => event.attendees.includes(p.id));

  return (
    <div className="animate-fade-in">
      <Link to="/home" className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="overflow-hidden rounded-3xl bg-gradient-soft p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-background/80 text-3xl shadow-card">
            {event.emoji}
          </div>
          <div className="flex-1">
            <span className="inline-block rounded-full bg-background/70 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider">
              {event.type} · {event.visibility}
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight">{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Row icon={Calendar} label={formatWhen(event.date, event.time)} />
        <Row icon={MapPin} label={event.location} />
      </div>

      <h2 className="mb-3 mt-7 text-lg font-semibold">Who's coming</h2>
      <ul className="space-y-2">
        {attendees.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-card">
            <PersonAvatar initials={p.initials} color={p.avatarColor} />
            <div className="flex-1">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">Going</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
          </li>
        ))}
      </ul>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <Button variant="outline" className="rounded-full">
          <MessageCircle className="h-4 w-4" /> Group chat
        </Button>
        <Button className="rounded-full bg-gradient-warm shadow-soft">Confirm I'm in</Button>
      </div>
    </div>
  );
};

const Row = ({ icon: Icon, label }: { icon: typeof Calendar; label: string }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

export default EventDetails;

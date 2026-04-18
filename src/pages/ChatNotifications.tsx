import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BellOff } from "lucide-react";
import { useState } from "react";

const OPTIONS = [
  { id: "on", label: "All messages", desc: "Notify me for everything in this chat." },
  { id: "mentions", label: "Mentions only", desc: "Just when the AI tags me with a plan." },
  { id: "8h", label: "Mute for 8 hours", desc: "Quiet for the rest of today." },
  { id: "1w", label: "Mute for 1 week", desc: "I'll catch up next week." },
  { id: "off", label: "Off", desc: "No notifications until I turn it back on." },
];

const ChatNotifications = () => {
  const { personId } = useParams();
  const [value, setValue] = useState("on");

  return (
    <div className="flex min-h-full flex-col bg-surface px-5 pb-8 pt-[60px]">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={`/chat/${personId}`}
          aria-label="Back to chat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <BellOff className="mr-1 inline h-3 w-3" /> Notifications
          </p>
          <h1 className="font-display text-[22px] font-semibold leading-tight">Mute this chat</h1>
        </div>
      </div>

      <ul className="space-y-2">
        {OPTIONS.map((o) => {
          const selected = value === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => setValue(o.id)}
                className={
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors " +
                  (selected ? "border-foreground bg-card" : "border-border bg-card hover:border-foreground/30")
                }
              >
                <span
                  className={
                    "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 " +
                    (selected ? "border-foreground" : "border-border")
                  }
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-foreground" />}
                </span>
                <span className="flex-1">
                  <span className="block text-[14px] font-medium text-foreground">{o.label}</span>
                  <span className="mt-0.5 block text-[12.5px] text-muted-foreground">{o.desc}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ChatNotifications;

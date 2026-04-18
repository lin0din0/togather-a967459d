import { Bell, Calendar, Check, Gift, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reminders } from "@/data/mock";

const iconFor = (k: string) => {
  if (k === "ai") return Sparkles;
  if (k === "gift") return Gift;
  if (k === "leave") return Calendar;
  return Bell;
};

const Notifications = () => {
  return (
    <div className="animate-fade-in">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground">Reminders & gentle nudges</p>
      </header>

      <ul className="space-y-2">
        {reminders.map((r) => {
          const Icon = iconFor(r.kind);
          const isAi = r.kind === "ai";
          return (
            <li
              key={r.id}
              className={`rounded-2xl border p-4 shadow-card ${
                isAi ? "border-ai/30 bg-ai-soft" : "border-border/60 bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isAi ? "bg-ai text-ai-foreground" : "bg-primary-soft text-primary"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.when}</p>
                </div>
                {!isAi && (
                  <button className="rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground shadow-card">
                    Open
                  </button>
                )}
              </div>
              {isAi && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1 rounded-full bg-ai text-ai-foreground hover:bg-ai/90">
                    <Check className="h-4 w-4" /> Yes, propose it
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-full">
                    <X className="h-4 w-4" /> Skip
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Notifications;

import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

const ChatAIPreferences = () => {
  const { personId } = useParams();
  const [suggestions, setSuggestions] = useState(true);
  const [proactive, setProactive] = useState(true);
  const [tone, setTone] = useState<"warm" | "concise" | "playful">("warm");

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ai">
            <Sparkles className="mr-1 inline h-3 w-3" /> Togather AI
          </p>
          <h1 className="font-display text-[22px] font-semibold leading-tight">Assistant preferences</h1>
        </div>
      </div>

      <ul className="space-y-2">
        <li className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="pr-3">
            <p className="text-[14px] font-medium">Plan suggestions</p>
            <p className="text-[12px] text-muted-foreground">Suggest meet-up windows based on your calendar.</p>
          </div>
          <Switch checked={suggestions} onCheckedChange={setSuggestions} />
        </li>
        <li className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="pr-3">
            <p className="text-[14px] font-medium">Proactive nudges</p>
            <p className="text-[12px] text-muted-foreground">Let the AI start the chat when it's been a while.</p>
          </div>
          <Switch checked={proactive} onCheckedChange={setProactive} />
        </li>
      </ul>

      <section className="mt-6">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Tone of voice</p>
        <div className="flex gap-2">
          {(["warm", "concise", "playful"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors " +
                (tone === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:border-foreground/40")
              }
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <p className="mt-8 text-[12px] text-muted-foreground">
        These preferences are saved locally for now and will sync to your profile soon.
      </p>
    </div>
  );
};

export default ChatAIPreferences;

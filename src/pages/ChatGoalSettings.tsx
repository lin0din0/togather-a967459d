import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const CADENCES = ["1×/week", "2×/month", "1×/month", "Every few months", "When it feels right"];

const ChatGoalSettings = () => {
  const { personId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [cadence, setCadence] = useState("1×/month");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!personId || !user) return;
    supabase
      .from("people")
      .select("name,goal,cadence")
      .eq("id", personId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setName(data.name ?? "");
        setGoal(data.goal ?? "");
        setCadence(data.cadence ?? "1×/month");
      });
  }, [personId, user]);

  const save = async () => {
    if (!personId) return;
    setSaving(true);
    const { error } = await supabase
      .from("people")
      .update({ goal, cadence })
      .eq("id", personId);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: "Goal & cadence updated." });
    navigate(`/chat/${personId}`);
  };

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
            Chat settings
          </p>
          <h1 className="font-display text-[22px] font-semibold leading-tight">
            Goal & cadence{name ? ` · ${name}` : ""}
          </h1>
        </div>
      </div>

      <section className="mb-6">
        <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your goal with this connection
        </label>
        <Input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Stay close while we live in different cities"
          className="rounded-xl"
        />
      </section>

      <section className="mb-8">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          How often do you want to meet?
        </p>
        <div className="flex flex-wrap gap-2">
          {CADENCES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCadence(c)}
              className={
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
                (cadence === c
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground hover:border-foreground/40")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <Button onClick={save} disabled={saving} className="rounded-2xl">
        <Check className="mr-1.5 h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
};

export default ChatGoalSettings;

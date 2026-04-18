import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { interestsList } from "@/data/mock";
import { useAuth, initialsOf } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const steps = ["Interests", "People", "Preferences"];

type DraftPerson = {
  name: string;
  relation: string;
  picked: boolean;
};

const suggested: DraftPerson[] = [
  { name: "Mom", relation: "Family", picked: false },
  { name: "Aunt Lila", relation: "Family", picked: false },
  { name: "Sam", relation: "Friend", picked: false },
];

const colors = ["14 88% 62%", "265 60% 70%", "152 55% 45%", "190 70% 50%", "32 80% 60%", "340 70% 60%"];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>(["Brunch", "Hiking"]);
  const [people, setPeople] = useState<DraftPerson[]>(suggested);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualRelation, setManualRelation] = useState("Friend");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  // Already-added existing people for this user (so re-running onboarding doesn't duplicate)
  useEffect(() => {
    if (!user) return;
    supabase.from("people").select("name").eq("user_id", user.id).then(({ data }) => {
      if (!data) return;
      const existing = new Set(data.map((d) => d.name.toLowerCase()));
      setPeople((prev) => prev.map((p) => existing.has(p.name.toLowerCase()) ? { ...p, picked: true } : p));
    });
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const toggle = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const togglePerson = (name: string) =>
    setPeople((prev) => prev.map((p) => (p.name === name ? { ...p, picked: !p.picked } : p)));

  const removePerson = (name: string) =>
    setPeople((prev) => prev.filter((p) => p.name !== name));

  const addManual = () => {
    const trimmed = manualName.trim();
    if (!trimmed) return;
    if (people.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Already added", description: `${trimmed} is already in your list.` });
      return;
    }
    setPeople((prev) => [...prev, { name: trimmed, relation: manualRelation, picked: true }]);
    setManualName("");
    setManualRelation("Friend");
    setManualOpen(false);
  };

  const canContinue =
    step === 0 ? interests.length > 0 :
    true;

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const picked = people.filter((p) => p.picked);
      if (picked.length) {
        // Skip ones we've already inserted (by name)
        const { data: existing } = await supabase.from("people").select("name").eq("user_id", user.id);
        const existingNames = new Set((existing ?? []).map((d) => d.name.toLowerCase()));
        const fresh = picked.filter((p) => !existingNames.has(p.name.toLowerCase()));
        if (fresh.length) {
          const rows = fresh.map((p, idx) => ({
            user_id: user.id,
            name: p.name,
            relation: p.relation,
            connection_type: p.relation === "Family" ? "Close family" : p.relation === "Colleague" ? "Work colleague" : "Hobby buddy",
            initials: initialsOf(p.name),
            avatar_color: colors[idx % colors.length],
            cadence: "1×/month",
            example_idea: "Coffee catch-up",
          }));
          const { error } = await supabase.from("people").insert(rows);
          if (error) throw error;
        }
      }
      toast({ title: "All set!", description: "Welcome to Togather." });
      navigate("/home");
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const next = () => (step < steps.length - 1 ? setStep(step + 1) : finish());

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => (step === 0 ? navigate("/auth") : setStep(step - 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-8 rounded-full transition-all",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{step + 1}/{steps.length}</span>
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{stepTitle(step)}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{stepSubtitle(step)}</p>

      <div className="mt-6 rounded-3xl border border-border/60 bg-card p-6 shadow-card">
        {step === 0 && (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Pick a few — we'll suggest plans you'll love.</p>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((i) => {
                const on = interests.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggle(i)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      on
                        ? "border-primary bg-primary text-primary-foreground shadow-soft"
                        : "border-border bg-background text-foreground hover:border-primary/50",
                    )}
                  >
                    {on && <Check className="mr-1 inline h-3.5 w-3.5" />}
                    {i}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Add the people you'd like to plan with.</p>
            {people.map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-2xl border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary">
                    {initialsOf(p.name)}
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.relation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!suggested.some((s) => s.name === p.name) && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground" onClick={() => removePerson(p.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={p.picked ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => togglePerson(p.name)}
                  >
                    {p.picked ? <><Check className="h-3.5 w-3.5" /> Added</> : "Add"}
                  </Button>
                </div>
              </div>
            ))}
            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full rounded-xl">
                  <Plus className="h-4 w-4" /> Add manually
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add someone to your circle</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="mname">Name</Label>
                    <Input id="mname" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="e.g. Priya" className="mt-1.5 rounded-xl" autoFocus />
                  </div>
                  <div>
                    <Label>Relation</Label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {["Family", "Friend", "Colleague", "Mom's circle"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setManualRelation(r)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                            manualRelation === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-primary/50",
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setManualOpen(false)}>Cancel</Button>
                  <Button onClick={addManual} disabled={!manualName.trim()}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {[
              { k: "Quiet hours", v: "10pm – 7am" },
              { k: "Default location", v: "Brooklyn, NY" },
              { k: "Notifications", v: "Gentle (3/day max)" },
              { k: "Announcements", v: "Private to my circle" },
            ].map((p) => (
              <div key={p.k} className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3">
                <span className="text-sm font-medium">{p.k}</span>
                <span className="text-sm text-muted-foreground">{p.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={next}
        disabled={!canContinue || saving}
        size="lg"
        className="mt-6 w-full rounded-full bg-gradient-warm shadow-glow disabled:opacity-50 disabled:shadow-none"
      >
        {saving ? "Saving…" : step === steps.length - 1 ? "Enter Togather" : "Continue"}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
};

const stepTitle = (s: number) =>
  ["What do you love?", "Add your people", "Set the vibe"][s];
const stepSubtitle = (s: number) =>
  [
    "We'll use this to suggest moments that fit.",
    "Mom, friends, colleagues — your circle.",
    "How should Togather show up for you?",
  ][s];

export default Onboarding;

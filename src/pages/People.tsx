import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles, Trash2, UserPlus } from "lucide-react";
import { PersonAvatar } from "@/components/Avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConnectionType } from "@/data/mock";
import { cn } from "@/lib/utils";
import { useAuth, initialsOf } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const groups = ["All", "Family", "Mom's circle", "Friends", "Colleagues"] as const;
type Group = typeof groups[number];

const connectionTypes: ("All types" | ConnectionType)[] = [
  "All types",
  "Close family",
  "Work colleague",
  "Romantic partner",
  "Hobby buddy",
  "New connection",
];

const typeColor: Record<string, string> = {
  "Close family": "bg-primary-soft text-primary",
  "Work colleague": "bg-ai-soft text-ai",
  "Romantic partner": "bg-accent text-accent-foreground",
  "Hobby buddy": "bg-secondary text-secondary-foreground",
  "New connection": "bg-muted text-muted-foreground",
  "Solo goal": "bg-muted text-muted-foreground",
};

const colors = ["14 88% 62%", "265 60% 70%", "152 55% 45%", "190 70% 50%", "32 80% 60%", "340 70% 60%", "25 60% 45%", "210 60% 60%"];

type DBPerson = {
  id: string;
  name: string;
  relation: string;
  connection_type: string;
  goal: string;
  example_idea: string;
  cadence: string;
  last_met: string;
  avatar_color: string;
  initials: string;
};

const People = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<DBPerson[]>([]);
  const [group, setGroup] = useState<Group>("All");
  const [type, setType] = useState<typeof connectionTypes[number]>("All types");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  // form
  const [fName, setFName] = useState("");
  const [fRelation, setFRelation] = useState("Friend");
  const [fType, setFType] = useState<ConnectionType>("Hobby buddy");
  const [fGoal, setFGoal] = useState("");
  const [fIdea, setFIdea] = useState("");
  const [fCadence, setFCadence] = useState("1×/month");

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("people").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) { toast({ title: "Couldn't load", description: error.message, variant: "destructive" }); return; }
    setList((data ?? []) as DBPerson[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const reset = () => { setFName(""); setFRelation("Friend"); setFType("Hobby buddy"); setFGoal(""); setFIdea(""); setFCadence("1×/month"); };

  const add = async () => {
    if (!user || !fName.trim()) return;
    const { error } = await supabase.from("people").insert({
      user_id: user.id,
      name: fName.trim(),
      relation: fRelation,
      connection_type: fType,
      goal: fGoal.trim(),
      example_idea: fIdea.trim() || "Coffee catch-up",
      cadence: fCadence,
      initials: initialsOf(fName.trim()),
      avatar_color: colors[list.length % colors.length],
    });
    if (error) { toast({ title: "Couldn't add", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Added", description: `${fName.trim()} is in your circle.` });
    setOpen(false);
    reset();
    load();
  };

  const remove = async (p: DBPerson) => {
    const { error } = await supabase.from("people").delete().eq("id", p.id);
    if (error) { toast({ title: "Couldn't delete", description: error.message, variant: "destructive" }); return; }
    setList((prev) => prev.filter((x) => x.id !== p.id));
  };

  const filtered = list.filter((p) => {
    const inGroup =
      group === "All" ||
      p.relation === group ||
      (group === "Friends" && p.relation === "Friend") ||
      (group === "Colleagues" && p.relation === "Colleague");
    const inType = type === "All types" || p.connection_type === type;
    return inGroup && inType && p.name.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="animate-fade-in">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My people</h1>
          <p className="text-sm text-muted-foreground">{list.length} in your circle · grouped by goal</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full bg-gradient-warm shadow-soft">
              <UserPlus className="h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to your circle</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="n">Name</Label>
                <Input id="n" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="e.g. Priya" className="mt-1.5 rounded-xl" autoFocus />
              </div>
              <div>
                <Label>Relation</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {["Family", "Friend", "Colleague", "Mom's circle"].map((r) => (
                    <button key={r} type="button" onClick={() => setFRelation(r)}
                      className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        fRelation === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Connection type</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {connectionTypes.filter((t) => t !== "All types").map((t) => (
                    <button key={t} type="button" onClick={() => setFType(t as ConnectionType)}
                      className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        fType === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="g">Goal (optional)</Label>
                <Input id="g" value={fGoal} onChange={(e) => setFGoal(e.target.value)} placeholder="e.g. Brunch & gossip" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="i">Example idea (optional)</Label>
                <Input id="i" value={fIdea} onChange={(e) => setFIdea(e.target.value)} placeholder="e.g. Café Lumière, late morning" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label>Cadence</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {["weekly", "2×/month", "1×/month", "occasional"].map((c) => (
                    <button key={c} type="button" onClick={() => setFCadence(c)}
                      className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        fCadence === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background")}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={add} disabled={!fName.trim()}>Add to circle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your circle" className="rounded-2xl border-transparent bg-muted pl-11" />
      </div>

      <div className="-mx-5 mb-2 flex gap-2 overflow-x-auto px-5 pb-1">
        {groups.map((g) => (
          <button key={g} onClick={() => setGroup(g)}
            className={cn("shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              group === g ? "bg-primary text-primary-foreground shadow-soft" : "bg-muted text-muted-foreground hover:text-foreground")}>{g}</button>
        ))}
      </div>

      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {connectionTypes.map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all",
              type === t ? "border-primary bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground")}>{t}</button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((p) => (
          <li key={p.id} className="group rounded-2xl border border-border/60 bg-card p-4 shadow-card">
            <div className="flex items-start gap-4">
              <PersonAvatar initials={p.initials} color={p.avatar_color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate font-semibold">{p.name}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{p.relation}</span>
                </div>
                {p.goal && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Goal: <span className="text-foreground">{p.goal}</span>
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", typeColor[p.connection_type] ?? "bg-muted text-muted-foreground")}>
                    {p.connection_type}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{p.cadence}</span>
                  {p.last_met && <span className="text-[10px] text-muted-foreground">· last met {p.last_met}</span>}
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100" onClick={() => remove(p)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {p.example_idea && (
              <Link to={`/plan?with=${encodeURIComponent(p.name)}`} className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-gradient-soft px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">AI idea</p>
                  <p className="truncate text-xs text-foreground">{p.example_idea}</p>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0 rounded-full hover:bg-background">
                  <Sparkles className="h-3.5 w-3.5" /> Plan
                </Button>
              </Link>
            )}
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            {list.length === 0 ? "No one yet — tap Add to start your circle." : "No one matches those filters."}
          </li>
        )}
      </ul>
    </div>
  );
};

export default People;

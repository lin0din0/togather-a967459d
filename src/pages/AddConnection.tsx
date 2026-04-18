import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth, initialsOf } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StepHeader } from "@/components/StepHeader";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TYPES = [
  { key: "Close family", icon: "👨‍👩‍👧", desc: "Quality time, low-key activities" },
  { key: "Work colleague", icon: "💼", desc: "Career events, networking" },
  { key: "Romantic partner", icon: "💕", desc: "Date nights, shared preferences" },
  { key: "Hobby buddy", icon: "🎨", desc: "Classes, shared interests" },
] as const;

const FREQS = ["Weekly", "1× / month", "2× / month", "Occasionally"];

const colors: Array<"coral" | "violet" | "teal" | "neutral"> = ["coral", "violet", "teal", "neutral"];

const AddConnection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<string>("Close family");
  const [freq, setFreq] = useState<string>("1× / month");
  const [saving, setSaving] = useState(false);

  const send = async () => {
    if (!user || !name.trim()) {
      toast({ title: "Add a name", description: "Tell us who you want to plan with.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { count } = await supabase.from("people").select("id", { head: true, count: "exact" }).eq("user_id", user.id);
    const idx = (count ?? 0) % colors.length;
    const colorMap: Record<typeof colors[number], string> = {
      coral: "13 100% 60%",
      violet: "252 100% 68%",
      teal: "169 71% 37%",
      neutral: "0 0% 60%",
    };
    const { error } = await supabase.from("people").insert({
      user_id: user.id,
      name: name.trim(),
      email: email.trim(),
      relation: type === "Work colleague" ? "Colleague" : type === "Close family" ? "Family" : "Friend",
      connection_type: type,
      cadence: freq,
      initials: initialsOf(name.trim()),
      avatar_color: colorMap[colors[idx]],
      example_idea: "Coffee catch-up",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    nav("/invite-sent", { state: { name: name.trim(), type, freq } });
  };

  return (
    <div className="bg-white px-6 pb-8 pt-[70px]">
      <StepHeader step={3} totalSteps={3} back="/budget" />
      <h1 className="font-display anim-fade-up text-[28px] font-semibold leading-[1.2]">Add your first connection</h1>
      <p className="anim-fade-up anim-d1 mb-5 mt-1.5 text-[13px] leading-[1.6] text-muted-foreground">
        Who do you want to see more of? Invite them — they'll set up their own preferences.
      </p>

      <div className="anim-fade-up anim-d2 mb-3">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maja Eriksen"
          className="mb-3 w-full rounded-[13px] border-[1.5px] border-border bg-white px-4 py-3 text-[14px] outline-none focus:border-foreground"
        />
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">Email (optional)</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="maja@email.com"
          className="w-full rounded-[13px] border-[1.5px] border-border bg-white px-4 py-3 text-[14px] outline-none focus:border-foreground"
        />
      </div>

      {name.trim() && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border-[1.5px] border-border bg-surface p-4">
          <InitialsAvatar initials={initialsOf(name)} size={46} bordered />
          <div className="flex-1">
            <div className="text-[14px] font-medium">{name}</div>
            {email && <div className="text-[11px] text-muted-foreground">{email}</div>}
          </div>
          <Check className="h-4 w-4 text-success" strokeWidth={1.8} />
        </div>
      )}

      <div className="anim-fade-up anim-d3 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">Connection type</div>
      <div className="anim-fade-up anim-d3 mb-4 grid grid-cols-2 gap-2">
        {TYPES.map((t) => {
          const sel = type === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={cn(
                "rounded-[14px] border-[1.5px] p-3 text-left transition-all",
                sel ? "border-primary bg-primary-bg" : "border-border bg-white",
              )}
            >
              <div className="mb-1 text-[20px]">{t.icon}</div>
              <div className="text-[12px] font-semibold">{t.key}</div>
              <div className="mt-0.5 text-[10px] leading-[1.4] text-muted-foreground">{t.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="anim-fade-up anim-d4 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">
        How often do you want to see {name.split(/\s+/)[0] || "them"}?
      </div>
      <div className="anim-fade-up anim-d4 mb-5 flex flex-wrap gap-1.5">
        {FREQS.map((f) => {
          const on = f === freq;
          return (
            <button
              key={f}
              onClick={() => setFreq(f)}
              className={cn(
                "rounded-full border-[1.5px] px-3.5 py-2 text-[12px] font-medium transition-all",
                on ? "border-foreground bg-foreground text-white" : "border-border text-muted-foreground",
              )}
            >
              {f}
            </button>
          );
        })}
      </div>

      <button
        onClick={send}
        disabled={saving || !name.trim()}
        className="anim-fade-up anim-d4 w-full rounded-full bg-primary px-6 py-3.5 text-[14px] font-medium text-white disabled:opacity-60"
      >
        {saving ? "Sending…" : `Send invite to ${name.split(/\s+/)[0] || "them"}`}
      </button>
      <button onClick={() => nav("/home")} className="mt-2 block w-full text-center text-[12px] text-muted-foreground underline">
        Skip — add people later
      </button>
    </div>
  );
};

export default AddConnection;

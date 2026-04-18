import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronRight, LogOut, MapPin, MessageSquare, Megaphone, Shield, Sparkles, Check, X, Settings, Camera, Loader2 } from "lucide-react";
import { PersonAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, initialsOf } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const groups = [
  {
    title: "Preferences",
    items: [
      { icon: Sparkles, label: "Interests", value: "Brunch, Hiking +3" },
      { icon: MapPin, label: "Location", value: "Brooklyn, NY" },
      { icon: Bell, label: "Notifications", value: "Gentle" },
      { icon: MessageSquare, label: "Chat settings", value: "Read receipts on" },
    ],
  },
  {
    title: "Sharing",
    items: [
      { icon: Megaphone, label: "Announcements", value: "Private circle" },
      { icon: Shield, label: "Privacy", value: "Friends of friends" },
    ],
  },
];

const Profile = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [counts, setCounts] = useState({ people: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const N8N_WEBHOOK_URL = "https://krtikaa285.app.n8n.cloud/webhook-test/Receivefromlovable";

  const onAvatarPick = () => fileInputRef.current?.click();

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5 MB.", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", user.id);
      if (updErr) throw updErr;
      await refreshProfile();
      toast({ title: "Profile picture updated" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submitToN8n = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        email: user.email,
        display_name: profile?.display_name ?? null,
        location: profile?.location ?? null,
        submitted_at: new Date().toISOString(),
      };
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      toast({ title: "Sent", description: "Your info was sent to n8n." });
    } catch (err) {
      toast({
        title: "Submit failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setName(profile?.display_name ?? "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("people").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => {
      setCounts({ people: count ?? 0 });
    });
  }, [user]);

  const save = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("user_id", user.id);
    if (error) { toast({ title: "Couldn't save", description: error.message, variant: "destructive" }); return; }
    await refreshProfile();
    toast({ title: "Updated", description: "Your name has been saved." });
    setEditing(false);
  };

  const display = profile?.display_name ?? "Friend";

  return (
    <div className="flex min-h-full flex-col bg-white px-6 pb-8 pt-[70px]">
      {/* Top bar */}
      <div className="anim-fade-up mb-8 flex items-center justify-between">
        <h1 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-ink4">Profile</h1>
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-ink2 transition-colors hover:bg-secondary">
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </div>

      {/* Hero card */}
      <section className="anim-fade-up anim-d1 mb-6 rounded-[28px] bg-gradient-soft px-6 py-8 text-center shadow-card ring-1 ring-border/40">
        <div className="mb-4 flex justify-center">
          <PersonAvatar initials={initialsOf(display)} color="14 88% 62%" size="lg" />
        </div>
        {editing ? (
          <div className="mx-auto mb-2 max-w-[220px]">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="rounded-xl text-center font-display text-[22px] font-semibold"
            />
          </div>
        ) : (
          <h2 className="font-display text-[26px] font-semibold leading-tight tracking-tight">{display}</h2>
        )}
        <p className="mt-1 text-[13px] text-muted-foreground">{user?.email}</p>

        {editing ? (
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" variant="outline" className="rounded-full px-4" onClick={() => { setEditing(false); setName(display); }}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button size="sm" className="rounded-full px-4" onClick={save}>
              <Check className="h-3.5 w-3.5" /> Save
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-border bg-white px-5 py-1.5 text-[12.5px] font-medium text-foreground transition-all hover:border-foreground"
          >
            Edit profile
          </button>
        )}
      </section>

      {/* Stats */}
      <section className="anim-fade-up anim-d2 mb-8 grid grid-cols-3 gap-3">
        {[
          { k: "Plans", v: "12" },
          { k: "People", v: String(counts.people) },
          { k: "Streak", v: "4w" },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl border border-border/60 bg-white px-3 py-4 text-center">
            <p className="font-display text-[24px] font-semibold leading-none tracking-tight">{s.v}</p>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.k}</p>
          </div>
        ))}
      </section>

      {/* Setting groups */}
      {groups.map((g, gi) => (
        <section key={g.title} className={`anim-fade-up ${gi === 0 ? "anim-d3" : "anim-d4"} mb-7`}>
          <h3 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {g.title}
          </h3>
          <ul className="space-y-2">
            {g.items.map((it) => (
              <li
                key={it.label}
                className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-border/60 bg-white px-4 py-3.5 transition-all hover:border-foreground/30 hover:shadow-card"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary">
                  <it.icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-tight text-foreground">{it.label}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">{it.value}</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Submit to n8n */}
      <div className="anim-fade-up mb-6">
        <Button onClick={submitToN8n} disabled={submitting} className="w-full rounded-2xl">
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </div>

      {/* Sign out */}
      <div className="anim-fade-up anim-d5 mt-auto pt-4">
        <Link
          to="/"
          onClick={async (e) => { e.preventDefault(); await signOut(); window.location.href = "/"; }}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white py-3.5 text-[13.5px] font-medium text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} /> Sign out
        </Link>
      </div>
    </div>
  );
};

export default Profile;

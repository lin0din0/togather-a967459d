import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands from a recovery link
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // If they already have a session (e.g. link processed), allow it
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", description: "Please retype your new password.", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "You're all set — signing you in." });
    nav("/home");
  };

  return (
    <div className="bg-white px-6 pb-8 pt-[70px]">
      <div className="mb-5 flex h-[56px] w-[56px] items-center justify-center rounded-full border-[1.5px] border-foreground bg-primary-bg">
        <Lock className="h-5 w-5 text-primary" strokeWidth={1.8} />
      </div>
      <h1 className="font-display anim-fade-up text-[28px] font-semibold leading-[1.2]">Set a new password</h1>
      <p className="anim-fade-up anim-d1 mb-7 mt-1.5 text-[13px] leading-[1.6] text-muted-foreground">
        {ready ? "Choose something only you would know." : "Verifying your reset link…"}
      </p>
      <form onSubmit={submit} className="anim-fade-up anim-d2 space-y-3.5">
        <div>
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">New password</div>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            className="w-full rounded-[13px] border-[1.5px] border-border bg-white px-4 py-3 text-[14px] outline-none placeholder:text-ink4 focus:border-foreground"
          />
        </div>
        <div>
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">Confirm password</div>
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Retype password"
            className="w-full rounded-[13px] border-[1.5px] border-border bg-white px-4 py-3 text-[14px] outline-none placeholder:text-ink4 focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !ready}
          className="mt-2 w-full rounded-full bg-primary px-6 py-3.5 text-[14px] font-medium text-white disabled:opacity-60"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;

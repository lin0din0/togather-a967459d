import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't send email", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
  };

  return (
    <div className="bg-white px-6 pb-8 pt-[70px]">
      <Link to="/auth?mode=signin" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Back to sign in
      </Link>

      {sent ? (
        <div className="anim-fade-up text-center">
          <div className="mx-auto mb-5 flex h-[64px] w-[64px] items-center justify-center rounded-full border-[1.5px] border-foreground bg-success">
            <MailCheck className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="font-display text-[26px] font-semibold leading-[1.2]">Check your inbox</h1>
          <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground">
            We sent a password reset link to <strong className="text-foreground">{email}</strong>. Tap it to set a new password.
          </p>
          <Link to="/auth?mode=signin" className="mt-7 inline-block rounded-full border-[1.5px] border-border px-6 py-3 text-[13px] text-muted-foreground">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-display anim-fade-up text-[28px] font-semibold leading-[1.2]">Forgot password?</h1>
          <p className="anim-fade-up anim-d1 mb-7 mt-1.5 text-[13px] leading-[1.6] text-muted-foreground">
            Tell us your email and we'll send a secure link to reset it.
          </p>
          <form onSubmit={submit} className="anim-fade-up anim-d2 space-y-3.5">
            <div>
              <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">Email</div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-[13px] border-[1.5px] border-border bg-white px-4 py-3 text-[14px] outline-none placeholder:text-ink4 focus:border-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-full bg-primary px-6 py-3.5 text-[14px] font-medium text-white disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;

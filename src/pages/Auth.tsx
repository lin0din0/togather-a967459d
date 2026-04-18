import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"signup" | "signin">(params.get("mode") === "signin" ? "signin" : "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/home" replace />;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please tell us your name.");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/calendar-connect`, data: { display_name: name.trim() } },
        });
        if (error) throw error;
        navigate("/calendar-connect");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/home");
      }
    } catch (err: any) {
      toast({ title: "Oops", description: err.message ?? "Something went wrong", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-white px-6 pb-8 pt-[70px]">
      <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Back
      </Link>
      <h1 className="font-display anim-fade-up text-[28px] font-semibold leading-[1.2]">
        {mode === "signup" ? "Create your account" : "Welcome back"}
      </h1>
      <p className="anim-fade-up anim-d1 mb-7 mt-1.5 text-[13px] leading-[1.6] text-muted-foreground">
        {mode === "signup"
          ? "Your calendar stays private. We only read when you're free — never what you're doing."
          : "Sign in to keep planning intentional time."}
      </p>
      <form onSubmit={handle} className="anim-fade-up anim-d3 space-y-3.5">
        {mode === "signup" && (
          <div>
            <Label>Your name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nahin Islam" />
          </div>
        )}
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" /></div>
        <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" minLength={6} /></div>
        <button type="submit" disabled={busy} className="mt-2 w-full rounded-full bg-primary px-6 py-3.5 text-[14px] font-medium text-white disabled:opacity-60">
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        {mode === "signin" && (
          <Link to="/forgot-password" className="block w-full pt-1 text-center text-[12px] font-medium text-primary">
            Forgot password?
          </Link>
        )}
        <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="block w-full pt-2 text-center text-[12px] text-muted-foreground">
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </form>
    </div>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">{children}</div>
);
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} required className="w-full rounded-[13px] border-[1.5px] border-border bg-white px-4 py-3 text-[14px] outline-none placeholder:text-ink4 focus:border-foreground" />
);

export default Auth;

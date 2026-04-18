import { Link } from "react-router-dom";
import { Sparkles, Users, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-warm p-8 text-primary-foreground shadow-glow">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
            <Heart className="h-3.5 w-3.5" /> for the people who matter
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight">
            Togather.
            <br />
            <span className="text-primary-foreground/85">Time, with love.</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-primary-foreground/90">
            Plan brunches with mom, hikes with friends, calls with colleagues — all in one warm little app.
            Our AI scans everyone's schedule and suggests the perfect moment to meet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full bg-white text-primary hover:bg-white/90">
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full text-primary-foreground hover:bg-white/15">
              <Link to="/auth">Sign in →</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Users, title: "Your people", body: "Mom's circle, friends, colleagues — gently organised." },
          { icon: Sparkles, title: "AI plans the day", body: "Match. Source. Propose. Adapt. Confirm." },
          { icon: Calendar, title: "Quiet reminders", body: "Nudge, don't nag. Skim, scan, show up." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;

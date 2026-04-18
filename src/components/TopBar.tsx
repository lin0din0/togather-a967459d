import { Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/home": "Home",
  "/people": "People",
  "/plan": "Plan",
  "/schedule": "Schedule",
  "/notifications": "Inbox",
  "/announcements": "Announcements",
  "/profile": "Profile",
};

export const TopBar = () => {
  const { pathname } = useLocation();
  const sub = pathname.startsWith("/events/") ? "Event" : titles[pathname];

  return (
    <header className="sticky top-0 z-40 -mx-5 mb-5 border-b border-border/50 bg-background/80 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-warm shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-base font-bold tracking-tight">
            Togather
          </span>
        </Link>
        {sub && (
          <span className={cn("rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground")}>
            {sub}
          </span>
        )}
      </div>
    </header>
  );
};

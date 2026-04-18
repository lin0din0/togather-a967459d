import { NavLink, useNavigate } from "react-router-dom";
import { Calendar, MessageSquare, Plus, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { to: string; label?: string; icon: typeof Home; fab?: boolean };
const tabs: Tab[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/chat", label: "Chats", icon: MessageSquare },
  { fab: true, to: "/add-connection", icon: Plus },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/profile", label: "Profile", icon: User },
];

export const TabBar = () => {
  const nav = useNavigate();
  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 flex h-[86px] items-center border-t border-black/[0.07] bg-surface/90 px-2 pb-[18px] backdrop-blur-xl">
      {tabs.map((t, i) =>
        t.fab ? (
          <button
            key={i}
            onClick={() => nav(t.to)}
            aria-label="Add"
            className="-mt-2.5 mx-auto flex h-[52px] w-[52px] flex-1 max-w-[52px] items-center justify-center rounded-full border-[1.5px] border-foreground bg-primary text-white shadow-glow active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5" strokeWidth={2.2} />
          </button>
        ) : (
          <NavLink
            key={t.to}
            to={t.to!}
            className={({ isActive }) =>
              cn("flex flex-1 flex-col items-center gap-[3px] pt-2", isActive ? "text-primary" : "text-ink4")
            }
          >
            {t.icon && <t.icon className="h-[22px] w-[22px]" strokeWidth={1.5} />}
            <span className="text-[10px] font-medium">{t.label}</span>
          </NavLink>
        ),
      )}
    </nav>
  );
};

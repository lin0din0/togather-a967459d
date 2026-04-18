import { Globe, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/Avatar";
import { announcements } from "@/data/mock";

const Announcements = () => {
  return (
    <div className="animate-fade-in">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">From your circle & beyond</p>
        </div>
        <Button size="sm" className="rounded-full bg-gradient-warm shadow-soft">
          <Plus className="h-4 w-4" /> Post
        </Button>
      </header>

      <ul className="space-y-3">
        {announcements.map((a) => {
          const Icon = a.visibility === "public" ? Globe : Lock;
          return (
            <li key={a.id} className="rounded-3xl border border-border/60 bg-card p-5 shadow-card">
              <div className="mb-2 flex items-center gap-2">
                <PersonAvatar initials={a.authorInitials} color={a.authorColor} size="sm" />
                <span className="text-sm font-medium">{a.author}</span>
                <span className="text-xs text-muted-foreground">· {a.createdAt}</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Icon className="h-3 w-3" /> {a.visibility}
                </span>
              </div>
              <h3 className="font-semibold">{a.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full">I'm in</Button>
                <Button variant="ghost" size="sm" className="rounded-full">Maybe</Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Announcements;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InitialsAvatar } from "@/components/InitialsAvatar";

type P = { id: string; name: string; initials: string; cadence: string; connection_type: string };

const ChatList = () => {
  const [people, setPeople] = useState<P[]>([]);
  useEffect(() => {
    supabase.from("people").select("id,name,initials,cadence,connection_type").then(({ data }) => {
      if (data) setPeople(data as P[]);
    });
  }, []);
  const variants = ["coral", "violet", "teal", "neutral"] as const;

  return (
    <div className="bg-surface min-h-full px-[22px] pb-6 pt-[60px]">
      <h1 className="font-display mb-4 text-[24px] font-semibold tracking-tight">Chats</h1>
      {people.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-[13px] text-muted-foreground">
          No chats yet. <Link to="/add-connection" className="text-primary underline">Add a connection</Link> to start.
        </div>
      ) : (
        <ul className="space-y-2">
          {people.map((p, i) => (
            <li key={p.id}>
              <Link to={`/chat/${p.id}`} className="flex items-center gap-3 rounded-2xl border-[1.5px] border-foreground bg-white p-3.5">
                <InitialsAvatar initials={p.initials} variant={variants[i % variants.length]} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.connection_type} · {p.cadence}</div>
                </div>
                <MessageSquare className="h-4 w-4 text-ink4" strokeWidth={1.5} />
                <ChevronRight className="h-4 w-4 text-ink4" strokeWidth={1.5} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export default ChatList;

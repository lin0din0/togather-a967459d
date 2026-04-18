import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, initialsOf } from "@/hooks/useAuth";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import { cn } from "@/lib/utils";

type P = { id: string; name: string; initials: string; cadence: string; connection_type: string };
type Msg = { id?: string; role: "ai" | "me" | "them"; body: string };

const ChatThread = () => {
  const { personId } = useParams();
  const { user, profile } = useAuth();
  const [person, setPerson] = useState<P | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!personId || !user) return;
    supabase.from("people").select("id,name,initials,cadence,connection_type").eq("id", personId).maybeSingle().then(({ data }) => {
      if (data) setPerson(data as P);
    });
    supabase.from("chat_messages").select("id,role,body").eq("person_id", personId).order("created_at").then(({ data }) => {
      if (data && data.length) setMessages(data as Msg[]);
      else if (data) setMessages([
        { role: "ai", body: `Hey! I found a window where you're both free this Saturday morning. Want me to suggest something to do?` },
      ]);
    });
  }, [personId, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !user || !personId) return;
    const me: Msg = { role: "me", body: text };
    setMessages((m) => [...m, me]);
    setInput("");
    await supabase.from("chat_messages").insert({ user_id: user.id, person_id: personId, role: "me", body: text });
    setTimeout(async () => {
      const reply: Msg = { role: "ai", body: "Got it. Looking for a low-key spot that fits both of your schedules…" };
      setMessages((m) => [...m, reply]);
      await supabase.from("chat_messages").insert({ user_id: user.id, person_id: personId, role: "ai", body: reply.body });
    }, 700);
  };

  if (!person) return <div className="px-6 pt-20 text-sm text-muted-foreground">Loading…</div>;
  const myInit = initialsOf(profile?.display_name ?? "Me");

  return (
    <div className="bg-surface flex h-full flex-col pt-[50px]">
      <div className="flex items-center gap-2.5 border-b border-border bg-surface/90 px-5 py-2.5 backdrop-blur">
        <Link to="/chat" className="text-muted-foreground"><ArrowLeft className="h-4 w-4" strokeWidth={1.5} /></Link>
        <div className="flex">
          <InitialsAvatar initials={myInit} size={28} variant="coral" bordered={false} className="ring-2 ring-surface" />
          <InitialsAvatar initials={person.initials} size={28} variant="violet" bordered={false} className="-ml-2 ring-2 ring-surface" />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold">{profile?.display_name?.split(" ")[0]} + {person.name.split(" ")[0]}</div>
          <div className="text-[10px] text-muted-foreground">Goal: quality time · {person.cadence}</div>
        </div>
      </div>

      <div className="scrollbar-none flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex flex-col", m.role === "me" ? "items-end" : "items-start")}>
            <div className="mb-1 px-1 text-[10px] text-ink4">
              {m.role === "ai" ? "Togather AI" : m.role === "me" ? profile?.display_name?.split(" ")[0] : person.name.split(" ")[0]}
            </div>
            <div className={cn(
              "max-w-[82%] rounded-[18px] px-3.5 py-2.5 text-[13px] leading-[1.55]",
              m.role === "me" ? "rounded-br-[4px] bg-primary text-white"
              : m.role === "ai" ? "rounded-bl-[4px] border border-white/95 bg-white/85"
              : "rounded-bl-[4px] border border-border bg-white"
            )}>{m.body}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border bg-surface/90 px-4 py-2.5 backdrop-blur">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message Togather or ${person.name.split(" ")[0]}…`}
          className="flex-1 rounded-full border-[1.5px] border-border bg-surface px-4 py-2.5 text-[13px] text-muted-foreground outline-none" />
        <button type="submit" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-primary text-white">
          <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </form>
    </div>
  );
};
export default ChatThread;

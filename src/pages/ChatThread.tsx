import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, Settings, Sparkles, BellOff, Pencil, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, initialsOf } from "@/hooks/useAuth";
import { InitialsAvatar } from "@/components/InitialsAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const myFirst = profile?.display_name?.split(" ")[0] ?? "You";
  const theirFirst = person.name.split(" ")[0];

  return (
    <div className="bg-surface flex h-full flex-col pt-[50px]">
      {/* Sticky top bar */}
      <div className="sticky top-[50px] z-30 flex items-center gap-2.5 border-b border-border bg-surface/95 px-4 py-2.5 backdrop-blur">
        <Link to="/chat" className="text-muted-foreground shrink-0">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </Link>

        {/* 3-member stack: me + them + AI */}
        <div className="flex shrink-0">
          <InitialsAvatar initials={myInit} size={28} variant="coral" bordered={false} className="ring-2 ring-surface" />
          <InitialsAvatar initials={person.initials} size={28} variant="violet" bordered={false} className="-ml-2 ring-2 ring-surface" />
          <div
            className="-ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-surface"
            style={{ background: "linear-gradient(135deg, hsl(var(--ai-soft)), hsl(var(--ai)))" }}
            aria-label="Togather AI"
          >
            <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2} />
          </div>
        </div>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1 truncate text-[13px] font-semibold">
            <span className="truncate">{myFirst} + {theirFirst}</span>
            <span className="text-muted-foreground">+</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-ai-bg px-1.5 py-px text-[10px] font-semibold text-ai">
              <Sparkles className="h-2.5 w-2.5" strokeWidth={2.2} /> AI
            </span>
          </div>
          <div className="truncate text-[10px] text-muted-foreground">
            <Users className="mr-1 inline h-2.5 w-2.5 -translate-y-px" strokeWidth={1.8} />
            3 members · {person.cadence}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Chat settings"
          >
            <Settings className="h-4 w-4" strokeWidth={1.6} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Chat settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit goal & cadence</DropdownMenuItem>
            <DropdownMenuItem><Sparkles className="mr-2 h-4 w-4" /> AI assistant preferences</DropdownMenuItem>
            <DropdownMenuItem><BellOff className="mr-2 h-4 w-4" /> Mute notifications</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Clear conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scrollable messages */}
      <div className="scrollbar-none flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex flex-col", m.role === "me" ? "items-end" : "items-start")}>
            <div className="mb-1 flex items-center gap-1 px-1 text-[10px] text-ink4">
              {m.role === "ai" && <Sparkles className="h-2.5 w-2.5 text-ai" strokeWidth={2.2} />}
              {m.role === "ai" ? "Togather AI" : m.role === "me" ? myFirst : theirFirst}
            </div>
            <div className={cn(
              "max-w-[82%] rounded-[18px] px-3.5 py-2.5 text-[13px] leading-[1.55]",
              m.role === "me" ? "rounded-br-[4px] bg-primary text-white"
              : m.role === "ai" ? "rounded-bl-[4px] border border-ai-soft bg-ai-bg text-foreground"
              : "rounded-bl-[4px] border border-border bg-white"
            )}>{m.body}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Sticky composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="sticky bottom-0 z-30 flex gap-2 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message Togather or ${theirFirst}…`}
          className="flex-1 rounded-full border-[1.5px] border-border bg-surface px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
        />
        <button type="submit" className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-primary text-white">
          <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </form>
    </div>
  );
};
export default ChatThread;

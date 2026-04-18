import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send, Settings, Sparkles, BellOff, Pencil, Trash2 } from "lucide-react";
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
        { role: "ai", body: `Hi! I spotted a calm window this Saturday morning when you're both free. Want me to suggest a spot to meet?` },
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
      const reply: Msg = { role: "ai", body: "On it — finding a low-key spot that fits both your calendars…" };
      setMessages((m) => [...m, reply]);
      await supabase.from("chat_messages").insert({ user_id: user.id, person_id: personId, role: "ai", body: reply.body });
    }, 700);
  };

  if (!person) {
    return (
      <div className="flex h-full items-center justify-center pt-[60px] text-sm text-muted-foreground" role="status" aria-live="polite">
        Loading conversation…
      </div>
    );
  }

  const myInit = initialsOf(profile?.display_name ?? "Me");
  const myFirst = profile?.display_name?.split(" ")[0] ?? "You";
  const theirFirst = person.name.split(" ")[0];
  const canSend = input.trim().length > 0;

  return (
    <div className="flex h-full flex-col bg-surface pt-[54px]">
      {/* Sticky top bar — sits just below the device notch */}
      <header className="sticky top-[54px] z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2">
          <Link
            to="/chat"
            aria-label="Back to chats"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </Link>

          {/* 3-member avatar stack */}
          <div className="flex shrink-0" aria-hidden="true">
            <InitialsAvatar initials={myInit} size={30} variant="coral" bordered={false} className="ring-2 ring-surface" />
            <InitialsAvatar initials={person.initials} size={30} variant="violet" bordered={false} className="-ml-2.5 ring-2 ring-surface" />
            <div
              className="-ml-2.5 inline-flex h-[30px] w-[30px] items-center justify-center rounded-full ring-2 ring-surface"
              style={{ background: "linear-gradient(135deg, hsl(var(--ai-soft)), hsl(var(--ai)))" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.2} />
            </div>
          </div>

          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[14px] font-semibold text-foreground">
              {myFirst}, {theirFirst} & Togather
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              Group chat · {person.cadence ?? "no cadence set"}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Edit chat settings"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Settings className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuLabel>Chat settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" /> Edit goal & cadence
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Sparkles className="mr-2 h-4 w-4 text-ai" /> Togather AI preferences
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <BellOff className="mr-2 h-4 w-4" /> Mute notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Clear conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Scrollable messages */}
      <div
        className="scrollbar-none flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label={`Conversation with ${theirFirst} and Togather AI`}
      >
        {/* Tone-setting intro chip */}
        <div className="mx-auto mb-1 inline-flex items-center gap-1.5 rounded-full bg-ai-bg px-3 py-1 text-[11px] font-medium text-ai">
          <Sparkles className="h-3 w-3" strokeWidth={2.2} /> Togather AI joined to help you plan
        </div>

        {messages.map((m, i) => {
          const isMe = m.role === "me";
          const isAi = m.role === "ai";
          const author = isAi ? "Togather AI" : isMe ? myFirst : theirFirst;
          return (
            <div key={i} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
              <div className="mb-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
                {isAi && <Sparkles className="h-2.5 w-2.5 text-ai" strokeWidth={2.4} aria-hidden="true" />}
                <span>{author}</span>
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-[18px] px-3.5 py-2.5 text-[14px] leading-[1.5]",
                  isMe && "rounded-br-[6px] bg-primary text-primary-foreground",
                  isAi && "rounded-bl-[6px] border border-ai-soft bg-ai-bg text-foreground",
                  !isMe && !isAi && "rounded-bl-[6px] border border-border bg-card text-foreground",
                )}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Sticky composer */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="sticky bottom-0 z-30 border-t border-border bg-surface/95 px-3 pb-4 pt-2.5 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">Message Togather or {theirFirst}</label>
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask Togather or message ${theirFirst}…`}
            className="flex-1 rounded-full border-[1.5px] border-border bg-surface px-4 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Send className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </form>
    </div>
  );
};
export default ChatThread;

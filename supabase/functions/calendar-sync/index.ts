import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const webhookUrl = Deno.env.get("N8N_CALENDAR_SYNC_URL");
    if (!webhookUrl || !/^https?:\/\//i.test(webhookUrl)) {
      console.warn("N8N_CALENDAR_SYNC_URL missing or invalid:", webhookUrl);
      return new Response(JSON.stringify({ common_slots: [], busy_count: 0, warning: "webhook not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional body params from client (friend email + date range)
    let body: { friend_email?: string; person_id?: string; range_start?: string; range_end?: string } = {};
    try { body = await req.json(); } catch { /* no body */ }

    const [{ data: profile }, { data: people }] = await Promise.all([
      supabase.from("profiles").select("display_name, location, free_days_per_week, protected_days").eq("user_id", user.id).maybeSingle(),
      supabase.from("people").select("id, name, email").eq("user_id", user.id),
    ]);

    const today = new Date();
    const in14 = new Date(today.getTime() + 14 * 86_400_000);

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        display_name: profile?.display_name ?? null,
        location: profile?.location ?? null,
        free_days_per_week: profile?.free_days_per_week ?? null,
        protected_days: profile?.protected_days ?? [],
      },
      friend: body.friend_email
        ? { email: body.friend_email, person_id: body.person_id ?? null }
        : null,
      people: people ?? [],
      range: {
        start: body.range_start ?? today.toISOString().slice(0, 10),
        end: body.range_end ?? in14.toISOString().slice(0, 10),
      },
      now: new Date().toISOString(),
    };

    const n8nResp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await n8nResp.text();
    let data: unknown = null;
    try { data = JSON.parse(text); } catch { data = text; }

    if (!n8nResp.ok) {
      console.error("n8n calendar-sync error", n8nResp.status, text);
      return new Response(JSON.stringify({ error: "n8n webhook failed", status: n8nResp.status, body: data }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize: accept { common_slots: [...] } or array of slots, or raw events list
    let common_slots: Array<{ date: string; start: string; end: string; label?: string }> = [];

    if (Array.isArray(data)) {
      common_slots = data as any;
    } else if (data && typeof data === "object") {
      const d = data as any;
      if (Array.isArray(d.common_slots)) common_slots = d.common_slots;
      if (Array.isArray(d.slots)) common_slots = d.slots;
    }

    // Normalize busy slots: accept events:[{date,start,end,title}] or busy:[...]
    const rawBusy: Array<any> = (() => {
      if (Array.isArray(data)) return [];
      if (data && typeof data === "object") {
        const d = data as any;
        if (Array.isArray(d.busy)) return d.busy;
        if (Array.isArray(d.events)) return d.events;
      }
      return [];
    })();

    const busy = rawBusy
      .map((b) => ({
        date: b.date ?? (b.start ? String(b.start).slice(0, 10) : null),
        start: b.start_time ?? (b.start ? String(b.start).slice(11, 16) : "00:00"),
        end: b.end_time ?? (b.end ? String(b.end).slice(11, 16) : "23:59"),
        title: b.title ?? "Busy",
        external_id: b.id ?? b.external_id ?? null,
      }))
      .filter((b) => b.date);

    // Cache google busy slots into events table
    if (busy.length > 0) {
      await supabase.from("events").delete().eq("user_id", user.id).eq("source", "google");
      await supabase.from("events").insert(
        busy.map((b) => ({
          user_id: user.id,
          title: b.title,
          event_date: b.date,
          start_time: b.start,
          end_time: b.end,
          source: "google",
          status: "confirmed",
          external_id: b.external_id,
          location: "",
          notes: "Google Calendar busy",
        })),
      );
    }

    return new Response(JSON.stringify({ common_slots, busy_count: busy.length, raw: data }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("calendar-sync error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

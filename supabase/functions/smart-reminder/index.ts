import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse cadence strings like "1×/month", "2x/week", "every 2 weeks" → days
const cadenceToDays = (c: string | null | undefined): number => {
  if (!c) return 30;
  const s = c.toLowerCase();
  const num = parseInt(s.match(/\d+/)?.[0] ?? "1", 10) || 1;
  if (s.includes("week")) return Math.round(7 / num);
  if (s.includes("month")) return Math.round(30 / num);
  if (s.includes("year")) return Math.round(365 / num);
  if (s.includes("day")) return Math.round(1 / num);
  return 30;
};

const daysSince = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const webhookUrl = Deno.env.get("N8N_SMART_REMINDER_URL");
    if (!webhookUrl || !/^https?:\/\//i.test(webhookUrl)) {
      // Gracefully degrade: return empty reminders so UI doesn't break
      console.warn("N8N_SMART_REMINDER_URL missing or invalid:", webhookUrl);
      return new Response(JSON.stringify({ reminders: [], warning: "webhook not configured" }), {
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

    // Profile + people
    const [{ data: profile }, { data: people }] = await Promise.all([
      supabase.from("profiles").select("display_name, location, interests, activity_prefs, free_days_per_week").eq("user_id", user.id).maybeSingle(),
      supabase.from("people").select("id, name, relation, connection_type, cadence, last_met, goal").eq("user_id", user.id),
    ]);

    // Compute overdue (days since last_met >= cadence target)
    const overdue = (people ?? [])
      .map((p) => {
        const targetDays = cadenceToDays(p.cadence);
        const since = daysSince(p.last_met as string | null);
        const daysOverdue = since == null ? targetDays : since - targetDays;
        return { ...p, days_since_last_met: since, target_days: targetDays, days_overdue: daysOverdue };
      })
      .filter((p) => p.days_overdue >= 0)
      .sort((a, b) => b.days_overdue - a.days_overdue)
      .slice(0, 10);

    const payload = {
      user: {
        id: user.id,
        display_name: profile?.display_name ?? null,
        location: profile?.location ?? null,
        interests: profile?.interests ?? [],
        activity_prefs: profile?.activity_prefs ?? [],
        free_days_per_week: profile?.free_days_per_week ?? null,
      },
      overdue_people: overdue,
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
      console.error("n8n error", n8nResp.status, text);
      return new Response(JSON.stringify({ error: "n8n webhook failed", status: n8nResp.status, body: data }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize: accept array of {person_id?, person_name?, title?, message} or {reminders:[...]}
    let reminders: Array<{ person_id?: string; person_name?: string; title?: string; message: string }> = [];
    if (Array.isArray(data)) reminders = data as any;
    else if (data && typeof data === "object" && Array.isArray((data as any).reminders)) reminders = (data as any).reminders;
    else if (data && typeof data === "object" && (data as any).message) reminders = [data as any];

    return new Response(JSON.stringify({ reminders, raw: data }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("smart-reminder error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

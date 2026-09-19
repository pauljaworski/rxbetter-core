import { authenticateRequest } from "../_shared/auth.ts";
import { streamOpenRouterCoach } from "../_shared/openrouter.ts";
import {
  authorizeGymMember,
  checkAthleteAiRateLimit,
  logAthleteAiRequest,
} from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authResult = await authenticateRequest(req);
    if ("error" in authResult) {
      return jsonResponse({ error: authResult.error }, authResult.status);
    }
    const { ctx } = authResult;

    let body: { contact_id?: string; gym_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const contactId = body.contact_id;
    const gymId = body.gym_id;
    if (!contactId || typeof contactId !== "string") {
      return jsonResponse({ error: "contact_id required" }, 400);
    }
    if (contactId !== ctx.contactId) {
      return jsonResponse({ error: "contact_id mismatch" }, 403);
    }
    if (!gymId || typeof gymId !== "string") {
      return jsonResponse({ error: "gym_id required" }, 400);
    }

    const member = await authorizeGymMember(ctx.supabaseAdmin, contactId, gymId);
    if (!member.ok) return jsonResponse({ error: member.error }, 403);

    const rate = await checkAthleteAiRateLimit(ctx.supabaseAdmin, contactId, "insights");
    if (!rate.ok) return jsonResponse({ error: rate.message }, 429);

    const sinceISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const todayISO = new Date().toISOString().slice(0, 10);
    const sb = ctx.supabaseAdmin;

    const [{ data: contact }, { data: perf }, { data: summary }] = await Promise.all([
      sb.from("contact").select("first_name, last_name").eq("id", contactId).maybeSingle(),
      sb
        .from("athlete_performance")
        .select("performance_date, score, weight_lifted, is_pr, benchmark_type_id, programming_id, workout_scale")
        .eq("contact_id", contactId)
        .gte("performance_date", sinceISO)
        .order("performance_date", { ascending: false })
        .limit(60),
      sb
        .from("athlete_benchmark_summary")
        .select("current_pr_weight, date_pr_achieved, benchmark_definition_id")
        .eq("contact_id", contactId),
    ]);

    const typeIds = Array.from(
      new Set((perf ?? []).map((p) => p.benchmark_type_id).filter(Boolean) as string[]),
    );
    const defIds = Array.from(
      new Set((summary ?? []).map((s) => s.benchmark_definition_id).filter(Boolean) as string[]),
    );
    const progIds = Array.from(
      new Set((perf ?? []).map((p) => p.programming_id).filter(Boolean) as string[]),
    );

    const [{ data: types }, { data: defs }, { data: progs }, { data: upcoming }] = await Promise.all([
      typeIds.length
        ? sb.from("benchmark_type").select("id, name, stimulus, sub_stimulus").in("id", typeIds)
        : Promise.resolve({ data: [] as { id: string; name: string; stimulus: string | null; sub_stimulus: string | null }[] }),
      defIds.length
        ? sb.from("benchmark_definition").select("id, rep_count, benchmark_type_id").in("id", defIds)
        : Promise.resolve({ data: [] as { id: string; rep_count: number; benchmark_type_id: string }[] }),
      progIds.length
        ? sb.from("programming").select("id, name, programming_segment, metcon_format").in("id", progIds)
        : Promise.resolve({ data: [] as { id: string; name: string | null; programming_segment: string | null; metcon_format: string | null }[] }),
      sb
        .from("programming")
        .select("name, description, programming_segment, wod_date, metcon_format, athlete_notes")
        .eq("gym_id", gymId)
        .eq("source", "gym")
        .gte("wod_date", todayISO)
        .not("published_at", "is", null)
        .order("wod_date", { ascending: true })
        .limit(8),
    ]);

    // Enrich PR type map with defs' types not already in perf
    const missingTypeIds = Array.from(
      new Set(
        (defs ?? [])
          .map((d) => d.benchmark_type_id)
          .filter((id) => !typeIds.includes(id)),
      ),
    );
    let allTypes = types ?? [];
    if (missingTypeIds.length) {
      const { data: extra } = await sb
        .from("benchmark_type")
        .select("id, name, stimulus, sub_stimulus")
        .in("id", missingTypeIds);
      allTypes = [...allTypes, ...(extra ?? [])];
    }

    const typeMap = new Map(allTypes.map((t) => [t.id, t]));
    const defMap = new Map((defs ?? []).map((d) => [d.id, d]));
    const progMap = new Map((progs ?? []).map((p) => [p.id, p]));

    const performanceCtx = (perf ?? []).map((p) => {
      const t = typeMap.get(p.benchmark_type_id ?? "");
      const pr = progMap.get(p.programming_id ?? "");
      return {
        date: p.performance_date,
        lift: t?.name,
        stimulus: t?.stimulus,
        weight: p.weight_lifted,
        score: p.score,
        is_pr: p.is_pr,
        scale: p.workout_scale,
        wod: pr?.name,
      };
    });

    const prCtx = (summary ?? []).map((s) => {
      const d = defMap.get(s.benchmark_definition_id);
      const t = d ? typeMap.get(d.benchmark_type_id) : undefined;
      const days = s.date_pr_achieved
        ? Math.floor((Date.now() - new Date(s.date_pr_achieved + "T12:00:00").getTime()) / 86400000)
        : null;
      return {
        lift: t?.name ?? "?",
        stimulus: t?.stimulus,
        rep_max: d?.rep_count,
        weight: s.current_pr_weight,
        days_since: days,
      };
    });

    const upcomingCtx = (upcoming ?? []).map((u) => ({
      date: u.wod_date,
      name: u.name,
      segment: u.programming_segment,
      format: u.metcon_format,
      description: u.description,
      athlete_notes: u.athlete_notes,
    }));

    const athleteName = contact?.first_name ? `${contact.first_name}` : "the athlete";

    const systemPrompt = `You are an elite CrossFit / strength-and-conditioning coach. Write a punchy weekly insight brief for ${athleteName}. Use markdown with these sections:

## Progress narrative
2-3 sentences on what this week showed: trends, highlights, recent PRs.

## Stale lifts to attack
Bulleted list of 2-3 PR lifts that haven't moved in a long time (>60 days). Suggest a concrete attempt. If none are stale, say so and suggest a different focus.

## Tomorrow's scaling
Look at upcoming programming for THIS gym. Recommend specific weights or scaling for the next session, grounded in their PRs. If nothing is published, say so.

## Focus of the week
One bold sentence in **bold** capturing the single most important thing.

Be specific with numbers from the data. Never invent lifts the athlete hasn't done. Keep total length under 280 words. Use a confident, motivating coaching tone — not corporate.`;

    const userPrompt = `Athlete data (JSON):\n\n${JSON.stringify(
      {
        recent_performance: performanceCtx,
        personal_records: prCtx,
        upcoming_programming: upcomingCtx,
      },
      null,
      2,
    )}`;

    await logAthleteAiRequest(sb, { contactId, gymId, kind: "insights" });

    const aiResp = await streamOpenRouterCoach({
      systemPrompt,
      userPrompt,
      maxTokens: 700,
      title: "RxBetter Insights",
    });

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("athlete-insights error", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});

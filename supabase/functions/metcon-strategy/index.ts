import { authenticateRequest } from "../_shared/auth.ts";
import { callOpenRouterCoach } from "../_shared/openrouter.ts";
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

function parseStrategyJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
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

    let body: { programming_id?: string; gym_id?: string; contact_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const programmingId = body.programming_id;
    const gymId = body.gym_id;
    const contactId = body.contact_id ?? ctx.contactId;

    if (!programmingId || typeof programmingId !== "string") {
      return jsonResponse({ error: "programming_id required" }, 400);
    }
    if (!gymId || typeof gymId !== "string") {
      return jsonResponse({ error: "gym_id required" }, 400);
    }
    if (contactId !== ctx.contactId) {
      return jsonResponse({ error: "contact_id mismatch" }, 403);
    }

    const member = await authorizeGymMember(ctx.supabaseAdmin, contactId, gymId);
    if (!member.ok) return jsonResponse({ error: member.error }, 403);

    const rate = await checkAthleteAiRateLimit(ctx.supabaseAdmin, contactId, "metcon_strategy");
    if (!rate.ok) return jsonResponse({ error: rate.message }, 429);

    const sb = ctx.supabaseAdmin;

    const { data: wod, error: wodErr } = await sb
      .from("programming")
      .select(
        "id, name, description, athlete_notes, coaches_notes, programming_segment, metcon_format, workout_scheme, prescribed_scale, wod_date, gym_id",
      )
      .eq("id", programmingId)
      .eq("gym_id", gymId)
      .maybeSingle();

    if (wodErr || !wod) {
      return jsonResponse({ error: "Workout not found for this gym" }, 404);
    }

    const segment = (wod.programming_segment ?? "").toLowerCase();
    if (segment !== "metcon" && segment !== "hiit") {
      // Still allow if metcon_format is set
      if (!wod.metcon_format) {
        return jsonResponse({ error: "Strategy is available for metcon segments" }, 400);
      }
    }

    const { data: items } = await sb
      .from("programming_line_item")
      .select(
        "id, sequence_number, reps_prescribed, prescribed_weight, prescribed_percentage, prescribed_score, benchmark_type_id, movement_label, rx_variants",
      )
      .eq("programming_id", programmingId)
      .is("contact_id", null)
      .order("sequence_number", { ascending: true });

    const typeIds = Array.from(
      new Set((items ?? []).map((i) => i.benchmark_type_id).filter(Boolean) as string[]),
    );
    const { data: types } = typeIds.length
      ? await sb.from("benchmark_type").select("id, name, stimulus, sub_stimulus").in("id", typeIds)
      : { data: [] as { id: string; name: string; stimulus: string | null; sub_stimulus: string | null }[] };
    const typeMap = new Map((types ?? []).map((t) => [t.id, t]));

    const movementCtx = (items ?? []).map((it) => ({
      order: it.sequence_number,
      name: it.movement_label ?? (it.benchmark_type_id ? typeMap.get(it.benchmark_type_id)?.name : null) ?? "Movement",
      stimulus: it.benchmark_type_id ? typeMap.get(it.benchmark_type_id)?.stimulus : null,
      reps: it.reps_prescribed,
      weight: it.prescribed_weight,
      percent: it.prescribed_percentage,
      score: it.prescribed_score,
      rx_variants: it.rx_variants,
    }));

    // PRs for movements in this workout
    const { data: summary } = await sb
      .from("athlete_benchmark_summary")
      .select("current_pr_weight, date_pr_achieved, benchmark_definition_id")
      .eq("contact_id", contactId);

    const defIds = (summary ?? []).map((s) => s.benchmark_definition_id);
    const { data: defs } = defIds.length
      ? await sb.from("benchmark_definition").select("id, rep_count, benchmark_type_id").in("id", defIds)
      : { data: [] as { id: string; rep_count: number; benchmark_type_id: string }[] };

    const relevantTypeIds = new Set(typeIds);
    const defMap = new Map((defs ?? []).map((d) => [d.id, d]));
    const prTypeIds = Array.from(
      new Set((defs ?? []).map((d) => d.benchmark_type_id).filter((id) => relevantTypeIds.has(id))),
    );
    let prTypes = types ?? [];
    const missing = prTypeIds.filter((id) => !typeMap.has(id));
    if (missing.length) {
      const { data: extra } = await sb
        .from("benchmark_type")
        .select("id, name, stimulus, sub_stimulus")
        .in("id", missing);
      prTypes = [...prTypes, ...(extra ?? [])];
    }
    const prTypeMap = new Map(prTypes.map((t) => [t.id, t]));

    const prCtx = (summary ?? [])
      .map((s) => {
        const d = defMap.get(s.benchmark_definition_id);
        if (!d || !relevantTypeIds.has(d.benchmark_type_id)) return null;
        const t = prTypeMap.get(d.benchmark_type_id);
        return {
          lift: t?.name ?? "?",
          rep_max: d.rep_count,
          weight_lb: s.current_pr_weight,
          date: s.date_pr_achieved,
        };
      })
      .filter(Boolean);

    // Recent scores on this programming or same format
    const sinceISO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data: recentScores } = await sb
      .from("athlete_performance")
      .select("performance_date, score, workout_scale, programming_id")
      .eq("contact_id", contactId)
      .is("programming_line_item_id", null)
      .gte("performance_date", sinceISO)
      .order("performance_date", { ascending: false })
      .limit(20);

    const { data: contact } = await sb
      .from("contact")
      .select("first_name, default_workout_scale, rx_gender")
      .eq("id", contactId)
      .maybeSingle();

    const systemPrompt = `You are an elite CrossFit coach giving a pre-WOD strategy brief. Return ONLY valid JSON with this shape:
{
  "headline": "one short motivating line",
  "scale_suggestion": "Rx / Scaled / specific load advice grounded in PRs when available",
  "pacing": "2-4 sentences on how to pace this format (splits, when to push)",
  "breakdown": ["movement or round tactic 1", "tactic 2", "tactic 3"],
  "targets": [{"movement": "name", "note": "load or set strategy"}],
  "risk": "one sentence on the biggest failure mode to avoid"
}
Rules:
- Ground advice in the workout scheme, movements, and the athlete's PRs. Never invent PRs.
- If no PR exists for a loaded movement, say so and suggest a conservative Rx/Scaled approach.
- Keep breakdown to 3-5 bullets max. Be specific and actionable.
- Match the metcon format (AMRAP, RFT, for time, EMOM, etc.).`;

    const userPrompt = JSON.stringify(
      {
        athlete: {
          name: contact?.first_name ?? "Athlete",
          default_scale: contact?.default_workout_scale,
          rx_gender: contact?.rx_gender,
        },
        workout: {
          name: wod.name,
          date: wod.wod_date,
          segment: wod.programming_segment,
          format: wod.metcon_format,
          scheme: wod.workout_scheme,
          prescribed_scale: wod.prescribed_scale,
          description: wod.description,
          athlete_notes: wod.athlete_notes,
          coaches_notes: wod.coaches_notes,
          movements: movementCtx,
        },
        relevant_prs: prCtx,
        recent_metcon_scores: recentScores ?? [],
      },
      null,
      2,
    );

    await logAthleteAiRequest(sb, { contactId, gymId, kind: "metcon_strategy" });

    const result = await callOpenRouterCoach({
      systemPrompt,
      userPrompt: `Build a strategy for this athlete and workout:\n${userPrompt}`,
      maxTokens: 800,
      temperature: 0.35,
      json: true,
      title: "RxBetter Metcon Strategy",
    });

    const parsed = parseStrategyJson(result.content);
    if (!parsed) {
      return jsonResponse({ error: "Could not parse strategy response", raw: result.content }, 502);
    }

    return jsonResponse({
      strategy: {
        headline: typeof parsed.headline === "string" ? parsed.headline : null,
        scale_suggestion: typeof parsed.scale_suggestion === "string" ? parsed.scale_suggestion : "",
        pacing: typeof parsed.pacing === "string" ? parsed.pacing : "",
        breakdown: Array.isArray(parsed.breakdown)
          ? parsed.breakdown.filter((x): x is string => typeof x === "string")
          : [],
        targets: Array.isArray(parsed.targets) ? parsed.targets : [],
        risk: typeof parsed.risk === "string" ? parsed.risk : null,
      },
      model: result.model,
      latency_ms: result.latencyMs,
    });
  } catch (e) {
    console.error("metcon-strategy error", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});

import { authenticateRequest, authorizeProgrammer } from "../_shared/auth.ts";
import { mapLlmToIntakeDraft, parseLlmJsonFromText } from "../_shared/map-llm-draft.ts";
import { callOpenRouter, selectParserTier } from "../_shared/openrouter.ts";
import { checkLlmRateLimit } from "../_shared/rate-limit.ts";
import { truncateForModel, validateWorkoutInput } from "../_shared/validate-input.ts";
import { buildUserPrompt, WOD_PARSE_SYSTEM_PROMPT } from "../_shared/wod-parse-prompt.ts";
import type { BenchmarkCatalogEntry } from "../_shared/fuzzy-benchmark.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ParseRequest = {
  gym_id: string;
  program_library_id: string;
  raw_text: string;
  display_order?: number;
  wod_date?: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authResult = await authenticateRequest(req);
  if ("error" in authResult) {
    return jsonResponse({ error: authResult.error }, authResult.status);
  }

  const { ctx } = authResult;

  let body: ParseRequest;
  try {
    body = (await req.json()) as ParseRequest;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { gym_id, program_library_id, raw_text, display_order = 0 } = body;
  if (!gym_id || !program_library_id || !raw_text) {
    return jsonResponse({ error: "gym_id, program_library_id, and raw_text are required" }, 400);
  }

  const inputCheck = validateWorkoutInput(raw_text);
  if (!inputCheck.ok) {
    return jsonResponse({ error: inputCheck.message }, 400);
  }

  const authz = await authorizeProgrammer(ctx.userClient, gym_id, program_library_id);
  if (!authz.ok) {
    return jsonResponse({ error: authz.error }, 403);
  }

  const rate = await checkLlmRateLimit(ctx.supabaseAdmin, gym_id, ctx.contactId);
  if (!rate.ok) {
    return jsonResponse({ error: rate.message }, 429);
  }

  const { data: catalogRows, error: catErr } = await ctx.supabaseAdmin
    .from("benchmark_type")
    .select("id, name, stimulus")
    .order("name")
    .limit(400);

  if (catErr) {
    return jsonResponse({ error: "Failed to load movement catalog" }, 500);
  }

  const catalog = (catalogRows ?? []) as BenchmarkCatalogEntry[];
  const catalogNames = catalog.map((c) => c.name);
  const tier = selectParserTier(raw_text);
  const truncated = truncateForModel(raw_text);

  const start = Date.now();
  let orResult;
  try {
    orResult = await callOpenRouter({
      systemPrompt: WOD_PARSE_SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(truncated, catalogNames),
      tier,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("OpenRouter error", msg);
    const clientMsg = msg.includes("OPENROUTER_API_KEY")
      ? msg
      : msg.includes("OpenRouter auth failed")
        ? msg
        : "AI parse failed. Try again or edit manually.";
    return jsonResponse({ error: clientMsg }, 502);
  }

  let llmParsed = parseLlmJsonFromText(orResult.content);
  if (!llmParsed) {
    try {
      const retry = await callOpenRouter({
        systemPrompt: WOD_PARSE_SYSTEM_PROMPT,
        userPrompt: `Fix this to valid JSON only:\n${orResult.content}`,
        tier: "fast",
        maxTokens: 600,
      });
      llmParsed = parseLlmJsonFromText(retry.content);
      orResult.tokenCount += retry.tokenCount;
    } catch {
      /* ignore retry failure */
    }
  }

  if (!llmParsed) {
    return jsonResponse({ error: "AI returned invalid structure. Edit manually." }, 422);
  }

  const draft = mapLlmToIntakeDraft({
    llm: llmParsed,
    catalog,
    defaultLibraryId: program_library_id,
    displayOrder: display_order,
    meta: {
      model: orResult.model,
      token_count: orResult.tokenCount,
      parser_tier: tier,
    },
  });

  const latencyMs = Date.now() - start;

  return jsonResponse({
    draft,
    needsLlmFallback: false,
    latency_ms: latencyMs,
    token_count: orResult.tokenCount,
    model: orResult.model,
    parser_tier: tier,
  });
});

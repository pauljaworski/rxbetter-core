export type ParserTier = "fast" | "standard" | "complex";

export function selectParserTier(rawText: string): ParserTier {
  const len = rawText.trim().length;
  if (/\b(partner|buy[- ]?in|cash[- ]?out|chipper)\b/i.test(rawText) || len > 1200) {
    return "complex";
  }
  const movementLines = rawText.split(/\n/).filter((l) => /\d/.test(l) || /\b(x|@)\b/i.test(l));
  if (len < 600 && movementLines.length <= 4) return "fast";
  return "standard";
}

const TIER_MODELS: Record<ParserTier, string[]> = {
  fast: ["google/gemini-2.5-flash", "openai/gpt-4o-mini"],
  standard: ["google/gemini-2.5-flash", "openai/gpt-4o-mini"],
  complex: ["anthropic/claude-3.5-haiku", "google/gemini-2.5-pro", "google/gemini-2.5-flash"],
};

/** Coaching / insights — prefer flash models. */
const COACH_MODELS = ["google/gemini-2.5-flash", "openai/gpt-4o-mini"];

export type OpenRouterResult = {
  content: string;
  model: string;
  tokenCount: number;
  latencyMs: number;
};

function openRouterHeaders(apiKey: string, title: string): Record<string, string> {
  const siteUrl = Deno.env.get("OPENROUTER_SITE_URL") ?? "https://rxbetter.app";
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": siteUrl,
    "X-Title": title,
  };
}

export async function callOpenRouter(options: {
  systemPrompt: string;
  userPrompt: string;
  tier: ParserTier;
  maxTokens?: number;
}): Promise<OpenRouterResult> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const models = TIER_MODELS[options.tier];
  const maxTokens = options.maxTokens ?? (options.tier === "complex" ? 1200 : 900);
  let lastError: Error | null = null;

  for (const model of models) {
    const start = Date.now();
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders(apiKey, "RxBetter WOD Parse"),
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userPrompt },
          ],
        }),
      });

      if (resp.status === 429 || resp.status >= 500) {
        lastError = new Error(`OpenRouter ${model}: HTTP ${resp.status}`);
        continue;
      }

      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`OpenRouter ${model}: ${resp.status} ${errBody.slice(0, 200)}`);
      }

      const data = (await resp.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { total_tokens?: number };
      };
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) {
        lastError = new Error(`OpenRouter ${model}: empty response`);
        continue;
      }

      return {
        content,
        model,
        tokenCount: data.usage?.total_tokens ?? 0,
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  const hint = lastError?.message?.includes("401")
    ? "Check OPENROUTER_API_KEY secret name and value in Supabase."
    : "";
  throw new Error(
    hint ? `OpenRouter auth failed. ${hint}` : (lastError?.message ?? "OpenRouter request failed"),
  );
}

/** Non-streaming coach chat (markdown or JSON). */
export async function callOpenRouterCoach(options: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
  title?: string;
}): Promise<OpenRouterResult> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const maxTokens = options.maxTokens ?? 900;
  let lastError: Error | null = null;

  for (const model of COACH_MODELS) {
    const start = Date.now();
    try {
      const body: Record<string, unknown> = {
        model,
        max_tokens: maxTokens,
        temperature: options.temperature ?? 0.4,
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userPrompt },
        ],
      };
      if (options.json) body.response_format = { type: "json_object" };

      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders(apiKey, options.title ?? "RxBetter Coach"),
        body: JSON.stringify(body),
      });

      if (resp.status === 429 || resp.status >= 500) {
        lastError = new Error(`OpenRouter ${model}: HTTP ${resp.status}`);
        continue;
      }
      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`OpenRouter ${model}: ${resp.status} ${errBody.slice(0, 200)}`);
      }

      const data = (await resp.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { total_tokens?: number };
      };
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) {
        lastError = new Error(`OpenRouter ${model}: empty response`);
        continue;
      }

      return {
        content,
        model,
        tokenCount: data.usage?.total_tokens ?? 0,
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw new Error(lastError?.message ?? "OpenRouter coach request failed");
}

/**
 * Streaming coach chat (OpenAI-compatible SSE). Returns the upstream Response
 * so callers can pipe `text/event-stream` to the client.
 */
export async function streamOpenRouterCoach(options: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  title?: string;
}): Promise<Response> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  let lastError: Error | null = null;

  for (const model of COACH_MODELS) {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders(apiKey, options.title ?? "RxBetter Insights"),
        body: JSON.stringify({
          model,
          stream: true,
          max_tokens: options.maxTokens ?? 700,
          temperature: options.temperature ?? 0.45,
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userPrompt },
          ],
        }),
      });

      if (resp.status === 429 || resp.status >= 500) {
        lastError = new Error(`OpenRouter ${model}: HTTP ${resp.status}`);
        continue;
      }
      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`OpenRouter ${model}: ${resp.status} ${errBody.slice(0, 200)}`);
      }
      if (!resp.body) {
        lastError = new Error(`OpenRouter ${model}: empty stream body`);
        continue;
      }
      return resp;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw new Error(lastError?.message ?? "OpenRouter stream failed");
}

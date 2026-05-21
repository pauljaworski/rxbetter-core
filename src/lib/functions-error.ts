import { FunctionsHttpError } from "@supabase/supabase-js";

/** Read `{ error: string }` from a failed functions.invoke call. */
export async function formatFunctionsInvokeError(
  error: { message?: string; context?: unknown },
): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context) {
    try {
      const ctx = error.context as Response;
      const body = (await ctx.json()) as { error?: string; message?: string };
      if (body?.error) return body.error;
      if (body?.message) return body.message;
    } catch {
      /* fall through */
    }
  }
  return error.message ?? "Request failed";
}

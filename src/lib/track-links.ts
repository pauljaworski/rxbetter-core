import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../types/database";

export type TrackLinkPublicOption = {
  program_library_id: string;
  name: string;
  description: string | null;
  sport_type: string | null;
};

export type TrackLinkPublicPayload = {
  link_id: string;
  gym_id: string;
  gym_name: string;
  label: string | null;
  options: TrackLinkPublicOption[];
};

export type ClaimTrackLinkResult = {
  gym_id: string;
  program_library_id: string;
  created_membership: boolean;
  created_subscription: boolean;
};

function asRecord(v: Json): Record<string, Json> | null {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, Json>;
}

function parseTrackLinkPublic(data: Json | null): TrackLinkPublicPayload | null {
  if (data === null) return null;
  const o = asRecord(data);
  if (!o) return null;

  const link_id = o.link_id;
  const gym_id = o.gym_id;
  const gym_name = o.gym_name;
  const label = o.label === undefined ? null : (o.label as string | null);
  const rawOpts = o.options;

  if (typeof link_id !== "string" || typeof gym_id !== "string" || typeof gym_name !== "string") {
    return null;
  }

  const options: TrackLinkPublicOption[] = [];
  if (Array.isArray(rawOpts)) {
    for (const item of rawOpts) {
      const r = asRecord(item);
      if (!r) continue;
      const pid = r.program_library_id;
      const name = r.name;
      if (typeof pid !== "string" || typeof name !== "string") continue;
      options.push({
        program_library_id: pid,
        name,
        description: typeof r.description === "string" ? r.description : null,
        sport_type: typeof r.sport_type === "string" ? r.sport_type : null,
      });
    }
  }

  return { link_id, gym_id, gym_name, label, options };
}

function parseClaimResult(data: Json | null): ClaimTrackLinkResult | null {
  if (data === null) return null;
  const o = asRecord(data);
  if (!o) return null;
  const gym_id = o.gym_id;
  const program_library_id = o.program_library_id;
  const created_membership = o.created_membership;
  const created_subscription = o.created_subscription;
  if (
    typeof gym_id !== "string" ||
    typeof program_library_id !== "string" ||
    typeof created_membership !== "boolean" ||
    typeof created_subscription !== "boolean"
  ) {
    return null;
  }
  return {
    gym_id,
    program_library_id,
    created_membership,
    created_subscription,
  };
}

/** Public invite payload (anon or authenticated). Invalid / expired / revoked → null. */
export async function getFitnessTrackLinkPublic(
  supabase: SupabaseClient<Database>,
  linkId: string
): Promise<TrackLinkPublicPayload | null> {
  const { data, error } = await supabase.rpc("get_fitness_track_link_public", {
    p_link_id: linkId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return parseTrackLinkPublic(data);
}

/** Authenticated athlete: join gym track from invite. */
export async function claimFitnessTrackLink(
  supabase: SupabaseClient<Database>,
  linkId: string,
  programLibraryId: string
): Promise<ClaimTrackLinkResult> {
  const { data, error } = await supabase.rpc("claim_fitness_track_link", {
    p_link_id: linkId,
    p_program_library_id: programLibraryId,
  });
  if (error) {
    throw new Error(error.message);
  }
  const parsed = parseClaimResult(data);
  if (!parsed) {
    throw new Error("claim_fitness_track_link: unexpected response shape");
  }
  return parsed;
}

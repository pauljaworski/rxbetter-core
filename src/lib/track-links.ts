import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../types/database";

export type TrackLinkIncludedProgramLibrary = {
  program_library_id: string;
  name: string;
};

export type TrackLinkPublicOption = {
  membership_offering_term_id: string;
  membership_offering_id: string;
  offering_name: string;
  description: string | null;
  term_months: number;
  price_cents: number;
  commitment_total_cents: number;
  currency: string;
  billing_type: string;
  included_program_libraries: TrackLinkIncludedProgramLibrary[];
  included_capabilities: string[];
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
  membership_offering_id: string;
  membership_offering_term_id: string;
  athlete_offering_subscription_id: string;
  created_membership: boolean;
  created_offering_subscription: boolean;
  created_track_subscriptions: number;
  created_capability_grants: number;
  end_date: string;
};

function asRecord(v: Json): Record<string, Json> | null {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, Json>;
}

function asStringArray(v: Json | undefined): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is string => typeof item === "string");
}

function parseIncludedProgramLibraries(v: Json | undefined): TrackLinkIncludedProgramLibrary[] {
  if (!Array.isArray(v)) return [];

  const result: TrackLinkIncludedProgramLibrary[] = [];
  for (const item of v) {
    const r = asRecord(item);
    if (!r) continue;
    const programLibraryId = r.program_library_id;
    const name = r.name;
    if (typeof programLibraryId !== "string" || typeof name !== "string") continue;
    result.push({
      program_library_id: programLibraryId,
      name,
    });
  }

  return result;
}

function parseTrackLinkPublic(data: Json | null): TrackLinkPublicPayload | null {
  if (data === null) return null;
  const o = asRecord(data);
  if (!o) return null;

  const linkId = o.link_id;
  const gymId = o.gym_id;
  const gymName = o.gym_name;
  const label = o.label === undefined ? null : (o.label as string | null);
  const rawOpts = o.options;

  if (typeof linkId !== "string" || typeof gymId !== "string" || typeof gymName !== "string") {
    return null;
  }

  const options: TrackLinkPublicOption[] = [];
  if (Array.isArray(rawOpts)) {
    for (const item of rawOpts) {
      const r = asRecord(item);
      if (!r) continue;

      const membershipOfferingTermId = r.membership_offering_term_id;
      const membershipOfferingId = r.membership_offering_id;
      const offeringName = r.offering_name;
      const description =
        typeof r.description === "string" ? r.description : r.description === null ? null : null;
      const termMonths = r.term_months;
      const priceCents = r.price_cents;
      const commitmentTotalCents = r.commitment_total_cents;
      const currency = r.currency;
      const billingType = r.billing_type;

      if (
        typeof membershipOfferingTermId !== "string" ||
        typeof membershipOfferingId !== "string" ||
        typeof offeringName !== "string" ||
        typeof termMonths !== "number" ||
        typeof priceCents !== "number" ||
        typeof commitmentTotalCents !== "number" ||
        typeof currency !== "string" ||
        typeof billingType !== "string"
      ) {
        continue;
      }

      options.push({
        membership_offering_term_id: membershipOfferingTermId,
        membership_offering_id: membershipOfferingId,
        offering_name: offeringName,
        description,
        term_months: termMonths,
        price_cents: priceCents,
        commitment_total_cents: commitmentTotalCents,
        currency,
        billing_type: billingType,
        included_program_libraries: parseIncludedProgramLibraries(
          r.included_program_libraries
        ),
        included_capabilities: asStringArray(r.included_capabilities),
      });
    }
  }

  return { link_id: linkId, gym_id: gymId, gym_name: gymName, label, options };
}

function parseClaimResult(data: Json | null): ClaimTrackLinkResult | null {
  if (data === null) return null;
  const o = asRecord(data);
  if (!o) return null;

  const gymId = o.gym_id;
  const membershipOfferingId = o.membership_offering_id;
  const membershipOfferingTermId = o.membership_offering_term_id;
  const athleteOfferingSubscriptionId = o.athlete_offering_subscription_id;
  const createdMembership = o.created_membership;
  const createdOfferingSubscription = o.created_offering_subscription;
  const createdTrackSubscriptions = o.created_track_subscriptions;
  const createdCapabilityGrants = o.created_capability_grants;
  const endDate = o.end_date;

  if (
    typeof gymId !== "string" ||
    typeof membershipOfferingId !== "string" ||
    typeof membershipOfferingTermId !== "string" ||
    typeof athleteOfferingSubscriptionId !== "string" ||
    typeof createdMembership !== "boolean" ||
    typeof createdOfferingSubscription !== "boolean" ||
    typeof createdTrackSubscriptions !== "number" ||
    typeof createdCapabilityGrants !== "number" ||
    typeof endDate !== "string"
  ) {
    return null;
  }

  return {
    gym_id: gymId,
    membership_offering_id: membershipOfferingId,
    membership_offering_term_id: membershipOfferingTermId,
    athlete_offering_subscription_id: athleteOfferingSubscriptionId,
    created_membership: createdMembership,
    created_offering_subscription: createdOfferingSubscription,
    created_track_subscriptions: createdTrackSubscriptions,
    created_capability_grants: createdCapabilityGrants,
    end_date: endDate,
  };
}

/** Public invite payload (anon or authenticated). Invalid / expired / revoked -> null. */
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

/** Authenticated athlete: join a gym offering term from invite. */
export async function claimFitnessTrackLink(
  supabase: SupabaseClient<Database>,
  linkId: string,
  membershipOfferingTermId: string
): Promise<ClaimTrackLinkResult> {
  const { data, error } = await supabase.rpc("claim_fitness_track_link", {
    p_link_id: linkId,
    p_membership_offering_term_id: membershipOfferingTermId,
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

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";

export type AuthContext = {
  userId: string;
  contactId: string;
  userClient: SupabaseClient;
  supabaseAdmin: SupabaseClient;
};

export async function authenticateRequest(
  req: Request,
): Promise<{ ctx: AuthContext } | { error: string; status: number }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing Authorization header", status: 401 };
  }

  const jwt = authHeader.replace("Bearer ", "").trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { error: "Server misconfigured", status: 500 };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return { error: "Invalid session", status: 401 };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("contact_id")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileErr || !profile?.contact_id) {
    return { error: "No contact profile", status: 403 };
  }

  return {
    ctx: {
      userId: userData.user.id,
      contactId: profile.contact_id as string,
      userClient,
      supabaseAdmin,
    },
  };
}

/** Uses JWT-scoped RPCs (auth_contact_id) via userClient. */
export async function authorizeProgrammer(
  userClient: SupabaseClient,
  gymId: string,
  programLibraryId: string,
): Promise<{ ok: true } | { error: string }> {
  const { data: isProg } = await userClient.rpc("has_active_fm_role", {
    p_gym_id: gymId,
    p_role: "programmer",
  });
  const { data: isAdmin } = await userClient.rpc("has_active_fm_role", {
    p_gym_id: gymId,
    p_role: "admin",
  });

  if (!isProg && !isAdmin) {
    return { error: "Programmer or admin role required" };
  }

  if (isProg) {
    const { data: scoped } = await userClient.rpc("has_staff_library_scope", {
      p_gym_id: gymId,
      p_program_library_id: programLibraryId,
      p_scope: "staff_programmer",
    });
    if (!scoped) return { error: "No library scope for programmer" };
  } else {
    const { data: scopedAdmin } = await userClient.rpc("has_staff_library_scope", {
      p_gym_id: gymId,
      p_program_library_id: programLibraryId,
      p_scope: "staff_admin",
    });
    const { data: gymWide } = await userClient.rpc("has_gym_staff_entitlement", {
      p_gym_id: gymId,
      p_scope: "staff_admin",
    });
    if (!scopedAdmin && !gymWide) return { error: "No library scope for admin" };
  }

  return { ok: true };
}

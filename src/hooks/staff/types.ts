export type ProgramLibrary = { id: string; name: string };

export type StaffDashboardStats = {
  members: number;
  activeSubs: number;
  scoresLoggedToday: number;
  upcomingWods: number;
};

export type GymRosterMember = {
  contact_id: string;
  name: string;
  email: string | null;
  roles: string[];
  subs: number;
};

export type OfferingTerm = {
  id: string;
  term_months: number;
  price_cents: number;
  currency: string;
};

export type GymOffering = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  terms: OfferingTerm[];
};

export type GymTrackLink = {
  id: string;
  label: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  max_redemptions: number | null;
  redemption_count: number;
  options: number;
};

export type StaffClassWod = {
  id: string;
  name: string | null;
  description: string | null;
  programming_segment: string | null;
  metcon_format: string | null;
  display_order: number | null;
  athlete_notes: string | null;
  coaches_notes: string | null;
};

export type StaffClassLineItem = {
  id: string;
  programming_id: string;
  sequence_number: number | null;
  reps_prescribed: number | null;
  prescribed_weight: number | null;
  prescribed_percentage: number | null;
  prescribed_score: string | null;
  benchmark_type_id: string | null;
  bench_name?: string | null;
};

export type StaffClassPerformance = {
  id: string;
  contact_id: string;
  programming_id: string | null;
  programming_line_item_id: string | null;
  score: string | null;
  weight_lifted: number | null;
  rpe: number | null;
  is_pr: boolean;
  workout_scale?: string | null;
  status?: string | null;
};

export type StaffClassContact = { id: string; name: string };

export type StaffClassDayData = {
  wods: StaffClassWod[];
  itemsByWod: Map<string, StaffClassLineItem[]>;
  perfByItem: Map<string, StaffClassPerformance[]>;
  contacts: Map<string, StaffClassContact>;
  totalLogged: number;
};

export type EditorLineItem = {
  id?: string;
  _new?: boolean;
  sequence_number: number;
  reps_prescribed: number | null;
  prescribed_weight: number | null;
  prescribed_percentage: number | null;
  prescribed_score: string | null;
  benchmark_type_id: string | null;
  bench_name?: string;
};

export type EditorWod = {
  id?: string;
  _new?: boolean;
  name: string | null;
  description: string | null;
  programming_segment: string;
  metcon_format: string | null;
  athlete_notes: string | null;
  coaches_notes: string | null;
  display_order: number;
  program_library_id: string | null;
  items: EditorLineItem[];
};

export type BenchmarkTypeOption = { id: string; name: string; stimulus: string | null };

/** Client-side draft from plain-text intake before commit. */
export type IntakeDraftPayload = {
  segment: EditorWod;
  lineItems: EditorLineItem[];
  warnings: string[];
  unmatchedTokens?: string[];
  _meta?: {
    model?: string;
    token_count?: number;
    parser_tier?: string;
  };
};

export type IntakeStageRow = {
  id: string;
  raw_text: string;
  parsed_payload: IntakeDraftPayload;
  parser_mode: string;
  contains_errors: boolean;
  correction_applied: boolean;
  status: string;
  committed_programming_id: string | null;
  latency_ms: number | null;
  created_at: string;
};

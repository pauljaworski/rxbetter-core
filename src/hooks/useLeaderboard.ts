import { useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAsyncState } from "./useAsyncState";
import { prescribedLevelLabel, type WorkoutScale } from "@/lib/format";
import { parseWorkoutScheme } from "@/lib/programming/workout-scheme-schema";
import { rankLeaderboardEntries } from "@/lib/leaderboard/rank-entries";
import { segmentLabel } from "@/lib/format";

export type GenderFilter = "male" | "female" | "both";
export type LevelFilter = "all" | WorkoutScale;

export type LeaderboardAthlete = {
  contactId: string;
  displayName: string;
  avatarUrl: string | null;
  rxGender: string | null;
};

export type LeaderboardEntry = {
  rank: number;
  performanceId: string;
  score: string;
  workoutScale: string | null;
  scaleLabel: string | null;
  athlete: LeaderboardAthlete;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
};

export type LeaderboardBoard = {
  programmingId: string;
  segmentGroupId: string | null;
  title: string;
  subtitle: string | null;
  entries: LeaderboardEntry[];
};

export type LeaderboardDay = {
  date: string;
  levels: WorkoutScale[];
  boards: LeaderboardBoard[];
};

const DEFAULT_LEVELS: WorkoutScale[] = ["rx_plus", "rx", "fx", "scaled"];

function parseGymLevels(raw: unknown): WorkoutScale[] {
  if (!Array.isArray(raw)) return DEFAULT_LEVELS;
  const valid = raw.filter(
    (v): v is WorkoutScale =>
      v === "rx_plus" || v === "rx" || v === "fx" || v === "scaled",
  );
  return valid.length ? valid : DEFAULT_LEVELS;
}

function athleteName(
  contact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    rx_gender: string | null;
  },
  profileMap: Map<string, string | null>,
): LeaderboardAthlete {
  const dn = profileMap.get(contact.id);
  const legal = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
  return {
    contactId: contact.id,
    displayName: dn?.trim() || legal || "Athlete",
    avatarUrl: contact.avatar_url,
    rxGender: contact.rx_gender,
  };
}

function matchesGender(athlete: LeaderboardAthlete, filter: GenderFilter): boolean {
  if (filter === "both") return true;
  return athlete.rxGender === filter;
}

function matchesLevel(scale: string | null, filter: LevelFilter): boolean {
  if (filter === "all") return true;
  return (scale ?? "rx") === filter;
}

export function useLeaderboard(
  gymId: string | null,
  contactId: string | null,
  date: Date,
  genderFilter: GenderFilter,
  levelFilter: LevelFilter,
) {
  const dateKey = format(date, "yyyy-MM-dd");

  const loader = useCallback(async (): Promise<LeaderboardDay> => {
    const empty: LeaderboardDay = { date: dateKey, levels: DEFAULT_LEVELS, boards: [] };
    if (!gymId) return empty;

    const { data: gymRow } = await supabase
      .from("gym")
      .select("leaderboard_levels")
      .eq("id", gymId)
      .maybeSingle();
    const levels = parseGymLevels(gymRow?.leaderboard_levels);

    const { data: progs, error: progErr } = await supabase
      .from("programming")
      .select(
        "id, name, programming_segment, metcon_format, workout_scheme, segment_group_id, group_score_anchor, display_order, prescribed_scale",
      )
      .eq("gym_id", gymId)
      .eq("wod_date", dateKey)
      .eq("source", "gym")
      .not("published_at", "is", null)
      .order("display_order", { ascending: true });

    if (progErr) throw new Error(progErr.message);
    if (!progs?.length) return { ...empty, levels };

    const progIds = progs.map((p) => p.id);
    const groupAnchors = progs.filter((p) => p.group_score_anchor && p.segment_group_id);
    const groupIds = groupAnchors.map((p) => p.segment_group_id as string);

    const [{ data: segmentPerfs, error: segPerfErr }, { data: groupPerfs, error: grpPerfErr }] =
      await Promise.all([
        supabase
          .from("athlete_performance")
          .select(
            "id, contact_id, programming_id, segment_group_id, score, result_value, workout_scale, programming_line_item_id",
          )
          .in("programming_id", progIds)
          .is("programming_line_item_id", null)
          .is("segment_group_id", null)
          .not("score", "is", null),
        groupIds.length
          ? supabase
              .from("athlete_performance")
              .select(
                "id, contact_id, programming_id, segment_group_id, score, result_value, workout_scale, programming_line_item_id",
              )
              .in("segment_group_id", groupIds)
              .is("programming_line_item_id", null)
              .not("score", "is", null)
          : Promise.resolve({ data: [] as never[], error: null }),
      ]);

    if (segPerfErr) throw new Error(segPerfErr.message);
    if (grpPerfErr) throw new Error(grpPerfErr.message);

    const leaderboardPerfs = [...(segmentPerfs ?? []), ...(groupPerfs ?? [])].filter((p) =>
      Boolean(p.score?.trim()),
    );

    const perfIds = leaderboardPerfs.map((p) => p.id);
    const contactIds = Array.from(new Set(leaderboardPerfs.map((p) => p.contact_id)));

    const [{ data: contacts }, { data: profiles }, { data: likes }, { data: comments }] =
      await Promise.all([
        contactIds.length
          ? supabase
              .from("contact")
              .select("id, first_name, last_name, avatar_url, rx_gender")
              .in("id", contactIds)
          : Promise.resolve({ data: [] as never[] }),
        contactIds.length
          ? supabase.from("profiles").select("contact_id, display_name").in("contact_id", contactIds)
          : Promise.resolve({ data: [] as never[] }),
        perfIds.length
          ? supabase
              .from("leaderboard_like")
              .select("id, performance_id, contact_id")
              .in("performance_id", perfIds)
          : Promise.resolve({ data: [] as never[] }),
        perfIds.length
          ? supabase
              .from("leaderboard_comment")
              .select("id, performance_id")
              .in("performance_id", perfIds)
          : Promise.resolve({ data: [] as never[] }),
      ]);

    const contactMap = new Map((contacts ?? []).map((c) => [c.id, c]));
    const profileMap = new Map((profiles ?? []).map((p) => [p.contact_id, p.display_name]));

    const likesByPerf = new Map<string, { count: number; mine: boolean }>();
    for (const l of likes ?? []) {
      const cur = likesByPerf.get(l.performance_id) ?? { count: 0, mine: false };
      cur.count += 1;
      if (contactId && l.contact_id === contactId) cur.mine = true;
      likesByPerf.set(l.performance_id, cur);
    }
    const commentCountByPerf = new Map<string, number>();
    for (const c of comments ?? []) {
      commentCountByPerf.set(c.performance_id, (commentCountByPerf.get(c.performance_id) ?? 0) + 1);
    }

    const boards: LeaderboardBoard[] = [];

    const segmentProgs = progs.filter((p) => !p.segment_group_id || p.group_score_anchor);

    for (const prog of segmentProgs) {
      const isGroupAnchor = Boolean(prog.group_score_anchor && prog.segment_group_id);

      const boardPerfs = leaderboardPerfs.filter((p) => {
        if (isGroupAnchor) {
          return p.segment_group_id === prog.segment_group_id;
        }
        if (p.segment_group_id) return false;
        return p.programming_id === prog.id;
      });

      if (!boardPerfs.length) continue;

      const scheme = parseWorkoutScheme(prog.workout_scheme);
      const ranked = rankLeaderboardEntries(boardPerfs, scheme?.scoreMetric, scheme?.kind);

      const buildEntries = (scaleFilter: LevelFilter): LeaderboardEntry[] => {
        const filtered = ranked.filter((p) => {
          const contact = contactMap.get(p.contact_id);
          if (!contact) return false;
          const athlete = athleteName(contact, profileMap);
          if (!matchesGender(athlete, genderFilter)) return false;
          if (!matchesLevel(p.workout_scale, scaleFilter)) return false;
          return true;
        });

        return filtered.map((p, idx) => {
          const contact = contactMap.get(p.contact_id)!;
          const athlete = athleteName(contact, profileMap);
          const social = likesByPerf.get(p.id);
          return {
            rank: idx + 1,
            performanceId: p.id,
            score: p.score ?? "—",
            workoutScale: p.workout_scale,
            scaleLabel: prescribedLevelLabel(p.workout_scale),
            athlete,
            likeCount: social?.count ?? 0,
            likedByMe: social?.mine ?? false,
            commentCount: commentCountByPerf.get(p.id) ?? 0,
          };
        });
      };

      if (levelFilter === "all") {
        for (const lvl of levels) {
          const entries = buildEntries(lvl);
          if (!entries.length) continue;
          boards.push({
            programmingId: prog.id,
            segmentGroupId: prog.segment_group_id,
            title: prog.name || segmentLabel(prog.programming_segment),
            subtitle: `${prescribedLevelLabel(lvl) ?? lvl} · ${segmentLabel(prog.programming_segment)}${prog.metcon_format ? ` · ${prog.metcon_format.toUpperCase()}` : ""}`,
            entries,
          });
        }
      } else {
        const entries = buildEntries(levelFilter);
        if (entries.length) {
          boards.push({
            programmingId: prog.id,
            segmentGroupId: prog.segment_group_id,
            title: prog.name || segmentLabel(prog.programming_segment),
            subtitle: `${segmentLabel(prog.programming_segment)}${prog.metcon_format ? ` · ${prog.metcon_format.toUpperCase()}` : ""}`,
            entries,
          });
        }
      }
    }

    return { date: dateKey, levels, boards };
  }, [gymId, contactId, dateKey, genderFilter, levelFilter]);

  const empty: LeaderboardDay = {
    date: dateKey,
    levels: DEFAULT_LEVELS,
    boards: [],
  };

  return useAsyncState(loader, [loader], empty, (d) => d.boards.length === 0);
}

export async function toggleLeaderboardLike(
  gymId: string,
  performanceId: string,
  contactId: string,
  liked: boolean,
): Promise<{ error: string | null }> {
  if (liked) {
    const { error } = await supabase
      .from("leaderboard_like")
      .delete()
      .eq("performance_id", performanceId)
      .eq("contact_id", contactId);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from("leaderboard_like").insert({
    gym_id: gymId,
    performance_id: performanceId,
    contact_id: contactId,
  });
  return { error: error?.message ?? null };
}

export async function postLeaderboardComment(
  gymId: string,
  performanceId: string,
  contactId: string,
  body: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("leaderboard_comment").insert({
    gym_id: gymId,
    performance_id: performanceId,
    contact_id: contactId,
    body: body.trim(),
  });
  return { error: error?.message ?? null };
}

export async function loadLeaderboardComments(performanceId: string) {
  const { data, error } = await supabase
    .from("leaderboard_comment")
    .select("id, body, created_at, contact_id")
    .eq("performance_id", performanceId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

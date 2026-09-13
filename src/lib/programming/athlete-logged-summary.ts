import { prescribedLevelLabel } from "@/lib/format";
import type { ExistingPerformance, LogLineItem } from "@/components/rx/LogScoreSheet";
import type { SegmentPerformance } from "@/hooks/useWorkoutDay";

function scaleSuffix(scale: string | null | undefined): string {
  const label = prescribedLevelLabel(scale);
  return label ? ` · ${label}` : "";
}

/** Compact metcon / group score for collapsed athlete cards. */
export function formatLoggedScorePreview(
  perf: SegmentPerformance | null | undefined,
): string | null {
  if (!perf?.score?.trim()) return null;
  return `${perf.score.trim()}${scaleSuffix(perf.workout_scale)}`;
}

export type LoggedLiftPreview = {
  name: string;
  detail: string;
};

/** Compact strength lift lines for collapsed athlete cards. */
export function formatLoggedLiftPreviews(
  items: LogLineItem[],
  perfByItem: Map<string, ExistingPerformance>,
): LoggedLiftPreview[] {
  const out: LoggedLiftPreview[] = [];
  for (const item of items) {
    const p = perfByItem.get(item.id);
    if (!p || (p.weight_lifted == null && !p.status)) continue;
    const name = item.bench_name?.trim() || "Lift";
    if (p.weight_lifted != null) {
      const fail = p.status === "failed" ? " (fail)" : "";
      const pr = p.is_pr ? " · PR" : "";
      out.push({
        name,
        detail: `${Math.round(Number(p.weight_lifted))} lb${fail}${pr}`,
      });
    } else {
      out.push({
        name,
        detail: p.status === "failed" ? "Failed" : "Logged",
      });
    }
  }
  return out;
}

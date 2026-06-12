import { cn } from "@/lib/utils";
import { prescribedLevelLabel, type WorkoutScale } from "@/lib/format";
import type { GenderFilter, LevelFilter } from "@/hooks/useLeaderboard";

type Props = {
  gender: GenderFilter;
  level: LevelFilter;
  levels: WorkoutScale[];
  onGenderChange: (g: GenderFilter) => void;
  onLevelChange: (l: LevelFilter) => void;
};

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function LeaderboardFilters({
  gender,
  level,
  levels,
  onGenderChange,
  onLevelChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Gender
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={gender === "both"} onClick={() => onGenderChange("both")}>
            Both
          </FilterChip>
          <FilterChip active={gender === "male"} onClick={() => onGenderChange("male")}>
            Male
          </FilterChip>
          <FilterChip active={gender === "female"} onClick={() => onGenderChange("female")}>
            Female
          </FilterChip>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Level
        </p>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={level === "all"} onClick={() => onLevelChange("all")}>
            All
          </FilterChip>
          {levels.map((lvl) => (
            <FilterChip key={lvl} active={level === lvl} onClick={() => onLevelChange(lvl)}>
              {prescribedLevelLabel(lvl) ?? lvl}
            </FilterChip>
          ))}
        </div>
      </div>
    </div>
  );
}

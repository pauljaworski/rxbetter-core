# Hooks

Data-fetching hooks for Supabase. Pages should stay thin and call hooks here.

| Hook | Purpose |
|------|---------|
| `useAsyncState` | Standard `{ data, isLoading, error, isEmpty, refetch }` |
| `useWorkoutDay` | Today's gym programming + PLIs + athlete performances |
| `useSavePerformance` | Upsert/delete `athlete_performance` (hybrid completion) |
| `useBenchmarkSummaries` | PR board data from `athlete_benchmark_summary` |
| `usePerformanceHistory` | Athlete performance ledger (History page) |
| `useProgrammingWeek` | Week of programming + PLIs + performances (Calendar) |
| `useProgramLibraries` | Active `program_library` rows for a gym |
| `useStaffDashboardStats` | Staff home counts (members, subs, scores, WODs) |
| `useGymRoster` | Active members, roles, subscription counts |
| `useGymMemberships` | Offerings/terms + track join links |
| `useStaffClassDay` | Class day WODs, shared PLIs, performances, contacts |
| `useStaffProgrammingDay` | Programming editor load for a date |
| `fetchProgrammingDayForCopy` | Copy-from-date helper (new `_new` WODs) |
| `useProgrammingSave` | Persist editor WODs + shared PLIs (`source: gym`); `saveWod` for single segment |
| `useBenchmarkCatalog` | Global `benchmark_type` list for intake fuzzy match |
| `useWodParser` | Plain-text → draft (regex); `parseWithAi` → edge `parse-complex-wod` |
| `useIntakeCommit` | Stage + commit intake to `programming` / `programming_intake_stage` |
| `useIntakeStageList` | Recent intake rows for a gym day |
| `useStaffPerformanceUpdate` | Coach/admin score corrections |

Auth/identity: `useAuth()` from `@/contexts/AuthContext`.

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
| `useProgrammingSave` | Persist editor WODs + shared PLIs (`source: gym`) |
| `useStaffPerformanceUpdate` | Coach/admin score corrections |

Auth/identity: `useAuth()` from `@/contexts/AuthContext`.

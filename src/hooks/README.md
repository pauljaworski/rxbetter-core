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

Auth/identity: `useAuth()` from `@/contexts/AuthContext`.

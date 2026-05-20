# Components

| Folder | Role |
|--------|------|
| `ui/` | shadcn primitives |
| `layout/` | `PageSkeleton`, `EmptyState`, `ErrorBanner` |
| `workout/` | Athlete workout views (`WorkoutDayView`) |
| `rx/` | App shell, nav, logging (`LogScoreSheet`) |

Pages in `src/pages/` should compose these — avoid inline Supabase calls in pages when a hook exists.

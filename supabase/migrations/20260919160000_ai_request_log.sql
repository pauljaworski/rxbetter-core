-- Athlete AI usage log (insights + metcon strategy rate limits).
create table if not exists public.ai_request_log (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contact (id) on delete cascade,
  gym_id uuid references public.gym (id) on delete set null,
  kind text not null check (kind in ('insights', 'metcon_strategy')),
  created_at timestamptz not null default now()
);

create index if not exists ai_request_log_contact_kind_day_idx
  on public.ai_request_log (contact_id, kind, created_at desc);

alter table public.ai_request_log enable row level security;

-- Service role inserts from edge functions; athletes can read their own (optional).
create policy ai_request_log_select_own on public.ai_request_log
  for select using (contact_id = public.auth_contact_id ());

comment on table public.ai_request_log is
  'Audit + daily rate limit for athlete-facing AI (insights, metcon strategy).';

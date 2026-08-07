-- Atomic PR vault recompute: serialize concurrent recomputes for the same
-- (contact_id, benchmark_definition_id) and apply summary + is_pr updates in
-- one transaction so a stale lighter attempt cannot overwrite a heavier PR.

create or replace function public.recompute_athlete_benchmark_summary (
  p_contact_id uuid,
  p_benchmark_definition_id uuid
)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_best_id uuid;
  v_best_weight numeric;
  v_best_date date;
begin
  if p_contact_id is null or p_benchmark_definition_id is null then
    raise exception 'contact_id and benchmark_definition_id are required';
  end if;

  if not (
    p_contact_id = public.auth_contact_id ()
    or exists (
      select 1
      from public.fitness_membership fm
      where fm.contact_id = p_contact_id
        and public.is_gym_admin_scoped (fm.gym_id)
    )
  ) then
    raise exception 'Not allowed to recompute PR vault for this athlete';
  end if;

  -- One recompute at a time per athlete + definition (transaction-scoped).
  perform pg_advisory_xact_lock(
    hashtext(p_contact_id::text),
    hashtext(p_benchmark_definition_id::text)
  );

  select
    ap.id,
    ap.weight_lifted,
    coalesce(ap.performance_date, (ap.created_at at time zone 'UTC')::date)
  into v_best_id, v_best_weight, v_best_date
  from public.athlete_performance ap
  where ap.contact_id = p_contact_id
    and ap.benchmark_definition_id = p_benchmark_definition_id
    and ap.weight_lifted is not null
    and ap.weight_lifted > 0
  order by
    ap.weight_lifted desc,
    coalesce(ap.performance_date, (ap.created_at at time zone 'UTC')::date) desc nulls last,
    ap.created_at desc nulls last
  limit 1;

  if v_best_id is null then
    delete from public.athlete_benchmark_summary
    where contact_id = p_contact_id
      and benchmark_definition_id = p_benchmark_definition_id;

    update public.athlete_performance
    set is_pr = false
    where contact_id = p_contact_id
      and benchmark_definition_id = p_benchmark_definition_id
      and is_pr;

    return;
  end if;

  insert into public.athlete_benchmark_summary as abs (
    contact_id,
    benchmark_definition_id,
    current_pr_weight,
    date_pr_achieved
  )
  values (
    p_contact_id,
    p_benchmark_definition_id,
    v_best_weight,
    v_best_date
  )
  on conflict (contact_id, benchmark_definition_id) do update
  set
    current_pr_weight = excluded.current_pr_weight,
    date_pr_achieved = excluded.date_pr_achieved;

  update public.athlete_performance
  set is_pr = (id = v_best_id)
  where contact_id = p_contact_id
    and benchmark_definition_id = p_benchmark_definition_id
    and is_pr is distinct from (id = v_best_id);
end;
$$;

comment on function public.recompute_athlete_benchmark_summary (uuid, uuid) is
  'Athlete or gym admin: atomically refresh athlete_benchmark_summary and is_pr flags for one definition.';

grant execute on function public.recompute_athlete_benchmark_summary (uuid, uuid) to authenticated;

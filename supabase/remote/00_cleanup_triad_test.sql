-- Reset Triad fixture UUIDs on remote (preserves auth.users / profiles)
begin;

delete from public.athlete_performance
where programming_id::text like 'e1000000%'
   or programming_line_item_id::text like 'f1000000%';

delete from public.programming_line_item
where id::text like 'f1000000%'
   or programming_id::text like 'e1000000%';

delete from public.programming
where id::text like 'e1000000%';

delete from public.contact_gym_capability_grant where id::text like '26000000%';
delete from public.athlete_offering_subscription where id::text like '25000000%';
delete from public.athlete_subscription where id::text like 'd1000000%';
delete from public.fitness_membership where id::text like 'b1000000%';
delete from public.fitness_track_link_option where link_id::text like '24000000%';
delete from public.fitness_track_link where id::text like '24000000%';
delete from public.membership_offering_component where id::text like '23000000%';
delete from public.membership_offering_term where id::text like '22000000%';
delete from public.membership_offering where id::text like '21000000%';
delete from public.program_library where id::text like '10000000%';

commit;

-- Duplicate signup contact removed after profile is repointed (see 02_paul_auth_dates_prs.sql)

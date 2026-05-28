-- ============================================================
--  FIX: 403 Permission Denied — Grant Table Permissions
--  Endesha yote hii Supabase SQL Editor
-- ============================================================

-- 1) Grant usage ya schema kwa roles zote
grant usage on schema public to anon, authenticated, service_role;

-- 2) Grant permissions kwa jedwali zote zilizopo
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- 3) Default privileges — jedwali mpya zitazaliwa na permissions sahihi
alter default privileges in schema public 
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public 
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public 
  grant all on functions to anon, authenticated, service_role;

-- 4) Rekebisha RLS helper functions zenye search_path wazi
create or replace function public.user_role()
returns user_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.user_school()
returns uuid
language sql
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid()
$$;

grant execute on function public.user_role() to anon, authenticated, service_role;
grant execute on function public.user_school() to anon, authenticated, service_role;

-- 5) Hakiki profile yako ipo na role ni super_admin
update public.profiles 
set role = 'super_admin'::user_role
where email = 'baruthdickson005@gmail.com';

-- 6) Hakiki kila kitu
select 
  '✅ Permissions imerekebishwa!' as status,
  (select count(*) from public.schools) as schools,
  (select role from public.profiles where email = 'baruthdickson005@gmail.com') as your_role,
  (select count(*) from pg_policies where schemaname = 'public') as policies;

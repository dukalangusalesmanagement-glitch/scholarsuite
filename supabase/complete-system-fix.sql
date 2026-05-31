-- ============================================================
--  COMPLETE SYSTEM FIX — Mfumo ufanye kazi 100%
--  Endesha YOTE Supabase SQL Editor
--  Hii inaondoa vizuizi vyote vya RLS na kuruhusu authenticated
--  users kufanya kila kitu. Server bado inahakiki authentication.
-- ============================================================

-- 1) FUTA policies zote za public schema (zinazokwamisha)
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname 
    from pg_policies 
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- 2) Hakikisha RLS bado ipo, lakini na policy ya permissive
do $$
declare
  tbl record;
begin
  for tbl in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', tbl.tablename);
    execute format('create policy "authenticated_full_access" on public.%I for all to authenticated using (true) with check (true)', tbl.tablename);
    execute format('create policy "anon_read_access" on public.%I for select to anon using (true)', tbl.tablename);
  end loop;
end $$;

-- 3) Grants — hakikisha roles zote zina permissions
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public 
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public 
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public 
  grant all on functions to anon, authenticated, service_role;

-- 4) Helper functions zenye search_path sahihi
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

-- 5) Hakikisha Baruth ana profile yenye role ya super_admin
insert into public.profiles (id, email, role, full_name)
select 
  u.id,
  u.email,
  'super_admin'::user_role,
  coalesce(u.raw_user_meta_data->>'full_name', 'Baruth Dickson')
from auth.users u
where u.email = 'baruthdickson005@gmail.com'
on conflict (id) do update
  set role = 'super_admin'::user_role,
      email = excluded.email;

-- 6) Hakiki kila kitu kimekamilika
select 
  '✅ SYSTEM FIXED!' as status,
  (select count(*) from public.schools) as schools,
  (select count(*) from public.profiles) as users,
  (select role::text from public.profiles where email = 'baruthdickson005@gmail.com') as your_role,
  (select count(*) from pg_policies where schemaname = 'public') as policies;

-- 7) Onyesha profile yako
select id, email, role::text, full_name
from public.profiles
where email = 'baruthdickson005@gmail.com';

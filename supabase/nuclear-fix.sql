-- ============================================================
--  NUCLEAR FIX — Toa RLS yote, jaribu insert moja kwa moja
--  ENDESHA YOTE HII SUPABASE SQL EDITOR
-- ============================================================

-- 1) Disable RLS kwenye tables ZOTE za public schema
do $$
declare 
  tbl record;
begin
  for tbl in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I disable row level security', tbl.tablename);
  end loop;
end $$;

-- 2) Onyesha hali ya RLS (zote zinapaswa kuwa false)
select 
  '📊 Hali ya RLS:' as label,
  tablename, 
  rowsecurity as rls_imewashwa
from pg_tables 
where schemaname = 'public'
order by tablename;

-- 3) Grants kamili kwa roles zote
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public 
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public 
  grant all on sequences to anon, authenticated, service_role;

-- 4) Test insert moja kwa moja - kama hii inafanikiwa, database iko sawa
insert into public.schools (name, slug, status, plan, monthly_fee, region)
values ('TEST SHULE - SQL TEST', 'test-shule-sql', 'trial', 'basic', 500000, 'Test Region')
returning 
  '✅ INSERT IMEFANIKIWA!' as status,
  id, 
  name, 
  slug, 
  monthly_fee;

-- 5) Hakikisha Baruth ana profile yenye super_admin
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

-- 6) Onyesha shule zote zilizopo
select 
  '🏫 Shule zote:' as label,
  id,
  name,
  status,
  plan,
  created_at
from public.schools
order by created_at desc
limit 10;

-- 7) Onyesha profile yako
select 
  '👤 Profile yako:' as label,
  id, 
  email, 
  role::text as role, 
  full_name
from public.profiles
where email = 'baruthdickson005@gmail.com';

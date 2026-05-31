-- ============================================================
--  COMPLETE FIX — Super Admin Profile + Permissions
--  Endesha YOTE Supabase SQL Editor (haijalishi imeshendeshwa)
-- ============================================================

-- 1) Hakikisha INSERT policy ipo kwenye profiles
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert with check (id = auth.uid());

-- 2) Hakikisha SELECT policy iko sawa
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (id = auth.uid() or public.user_role() = 'super_admin');

-- 3) Hakikisha UPDATE policy iko sawa
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid() or public.user_role() = 'super_admin');

-- 4) Grants kwa roles zote (kuepuka 403)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- 5) Hakikisha helper functions zina search_path
create or replace function public.user_role()
returns user_role
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

grant execute on function public.user_role() to anon, authenticated, service_role;

-- 6) DELETE profile ya zamani (kama ipo na ina shida) na uunde mpya
delete from public.profiles 
where email = 'baruthdickson005@gmail.com';

-- 7) Tengeneza profile MPYA, fresh, kwa Super Admin
insert into public.profiles (id, email, full_name, role)
select 
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', 'Baruth Dickson'),
  'super_admin'::user_role
from auth.users u
where u.email = 'baruthdickson005@gmail.com';

-- 8) HAKIKI — lazima uone profile yako na role 'super_admin'
select 
  '✅ FIXED!' as status,
  p.id,
  p.email,
  p.role::text as role,
  p.full_name,
  p.created_at
from public.profiles p
where p.email = 'baruthdickson005@gmail.com';

-- 9) Hakiki RLS policies
select 
  policyname,
  cmd
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

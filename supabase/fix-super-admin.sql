-- ============================================================
--  FIX: Hakikisha Super Admin profile ipo na role ni sahihi
--  Endesha Supabase SQL Editor
-- ============================================================

-- 1) Hakikisha INSERT policy ipo (kwa users wapya kujitengenezea profile)
drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles
  for insert
  with check (id = auth.uid());

-- 2) Tengeneza au update profile ya Super Admin (baruthdickson005@gmail.com)
insert into public.profiles (id, email, full_name, first_name, role)
select 
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', 'Baruth Dickson'),
  coalesce(u.raw_user_meta_data->>'first_name', 'Baruth'),
  'super_admin'::user_role
from auth.users u
where u.email = 'baruthdickson005@gmail.com'
on conflict (id) do update
  set role = 'super_admin'::user_role,
      email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      first_name = coalesce(public.profiles.first_name, excluded.first_name);

-- 3) Hakiki kwamba imefanikiwa
select 
  '✅ Super Admin profile imerekebishwa!' as status,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
from public.profiles p
where p.email = 'baruthdickson005@gmail.com';

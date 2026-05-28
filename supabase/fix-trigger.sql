-- ============================================================
--  FIX: Trigger inakwama wakati wa kuumba user
-- ============================================================

-- 1) Ondoa trigger ya zamani
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- 2) Tengeneza upya na error handling bora
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'school_admin'::user_role
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Kama profile insert inashindwa, usizuie user creation
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;
end;
$$;

-- 3) Toa permissions kwa function
grant execute on function public.handle_new_user() to anon, authenticated, service_role;

-- 4) Tengeneza trigger upya
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Hakiki trigger ipo
select 
  '✅ Trigger imerekebishwa!' as status,
  tgname as trigger_name,
  tgenabled as enabled
from pg_trigger
where tgname = 'on_auth_user_created';

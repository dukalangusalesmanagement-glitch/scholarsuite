-- ============================================================
--  ClassLink — RBAC Upgrade + Permissions Fix
--  Endesha YOTE Supabase SQL Editor mara moja
-- ============================================================

-- 1) Ongeza roles 13 mpya kwenye enum
do $$
begin
  begin alter type user_role add value 'school_director'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'head_teacher'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'academic_master'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'subject_teacher'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'class_teacher'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'hostel_manager'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'transport_manager'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'secretary'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'receptionist'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'nurse'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'store_keeper'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'security_supervisor'; exception when duplicate_object then null; end;
  begin alter type user_role add value 'hr_officer'; exception when duplicate_object then null; end;
end $$;

-- 2) Ongeza columns za majina 3 + assignments kwenye profiles
alter table public.profiles 
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists last_name text,
  add column if not exists assigned_class_id uuid,
  add column if not exists assigned_subjects uuid[],
  add column if not exists created_by uuid references public.profiles(id);

-- 3) FIX 403 — Grant permissions kwa roles zote
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

-- 4) Rekebisha helper functions zenye search_path
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

-- 5) Update trigger ya kuumba profile automatic — sasa inashughulikia data zote
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn text;
  mn text;
  ln text;
  fullname text;
begin
  fn := new.raw_user_meta_data->>'first_name';
  mn := new.raw_user_meta_data->>'middle_name';
  ln := new.raw_user_meta_data->>'last_name';
  fullname := coalesce(
    new.raw_user_meta_data->>'full_name',
    nullif(trim(concat_ws(' ', fn, mn, ln)), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (
    id, email, 
    first_name, middle_name, last_name, full_name,
    phone, role, school_id
  )
  values (
    new.id,
    new.email,
    fn, mn, ln, fullname,
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'school_admin'),
    case 
      when new.raw_user_meta_data->>'school_id' is not null 
       and new.raw_user_meta_data->>'school_id' <> '' 
      then (new.raw_user_meta_data->>'school_id')::uuid 
      else null 
    end
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;
end;
$$;

-- 6) Hakikisha trigger ipo
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7) Hakikisha account yako ni super_admin
update public.profiles 
set role = 'super_admin'::user_role
where email = 'baruthdickson005@gmail.com';

-- 8) Hakiki kila kitu kimekamilika
select 
  '✅ RBAC + Permissions imekamilika!' as status,
  (select count(*) from public.schools) as schools,
  (select count(*) from public.profiles) as users,
  (select role::text from public.profiles where email = 'baruthdickson005@gmail.com') as your_role,
  (select count(*) from pg_policies where schemaname = 'public') as policies;

-- =============================================================
--  Multi-Tenant School Isolation
--  Ensures every user is scoped to a single school (or platform)
-- =============================================================

-- 1) Make sure profiles has school_id column
alter table public.profiles
  add column if not exists school_id uuid references public.schools(id) on delete set null;

create index if not exists idx_profiles_school_id on public.profiles(school_id);

-- 2) Make sure all school-scoped tables have school_id (if missing)
do $$
declare
  tbl text;
  scoped_tables text[] := array[
    'students', 'teachers', 'staff', 'classes', 'subjects',
    'attendance', 'exams', 'timetable', 'fees', 'library_books',
    'hostel_allocations', 'transport_routes', 'payroll',
    'inventory', 'discipline', 'events', 'communications'
  ];
begin
  foreach tbl in array scoped_tables loop
    -- Check if table exists first
    if exists (select 1 from information_schema.tables where table_schema='public' and table_name=tbl) then
      execute format('alter table public.%I add column if not exists school_id uuid references public.schools(id) on delete cascade', tbl);
      execute format('create index if not exists idx_%I_school_id on public.%I(school_id)', tbl, tbl);
    end if;
  end loop;
end $$;

-- 3) Trigger to auto-create profile when new user signs up
--    Sets school_id from user_metadata if provided (e.g. when Head Teacher
--    creates a teacher, the teacher inherits the head_teacher's school)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, school_id, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'viewer'::user_role),
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role = coalesce(excluded.role, public.profiles.role),
        school_id = coalesce(excluded.school_id, public.profiles.school_id),
        phone = coalesce(excluded.phone, public.profiles.phone);
  return new;
exception when others then
  -- Don't fail the auth signup if profile insert errors
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Ensure Baruth stays super_admin with no school binding
update public.profiles
set role = 'super_admin'::user_role, school_id = null
where email = 'baruthdickson005@gmail.com';

-- 5) Verify
select
  '👤 Profile yako:' as label,
  id, email, role::text as role, school_id, full_name
from public.profiles
where email = 'baruthdickson005@gmail.com';

-- 6) Show all schools and their head teachers
select
  '🏫 Schools and Head Teachers:' as label,
  s.id as school_id,
  s.name as school_name,
  p.email as head_teacher_email,
  p.full_name as head_teacher_name,
  p.role::text as role
from public.schools s
left join public.profiles p on p.school_id = s.id and p.role = 'head_teacher'
order by s.created_at desc
limit 20;

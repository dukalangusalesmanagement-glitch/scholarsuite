-- ============================================================
--  ScholarSuite — CLEAN SCHEMA (Fixed & Idempotent)
--  Endesha YOTE hii kwa pamoja Supabase SQL Editor
--  Itafuta kila kitu cha zamani kisha itaunda upya
-- ============================================================

-- ============================================================
--  STEP 1: CLEAN SLATE — futa schema yote na uunda upya
-- ============================================================
drop schema if exists public cascade;
create schema public;
grant all on schema public to postgres, anon, authenticated, service_role;

-- Pia futa auth trigger ya zamani kama ipo
drop trigger if exists on_auth_user_created on auth.users;

-- ============================================================
--  STEP 2: EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
--  STEP 3: ENUMS
-- ============================================================
create type subscription_plan as enum ('basic', 'standard', 'premium', 'enterprise');
create type subscription_status as enum ('active', 'trial', 'expired', 'inactive');
create type user_role as enum ('super_admin', 'school_admin', 'teacher', 'parent', 'student', 'accountant', 'librarian');
create type payment_method as enum ('mpesa', 'airtel_money', 'tigo_pesa', 'bank_transfer', 'cash', 'cheque');
create type payment_status as enum ('paid', 'pending', 'overdue', 'partial', 'cancelled');
create type gender_type as enum ('male', 'female');
create type attendance_status as enum ('present', 'absent', 'late', 'excused');

-- ============================================================
--  STEP 4: TABLES
-- ============================================================

-- schools (tenants)
create table public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  director_name text,
  email text,
  phone text,
  address text,
  region text,
  country text default 'Tanzania',
  logo_url text,
  plan subscription_plan default 'basic',
  status subscription_status default 'trial',
  subscription_starts timestamptz default now(),
  subscription_ends timestamptz default (now() + interval '30 days'),
  student_count integer default 0,
  monthly_fee numeric(12,2) default 0,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_schools_status on public.schools(status);
create index idx_schools_plan on public.schools(plan);

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  avatar_url text,
  role user_role default 'school_admin',
  school_id uuid references public.schools(id) on delete cascade,
  language text default 'sw',
  is_active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_profiles_school on public.profiles(school_id);
create index idx_profiles_role on public.profiles(role);

-- classes
create table public.classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  name text not null,
  level text,
  stream text,
  capacity integer default 40,
  class_teacher_id uuid,
  academic_year text default '2025-2026',
  created_at timestamptz default now()
);
create index idx_classes_school on public.classes(school_id);

-- subjects
create table public.subjects (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  name text not null,
  code text,
  category text,
  created_at timestamptz default now()
);
create index idx_subjects_school on public.subjects(school_id);

-- teachers
create table public.teachers (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  profile_id uuid references public.profiles(id),
  employee_no text,
  full_name text not null,
  email text,
  phone text,
  gender gender_type,
  date_of_birth date,
  address text,
  qualification text,
  specialization text,
  date_joined date default current_date,
  salary numeric(12,2),
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_teachers_school on public.teachers(school_id);

-- students
create table public.students (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  admission_no text not null,
  full_name text not null,
  gender gender_type,
  date_of_birth date,
  class_id uuid references public.classes(id),
  parent_name text,
  parent_phone text,
  parent_email text,
  address text,
  photo_url text,
  date_admitted date default current_date,
  status text default 'active',
  blood_group text,
  medical_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(school_id, admission_no)
);
create index idx_students_school on public.students(school_id);
create index idx_students_class on public.students(class_id);

-- attendance
create table public.attendance (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  class_id uuid references public.classes(id),
  date date not null default current_date,
  status attendance_status default 'present',
  notes text,
  marked_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(student_id, date)
);
create index idx_attendance_school_date on public.attendance(school_id, date);

-- exams
create table public.exams (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  name text not null,
  term text,
  academic_year text default '2025-2026',
  start_date date,
  end_date date,
  status text default 'scheduled',
  created_at timestamptz default now()
);

-- exam_results (NA school_id ILIYOREKEBISHWA)
create table public.exam_results (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  exam_id uuid references public.exams(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  subject_id uuid references public.subjects(id),
  marks numeric(5,2),
  total_marks numeric(5,2) default 100,
  grade text,
  remarks text,
  created_at timestamptz default now()
);
create index idx_results_exam on public.exam_results(exam_id);
create index idx_results_student on public.exam_results(student_id);
create index idx_results_school on public.exam_results(school_id);

-- fees
create table public.fees (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  invoice_no text,
  fee_type text,
  amount numeric(12,2) not null,
  amount_paid numeric(12,2) default 0,
  due_date date,
  status payment_status default 'pending',
  term text,
  academic_year text default '2025-2026',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_fees_school on public.fees(school_id);
create index idx_fees_student on public.fees(student_id);
create index idx_fees_status on public.fees(status);

-- payments
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  fee_id uuid references public.fees(id) on delete cascade,
  student_id uuid references public.students(id),
  amount numeric(12,2) not null,
  method payment_method default 'cash',
  reference text,
  transaction_id text,
  payment_date timestamptz default now(),
  received_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz default now()
);
create index idx_payments_school on public.payments(school_id);
create index idx_payments_date on public.payments(payment_date);

-- timetable
create table public.timetable (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  teacher_id uuid references public.teachers(id),
  day_of_week integer check (day_of_week between 1 and 7),
  period integer,
  start_time time,
  end_time time,
  room text,
  created_at timestamptz default now()
);

-- library_books
create table public.library_books (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  title text not null,
  author text,
  isbn text,
  category text,
  total_copies integer default 1,
  available_copies integer default 1,
  shelf_location text,
  created_at timestamptz default now()
);

-- library_borrowings
create table public.library_borrowings (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  book_id uuid references public.library_books(id) on delete cascade,
  student_id uuid references public.students(id),
  borrowed_at timestamptz default now(),
  due_date date,
  returned_at timestamptz,
  status text default 'borrowed'
);

-- hostel_rooms
create table public.hostel_rooms (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  room_no text not null,
  block text,
  capacity integer default 4,
  occupied integer default 0,
  gender gender_type,
  created_at timestamptz default now()
);

-- hostel_assignments
create table public.hostel_assignments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  room_id uuid references public.hostel_rooms(id),
  student_id uuid references public.students(id) on delete cascade,
  bed_no integer,
  assigned_date date default current_date,
  vacated_date date,
  status text default 'active'
);

-- transport_routes
create table public.transport_routes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  route_name text not null,
  bus_number text,
  driver_name text,
  driver_phone text,
  capacity integer default 30,
  monthly_fee numeric(12,2),
  created_at timestamptz default now()
);

-- transport_assignments
create table public.transport_assignments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  route_id uuid references public.transport_routes(id),
  student_id uuid references public.students(id) on delete cascade,
  pickup_point text,
  assigned_date date default current_date,
  status text default 'active'
);

-- payroll
create table public.payroll (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  teacher_id uuid references public.teachers(id) on delete cascade,
  month integer,
  year integer,
  basic_salary numeric(12,2),
  allowances numeric(12,2) default 0,
  deductions numeric(12,2) default 0,
  net_salary numeric(12,2),
  paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- inventory
create table public.inventory (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  item_name text not null,
  category text,
  quantity integer default 0,
  unit text,
  unit_price numeric(12,2),
  supplier text,
  location text,
  reorder_level integer default 10,
  created_at timestamptz default now()
);

-- discipline_records
create table public.discipline_records (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade,
  incident_date date default current_date,
  category text,
  description text,
  action_taken text,
  reported_by uuid references public.profiles(id),
  severity text default 'low',
  created_at timestamptz default now()
);

-- events
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  start_date timestamptz,
  end_date timestamptz,
  location text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- announcements
create table public.announcements (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade not null,
  title text not null,
  message text not null,
  recipients text,
  channel text default 'in_app',
  sent_by uuid references public.profiles(id),
  sent_at timestamptz default now()
);

-- activity_log
create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references public.schools(id) on delete cascade,
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);
create index idx_activity_school on public.activity_log(school_id);
create index idx_activity_created on public.activity_log(created_at desc);

-- ============================================================
--  STEP 5: TRIGGERS
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_schools_updated_at before update on public.schools
  for each row execute function public.handle_updated_at();
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_students_updated_at before update on public.students
  for each row execute function public.handle_updated_at();
create trigger set_teachers_updated_at before update on public.teachers
  for each row execute function public.handle_updated_at();
create trigger set_fees_updated_at before update on public.fees
  for each row execute function public.handle_updated_at();

-- ============================================================
--  STEP 6: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'school_admin')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  STEP 7: HELPER FUNCTIONS for RLS
-- ============================================================
create or replace function public.user_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer;

create or replace function public.user_school()
returns uuid as $$
  select school_id from public.profiles where id = auth.uid()
$$ language sql security definer;

-- ============================================================
--  STEP 8: ENABLE RLS
-- ============================================================
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.exams enable row level security;
alter table public.exam_results enable row level security;
alter table public.fees enable row level security;
alter table public.payments enable row level security;
alter table public.timetable enable row level security;
alter table public.library_books enable row level security;
alter table public.library_borrowings enable row level security;
alter table public.hostel_rooms enable row level security;
alter table public.hostel_assignments enable row level security;
alter table public.transport_routes enable row level security;
alter table public.transport_assignments enable row level security;
alter table public.payroll enable row level security;
alter table public.inventory enable row level security;
alter table public.discipline_records enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.activity_log enable row level security;

-- ============================================================
--  STEP 9: SCHOOLS & PROFILES POLICIES
-- ============================================================
create policy "Super admin full access schools" on public.schools
  for all using (public.user_role() = 'super_admin');

create policy "School users read own school" on public.schools
  for select using (id = public.user_school());

create policy "Users read own profile" on public.profiles
  for select using (id = auth.uid() or public.user_role() = 'super_admin');

create policy "Users update own profile" on public.profiles
  for update using (id = auth.uid());

create policy "Super admin all profiles" on public.profiles
  for all using (public.user_role() = 'super_admin');

-- ============================================================
--  STEP 10: GENERIC TENANT POLICIES (loop)
-- ============================================================
do $$
declare
  tbl text;
  tables text[] := array[
    'classes', 'subjects', 'teachers', 'students', 'attendance',
    'exams', 'exam_results', 'fees', 'payments', 'timetable',
    'library_books', 'library_borrowings', 'hostel_rooms', 'hostel_assignments',
    'transport_routes', 'transport_assignments', 'payroll', 'inventory',
    'discipline_records', 'events', 'announcements', 'activity_log'
  ];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy "tenant_select_%s" on public.%I for select using (school_id = public.user_school() or public.user_role() = ''super_admin'')',
      tbl, tbl
    );
    execute format(
      'create policy "tenant_insert_%s" on public.%I for insert with check (school_id = public.user_school() or public.user_role() = ''super_admin'')',
      tbl, tbl
    );
    execute format(
      'create policy "tenant_update_%s" on public.%I for update using (school_id = public.user_school() or public.user_role() = ''super_admin'')',
      tbl, tbl
    );
    execute format(
      'create policy "tenant_delete_%s" on public.%I for delete using (school_id = public.user_school() or public.user_role() = ''super_admin'')',
      tbl, tbl
    );
  end loop;
end $$;

-- ============================================================
--  STEP 11: SEED DATA — shule 8 za Tanzania
-- ============================================================
insert into public.schools (name, slug, director_name, email, phone, address, region, plan, status, student_count, monthly_fee)
values
  ('Mwenge Secondary School', 'mwenge-sec', 'Dr. Joseph Mwakasege', 'info@mwenge.ac.tz', '+255 754 123 456', 'Mwenge Road, Kinondoni', 'Dar es Salaam', 'premium', 'active', 842, 2500000),
  ('Arusha International Academy', 'arusha-intl', 'Mrs. Grace Mollel', 'admin@arushaintl.ac.tz', '+255 758 234 567', 'Njiro Hill', 'Arusha', 'enterprise', 'active', 1240, 4800000),
  ('Mbeya Highlands School', 'mbeya-highlands', 'Mr. Daniel Mwasanjala', 'office@mbeyahighlands.tz', '+255 763 345 678', 'Iyunga Road', 'Mbeya', 'standard', 'active', 567, 1500000),
  ('Mwanza Lakeside Academy', 'mwanza-lakeside', 'Dr. Esther Magesa', 'principal@lakeside.ac.tz', '+255 769 456 789', 'Bwiru Boys', 'Mwanza', 'premium', 'active', 723, 2400000),
  ('Dodoma Central College', 'dodoma-central', 'Prof. Hassan Mwinyi', 'info@dodomacentral.tz', '+255 752 567 890', 'Area C', 'Dodoma', 'standard', 'trial', 412, 1200000),
  ('Zanzibar Coastal School', 'zanzibar-coastal', 'Mrs. Aisha Khamis', 'admin@zanzibarcoastal.tz', '+255 778 678 901', 'Stone Town', 'Zanzibar', 'basic', 'active', 298, 800000),
  ('Iringa Mountain Academy', 'iringa-mountain', 'Mr. Peter Sanga', 'office@iringamountain.tz', '+255 765 789 012', 'Gangilonga', 'Iringa', 'standard', 'active', 489, 1400000),
  ('Tanga Coastal High', 'tanga-coastal', 'Dr. Fatma Mohammed', 'info@tangacoastal.tz', '+255 757 890 123', 'Ngamiani', 'Tanga', 'basic', 'trial', 234, 700000);

-- ============================================================
--  STEP 12: HAKIKI MATOKEO
-- ============================================================
select
  '✅ Schema imekamilika!' as status,
  (select count(*) from public.schools) as schools_count,
  (select count(*) from information_schema.tables where table_schema = 'public') as tables_count,
  (select count(*) from pg_policies where schemaname = 'public') as policies_count;

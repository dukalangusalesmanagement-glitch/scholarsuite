-- ============================================================
--  FIX: exam_results column missing + re-apply policies + seed
--  Endesha hii yote kwa pamoja kwenye Supabase SQL Editor
-- ============================================================

-- 1) Ongeza column ya school_id kwenye exam_results
alter table public.exam_results
  add column if not exists school_id uuid references public.schools(id) on delete cascade;

create index if not exists idx_exam_results_school on public.exam_results(school_id);

-- 2) Re-endesha RLS policies (idempotent — itadrop na ku-create upya)
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
    execute format('drop policy if exists "tenant_select_%s" on public.%I', tbl, tbl);
    execute format(
      'create policy "tenant_select_%s" on public.%I for select using (school_id = public.user_school() or public.user_role() = ''super_admin'')',
      tbl, tbl
    );
    execute format('drop policy if exists "tenant_insert_%s" on public.%I', tbl, tbl);
    execute format(
      'create policy "tenant_insert_%s" on public.%I for insert with check (school_id = public.user_school() or public.user_role() = ''super_admin'')',
      tbl, tbl
    );
    execute format('drop policy if exists "tenant_update_%s" on public.%I', tbl, tbl);
    execute format(
      'create policy "tenant_update_%s" on public.%I for update using (school_id = public.user_school() or public.user_role() = ''super_admin'')',
      tbl, tbl
    );
    execute format('drop policy if exists "tenant_delete_%s" on public.%I', tbl, tbl);
    execute format(
      'create policy "tenant_delete_%s" on public.%I for delete using (school_id = public.user_school() or public.user_role() = ''super_admin'')',
      tbl, tbl
    );
  end loop;
end $$;

-- 3) Hakikisha seed data ipo (kama ulikosa kupita awali)
insert into public.schools (name, slug, director_name, email, phone, address, region, plan, status, student_count, monthly_fee)
values
  ('Mwenge Secondary School', 'mwenge-sec', 'Dr. Joseph Mwakasege', 'info@mwenge.ac.tz', '+255 754 123 456', 'Mwenge Road, Kinondoni', 'Dar es Salaam', 'premium', 'active', 842, 2500000),
  ('Arusha International Academy', 'arusha-intl', 'Mrs. Grace Mollel', 'admin@arushaintl.ac.tz', '+255 758 234 567', 'Njiro Hill', 'Arusha', 'enterprise', 'active', 1240, 4800000),
  ('Mbeya Highlands School', 'mbeya-highlands', 'Mr. Daniel Mwasanjala', 'office@mbeyahighlands.tz', '+255 763 345 678', 'Iyunga Road', 'Mbeya', 'standard', 'active', 567, 1500000),
  ('Mwanza Lakeside Academy', 'mwanza-lakeside', 'Dr. Esther Magesa', 'principal@lakeside.ac.tz', '+255 769 456 789', 'Bwiru Boys', 'Mwanza', 'premium', 'active', 723, 2400000),
  ('Dodoma Central College', 'dodoma-central', 'Prof. Hassan Mwinyi', 'info@dodomacentral.tz', '+255 752 567 890', 'Area C', 'Dodoma', 'standard', 'trial', 412, 1200000),
  ('Zanzibar Coastal School', 'zanzibar-coastal', 'Mrs. Aisha Khamis', 'admin@zanzibarcoastal.tz', '+255 778 678 901', 'Stone Town', 'Zanzibar', 'basic', 'active', 298, 800000),
  ('Iringa Mountain Academy', 'iringa-mountain', 'Mr. Peter Sanga', 'office@iringamountain.tz', '+255 765 789 012', 'Gangilonga', 'Iringa', 'standard', 'active', 489, 1400000),
  ('Tanga Coastal High', 'tanga-coastal', 'Dr. Fatma Mohammed', 'info@tangacoastal.tz', '+255 757 890 123', 'Ngamiani', 'Tanga', 'basic', 'trial', 234, 700000)
on conflict (slug) do nothing;

-- 4) Hakiki kila kitu kimekamilika
select 'Fix completed successfully!' as status,
       (select count(*) from public.schools) as schools_count,
       (select count(*) from pg_policies where schemaname = 'public') as policies_count;

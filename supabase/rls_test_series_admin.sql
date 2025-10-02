-- Admin write policies for public.test_series
-- Run in Supabase SQL Editor. Safe to re-run.

-- Ensure RLS is enabled
alter table public.test_series enable row level security;

-- Drop potentially conflicting policies
drop policy if exists "Admin peut gérer les séries de tests" on public.test_series;
drop policy if exists test_series_admin_insert on public.test_series;
drop policy if exists test_series_admin_update on public.test_series;
drop policy if exists test_series_admin_delete on public.test_series;

-- Allow authenticated admins to INSERT
create policy test_series_admin_insert
on public.test_series
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Allow authenticated admins to UPDATE
create policy test_series_admin_update
on public.test_series
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Allow authenticated admins to DELETE
create policy test_series_admin_delete
on public.test_series
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Optional: ensure a permissive SELECT policy exists (already present in many setups)
-- create policy if not exists test_series_public_select
-- on public.test_series
-- for select
-- to public
-- using (true);

-- Add suspension fields to profiles table
-- Safe to run multiple times
alter table if exists public.profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_at timestamptz null,
  add column if not exists is_approved boolean not null default true;

-- Optional: comment for documentation
comment on column public.profiles.is_suspended is 'If true, the user account is suspended and should be blocked from accessing the app.';
comment on column public.profiles.suspended_at is 'Timestamp when the account was suspended.';
comment on column public.profiles.is_approved is 'If false, the account is pending approval by admin.';
-- 
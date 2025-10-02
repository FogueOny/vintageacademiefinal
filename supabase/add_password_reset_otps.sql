-- Create table for password reset OTPs
create table if not exists public.password_reset_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid,
  otp_hash text not null,
  otp_salt text not null,
  expires_at timestamptz not null,
  tries int not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes for fast lookup
create index if not exists idx_password_reset_otps_email on public.password_reset_otps (email);
create index if not exists idx_password_reset_otps_expires on public.password_reset_otps (expires_at);
create index if not exists idx_password_reset_otps_used on public.password_reset_otps (used_at);

-- Optional: auto-cleanup old rows (can be scheduled separately)
-- delete from public.password_reset_otps where (expires_at < now() - interval '7 days') or used_at is not null;

-- Note: Access via server with service role key; no RLS policy needed for public since server bypasses RLS.

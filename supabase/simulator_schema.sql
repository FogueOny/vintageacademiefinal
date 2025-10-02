-- Vintage Académie — Simulateur TCF (EE)
-- Schema + RLS + helpers
-- One credit per attempt. Credits are attributed manually by admin (no auto-signup credits).

-- 1) Tables ---------------------------------------------------------------

create table if not exists public.user_credits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta int not null,
  reason text not null, -- 'signup_bonus' | 'attempt_start' | 'admin_adjust' | 'purchase'
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_tx_user on public.credit_transactions(user_id);

create table if not exists public.simulator_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  combination_id uuid not null references public.expression_ecrite_combinations (id) on delete restrict,
  status text not null default 'in_progress', -- in_progress | submitted | graded
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  duration_seconds int,
  words_task1 int,
  words_task2 int,
  words_task3 int
);

create index if not exists idx_attempts_user on public.simulator_attempts(user_id);
create index if not exists idx_attempts_comb on public.simulator_attempts(combination_id);

create table if not exists public.simulator_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulator_attempts (id) on delete cascade,
  task_id uuid not null references public.expression_ecrite_tasks (id) on delete restrict,
  task_number int not null check (task_number in (1,2,3)),
  content text not null,
  word_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, task_number)
);

create index if not exists idx_answers_attempt on public.simulator_answers(attempt_id);

create table if not exists public.ai_evaluations (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulator_attempts (id) on delete cascade,
  task_number int, -- null => global synth
  model text not null,
  score_20 numeric(5,2),
  cecr_level text,
  positives text[],
  improvements text[],
  suggested_correction text,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_eval_attempt on public.ai_evaluations(attempt_id);

-- 2) RLS ------------------------------------------------------------------

alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.simulator_attempts enable row level security;
alter table public.simulator_answers enable row level security;
alter table public.ai_evaluations enable row level security;

-- Owner policies (users can only see their own data)

drop policy if exists user_credits_select_self on public.user_credits;
create policy user_credits_select_self on public.user_credits
  for select using (auth.uid() = user_id);

drop policy if exists user_credits_update_self on public.user_credits;
create policy user_credits_update_self on public.user_credits
  for update using (auth.uid() = user_id);

drop policy if exists credit_tx_select_self on public.credit_transactions;
create policy credit_tx_select_self on public.credit_transactions
  for select using (auth.uid() = user_id);

drop policy if exists attempts_select_self on public.simulator_attempts;
create policy attempts_select_self on public.simulator_attempts
  for select using (auth.uid() = user_id);

drop policy if exists attempts_insert_self on public.simulator_attempts;
create policy attempts_insert_self on public.simulator_attempts
  for insert with check (auth.uid() = user_id);

drop policy if exists attempts_update_self on public.simulator_attempts;
create policy attempts_update_self on public.simulator_attempts
  for update using (auth.uid() = user_id);

drop policy if exists answers_select_self on public.simulator_answers;
create policy answers_select_self on public.simulator_answers
  for select using (
    exists(
      select 1 from public.simulator_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

drop policy if exists answers_upsert_self on public.simulator_answers;
create policy answers_upsert_self on public.simulator_answers
  for insert with check (
    exists(
      select 1 from public.simulator_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

drop policy if exists answers_update_self on public.simulator_answers;
create policy answers_update_self on public.simulator_answers
  for update using (
    exists(
      select 1 from public.simulator_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

drop policy if exists ai_eval_select_self on public.ai_evaluations;
create policy ai_eval_select_self on public.ai_evaluations
  for select using (
    exists(
      select 1 from public.simulator_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

-- Service role (supabase functions / server) bypass RLS via service key.

-- 3) Helpers & RPC --------------------------------------------------------

-- 3.1 Atomic credit consumption for an attempt
create or replace function public.consume_attempt_credit(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare v_balance int;
begin
  select balance into v_balance from public.user_credits where user_id = p_user_id for update;
  if v_balance is null then
    insert into public.user_credits(user_id, balance) values (p_user_id, 0);
    v_balance := 0;
  end if;
  if v_balance < 1 then
    return false;
  end if;
  update public.user_credits set balance = balance - 1, updated_at = now() where user_id = p_user_id;
  insert into public.credit_transactions(user_id, delta, reason)
    values (p_user_id, -1, 'attempt_start');
  return true;
end; $$;

-- 3.2 Utility to add credits (admin/server)
create or replace function public.add_credits(p_user_id uuid, p_amount int, p_reason text default 'admin_adjust', p_meta jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_credits(user_id, balance)
  values (p_user_id, greatest(p_amount,0))
  on conflict (user_id) do update set balance = public.user_credits.balance + greatest(p_amount,0), updated_at = now();
  insert into public.credit_transactions(user_id, delta, reason, metadata)
    values (p_user_id, p_amount, coalesce(p_reason,'admin_adjust'), p_meta);
end; $$;

-- 4) Notes ----------------------------------------------------------------
-- - No automatic credits at signup. Admin attributes credits via add_credits(..., 'admin_adjust', ...).
-- - All writes that must bypass RLS (server-initiated) should use the Supabase service key.
-- - Front-end reads/writes respect RLS, so a user only voit ses propres données.
-- - Attempt creation flow (server):
--   1) select public.consume_attempt_credit(auth_user_id) => true/false
--   2) if true, insert into simulator_attempts(user_id, combination_id)
-- - Evaluations IA should be inserted server-side with service role.

-- Exam plans table to persist generated mock exams (plan only, not user answers)
create table if not exists public.exam_plans (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'examen_blanc',
  created_by uuid null references auth.users(id),
  config jsonb not null,
  plan jsonb not null,
  created_at timestamptz not null default now()
);

-- Optional simple index
create index if not exists idx_exam_plans_created_at on public.exam_plans(created_at desc);

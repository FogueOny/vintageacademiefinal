-- Exam submissions schema for mock exams (examen blanc)
-- Stores submissions and per-question answers for auto-gradable parts

create table if not exists public.exam_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text null, -- denormalized for convenience in admin
  plan_id uuid null references public.exam_plans(id) on delete set null,
  status text not null default 'submitted', -- in_progress | submitted | graded
  score numeric null, -- total auto-graded score, if applicable
  submitted_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_exam_submissions_user on public.exam_submissions(user_id);
create index if not exists idx_exam_submissions_plan on public.exam_submissions(plan_id);
create index if not exists idx_exam_submissions_submitted_at on public.exam_submissions(submitted_at desc);

-- Answers for auto-gradable sections (CO/CE). For EE/EO keep separate manual flow.
create table if not exists public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.exam_submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  user_option_id uuid null references public.options(id) on delete set null,
  user_label text null, -- redundancy in case option ref is not available
  created_at timestamptz not null default now(),
  unique(submission_id, question_id)
);

create index if not exists idx_submission_answers_submission on public.submission_answers(submission_id);
create index if not exists idx_submission_answers_question on public.submission_answers(question_id);

-- Optional view to expose correctness by joining options
create or replace view public.v_submission_answers_enriched as
select 
  sa.id,
  sa.submission_id,
  sa.question_id,
  m.type as question_type,
  q.content as prompt,
  sa.user_option_id,
  sa.user_label,
  uo.label as user_option_label,
  co.id as correct_option_id,
  co.label as correct_option_label,
  (coalesce(sa.user_option_id, '00000000-0000-0000-0000-000000000000'::uuid) = co.id
    or (sa.user_label is not null and sa.user_label = co.label)) as is_correct
from public.submission_answers sa
join public.questions q on q.id = sa.question_id
join public.test_series ts on ts.id = q.test_series_id
join public.modules m on m.id = ts.module_id
left join public.options uo on uo.id = sa.user_option_id
left join public.options co on co.question_id = sa.question_id and co.is_correct = true;

-- Progress tracking for stage order (CO -> CE -> EE -> EO)
alter table public.exam_submissions
  add column if not exists progress jsonb not null default '{}'::jsonb;

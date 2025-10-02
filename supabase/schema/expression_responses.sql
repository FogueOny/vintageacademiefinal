-- Schema for Expression Écrite & Expression Orale responses in Exam Blanc
-- Stores text responses (EE) and audio responses (EO) with admin corrections

-- Table pour stocker les réponses Expression Écrite & Orale
create table if not exists public.submission_expression_responses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.exam_submissions(id) on delete cascade,
  type text not null check (type in ('expression_ecrite', 'expression_orale')),
  
  -- Référence vers la tâche/sujet
  task_id uuid null, -- référence vers expression_ecrite_tasks ou expression_orale_subjects
  task_number int null, -- pour EE: 1, 2, 3
  partie_number int null, -- pour EO: 1, 2, 3
  
  -- Réponse texte (Expression Écrite)
  text_response text null,
  word_count int null,
  
  -- Réponse audio (Expression Orale)
  audio_url text null, -- URL Supabase Storage
  audio_duration_seconds int null,
  
  -- Correction admin
  admin_score numeric null check (admin_score >= 0 and admin_score <= 25),
  admin_feedback text null,
  corrected_by uuid null references auth.users(id),
  corrected_at timestamptz null,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index pour performance
create index if not exists idx_expression_responses_submission on public.submission_expression_responses(submission_id);
create index if not exists idx_expression_responses_type on public.submission_expression_responses(type);
create index if not exists idx_expression_responses_corrected on public.submission_expression_responses(corrected_at) where corrected_at is not null;

-- Trigger pour mettre à jour updated_at
create or replace function public.update_expression_responses_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_expression_responses_updated_at
  before update on public.submission_expression_responses
  for each row
  execute function public.update_expression_responses_updated_at();

-- RLS Policies
alter table public.submission_expression_responses enable row level security;

-- Users can insert their own responses
create policy "Users can insert their own expression responses"
on public.submission_expression_responses
for insert
to authenticated
with check (
  exists (
    select 1 from public.exam_submissions
    where id = submission_id
    and user_id = auth.uid()
  )
);

-- Users can read their own responses
create policy "Users can read their own expression responses"
on public.submission_expression_responses
for select
to authenticated
using (
  exists (
    select 1 from public.exam_submissions
    where id = submission_id
    and user_id = auth.uid()
  )
);

-- Users can update their own responses (before correction)
create policy "Users can update their own uncorrected responses"
on public.submission_expression_responses
for update
to authenticated
using (
  exists (
    select 1 from public.exam_submissions
    where id = submission_id
    and user_id = auth.uid()
  )
  and corrected_at is null
)
with check (
  exists (
    select 1 from public.exam_submissions
    where id = submission_id
    and user_id = auth.uid()
  )
);

-- Admins can read all responses
create policy "Admins can read all expression responses"
on public.submission_expression_responses
for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  )
);

-- Admins can update responses (for corrections)
create policy "Admins can update expression responses for corrections"
on public.submission_expression_responses
for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  )
);

-- Vue pour faciliter les requêtes avec infos utilisateur
create or replace view public.v_expression_responses_enriched as
select 
  er.*,
  es.user_id,
  es.user_email,
  es.plan_id,
  es.status as submission_status,
  p.email as corrector_email,
  p.full_name as corrector_name
from public.submission_expression_responses er
join public.exam_submissions es on es.id = er.submission_id
left join public.profiles p on p.id = er.corrected_by;

-- Grant permissions
grant select on public.v_expression_responses_enriched to authenticated;

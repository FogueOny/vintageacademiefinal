create table public.modules (
  id uuid not null default gen_random_uuid (),
  name text not null,
  description text null,
  type text not null,
  slug text not null,
  icon text null,
  created_at timestamp with time zone null default now(),
  type_module text null default 'tcf'::text,
  constraint modules_pkey primary key (id),
  constraint modules_slug_key unique (slug)
) TABLESPACE pg_default;

create table public.test_series (
  id uuid not null default gen_random_uuid (),
  module_id uuid not null,
  name text not null,
  description text null,
  time_limit integer not null,
  slug text not null,
  created_at timestamp with time zone null default now(),
  is_free boolean null default false,
  constraint test_series_pkey primary key (id),
  constraint test_series_slug_key unique (slug),
  constraint test_series_module_id_fkey foreign KEY (module_id) references modules (id)
) TABLESPACE pg_default;

create table public.options (
  id uuid not null default gen_random_uuid (),
  question_id uuid not null,
  content text not null,
  is_correct boolean not null default false,
  label text not null,
  created_at timestamp with time zone null default now(),
  constraint options_pkey primary key (id),
  constraint options_question_id_fkey foreign KEY (question_id) references questions (id)
) TABLESPACE pg_default;

create table public.question_media (
  id uuid not null default extensions.uuid_generate_v4 (),
  question_id uuid not null,
  media_url text not null,
  media_type text not null,
  description text null,
  display_order integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint question_media_pkey primary key (id),
  constraint question_media_question_id_fkey foreign KEY (question_id) references questions (id) on delete CASCADE,
  constraint question_media_media_type_check check (
    (
      media_type = any (
        array['image'::text, 'audio'::text, 'video'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists question_media_question_id_idx on public.question_media using btree (question_id) TABLESPACE pg_default;

create trigger update_question_media_modtime BEFORE
update on question_media for EACH row
execute FUNCTION update_modified_column ();

create table public.expression_orale_tasks (
  id uuid not null default extensions.uuid_generate_v4 (),
  period_id uuid null,
  task_number integer not null,
  title text not null,
  description text null,
  instructions text null,
  total_subjects integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint expression_orale_tasks_pkey primary key (id),
  constraint expression_orale_tasks_period_id_task_number_key unique (period_id, task_number),
  constraint expression_orale_tasks_period_id_fkey foreign KEY (period_id) references expression_orale_periods (id) on delete CASCADE,
  constraint expression_orale_tasks_task_number_check check ((task_number = any (array[2, 3])))
) TABLESPACE pg_default;

create index IF not exists idx_expression_orale_tasks_period on public.expression_orale_tasks using btree (period_id) TABLESPACE pg_default;

create trigger trig_update_expression_orale_tasks_timestamp BEFORE
update on expression_orale_tasks for EACH row
execute FUNCTION update_timestamps ();


create table public.expression_orale_subjects (
  id uuid not null default extensions.uuid_generate_v4 (),
  task_id uuid null,
  subject_number integer not null,
  content text not null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  question text null,
  partie_number integer not null default 1,
  period_id uuid null,
  constraint expression_orale_subjects_pkey primary key (id),
  constraint fk_expression_orale_subjects_period foreign KEY (period_id) references expression_orale_periods (id) on delete CASCADE,
  constraint fk_expression_orale_subjects_task foreign KEY (task_id) references expression_orale_tasks (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_expression_orale_subjects_task on public.expression_orale_subjects using btree (task_id) TABLESPACE pg_default;

create index IF not exists idx_expression_orale_subjects_question on public.expression_orale_subjects using btree (question) TABLESPACE pg_default;

create unique INDEX IF not exists idx_expression_orale_subjects_period_task_partie_subject on public.expression_orale_subjects using btree (period_id, task_id, partie_number, subject_number) TABLESPACE pg_default;

create index IF not exists idx_expression_orale_subjects_period_task on public.expression_orale_subjects using btree (period_id, task_id) TABLESPACE pg_default;

create index IF not exists idx_expression_orale_subjects_partie on public.expression_orale_subjects using btree (partie_number) TABLESPACE pg_default;

create trigger trig_update_expression_orale_subjects_timestamp BEFORE
update on expression_orale_subjects for EACH row
execute FUNCTION update_timestamps ();

create table public.expression_ecrite_documents (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  document_number integer not null,
  title text not null,
  content text not null,
  source text null,
  document_type text null default 'reference'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint expression_ecrite_documents_pkey primary key (id),
  constraint expression_ecrite_documents_task_id_fkey foreign KEY (task_id) references expression_ecrite_tasks (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_documents_task on public.expression_ecrite_documents using btree (task_id) TABLESPACE pg_default;

create trigger update_documents_updated_at BEFORE
update on expression_ecrite_documents for EACH row
execute FUNCTION update_updated_at_column ();
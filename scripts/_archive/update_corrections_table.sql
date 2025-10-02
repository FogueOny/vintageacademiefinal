-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS public.expression_ecrite_corrections CASCADE;

-- Créer la nouvelle table corrections adaptée à la structure validée
CREATE TABLE public.expression_ecrite_corrections (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  period_id uuid NOT NULL REFERENCES expression_ecrite_periods(id),
  combination_number integer NOT NULL,
  task_number integer NOT NULL CHECK (task_number in (1,2,3)),
  -- Pour Tâche 3 uniquement
  task3_title varchar(255) NULL,
  document1_content text NULL,
  document2_content text NULL,
  -- Pour toutes les tâches
  task_description text NOT NULL,
  correction_content text NOT NULL,
  corrector_name varchar(100) NULL DEFAULT 'EVOLUE',
  correction_type varchar(50) NULL DEFAULT 'example',
  is_public boolean NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corrections_period_id ON public.expression_ecrite_corrections(period_id);
CREATE INDEX IF NOT EXISTS idx_corrections_combination_task ON public.expression_ecrite_corrections(combination_number, task_number);
CREATE INDEX IF NOT EXISTS idx_corrections_is_public ON public.expression_ecrite_corrections(is_public);

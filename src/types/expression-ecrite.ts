// Types TypeScript pour Expression Écrite TCF

export interface ExpressionEcritePeriod {
  id: string;
  month: string;
  year: number;
  slug: string;
  title: string;
  description?: string;
  is_active: boolean;
  total_combinations: number;
  created_at: string;
  updated_at: string;
}

export interface ExpressionEcriteCombination {
  id: string;
  period_id: string;
  combination_number: number;
  title?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  period?: ExpressionEcritePeriod;
  tasks?: ExpressionEcriteTask[];
}

export interface ExpressionEcriteTask {
  id: string;
  combination_id: string;
  task_number: 1 | 2 | 3;
  title: string;
  description: string;
  word_count_min?: number;
  word_count_max?: number;
  task_type: string;
  duration_minutes?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
  created_at: string;
  updated_at: string;
  // Relations
  combination?: ExpressionEcriteCombination;
  documents?: ExpressionEcriteDocument[];
  corrections?: ExpressionEcriteCorrection[];
}

export interface ExpressionEcriteDocument {
  id: string;
  task_id: string;
  document_number: number;
  title: string;
  content: string;
  source?: string;
  document_type: 'reference' | 'example' | 'support';
  created_at: string;
  updated_at: string;
  // Relations
  task?: ExpressionEcriteTask;
}

export interface ExpressionEcriteCorrection {
  // Core DB columns (flat table)
  id: string;
  period_id: string;
  combination_number: number;
  task_number: 1 | 2 | 3;
  task3_title?: string;
  document1_content?: string;
  document2_content?: string;
  task_description: string;
  correction_content: string;
  corrector_name?: string;
  correction_type: 'example' | 'user_specific' | 'model_answer' | 'official' | 'community';
  is_public: boolean;
  created_at: string;
  updated_at: string;

  // Legacy/extended optional fields for compatibility
  task_id?: string;
  combination_id?: string;
  user_id?: string;
  title?: string; // UI label; often derived
  content?: string; // alias of correction_content for UI convenience
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];

  // Derived fields (for UI convenience)
  task_title?: string; // e.g., task3_title for task 3
  task_type?: string;  // derived from task_number
}

export interface ExpressionEcriteStats {
  id: string;
  period_id: string;
  total_attempts: number;
  average_score?: number;
  completion_rate?: number;
  most_difficult_task?: 1 | 2 | 3;
  popular_topics?: string[];
  last_updated: string;
  // Relations
  period?: ExpressionEcritePeriod;
}

// Types pour les requêtes et formulaires
export interface CreatePeriodData {
  month: string;
  year: number;
  slug: string;
  title: string;
  description?: string;
}

export interface CreateCombinationData {
  period_id: string;
  combination_number: number;
  title?: string;
}

export interface CreateTaskData {
  combination_id: string;
  task_number: 1 | 2 | 3;
  title: string;
  description: string;
  word_count_min?: number;
  word_count_max?: number;
  task_type: string;
  duration_minutes?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
}

export interface CreateDocumentData {
  task_id: string;
  document_number: number;
  title: string;
  content: string;
  source?: string;
  document_type?: 'reference' | 'example' | 'support';
}

export interface CreateCorrectionData {
  period_id: string;
  combination_number: number;
  task_number: 1 | 2 | 3;
  task_title?: string;
  task_description?: string;
  task_type?: string;
  user_id?: string;
  correction_type?: 'example' | 'user_specific' | 'model_answer' | 'official' | 'community';
  title: string;
  content: string;
  corrector_name?: string;
  is_public?: boolean;
}

// Types pour les filtres et recherches
export interface PeriodFilters {
  year?: number;
  month?: string;
  is_active?: boolean;
}

export interface TaskFilters {
  task_number?: 1 | 2 | 3;
  task_type?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  period_id?: string;
}

export interface CorrectionFilters {
  correction_type?: 'example' | 'user_specific' | 'model_answer';
  is_public?: boolean;
  task_number?: 1 | 2 | 3;
  min_score?: number;
  max_score?: number;
}

// Types pour les statistiques et analytics
export interface PeriodAnalytics {
  period: ExpressionEcritePeriod;
  total_combinations: number;
  total_tasks: number;
  total_corrections: number;
  average_score?: number;
  task_distribution: {
    task_1: number;
    task_2: number;
    task_3: number;
  };
  difficulty_distribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

export interface TaskAnalytics {
  task: ExpressionEcriteTask;
  total_corrections: number;
  average_score?: number;
  completion_rate?: number;
  common_mistakes: string[];
  success_factors: string[];
}

// Types pour l'interface utilisateur
export interface PeriodWithCombinations extends ExpressionEcritePeriod {
  combinations: CombinationWithTasks[];
}

export interface CombinationWithTasks extends ExpressionEcriteCombination {
  tasks: TaskWithDocuments[];
}

export interface TaskWithDocuments extends ExpressionEcriteTask {
  documents: ExpressionEcriteDocument[];
  corrections: ExpressionEcriteCorrection[];
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Constantes
export const TASK_TYPES = {
  COURRIEL: 'courriel',
  BLOG: 'blog',
  ARTICLE: 'article',
  ARGUMENTATION: 'argumentation',
  MESSAGE: 'message',
  LETTRE: 'lettre'
} as const;

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
} as const;

export const CORRECTION_TYPES = {
  EXAMPLE: 'example',
  USER_SPECIFIC: 'user_specific',
  MODEL_ANSWER: 'model_answer',
  OFFICIAL: 'official',
  COMMUNITY: 'community'
} as const;

export const DOCUMENT_TYPES = {
  REFERENCE: 'reference',
  EXAMPLE: 'example',
  SUPPORT: 'support'
} as const;

export const MONTHS = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
] as const;

export type MonthType = typeof MONTHS[number];

/**
 * Types pour la gestion des sujets d'expression orale TCF
 */

// Type de période (mois/année)
export interface ExpressionOralePeriod {
  id: string;
  month: number;
  year: number;
  slug: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Type de tâche (2 ou 3)
export interface ExpressionOraleTask {
  id: string;
  period_id: string;
  task_number: 2 | 3; // Tâche 2 ou Tâche 3 uniquement
  title: string;
  description?: string;
  instructions?: string;
  total_subjects: number;
  created_at?: string;
  updated_at?: string;
}

// Type de sujet
export interface ExpressionOraleSubject {
  id: string;
  task_id: string;
  subject_number: number;
  content: string;
  question?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Types pour les formulaires
export type CreatePeriodData = Omit<ExpressionOralePeriod, 'id' | 'created_at' | 'updated_at'>;
export type CreateTaskData = Omit<ExpressionOraleTask, 'id' | 'total_subjects' | 'created_at' | 'updated_at'>;
export type CreateSubjectData = Omit<ExpressionOraleSubject, 'id' | 'created_at' | 'updated_at'>;

// Type pour les réponses API
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Constantes utiles
export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Types de filtres
export interface PeriodFilters {
  year?: number;
  search?: string;
}

export interface SubjectFilters {
  task_number?: 2 | 3;
  tags?: string[];
  search?: string;
}

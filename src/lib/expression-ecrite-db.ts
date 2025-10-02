// Fonctions utilitaires pour interagir avec la base de données Expression Écrite TCF

import { createClient } from '@supabase/supabase-js';
import {
  ExpressionEcritePeriod,
  ExpressionEcriteCombination,
  ExpressionEcriteTask,
  ExpressionEcriteDocument,
  ExpressionEcriteCorrection,
  ExpressionEcriteStats,
  CreatePeriodData,
  CreateCombinationData,
  CreateTaskData,
  CreateDocumentData,
  CreateCorrectionData,
  PeriodFilters,
  TaskFilters,
  CorrectionFilters,
  PeriodWithCombinations,
  TaskWithDocuments,
  ApiResponse
} from '@/types/expression-ecrite';

// Client Supabase (utiliser les variables d'environnement existantes)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ==================== PÉRIODES ====================

export async function getPeriods(filters?: PeriodFilters): Promise<ApiResponse<ExpressionEcritePeriod[]>> {
  try {
    let query = supabase
      .from('expression_ecrite_periods')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (filters?.year) {
      query = query.eq('year', filters.year);
    }
    if (filters?.month) {
      query = query.eq('month', filters.month);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors de la récupération des périodes: ${error.message}`);
    }

    return { data: data || [] };
  } catch {
    return { error: 'Erreur lors de la récupération des périodes' };
  }
}

export async function getPeriodBySlug(slug: string): Promise<ApiResponse<ExpressionEcritePeriod>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_periods')
      .select('*')
      .eq('slug', slug)
      .single();

    if (_error) {
      return { error: _error.message };
    }

    return { data };
  } catch {
    return { error: 'Erreur lors de la récupération de la période' };
  }
}

export async function createPeriod(periodData: CreatePeriodData): Promise<ApiResponse<ExpressionEcritePeriod>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_periods')
      .insert(periodData)
      .select()
      .single();

    if (_error) {
      return { error: _error.message };
    }

    return { data };
  } catch {
    return { error: 'Erreur lors de la création de la période' };
  }
}

export async function updatePeriod(id: string, updates: Partial<CreatePeriodData>): Promise<ApiResponse<ExpressionEcritePeriod>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_periods')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (_error) {
      return { error: _error.message };
    }

    return { data };
  } catch {
    return { error: 'Erreur lors de la mise à jour de la période' };
  }
}

export async function deletePeriod(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('expression_ecrite_periods')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { message: 'Période supprimée avec succès' };
  } catch {
    return { error: 'Erreur lors de la suppression de la période' };
  }
}

// ==================== COMBINAISONS ====================

export async function getCombinationsByPeriod(periodId: string): Promise<ApiResponse<ExpressionEcriteCombination[]>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_combinations')
      .select('*')
      .eq('period_id', periodId)
      .eq('is_active', true)
      .order('combination_number', { ascending: true });

    if (_error) {
      return { error: _error.message };
    }

    return { data: data || [] };
  } catch {
    return { error: 'Erreur lors de la récupération des combinaisons' };
  }
}

export async function createCombination(combinationData: CreateCombinationData): Promise<ApiResponse<ExpressionEcriteCombination>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_combinations')
      .insert(combinationData)
      .select()
      .single();

    if (_error) {
      return { error: _error.message };
    }

    return { data };
  } catch {
    return { error: 'Erreur lors de la création de la combinaison' };
  }
}

// ==================== TÂCHES ====================

export async function getTasksByCombination(combinationId: string): Promise<ApiResponse<ExpressionEcriteTask[]>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_tasks')
      .select('*')
      .eq('combination_id', combinationId)
      .order('task_number', { ascending: true });

    if (_error) {
      return { error: _error.message };
    }

    return { data: data || [] };
  } catch {
    return { error: 'Erreur lors de la récupération des tâches' };
  }
}

export async function getTasksWithFilters(filters: TaskFilters): Promise<ApiResponse<ExpressionEcriteTask[]>> {
  try {
    let query = supabase
      .from('expression_ecrite_tasks')
      .select(`
        *,
        combination:expression_ecrite_combinations(
          *,
          period:expression_ecrite_periods(*)
        )
      `);

    if (filters.task_number) {
      query = query.eq('task_number', filters.task_number);
    }
    if (filters.task_type) {
      query = query.eq('task_type', filters.task_type);
    }
    if (filters.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level);
    }

    const { data, error } = await query;

    if (error) {
      return { error: error.message };
    }

    return { data: data || [] };
  } catch {
    return { error: 'Erreur lors de la récupération des tâches' };
  }
}

export async function createTask(taskData: CreateTaskData): Promise<ApiResponse<ExpressionEcriteTask>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_tasks')
      .insert(taskData)
      .select()
      .single();

    if (_error) {
      return { error: _error.message };
    }

    return { data };
  } catch {
    return { error: 'Erreur lors de la création de la tâche' };
  }
}

// ==================== DOCUMENTS ====================

export async function getDocumentsByTask(taskId: string): Promise<ApiResponse<ExpressionEcriteDocument[]>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_documents')
      .select('*')
      .eq('task_id', taskId)
      .order('document_number', { ascending: true });

    if (_error) {
      return { error: _error.message };
    }

    return { data: data || [] };
  } catch {
    return { error: 'Erreur lors de la récupération des documents' };
  }
}

export async function createDocument(documentData: CreateDocumentData): Promise<ApiResponse<ExpressionEcriteDocument>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_documents')
      .insert(documentData)
      .select()
      .single();

    if (_error) {
      return { error: _error.message };
    }

    return { data };
  } catch {
    return { error: 'Erreur lors de la création du document' };
  }
}

// ==================== CORRECTIONS ====================

export async function getCorrectionsByTask(taskId: string, filters?: CorrectionFilters): Promise<ApiResponse<ExpressionEcriteCorrection[]>> {
  try {
    let query = supabase
      .from('expression_ecrite_corrections')
      .select('*')
      .eq('task_id', taskId);

    if (filters?.correction_type) {
      query = query.eq('correction_type', filters.correction_type);
    }
    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }
    if (filters?.min_score) {
      query = query.gte('score', filters.min_score);
    }
    if (filters?.max_score) {
      query = query.lte('score', filters.max_score);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return { error: error.message };
    }

    return { data: data || [] };
  } catch {
    return { error: 'Erreur lors de la récupération des corrections' };
  }
}

export async function createCorrection(correctionData: CreateCorrectionData): Promise<ApiResponse<ExpressionEcriteCorrection>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_corrections')
      .insert(correctionData)
      .select()
      .single();

    if (_error) {
      return { error: _error.message };
    }

    return { data };
  } catch {
    return { error: 'Erreur lors de la création de la correction' };
  }
}

// ==================== FONCTIONS COMPLEXES ====================

export async function getPeriodWithCombinations(slug: string): Promise<ApiResponse<PeriodWithCombinations>> {
  try {
    const { data: period, error: periodError } = await supabase
      .from('expression_ecrite_periods')
      .select('*')
      .eq('slug', slug)
      .single();

    if (periodError) {
      return { error: periodError.message };
    }

    const { data: combinations, error: combinationsError } = await supabase
      .from('expression_ecrite_combinations')
      .select(`
        *,
        tasks:expression_ecrite_tasks(
          *,
          documents:expression_ecrite_documents(*),
          corrections:expression_ecrite_corrections(*)
        )
      `)
      .eq('period_id', period.id)
      .eq('is_active', true)
      .order('combination_number', { ascending: true });

    if (combinationsError) {
      return { error: combinationsError.message };
    }

    const result: PeriodWithCombinations = {
      ...period,
      combinations: combinations || []
    };

    return { data: result };
  } catch {
    return { error: 'Erreur lors de la récupération des données complètes' };
  }
}

export async function getTaskWithDocuments(taskId: string): Promise<ApiResponse<TaskWithDocuments>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_tasks')
      .select(`
        *,
        documents:expression_ecrite_documents(*),
        corrections:expression_ecrite_corrections(*)
      `)
      .eq('id', taskId)
      .single();

    if (_error) {
      return { error: _error.message };
    }

    return { data };
  } catch {
    return { error: 'Erreur lors de la récupération de la tâche complète' };
  }
}

// ==================== STATISTIQUES ====================

export async function getPeriodStats(periodId: string): Promise<ApiResponse<ExpressionEcriteStats>> {
  try {
    const { data, error: _error } = await supabase
      .from('expression_ecrite_stats')
      .select('*')
      .eq('period_id', periodId)
      .single();

    if (_error) {
      return { error: _error.message };
    }

    return { data };
  } catch {
    return { error: 'Erreur lors de la récupération des statistiques' };
  }
}

export async function updatePeriodStats(periodId: string): Promise<ApiResponse<void>> {
  try {
    // Calculer les statistiques à partir des données existantes
    const { data: combinations } = await supabase
      .from('expression_ecrite_combinations')
      .select(`
        *,
        tasks:expression_ecrite_tasks(
          *,
          corrections:expression_ecrite_corrections(score)
        )
      `)
      .eq('period_id', periodId);

    if (!combinations) {
      return { error: 'Aucune donnée trouvée pour calculer les statistiques' };
    }

    type TaskForStats = {
      corrections: { score: number | null }[] | null;
    };

    type CombinationForStats = {
      tasks: TaskForStats[];
    };

    const typedCombinations = combinations as CombinationForStats[];

    // Calculer les métriques
    const totalAttempts = typedCombinations.reduce((acc, combo) => {
      const tasksAttempts = combo.tasks.reduce((taskAcc, task) => {
        return taskAcc + (task.corrections?.length ?? 0);
      }, 0);
      return acc + tasksAttempts;
    }, 0);

    const allScores = typedCombinations.flatMap((combo) =>
      combo.tasks.flatMap((task) =>
        (task.corrections ?? [])
          .map((corr) => corr.score)
          .filter((score): score is number => typeof score === 'number')
      )
    );

    const averageScore = allScores.length > 0 
      ? allScores.reduce((sum: number, score: number) => sum + score, 0) / allScores.length 
      : null;

    // Mettre à jour ou créer les statistiques
    const { error } = await supabase
      .from('expression_ecrite_stats')
      .upsert({
        period_id: periodId,
        total_attempts: totalAttempts,
        average_score: averageScore,
        completion_rate: totalAttempts > 0 ? 100 : 0,
        last_updated: new Date().toISOString()
      });

    if (error) {
      return { error: error.message };
    }

    return { message: 'Statistiques mises à jour avec succès' };
  } catch {
    return { error: 'Erreur lors de la mise à jour des statistiques' };
  }
}

// ==================== FONCTIONS UTILITAIRES ====================

export function generatePeriodSlug(month: string, year: number): string {
  return `${month.toLowerCase()}-${year}`;
}

export function formatPeriodTitle(month: string, year: number): string {
  const monthNames: { [key: string]: string } = {
    'janvier': 'Janvier',
    'fevrier': 'Février',
    'mars': 'Mars',
    'avril': 'Avril',
    'mai': 'Mai',
    'juin': 'Juin',
    'juillet': 'Juillet',
    'aout': 'Août',
    'septembre': 'Septembre',
    'octobre': 'Octobre',
    'novembre': 'Novembre',
    'decembre': 'Décembre'
  };

  return `Sujets Expression Écrite - ${monthNames[month] || month} ${year}`;
}

export function getWordCountRange(taskNumber: 1 | 2 | 3): { min: number; max: number } {
  switch (taskNumber) {
    case 1:
      return { min: 60, max: 120 };
    case 2:
      return { min: 120, max: 150 };
    case 3:
      return { min: 120, max: 180 };
    default:
      return { min: 60, max: 180 };
  }
}

export function getTaskTypeSuggestions(taskNumber: 1 | 2 | 3): string[] {
  switch (taskNumber) {
    case 1:
      return ['courriel', 'message', 'lettre'];
    case 2:
      return ['blog', 'article', 'chronique'];
    case 3:
      return ['argumentation', 'essai', 'dissertation'];
    default:
      return ['courriel', 'blog', 'argumentation'];
  }
}

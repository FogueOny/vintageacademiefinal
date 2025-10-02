import { getSupabaseBrowser } from './client';
import { ExpressionEcriteCorrection } from '@/types/expression-ecrite';

// Types de retour API
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

type ExpressionEcriteCorrectionRow = {
  id: string;
  period_id: string;
  combination_number: number;
  task_number: number;
  task3_title: string | null;
  document1_content: string | null;
  document2_content: string | null;
  task_description: string;
  correction_content: string;
  corrector_name: string | null;
  correction_type: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

const validCorrectionTypes = new Set<ExpressionEcriteCorrection['correction_type']>([
  'example',
  'user_specific',
  'model_answer',
  'official',
  'community',
]);

const normalizeTaskNumber = (value: number): ExpressionEcriteCorrection['task_number'] => {
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }
  return 1;
};

const normalizeCorrectionType = (value: string): ExpressionEcriteCorrection['correction_type'] => {
  return validCorrectionTypes.has(value as ExpressionEcriteCorrection['correction_type'])
    ? (value as ExpressionEcriteCorrection['correction_type'])
    : 'example';
};

const mapRowToCorrection = (row: ExpressionEcriteCorrectionRow): ExpressionEcriteCorrection => {
  const taskNumber = normalizeTaskNumber(row.task_number);
  const derivedTaskType = taskNumber === 1 ? 'courriel' : taskNumber === 2 ? 'narration' : 'argumentation';
  const title = taskNumber === 3 ? row.task3_title ?? 'Sujet Tâche 3' : `Tâche ${taskNumber}`;

  return {
    id: row.id,
    period_id: row.period_id,
    combination_number: row.combination_number,
    task_number: taskNumber,
    task3_title: row.task3_title ?? undefined,
    document1_content: row.document1_content ?? undefined,
    document2_content: row.document2_content ?? undefined,
    task_description: row.task_description,
    correction_content: row.correction_content,
    corrector_name: row.corrector_name ?? undefined,
    correction_type: normalizeCorrectionType(row.correction_type),
    is_public: row.is_public,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // UI aliases / derived
    title,
    content: row.correction_content,
    task_title: title,
    task_type: derivedTaskType,
  };
};

/**
 * Récupère le nombre de corrections disponibles pour une période spécifique
 */
export async function getCorrectionCountByPeriod(periodId: string): Promise<ApiResponse<number>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Cette requête compte les corrections pour une période spécifique
    const { count, error } = await supabase
      .from('expression_ecrite_corrections')
      .select('*', { count: 'exact', head: true })
      .eq('period_id', periodId)
      .eq('is_public', true);
      
    if (error) {
      console.error(`Erreur lors du comptage des corrections pour la période ${periodId}:`, error.message);
      return { data: 0, error: error.message };
    }

    return { data: count ?? 0, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error(`Exception lors du comptage des corrections:`, message);
    return { data: 0, error: message };
  }
}

/**
 * Récupère le nombre de corrections disponibles pour chaque période
 * Retourne un objet avec les IDs de période comme clés et le nombre de corrections comme valeurs
 */
export async function getAllPeriodCorrectionCounts(): Promise<ApiResponse<Record<string, number>>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Cette requête récupère toutes les corrections avec leur période associée
    const { data, error } = await supabase
      .from('expression_ecrite_corrections')
      .select('period_id')
      .eq('is_public', true);
      
    if (error) {
      console.error(`Erreur lors de la récupération des corrections:`, error.message);
      return { data: {}, error: error.message };
    }

    // Compter les corrections par période
    const countsByPeriod: Record<string, number> = {};
    (data ?? []).forEach(({ period_id }: { period_id: string | null }) => {
      const periodId = period_id;
      if (periodId) {
        countsByPeriod[periodId] = (countsByPeriod[periodId] || 0) + 1;
      }
    });

    return { data: countsByPeriod, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error(`Exception lors du comptage global des corrections:`, message);
    return { data: {}, error: message };
  }
}

/**
 * Récupère les corrections disponibles pour une tâche spécifique dans une période et une combinaison
 */
export async function getCorrectionsByTask(periodId: string, combinationNumber: number, taskNumber: number, publicOnly: boolean = true): Promise<ApiResponse<ExpressionEcriteCorrection[]>> {
  try {
    const supabase = getSupabaseBrowser();

    // Query the flat corrections table directement
    let query = supabase
      .from('expression_ecrite_corrections')
      .select('*')
      .eq('period_id', periodId)
      .eq('combination_number', combinationNumber)
      .eq('task_number', taskNumber);
      
    // Si publicOnly est vrai, filtrer pour n'avoir que les corrections publiques
    if (publicOnly) {
      query = query.eq('is_public', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
      
    if (error) {
      console.error(`Erreur lors de la récupération des corrections pour la tâche ${taskNumber} de la combinaison ${combinationNumber}:`, error.message);
      return { data: null, error: error.message };
    }

    // Map to ExpressionEcriteCorrection with derived fields
    const mapped: ExpressionEcriteCorrection[] = (data ?? []).map((row) =>
      mapRowToCorrection(row as ExpressionEcriteCorrectionRow)
    );

    return { data: mapped, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error(`Exception lors de la récupération des corrections:`, message);
    return { data: null, error: message };
  }
}

/**
 * Récupère les corrections disponibles pour une combinaison spécifique dans une période
 */
export async function getCorrectionsByCombination(periodId: string, combinationNumber: number, publicOnly: boolean = true): Promise<ApiResponse<ExpressionEcriteCorrection[]>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Query the flat table directly
    let query = supabase
      .from('expression_ecrite_corrections')
      .select('*')
      .eq('period_id', periodId)
      .eq('combination_number', combinationNumber);
      
    // Si publicOnly est vrai, filtrer pour n'avoir que les corrections publiques
    if (publicOnly) {
      query = query.eq('is_public', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
      
    if (error) {
      console.error(`Erreur lors de la récupération des corrections pour la combinaison ${combinationNumber} de la période ${periodId}:`, error.message);
      return { data: null, error: error.message };
    }

    const mapped = (data || []).map((row: any) => {
      const derivedTaskType = row.task_number === 1 ? 'courriel' : row.task_number === 2 ? 'narration' : 'argumentation';
      const title = row.task_number === 3 ? (row.task3_title || 'Sujet Tâche 3') : `Tâche ${row.task_number}`;
      return {
        id: row.id,
        period_id: row.period_id,
        combination_number: row.combination_number,
        task_number: row.task_number,
        task3_title: row.task3_title || undefined,
        document1_content: row.document1_content || undefined,
        document2_content: row.document2_content || undefined,
        task_description: row.task_description,
        correction_content: row.correction_content,
        corrector_name: row.corrector_name || undefined,
        correction_type: row.correction_type,
        is_public: row.is_public,
        created_at: row.created_at,
        updated_at: row.updated_at,
        // UI aliases / derived
        title,
        content: row.correction_content,
        task_title: title,
        task_type: derivedTaskType
      } as ExpressionEcriteCorrection;
    });

    return { data: mapped, error: null };
  } catch (error: any) {
    console.error(`Exception lors de la récupération des corrections:`, error.message);
    return { data: null, error: error.message };
  }
}

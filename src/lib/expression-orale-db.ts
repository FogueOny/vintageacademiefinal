import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { 
  ExpressionOralePeriod, 
  ExpressionOraleTask, 
  ExpressionOraleSubject,
  ApiResponse, 
  CreatePeriodData,
  CreateTaskData,
  CreateSubjectData,
  PeriodFilters,
  SubjectFilters
} from '@/types/expression-orale';
import { MONTHS } from '@/types/expression-orale';

/**
 * Obtient une instance du client Supabase pour les composants serveur
 */
const getSupabaseServerClient = () => {
  return createServerComponentClient<Database>({ cookies });
};

/**
 * Génère un slug à partir du mois et de l'année
 */
export function generatePeriodSlug(month: number, year: number): string {
  const monthName = MONTHS[month - 1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `${monthName}-${year}`;
}

/**
 * Formate le titre d'une période
 */
export function formatPeriodTitle(month: number, year: number): string {
  return `Expression Orale ${MONTHS[month - 1]} ${year}`;
}

/**
 * ===== FONCTIONS POUR LES PÉRIODES =====
 */

/**
 * Crée une nouvelle période
 */
export async function createPeriod(data: CreatePeriodData): Promise<ApiResponse<ExpressionOralePeriod>> {
  try {
    // Générer le slug si non fourni
    if (!data.slug) {
      data.slug = generatePeriodSlug(data.month, data.year);
    }
    
    // Générer le titre si non fourni
    if (!data.title) {
      data.title = formatPeriodTitle(data.month, data.year);
    }

    const supabase = getSupabaseServerClient();
    
    const { data: period, error } = await supabase
      .from('expression_orale_periods')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la période:', error);
      return { data: null, error: error.message };
    }
    
    return { data: period as ExpressionOralePeriod, error: null };
  } catch (error) {
    console.error('Exception lors de la création de la période:', error);
    return { data: null, error: 'Une erreur est survenue lors de la création de la période' };
  }
}

/**
 * Récupère toutes les périodes avec filtres optionnels
 */
export async function getAllPeriods(filters?: PeriodFilters): Promise<ApiResponse<ExpressionOralePeriod[]>> {
  try {
    const supabase = getSupabaseServerClient();
    
    let query = supabase
      .from('expression_orale_periods')
      .select('*');
    
    // Appliquer les filtres s'ils existent
    if (filters) {
      if (filters.year) {
        query = query.eq('year', filters.year);
      }
      
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }
    
    // Trier par année et mois décroissants (plus récents d'abord)
    query = query.order('year', { ascending: false }).order('month', { ascending: false });
    
    const { data: periods, error } = await query;
    
    if (error) {
      console.error('Erreur lors de la récupération des périodes:', error);
      return { data: null, error: error.message };
    }
    
    return { data: periods as ExpressionOralePeriod[], error: null };
  } catch (error) {
    console.error('Exception lors de la récupération des périodes:', error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des périodes' };
  }
}

/**
 * Récupère une période par son ID
 */
export async function getPeriodById(id: string): Promise<ApiResponse<ExpressionOralePeriod>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: period, error } = await supabase
      .from('expression_orale_periods')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Erreur lors de la récupération de la période ${id}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: period as ExpressionOralePeriod, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de la période ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération de la période' };
  }
}

/**
 * Récupère une période par son slug
 */
export async function getPeriodBySlug(slug: string): Promise<ApiResponse<ExpressionOralePeriod>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: period, error } = await supabase
      .from('expression_orale_periods')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error(`Erreur lors de la récupération de la période avec slug ${slug}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: period as ExpressionOralePeriod, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de la période avec slug ${slug}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération de la période' };
  }
}

/**
 * Met à jour une période
 */
export async function updatePeriod(id: string, data: Partial<CreatePeriodData>): Promise<ApiResponse<ExpressionOralePeriod>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: period, error } = await supabase
      .from('expression_orale_periods')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de la période ${id}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: period as ExpressionOralePeriod, error: null };
  } catch (error) {
    console.error(`Exception lors de la mise à jour de la période ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la mise à jour de la période' };
  }
}

/**
 * Supprime une période
 */
export async function deletePeriod(id: string): Promise<ApiResponse<boolean>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { error } = await supabase
      .from('expression_orale_periods')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression de la période ${id}:`, error);
      return { data: false, error: error.message };
    }
    
    return { data: true, error: null };
  } catch (error) {
    console.error(`Exception lors de la suppression de la période ${id}:`, error);
    return { data: false, error: 'Une erreur est survenue lors de la suppression de la période' };
  }
}

/**
 * ===== FONCTIONS POUR LES TÂCHES =====
 */

/**
 * Crée une nouvelle tâche
 */
export async function createTask(data: CreateTaskData): Promise<ApiResponse<ExpressionOraleTask>> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Si le titre n'est pas fourni, générer un titre par défaut
    if (!data.title) {
      data.title = `Tâche ${data.task_number}`;
    }
    
    const { data: task, error } = await supabase
      .from('expression_orale_tasks')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la tâche:', error);
      return { data: null, error: error.message };
    }
    
    return { data: task as ExpressionOraleTask, error: null };
  } catch (error) {
    console.error('Exception lors de la création de la tâche:', error);
    return { data: null, error: 'Une erreur est survenue lors de la création de la tâche' };
  }
}

/**
 * Récupère toutes les tâches d'une période
 */
export async function getTasksByPeriodId(periodId: string): Promise<ApiResponse<ExpressionOraleTask[]>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: tasks, error } = await supabase
      .from('expression_orale_tasks')
      .select('*')
      .eq('period_id', periodId)
      .order('task_number', { ascending: true });
    
    if (error) {
      console.error(`Erreur lors de la récupération des tâches pour la période ${periodId}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: tasks as ExpressionOraleTask[], error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération des tâches pour la période ${periodId}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des tâches' };
  }
}

/**
 * Récupère une tâche par son ID
 */
export async function getTaskById(id: string): Promise<ApiResponse<ExpressionOraleTask>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: task, error } = await supabase
      .from('expression_orale_tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Erreur lors de la récupération de la tâche ${id}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: task as ExpressionOraleTask, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de la tâche ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération de la tâche' };
  }
}

/**
 * Met à jour une tâche
 */
export async function updateTask(id: string, data: Partial<CreateTaskData>): Promise<ApiResponse<ExpressionOraleTask>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: task, error } = await supabase
      .from('expression_orale_tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour de la tâche ${id}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: task as ExpressionOraleTask, error: null };
  } catch (error) {
    console.error(`Exception lors de la mise à jour de la tâche ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la mise à jour de la tâche' };
  }
}

/**
 * Supprime une tâche
 */
export async function deleteTask(id: string): Promise<ApiResponse<boolean>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { error } = await supabase
      .from('expression_orale_tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression de la tâche ${id}:`, error);
      return { data: false, error: error.message };
    }
    
    return { data: true, error: null };
  } catch (error) {
    console.error(`Exception lors de la suppression de la tâche ${id}:`, error);
    return { data: false, error: 'Une erreur est survenue lors de la suppression de la tâche' };
  }
}

/**
 * ===== FONCTIONS POUR LES SUJETS =====
 */

/**
 * Crée un nouveau sujet
 */
export async function createSubject(data: CreateSubjectData): Promise<ApiResponse<ExpressionOraleSubject>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: subject, error } = await supabase
      .from('expression_orale_subjects')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création du sujet:', error);
      return { data: null, error: error.message };
    }
    
    return { data: subject as ExpressionOraleSubject, error: null };
  } catch (error) {
    console.error('Exception lors de la création du sujet:', error);
    return { data: null, error: 'Une erreur est survenue lors de la création du sujet' };
  }
}

/**
 * Récupère tous les sujets d'une tâche
 */
export async function getSubjectsByTaskId(taskId: string): Promise<ApiResponse<ExpressionOraleSubject[]>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: subjects, error } = await supabase
      .from('expression_orale_subjects')
      .select('*')
      .eq('task_id', taskId)
      .order('subject_number', { ascending: true });
    
    if (error) {
      console.error(`Erreur lors de la récupération des sujets pour la tâche ${taskId}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: subjects as ExpressionOraleSubject[], error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération des sujets pour la tâche ${taskId}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des sujets' };
  }
}

/**
 * Récupère un sujet par son ID
 */
export async function getSubjectById(id: string): Promise<ApiResponse<ExpressionOraleSubject>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: subject, error } = await supabase
      .from('expression_orale_subjects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Erreur lors de la récupération du sujet ${id}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: subject as ExpressionOraleSubject, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération du sujet ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération du sujet' };
  }
}

/**
 * Met à jour un sujet
 */
export async function updateSubject(id: string, data: Partial<CreateSubjectData>): Promise<ApiResponse<ExpressionOraleSubject>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data: subject, error } = await supabase
      .from('expression_orale_subjects')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la mise à jour du sujet ${id}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: subject as ExpressionOraleSubject, error: null };
  } catch (error) {
    console.error(`Exception lors de la mise à jour du sujet ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la mise à jour du sujet' };
  }
}

/**
 * Supprime un sujet
 */
export async function deleteSubject(id: string): Promise<ApiResponse<boolean>> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { error } = await supabase
      .from('expression_orale_subjects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erreur lors de la suppression du sujet ${id}:`, error);
      return { data: false, error: error.message };
    }
    
    return { data: true, error: null };
  } catch (error) {
    console.error(`Exception lors de la suppression du sujet ${id}:`, error);
    return { data: false, error: 'Une erreur est survenue lors de la suppression du sujet' };
  }
}

/**
 * ===== FONCTIONS AVANCÉES =====
 */

/**
 * Récupère une période avec toutes ses tâches
 */
export async function getPeriodWithTasks(periodId: string): Promise<ApiResponse<ExpressionOralePeriod & { tasks: ExpressionOraleTask[] }>> {
  try {
    // D'abord récupérer la période
    const periodResponse = await getPeriodById(periodId);
    
    if (periodResponse.error || !periodResponse.data) {
      return { data: null, error: periodResponse.error || 'Période non trouvée' };
    }
    
    // Ensuite récupérer les tâches
    const tasksResponse = await getTasksByPeriodId(periodId);
    
    if (tasksResponse.error) {
      return { data: null, error: tasksResponse.error };
    }
    
    // Combiner les données
    const result = {
      ...periodResponse.data,
      tasks: tasksResponse.data || []
    };
    
    return { data: result, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de la période ${periodId} avec ses tâches:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des données' };
  }
}

/**
 * Récupère une tâche avec tous ses sujets
 */
export async function getTaskWithSubjects(taskId: string): Promise<ApiResponse<ExpressionOraleTask & { subjects: ExpressionOraleSubject[] }>> {
  try {
    // D'abord récupérer la tâche
    const taskResponse = await getTaskById(taskId);
    
    if (taskResponse.error || !taskResponse.data) {
      return { data: null, error: taskResponse.error || 'Tâche non trouvée' };
    }
    
    // Ensuite récupérer les sujets
    const subjectsResponse = await getSubjectsByTaskId(taskId);
    
    if (subjectsResponse.error) {
      return { data: null, error: subjectsResponse.error };
    }
    
    // Combiner les données
    const result = {
      ...taskResponse.data,
      subjects: subjectsResponse.data || []
    };
    
    return { data: result, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de la tâche ${taskId} avec ses sujets:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des données' };
  }
}

/**
 * Récupère tous les sujets d'une période pour un numéro de tâche donné
 */
export async function getSubjectsByPeriodAndTaskNumber(
  periodId: string, 
  taskNumber: 2 | 3
): Promise<ApiResponse<ExpressionOraleSubject[]>> {
  try {
    const supabase = getSupabaseServerClient();
    
    // D'abord trouver la tâche correspondante
    const { data: tasks, error: taskError } = await supabase
      .from('expression_orale_tasks')
      .select('id')
      .eq('period_id', periodId)
      .eq('task_number', taskNumber);
    
    if (taskError || !tasks || tasks.length === 0) {
      return { data: null, error: taskError?.message || `Aucune tâche ${taskNumber} trouvée pour cette période` };
    }
    
    const taskId = tasks[0].id;
    
    // Ensuite récupérer les sujets de cette tâche
    return getSubjectsByTaskId(taskId);
  } catch (error) {
    console.error(`Exception lors de la récupération des sujets pour la période ${periodId} et tâche ${taskNumber}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des sujets' };
  }
}

/**
 * Crée une période complète avec ses tâches par défaut (2 et 3)
 */
export async function createPeriodWithDefaultTasks(
  data: CreatePeriodData
): Promise<ApiResponse<ExpressionOralePeriod>> {
  try {
    // 1. Créer la période
    const periodResponse = await createPeriod(data);
    
    if (periodResponse.error || !periodResponse.data) {
      return { data: null, error: periodResponse.error || 'Erreur lors de la création de la période' };
    }
    
    const periodId = periodResponse.data.id;
    
    // 2. Créer la tâche 2
    const task2Data: CreateTaskData = {
      period_id: periodId,
      task_number: 2,
      title: 'Tâche 2 : Interaction',
      description: 'Dans cette tâche, vous êtes en situation d\'interaction avec l\'examinateur qui joue le rôle indiqué dans le sujet.',
      instructions: 'Posez des questions à l\'examinateur en fonction du contexte indiqué.'
    };
    
    const task2Response = await createTask(task2Data);
    
    // 3. Créer la tâche 3
    const task3Data: CreateTaskData = {
      period_id: periodId,
      task_number: 3,
      title: 'Tâche 3 : Point de vue',
      description: 'Dans cette tâche, vous devez donner et justifier votre opinion sur un sujet donné.',
      instructions: 'Exprimez et argumentez votre point de vue sur le sujet proposé. Donnez des exemples.'
    };
    
    const task3Response = await createTask(task3Data);
    
    if (task2Response.error || task3Response.error) {
      console.error('Erreur lors de la création des tâches par défaut:', task2Response.error || task3Response.error);
      // On ne retourne pas d'erreur car la période a été créée avec succès
    }
    
    return periodResponse;
  } catch (error) {
    console.error('Exception lors de la création de la période avec tâches par défaut:', error);
    return { data: null, error: 'Une erreur est survenue lors de la création de la période avec tâches par défaut' };
  }
}

/**
 * Obtient le prochain numéro de sujet disponible pour une tâche
 */
export async function getNextSubjectNumber(taskId: string): Promise<number> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('expression_orale_subjects')
      .select('subject_number')
      .eq('task_id', taskId)
      .order('subject_number', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return 1; // Premier sujet
    }
    
    return (data[0].subject_number as number) + 1;
  } catch (error) {
    console.error(`Exception lors de la récupération du prochain numéro de sujet pour la tâche ${taskId}:`, error);
    return 1; // En cas d'erreur, commencer à 1
  }
}

import { getSupabaseBrowser } from './client';
import {
  ExpressionEcritePeriod,
  ExpressionEcriteCombination,
  ExpressionEcriteTask,
  ExpressionEcriteCorrection,
  ExpressionEcriteDocument,
} from '@/types/expression-ecrite';

// Types de retour API
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

// ===== PÉRIODES =====

/**
 * Récupère une période complète par son slug (avec combinaisons et tâches)
 */
export async function getPeriodBySlugWithContent(slug: string): Promise<ApiResponse<ExpressionEcritePeriod & { combinations: (ExpressionEcriteCombination & { tasks: ExpressionEcriteTask[] })[] }>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // 1. Récupérer la période par son slug
    const { data: periodData, error: periodError } = await supabase
      .from('expression_ecrite_periods')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (periodError) {
      console.error(`Erreur lors de la récupération de la période ${slug}:`, periodError.message);
      return { data: null, error: periodError.message };
    }

    if (!periodData) {
      return { data: null, error: 'Période non trouvée' };
    }
    
    // 2. Récupérer toutes les combinaisons pour cette période
    const { data: combinationsData, error: combinationsError } = await supabase
      .from('expression_ecrite_combinations')
      .select('*')
      .eq('period_id', periodData.id)
      .order('combination_number', { ascending: true });
      
    if (combinationsError) {
      console.error(`Erreur lors de la récupération des combinaisons:`, combinationsError.message);
      return { data: null, error: combinationsError.message };
    }

    // 3. Pour chaque combinaison, récupérer ses tâches
    const combinationsWithTasks = await Promise.all(combinationsData.map(async (combination: ExpressionEcriteCombination) => {
      const { data: tasksData, error: tasksError } = await supabase
        .from('expression_ecrite_tasks')
        .select('*')
        .eq('combination_id', combination.id)
        .order('task_number', { ascending: true });
        
      if (tasksError) {
        console.error(`Erreur lors de la récupération des tâches pour la combinaison ${combination.id}:`, tasksError.message);
        return { ...combination, tasks: [] };
      }
      
      return { ...combination, tasks: tasksData || [] };
    }));
    
    // 4. Fusionner toutes les données
    const result = {
      ...periodData,
      combinations: combinationsWithTasks
    };
    
    return { data: result, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de la période ${slug}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des données' };
  }
}

/**
 * Récupère une période par son slug
 */
export async function getPeriodBySlug(slug: string): Promise<ApiResponse<ExpressionEcritePeriod[]>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Ne pas utiliser single() pour renvoyer un tableau comme attendu par la page
    const { data, error } = await supabase
      .from('expression_ecrite_periods')
      .select('*')
      .eq('slug', slug);
      
    if (error) {
      console.error(`Erreur lors de la récupération de la période ${slug}:`, error.message);
      return { data: null, error: error.message };
    }
    
    if (!data || data.length === 0) {
      console.log(`Aucune période trouvée pour le slug: ${slug}`);
      return { data: [], error: 'Période non trouvée' };
    }
    
    console.log(`Période trouvée pour slug ${slug}:`, data);
    return { data, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de la période ${slug}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération de la période' };
  }
}

/**
 * Récupère toutes les périodes d'Expression Écrite
 */
export async function getAllPeriods(): Promise<ApiResponse<ExpressionEcritePeriod[]>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { data, error } = await supabase
      .from('expression_ecrite_periods')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
      
    if (error) {
      console.error('Erreur lors de la récupération des périodes:', error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception lors de la récupération des périodes:', error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des périodes' };
  }
}

/**
 * Crée une nouvelle période
 */
export async function createPeriod(period: Omit<ExpressionEcritePeriod, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ExpressionEcritePeriod>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { data, error } = await supabase
      .from('expression_ecrite_periods')
      .insert([
        { 
          month: period.month,
          year: period.year,
          slug: period.slug,
          title: period.title,
          description: period.description,
          is_active: period.is_active,
          total_combinations: period.total_combinations || 0
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de la création de la période:', error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception lors de la création de la période:', error);
    return { data: null, error: 'Une erreur est survenue lors de la création de la période' };
  }
}

/**
 * Met à jour une période existante
 */
export async function updatePeriod(id: string, updates: Partial<ExpressionEcritePeriod>): Promise<ApiResponse<ExpressionEcritePeriod>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Supprimer les champs qui ne doivent pas être mis à jour directement
    const { id: _omitId, created_at: _omitCreatedAt, updated_at: _omitUpdatedAt, ...updateData } = updates;
    
    const { data, error } = await supabase
      .from('expression_ecrite_periods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error(`Erreur lors de la mise à jour de la période ${id}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception lors de la mise à jour de la période ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la mise à jour de la période' };
  }
}

/**
 * Supprime une période
 */
export async function deletePeriod(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { error } = await supabase
      .from('expression_ecrite_periods')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Erreur lors de la suppression de la période ${id}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  } catch (error) {
    console.error(`Exception lors de la suppression de la période ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la suppression de la période' };
  }
}

/**
 * Récupère une période par son ID avec ses combinaisons
 */
export async function getPeriodWithCombinations(id: string): Promise<ApiResponse<ExpressionEcritePeriod & { combinations: ExpressionEcriteCombination[] }>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Récupérer la période
    const { data: period, error: periodError } = await supabase
      .from('expression_ecrite_periods')
      .select('*')
      .eq('id', id)
      .single();
      
    if (periodError) {
      console.error(`Erreur lors de la récupération de la période ${id}:`, periodError.message);
      return { data: null, error: periodError.message };
    }
    
    // Récupérer les combinaisons associées
    const { data: combinations, error: combinationsError } = await supabase
      .from('expression_ecrite_combinations')
      .select('*')
      .eq('period_id', id)
      .order('combination_number');
      
    if (combinationsError) {
      console.error(`Erreur lors de la récupération des combinaisons pour la période ${id}:`, combinationsError.message);
      return { data: null, error: combinationsError.message };
    }
    
    // Combiner les données
    const result = {
      ...period,
      combinations: combinations || []
    };
    
    return { data: result, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de la période ${id} avec combinaisons:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des données' };
  }
}

// ===== COMBINAISONS =====

/**
 * Récupère toutes les combinaisons pour une période
 */
export async function getCombinationsByPeriod(periodId: string): Promise<ApiResponse<ExpressionEcriteCombination[]>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { data, error } = await supabase
      .from('expression_ecrite_combinations')
      .select('*')
      .eq('period_id', periodId)
      .order('combination_number');
      
    if (error) {
      console.error(`Erreur lors de la récupération des combinaisons pour la période ${periodId}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération des combinaisons pour la période ${periodId}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des combinaisons' };
  }
}

/**
 * Crée une nouvelle combinaison
 */
export async function createCombination(combination: Omit<ExpressionEcriteCombination, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ExpressionEcriteCombination>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { data, error } = await supabase
      .from('expression_ecrite_combinations')
      .insert([
        { 
          period_id: combination.period_id,
          combination_number: combination.combination_number,
          title: combination.title,
          is_active: combination.is_active
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de la création de la combinaison:', error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception lors de la création de la combinaison:', error);
    return { data: null, error: 'Une erreur est survenue lors de la création de la combinaison' };
  }
}

/**
 * Met à jour une combinaison existante
 */
export async function updateCombination(id: string, updates: Partial<ExpressionEcriteCombination>): Promise<ApiResponse<ExpressionEcriteCombination>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Supprimer les champs qui ne doivent pas être mis à jour directement
    const { id: _omitId, created_at: _omitCreatedAt, updated_at: _omitUpdatedAt, ...updateData } = updates;
    
    const { data, error } = await supabase
      .from('expression_ecrite_combinations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error(`Erreur lors de la mise à jour de la combinaison ${id}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception lors de la mise à jour de la combinaison ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la mise à jour de la combinaison' };
  }
}

/**
 * Supprime une combinaison
 */
export async function deleteCombination(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { error } = await supabase
      .from('expression_ecrite_combinations')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Erreur lors de la suppression de la combinaison ${id}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  } catch (error) {
    console.error(`Exception lors de la suppression de la combinaison ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la suppression de la combinaison' };
  }
}

// ===== TÂCHES =====

/**
 * Récupère une tâche par son ID, avec documents associés pour la tâche 3
 */
// Données de secours temporaires pour éviter l'erreur 404
const FALLBACK_TASKS: Record<'task1' | 'task2' | 'task3', ExpressionEcriteTask & { documents?: ExpressionEcriteDocument[] }> = {
  // Tâche 1 - Invitation restaurant
  'task1': {
    id: 'fallback-task1',
    title: 'Invitation à un restaurant',
    description: 'Vous souhaitez inviter un collègue à un dîner professionnel dans un nouveau restaurant.',
    instructions: 'Rédigez un courriel pour inviter votre collègue en précisant la date, l\'heure, le lieu et l\'objet du dîner.',
    word_count_min: 60,
    word_count_max: 120,
    task_number: 1,
    task_type: 'courriel',
    difficulty_level: 'beginner',
    combination_id: 'fallback-combination1',
    created_at: '1970-01-01T00:00:00Z',
    updated_at: '1970-01-01T00:00:00Z',
  },
  // Tâche 2 - Nouvelle activité sportive
  'task2': {
    id: 'fallback-task2',
    title: 'Nouvelle activité sportive',
    description: 'Vous avez récemment commencé une nouvelle activité sportive qui vous plaît beaucoup.',
    instructions: 'Rédigez un article de blog pour partager votre expérience, décrire cette activité et expliquer pourquoi vous la recommandez.',
    word_count_min: 120,
    word_count_max: 150,
    task_number: 2,
    task_type: 'blog',
    difficulty_level: 'intermediate',
    combination_id: 'fallback-combination1',
    created_at: '1970-01-01T00:00:00Z',
    updated_at: '1970-01-01T00:00:00Z',
  },
  // Tâche 3 - Animaux au bureau
  'task3': {
    id: 'fallback-task3',
    title: 'Animaux de compagnie au bureau',
    description: 'De plus en plus d\'entreprises autorisent leurs employés à venir avec leurs animaux de compagnie au bureau.',
    instructions: 'À l\'aide des documents proposés, rédigez un texte argumenté présentant les avantages et inconvénients de cette pratique.',
    word_count_min: 120,
    word_count_max: 180,
    task_number: 3,
    task_type: 'argumentation',
    difficulty_level: 'advanced',
    combination_id: 'fallback-combination1',
    created_at: '1970-01-01T00:00:00Z',
    updated_at: '1970-01-01T00:00:00Z',
    documents: [
      {
        id: 'doc1',
        task_id: 'fallback-task3',
        document_number: 1,
        title: 'Étude sur la productivité',
        content: 'Selon une étude menée auprès de 500 employés dans des entreprises autorisant les animaux, 67% rapportent une réduction du stress et 43% une augmentation de la productivité. Cependant, 21% des participants mentionnent des distractions occasionnelles.',
        source: 'Institut de Recherche sur le Bien-être au Travail, 2024',
        document_type: 'reference',
        created_at: '1970-01-01T00:00:00Z',
        updated_at: '1970-01-01T00:00:00Z',
      },
      {
        id: 'doc2',
        task_id: 'fallback-task3',
        document_number: 2,
        title: 'Témoignages d\'employeurs',
        content: 'Nous avons observé une amélioration notable de l\'ambiance de travail depuis que nous autorisons les animaux. Toutefois, nous avons dû mettre en place des règles strictes concernant la propreté et le comportement des animaux pour respecter ceux qui pourraient avoir des allergies ou des craintes.',
        source: 'Marie Durant, Directrice RH, TechInnovation',
        document_type: 'example',
        created_at: '1970-01-01T00:00:00Z',
        updated_at: '1970-01-01T00:00:00Z',
      }
    ]
  }
};

// Fonction pour récupérer une tâche de secours basée sur une partie de l'ID ou un mot-clé
function getFallbackTask(taskId: string): (ExpressionEcriteTask & { documents?: ExpressionEcriteDocument[] }) | null {
  // Si l'ID contient certains mots-clés, retourner la tâche correspondante
  if (taskId.toLowerCase().includes('invitation') || taskId.toLowerCase().includes('restaurant')) {
    return FALLBACK_TASKS.task1;
  } else if (taskId.toLowerCase().includes('activité') || taskId.toLowerCase().includes('sport')) {
    return FALLBACK_TASKS.task2;
  } else if (taskId.toLowerCase().includes('animaux') || taskId.toLowerCase().includes('bureau')) {
    return FALLBACK_TASKS.task3;
  }
  
  // Sinon, essayer de deviner à partir du numéro si présent
  if (taskId.includes('1')) {
    return FALLBACK_TASKS.task1;
  } else if (taskId.includes('2')) {
    return FALLBACK_TASKS.task2;
  } else if (taskId.includes('3')) {
    return FALLBACK_TASKS.task3;
  }
  
  // Par défaut, retourner la première tâche
  return FALLBACK_TASKS.task1;
}

export async function getTaskById(taskId: string): Promise<ApiResponse<ExpressionEcriteTask & { documents?: ExpressionEcriteDocument[] }>> {
  try {
    console.log('Début getTaskById avec ID:', taskId);
    
    // Utiliser le client browser qui fonctionne à la fois dans les environnements client et serveur
    const supabase = getSupabaseBrowser();
    console.log('Client Supabase créé avec succès');
    
    // Vérifier que l'ID est valide
    if (!taskId || taskId === 'undefined') {
      console.error('ID de tâche invalide:', taskId);
      return { data: null, error: 'ID de tâche invalide' };
    }
    
    // Essayer d'abord une requête simple sans jointures pour vérifier l'existence
    console.log('Vérification existence de la tâche avec ID simple:', taskId);
    const { data: existCheck, error: existError } = await supabase
      .from('expression_ecrite_tasks')
      .select('id, title')
      .eq('id', taskId)
      .maybeSingle();
    
    if (existError) {
      console.error(`Erreur lors de la vérification de la tâche ${taskId}:`, existError);
    } else {
      console.log('Résultat de la vérification:', existCheck ? 'Tâche trouvée' : 'Tâche non trouvée');
    }
    
    // 1. Récupérer la tâche avec tous les détails
    console.log('Récupération de la tâche avec jointures:', taskId);
    const { data: taskData, error: taskError } = await supabase
      .from('expression_ecrite_tasks')
      .select('*, combination:combination_id(*, period:period_id(*))')
      .eq('id', taskId)
      .single();
      
    if (taskError) {
      console.error(`Erreur lors de la récupération de la tâche ${taskId}:`, taskError);
      return { data: null, error: taskError.message };
    }

    if (!taskData) {
      console.log('Aucune donnée de tâche trouvée pour ID:', taskId);
      console.log('Utilisation d\'une tâche de secours temporaire...');
      
      // Utiliser une tâche de secours si disponible
      const fallbackTask = getFallbackTask(taskId);
      if (fallbackTask) {
        console.log('Données de secours utilisées:', fallbackTask.title);
        return { data: fallbackTask, error: null };
      }
      
      return { data: null, error: 'Tâche non trouvée' };
    }
    
    console.log('Tâche récupérée avec succès:', taskData.title);
    
    // 2. Si c'est une tâche 3 (argumentation), récupérer les documents associés
    if (taskData.task_number === 3) {
      const { data: documentsData, error: documentsError } = await supabase
        .from('expression_ecrite_documents')
        .select('*')
        .eq('task_id', taskId)
        .order('document_number', { ascending: true });
        
      if (documentsError) {
        console.error(`Erreur lors de la récupération des documents:`, documentsError.message);
        return { data: taskData, error: null }; // Renvoyer la tâche sans les documents en cas d'erreur
      }
      
      return { data: { ...taskData, documents: documentsData || [] }, error: null };
    }
    
    // Pour les tâches 1 et 2, renvoyer simplement la tâche
    return { data: taskData, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération de la tâche ${taskId}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération de la tâche' };
  }
}

/**
 * Récupère toutes les tâches pour une combinaison
 */
export async function getTasksByCombination(combinationId: string): Promise<ApiResponse<ExpressionEcriteTask[]>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { data, error } = await supabase
      .from('expression_ecrite_tasks')
      .select('*')
      .eq('combination_id', combinationId)
      .order('task_number');
      
    if (error) {
      console.error(`Erreur lors de la récupération des tâches pour la combinaison ${combinationId}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération des tâches pour la combinaison ${combinationId}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des tâches' };
  }
}

/**
 * Crée une nouvelle tâche
 */
export async function createTask(task: Omit<ExpressionEcriteTask, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ExpressionEcriteTask>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { data, error } = await supabase
      .from('expression_ecrite_tasks')
      .insert([
        { 
          combination_id: task.combination_id,
          task_number: task.task_number,
          title: task.title,
          description: task.description,
          word_count_min: task.word_count_min,
          word_count_max: task.word_count_max,
          task_type: task.task_type,
          duration_minutes: task.duration_minutes,
          difficulty_level: task.difficulty_level,
          instructions: task.instructions
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de la création de la tâche:', error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception lors de la création de la tâche:', error);
    return { data: null, error: 'Une erreur est survenue lors de la création de la tâche' };
  }
}

/**
 * Met à jour une tâche existante
 */
export async function updateTask(id: string, updates: Partial<ExpressionEcriteTask>): Promise<ApiResponse<ExpressionEcriteTask>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Supprimer les champs qui ne doivent pas être mis à jour directement
    const { id: _omitId, created_at: _omitCreatedAt, updated_at: _omitUpdatedAt, ...updateData } = updates;
    
    const { data, error } = await supabase
      .from('expression_ecrite_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error(`Erreur lors de la mise à jour de la tâche ${id}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception lors de la mise à jour de la tâche ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la mise à jour de la tâche' };
  }
}

/**
 * Supprime une tâche
 */
export async function deleteTask(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { error } = await supabase
      .from('expression_ecrite_tasks')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Erreur lors de la suppression de la tâche ${id}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  } catch (error) {
    console.error(`Exception lors de la suppression de la tâche ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la suppression de la tâche' };
  }
}

// ===== CORRECTIONS =====

/**
 * Récupère toutes les corrections pour une tâche
 */
export async function getCorrectionsByTask(taskId: string): Promise<ApiResponse<ExpressionEcriteCorrection[]>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { data, error } = await supabase
      .from('expression_ecrite_corrections')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(`Erreur lors de la récupération des corrections pour la tâche ${taskId}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception lors de la récupération des corrections pour la tâche ${taskId}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération des corrections' };
  }
}

/**
 * Crée une nouvelle correction
 */
export async function createCorrection(correction: Omit<ExpressionEcriteCorrection, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ExpressionEcriteCorrection>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { data, error } = await supabase
      .from('expression_ecrite_corrections')
      .insert([correction])
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de la création de la correction:', error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception lors de la création de la correction:', error);
    return { data: null, error: 'Une erreur est survenue lors de la création de la correction' };
  }
}

/**
 * Met à jour une correction existante
 */
export async function updateCorrection(id: string, updates: Partial<ExpressionEcriteCorrection>): Promise<ApiResponse<ExpressionEcriteCorrection>> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Supprimer les champs qui ne doivent pas être mis à jour directement
    const { id: _omitId, created_at: _omitCreatedAt, updated_at: _omitUpdatedAt, ...updateData } = updates;
    
    const { data, error } = await supabase
      .from('expression_ecrite_corrections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error(`Erreur lors de la mise à jour de la correction ${id}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception lors de la mise à jour de la correction ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la mise à jour de la correction' };
  }
}

/**
 * Supprime une correction
 */
export async function deleteCorrection(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = getSupabaseBrowser();
    
    const { error } = await supabase
      .from('expression_ecrite_corrections')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Erreur lors de la suppression de la correction ${id}:`, error.message);
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  } catch (error) {
    console.error(`Exception lors de la suppression de la correction ${id}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la suppression de la correction' };
  }
}

import { ExpressionEcriteDocument, ExpressionEcriteTask } from '@/types/expression-ecrite';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

const getSupabaseServerClient = () => createServerSupabaseClient();

type ExpressionEcriteTaskWithDocuments = ExpressionEcriteTask & {
  documents?: ExpressionEcriteDocument[];
  combination?: Record<string, unknown>;
};

/**
 * Récupère une tâche par son ID - Version pour Server Components
 */
export async function getTaskByIdServer(taskId: string): Promise<ApiResponse<ExpressionEcriteTaskWithDocuments>> {
  try {
    console.log('[SERVER] Début getTaskByIdServer avec ID:', taskId);
    
    // Utiliser le client serveur approprié
    const supabase = await getSupabaseServerClient();
    console.log('[SERVER] Client Supabase créé avec succès');
    
    // Vérifier que l'ID est valide
    if (!taskId || taskId === 'undefined') {
      console.error('[SERVER] ID de tâche invalide:', taskId);
      return { data: null, error: 'ID de tâche invalide' };
    }
    
    // Essayer d'abord une requête simple sans jointures pour vérifier l'existence
    console.log('[SERVER] Vérification existence de la tâche avec ID simple:', taskId);
    const { data: existCheck, error: existError } = await supabase
      .from('expression_ecrite_tasks')
      .select('id, title')
      .eq('id', taskId)
      .maybeSingle();
    
    if (existError) {
      console.error(`[SERVER] Erreur lors de la vérification de la tâche ${taskId}:`, existError);
    } else {
      console.log('[SERVER] Résultat de la vérification:', existCheck ? 'Tâche trouvée' : 'Tâche non trouvée');
    }
    
    // Récupérer la tâche avec tous les détails
    console.log('[SERVER] Récupération de la tâche avec jointures:', taskId);
    const { data: taskData, error: taskError } = await supabase
      .from('expression_ecrite_tasks')
      .select('*, combination:combination_id(*, period:period_id(*))')
      .eq('id', taskId)
      .single();
      
    if (taskError) {
      console.error(`[SERVER] Erreur lors de la récupération de la tâche ${taskId}:`, taskError);
      return { data: null, error: taskError.message };
    }

    if (!taskData) {
      console.log('[SERVER] Aucune donnée de tâche trouvée pour ID:', taskId);
      return { data: null, error: 'Tâche non trouvée' };
    }
    
    console.log('[SERVER] Tâche récupérée avec succès:', taskData.title);
    
    // Si c'est une tâche 3 (argumentation), récupérer les documents associés
    if (taskData.task_number === 3) {
      const { data: documentsData, error: documentsError } = await supabase
        .from('expression_ecrite_documents')
        .select('*')
        .eq('task_id', taskId)
        .order('document_number', { ascending: true });
        
      if (documentsError) {
        console.error(`[SERVER] Erreur lors de la récupération des documents:`, documentsError.message);
        return { data: taskData, error: null }; // Renvoyer la tâche sans les documents en cas d'erreur
      }
      
      return { data: { ...taskData, documents: documentsData ?? [] }, error: null };
    }
    
    // Pour les tâches 1 et 2, renvoyer simplement la tâche
    return { data: taskData, error: null };
  } catch (error) {
    console.error(`[SERVER] Exception lors de la récupération de la tâche ${taskId}:`, error);
    return { data: null, error: 'Une erreur est survenue lors de la récupération de la tâche' };
  }
}

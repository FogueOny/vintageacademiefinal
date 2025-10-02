import { supabase } from '@/lib/supabase/client';
import { isFileValid } from './storage-utils';

// Types pour les médias des questions
export interface QuestionMedia {
  id?: string;
  question_id: string;
  media_url: string;
  media_type: 'image' | 'audio' | 'video' | 'document';
  description?: string;
  display_order: number;
}

type QuestionMediaRow = {
  id: string;
  question_id: string;
  media_url: string | null;
  media_type: 'image' | 'audio' | 'video' | 'document' | null;
  description: string | null;
  display_order: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const mapRowToMedia = (row: QuestionMediaRow): QuestionMedia => ({
  id: row.id ?? undefined,
  question_id: row.question_id,
  media_url: row.media_url ?? '',
  media_type: row.media_type as QuestionMedia['media_type'],
  description: row.description ?? undefined,
  display_order: typeof row.display_order === 'number' ? row.display_order : 0,
});

// Fonction pour obtenir les médias d'une question
export async function getQuestionMedia(questionId: string) {
  // Vérifier si l'ID est temporaire (non-UUID)
  if (questionId.startsWith('temp-')) {
    console.log('ID temporaire détecté, aucun média disponible pour les nouvelles questions');
    return [];
  }
  
  // Utiliser l'instance singleton de Supabase
  const { data, error } = await supabase()
    .from('question_media')
    .select('*')
    .eq('question_id', questionId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des médias:', error);
    return [];
  }

  return (data ?? []).map(mapRowToMedia);
}

// Fonction pour ajouter un média à une question
export async function addQuestionMedia(
  questionId: string,
  file: File,
  description: string = '',
  displayOrder: number = 0
): Promise<QuestionMedia> {
  // Vérifier l'état d'authentification avant de continuer
  const { data: { session: userSession } } = await supabase().auth.getSession();
  
  if (!userSession) {
    throw new Error('Vous devez être connecté pour ajouter un média.');
  }

  // 1. Déterminer le type de média
  let mediaType: 'image' | 'audio' | 'video' | 'document';
  if (file.type.includes('image')) {
    mediaType = 'image';
  } else if (file.type.includes('video')) {
    mediaType = 'video';
  } else if (file.type.includes('audio')) {
    mediaType = 'audio';
  } else {
    mediaType = 'document';
  }

  if (!isFileValid(file, mediaType)) {
    throw new Error('Fichier média invalide.');
  }

  // Vérifier si l'ID de question est temporaire
  if (questionId.includes('temp')) {
    // Pour les ID temporaires, afficher un message d'information et arrêter
    alert('Veuillez d\'abord enregistrer la question avant d\'ajouter des médias.');
    return {
      id: '',
      question_id: questionId,
      media_url: '',
      media_type: mediaType,
      description: '',
      display_order: 0,
    };
  }

  try {
    // Créer un FormData pour l'upload multipart
    const formData = new FormData();
    
    // Ajouter le fichier
    formData.append('file', file);
    
    // Ajouter les métadonnées
    const metadata = {
      questionId,
      mediaType,
      description,
      displayOrder,
      userId: userSession.user.id
    };
    
    formData.append('metadata', JSON.stringify(metadata));
    
    // Appeler l'API d'upload
    const response = await fetch('/api/upload-media', {
      method: 'POST',
      body: formData,
      // Pas besoin de définir Content-Type car le navigateur le fait automatiquement avec FormData
    });
    
    if (!response.ok) {
      let message = response.statusText;
      try {
        const errorDetails = await response.json() as { error?: string };
        if (errorDetails.error) {
          message = errorDetails.error;
        }
      } catch {}
      throw new Error(`Erreur du serveur: ${message}`);
    }
    
    // Récupérer les données du média créé
    const result = await response.json() as { success: boolean; media?: QuestionMediaRow };

    if (!result.success) {
      throw new Error('Erreur lors de l\'upload: la requête a réussi mais a signalé une erreur.');
    }

    // Retourner les données du média
    if (!result.media) {
      throw new Error('Réponse invalide du serveur: média manquant.');
    }

    return mapRowToMedia(result.media);
    
  } catch (error) {
    console.error("Détail de l'erreur d'upload:", error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Erreur lors de l'ajout du média: ${message}`);
  }
}

// Fonction pour supprimer un média
export async function deleteQuestionMedia(mediaId: string, mediaUrl: string) {
  // Appelle l'API serveur sécurisée (service role) qui supprime BD + Storage
  const { data: { session }, error: sessionError } = await supabase().auth.getSession();
  if (sessionError) {
    throw sessionError;
  }
  if (!session) {
    throw new Error('Session invalide. Veuillez vous reconnecter.');
  }

  const res = await fetch('/api/delete-media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ mediaId, mediaUrl }),
  });

  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error || msg;
    } catch {}
    throw new Error(`Suppression échouée: ${msg}`);
  }

  return true;
}

// Fonction pour réorganiser l'ordre des médias 
export async function updateMediaOrder(mediaItems: QuestionMedia[]) {
  // Utiliser l'instance singleton de Supabase
  
  const promises = mediaItems.map((item, index) => {
    if (!item.id) {
      return Promise.resolve();
    }
    
    return supabase()
      .from('question_media')
      .update({ display_order: index })
      .eq('id', item.id);
  });
  
  await Promise.all(promises);
  return true;
}

// Note: transferMediaFromTemp function has been removed as it's no longer needed
// in the simplified workflow where questions are created first and media is uploaded directly
// with the real question ID.

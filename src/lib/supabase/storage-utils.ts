import { getSupabaseBrowser } from './client';

/**
 * Constantes pour le stockage
 */
export const BUCKET_NAME = 'questions-media';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB en octets

/**
 * Types de fichiers acceptés pour chaque type de média
 */
export const ACCEPTED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
} as const;

export const ACCEPTED_FILE_TYPES_LABEL = {
  image: 'JPEG, PNG, GIF, WEBP',
  audio: 'MP3, WAV, OGG, WEBM',
  video: 'MP4, WEBM, OGG',
  document: 'PDF, DOC, DOCX, TXT',
} as const;

export type AcceptedMediaType = keyof typeof ACCEPTED_FILE_TYPES;

/**
 * Vérifie si un fichier est valide pour le type de média spécifié
 */
export function isFileValid(file: File | null, mediaType: AcceptedMediaType | null): boolean {
  if (!file || !mediaType) {
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    console.warn(`Fichier trop volumineux (>${MAX_FILE_SIZE / 1024 / 1024} MB).`);
    return false;
  }

  const allowedTypes: readonly string[] = ACCEPTED_FILE_TYPES[mediaType];
  if (!allowedTypes.includes(file.type)) {
    const readableList = ACCEPTED_FILE_TYPES_LABEL[mediaType] ?? 'aucun type autorisé';
    console.warn(`Type de fichier non accepté pour ${mediaType}. Types acceptés: ${readableList}`);
    return false;
  }

  return true;
}

/**
 * Télécharge un fichier dans le bucket Supabase
 */
export async function uploadFile(file: File, mediaType: AcceptedMediaType): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Créer un nom de fichier unique avec le timestamp et le nom d'origine
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${mediaType}/${timestamp}-${file.name}`;
    
    // Télécharger dans le bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw new Error(`Erreur lors du téléchargement: ${error.message}`);
    }
    
    // Récupérer l'URL publique du fichier
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    console.error('Erreur inattendue lors du téléchargement:', error);
    throw error;
  }
}

/**
 * Supprime un fichier du bucket Supabase
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Extraire le chemin relatif de l'URL publique
    const pathParts = filePath.split(`${BUCKET_NAME}/`);
    const relativePath = pathParts.length > 1 ? pathParts[1] : filePath;
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([relativePath]);
      
    if (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur inattendue lors de la suppression:', error);
    return false;
  }
}

/**
 * Vérifie si le bucket existe et affiche un message approprié
 * Note: La création de buckets doit être faite par l'administrateur via l'interface Supabase
 */
export async function ensureBucketExists(): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowser();
    
    // Essayer d'accéder au bucket directement au lieu de lister tous les buckets
    // Si on peut lister le contenu du bucket, c'est qu'il existe
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1 });
    
    if (error) {
      console.error(`Erreur lors de l'accès au bucket ${BUCKET_NAME}:`, error);
      if (error.message && error.message.includes('does not exist')) {
        console.warn(`Le bucket "${BUCKET_NAME}" n'existe pas.`);
        alert(`Le bucket de stockage "${BUCKET_NAME}" n'existe pas. Veuillez demander à l'administrateur de le créer via l'interface Supabase.`);
        return false;
      }
      // Si l'erreur est liée aux permissions mais que le bucket existe
      return true;
    }
    
    // Si on arrive ici, c'est que le bucket existe et qu'on a pu y accéder
    console.log(`Bucket "${BUCKET_NAME}" accessible.`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification du bucket:', error);
    // Supposons que le bucket existe même si on a une erreur
    // car c'est probablement une erreur d'authentification ou de permissions
    return true;
  }
}

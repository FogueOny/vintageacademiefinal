import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Créer un client Supabase avec la clé de service
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '', // Clé privée côté serveur
  {
    auth: {
      persistSession: false,
    },
  }
);

// Format des données attendues dans la requête
interface MediaUploadRequest {
  questionId: string;
  mediaType: string;
  description?: string;
  displayOrder?: number;
  userId: string; // ID de l'utilisateur qui fait l'upload
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier si la requête contient des données multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const metadataStr = formData.get('metadata') as string;

    // Valider les données
    if (!file || !metadataStr) {
      return NextResponse.json(
        { error: 'Fichier ou métadonnées manquants' },
        { status: 400 }
      );
    }

    // Parser les métadonnées JSON
    const metadata: MediaUploadRequest = JSON.parse(metadataStr);
    const { questionId, mediaType, description = '', displayOrder = 0, userId } = metadata;

    // Générer le nom de fichier
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${mediaType}s/${questionId}_${timestamp}.${fileExt}`;

    // 1. Upload du fichier avec le client admin (qui contourne les RLS)
    const { error: uploadError, data: uploadData } = await supabaseAdmin.storage
      .from('questions-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Erreur d\'upload:', uploadError);
      return NextResponse.json(
        { error: `Erreur lors du téléchargement: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 2. Obtenir l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from('questions-media')
      .getPublicUrl(filePath);

    // 3. Ajouter à la base de données
    const { error: dbError } = await supabaseAdmin
      .from('question_media')
      .insert({
        question_id: questionId,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        description,
        display_order: displayOrder,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Erreur base de données:', dbError);
      return NextResponse.json(
        { error: `Erreur lors de l'enregistrement en base de données: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 4. Retourner les données du média
    return NextResponse.json({
      success: true,
      media: {
        id: '', // L'ID est généré par Supabase et n'est pas retourné lors de l'insertion
        question_id: questionId,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        description,
        display_order: displayOrder
      }
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

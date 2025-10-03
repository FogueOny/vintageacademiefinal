import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Utiliser le service role pour bypasser RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file || !fileName) {
      return NextResponse.json(
        { error: 'Fichier ou nom de fichier manquant' },
        { status: 400 }
      );
    }

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload avec le service role (bypass RLS)
    const { data, error } = await supabaseAdmin.storage
      .from('exam-oral-responses')
      .upload(fileName, buffer, {
        contentType: file.type || 'audio/webm',
        upsert: false
      });

    if (error) {
      console.error('Erreur upload storage:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Créer une URL signée (valide 1 an)
    const { data: urlData } = await supabaseAdmin.storage
      .from('exam-oral-responses')
      .createSignedUrl(fileName, 31536000); // 1 an

    return NextResponse.json({
      success: true,
      url: urlData?.signedUrl,
      path: data.path
    });

  } catch (error: any) {
    console.error('Erreur API upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

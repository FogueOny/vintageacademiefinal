import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Client service pour contourner les problèmes RLS
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { questionId, options } = await request.json();
    
    console.log('🔧 API: Sauvegarde des options pour question:', questionId);
    console.log('🔧 API: Options reçues:', options);
    
    // Vérifier les paramètres
    if (!questionId || !options || !Array.isArray(options)) {
      return NextResponse.json(
        { error: 'Paramètres invalides' },
        { status: 400 }
      );
    }
    
    // Supprimer les options existantes
    console.log('🗑️ API: Suppression des options existantes...');
    const { error: deleteError } = await serviceClient
      .from('options')
      .delete()
      .eq('question_id', questionId);
    
    if (deleteError) {
      console.error('❌ API: Erreur suppression:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des options existantes' },
        { status: 500 }
      );
    }
    
    // Préparer les nouvelles options
    const optionsToInsert = options
      .filter((option: any) => option.content.trim() !== '')
      .map((option: any, index: number) => ({
        question_id: questionId,
        content: option.content.trim(),
        is_correct: option.is_correct,
        label: String.fromCharCode(65 + index) // A, B, C, D
      }));
    
    console.log('📝 API: Options à insérer:', optionsToInsert);
    
    // Insérer les nouvelles options
    const { data: newOptions, error: insertError } = await serviceClient
      .from('options')
      .insert(optionsToInsert)
      .select();
    
    if (insertError) {
      console.error('❌ API: Erreur insertion:', insertError);
      return NextResponse.json(
        { 
          error: 'Erreur lors de l\'insertion des options',
          details: insertError.message 
        },
        { status: 500 }
      );
    }
    
    console.log('✅ API: Options sauvegardées avec succès');
    
    return NextResponse.json({
      success: true,
      data: newOptions
    });
    
  } catch (error) {
    console.error('❌ API: Exception:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
} 
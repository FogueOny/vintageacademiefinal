import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Utilisation de l'API côté serveur avec clé de service
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET() {
  try {
    console.log("📥 Récupération des modules via API admin...");
    
    // Récupérer tous les modules
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .order('created_at', { ascending: false });

    if (modulesError) {
      console.error("❌ Erreur lors de la récupération des modules:", modulesError);
      return NextResponse.json({ 
        success: false, 
        error: modulesError.message 
      }, { status: 500 });
    }

    console.log("✅ Modules récupérés:", modules?.length || 0);
    
    return NextResponse.json({ 
      success: true, 
      modules: modules || [],
      count: modules?.length || 0
    });
    
  } catch (error) {
    console.error("❌ Erreur serveur:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
} 
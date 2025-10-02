import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Utilisation de l'API côté serveur avec clé de service pour contourner les restrictions RLS
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📥 Données reçues pour création de module:", body);
    
    const { name, description, type, type_module, icon, slug } = body;
    
    // Validation des données
    if (!name || !description || !type || !type_module) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }
    
    // Générer un slug si non fourni
    const finalSlug = slug || name.toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
    
    console.log("🔗 Slug final:", finalSlug);
    
    // Vérifier si le module existe déjà
    const { data: existingModule, error: checkError } = await supabaseAdmin
      .from('modules')
      .select('id, slug')
      .eq('slug', finalSlug)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Erreur lors de la vérification du module:", checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingModule) {
      return NextResponse.json({ 
        error: `Un module avec ce slug existe déjà (ID: ${existingModule.id})` 
      }, { status: 409 });
    }

    // Créer le module avec seulement les colonnes qui existent
    const moduleData = {
      name,
      description,
      type,
      type_module,
      icon: icon || null,
      slug: finalSlug
    };
    
    console.log("📦 Création du module avec données:", moduleData);
    
    const { data, error } = await supabaseAdmin
      .from('modules')
      .insert([moduleData])
      .select()
      .single();

    if (error) {
      console.error("❌ Erreur lors de la création du module:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Module créé avec succès:", data);
    return NextResponse.json({ 
      success: true, 
      message: "Module créé avec succès",
      module: data 
    });
  } catch (error) {
    console.error("❌ Erreur serveur:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug') || 'comprehension-orale';
    const name = searchParams.get('name') || 'Compréhension Orale';
    const description = searchParams.get('description') || 'Module de tests de compréhension orale';
    
    // Vérifier si le module existe déjà
    const { data: existingModule, error: checkError } = await supabaseAdmin
      .from('modules')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (checkError) {
      console.error("Erreur lors de la vérification du module:", checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingModule) {
      return NextResponse.json({ 
        message: `Le module existe déjà (ID: ${existingModule.id})`, 
        module: existingModule 
      });
    }

    // Créer le module s'il n'existe pas
    const { data, error } = await supabaseAdmin
      .from('modules')
      .insert([
        { 
          name,
          description,
          slug,
          type: 'comprehension_orale',
          type_module: 'tcf'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création du module:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Module créé avec succès",
      module: data 
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

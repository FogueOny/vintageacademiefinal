import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Créer un client Supabase côté serveur
    const supabase = await createServerSupabaseClient();
    
    // Vérifier si l'utilisateur est connecté
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    
    // Récupérer l'URL actuelle pour extraire les paramètres
    const url = new URL(request.url);
    // Récupérer l'email de l'utilisateur à promouvoir
    const userEmail = url.searchParams.get("email");
    
    if (!userEmail) {
      return NextResponse.json({ error: "Email utilisateur requis" }, { status: 400 });
    }
    
    // Mettre à jour le rôle de l'utilisateur spécifié en admin
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("email", userEmail);
      
    if (error) {
      console.error("Erreur lors de la promotion en admin:", error);
      return NextResponse.json({ error: "Erreur lors de la mise à jour du rôle" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `L'utilisateur ${userEmail} a été promu administrateur` 
    });
    
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

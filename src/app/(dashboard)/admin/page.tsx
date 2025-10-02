import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  // Vérifier si l'utilisateur est connecté
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // Récupérer le profil utilisateur pour vérifier le rôle
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  // Rediriger si l'utilisateur n'est pas admin
  if (!profile || profile.role !== 'admin') {
    redirect("/dashboard");
  }

  return <AdminDashboard />;
}

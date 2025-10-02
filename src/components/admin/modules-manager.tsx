"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { PlusCircle, Pencil, Trash2, Save, Book, FileText, Headphones, FileAudio, Mic, FileVideo, Edit, ScrollText } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Module = {
  id: string;
  name: string;
  description: string;
  type: string;
  type_module: string;
  slug: string;
  icon?: string;
  created_at: string;
}

export function ModulesManager() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // État séparé pour la soumission
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "comprehension_ecrite",
    type_module: "tcf",
    icon: "",
  });

  useEffect(() => {
    fetchModules();
  }, []);

  async function fetchModules() {
    console.log("🔄 Début du chargement des modules...");
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("❌ Erreur lors de la récupération des modules:", error);
      } else {
        console.log("✅ Modules récupérés:", data?.length || 0);
        setModules(data || []);
      }
    } catch (error) {
      console.error("❌ Erreur inattendue lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  }

  // La fonction handleSelectChange a été remplacée par des gestionnaires inline

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      type: "comprehension_ecrite",
      type_module: "tcf",
      icon: "",
    });
    setEditingModule(null);
  }

  function handleOpenDialog(module?: Module) {
    if (module) {
      setEditingModule(module);
      setFormData({
        name: module.name,
        description: module.description || "",
        type: module.type,
        type_module: module.type_module || "tcf",
        icon: module.icon || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("🚀 Début de la soumission du formulaire avec données:", formData);
    
    // Protection contre les soumissions multiples
    if (submitting) {
      console.log("⏳ Soumission déjà en cours, ignorée");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const supabase = getSupabaseBrowser();
      
      // Vérifier que l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("❌ Pas de session utilisateur");
        alert("Vous devez être connecté pour effectuer cette action.");
        return;
      }
      console.log("✅ Utilisateur authentifié:", session.user.id);
      
      // Générer un slug à partir du nom
      const slug = formData.name.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      console.log("🔗 Slug généré:", slug);
      
      // Définir un type qui inclut slug pour éviter les erreurs TypeScript
      type ModuleDataType = {
        name: string;
        description: string;
        type: string;
        type_module: string;
        icon: string | null;
        slug?: string; // Optionnel car uniquement utilisé pour la création
      };
      
      // Vérifier si l'utilisateur a le rôle d'administrateur
      console.log("🔍 Vérification du rôle administrateur...");
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        console.error("❌ Erreur lors de la vérification du profil:", profileError);
        alert(`Erreur: Impossible de vérifier vos privilèges d'administrateur.`);
        return;
      }
      
      if (profileData?.role !== 'admin') {
        console.error("❌ L'utilisateur n'est pas administrateur:", profileData);
        alert(`Erreur: Vous n'avez pas les droits d'administration nécessaires.`);
        return;
      }
      
      console.log("✅ Vérification du rôle administrateur réussie:", profileData);
      
      const moduleData: ModuleDataType = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        type_module: formData.type_module,
        icon: formData.icon || null, // Permettre explicitement null si vide
      };
      
      if (editingModule) {
        console.log("📝 Mode édition - Mise à jour du module:", moduleData);
        // Mise à jour d'un module existant
        const { data, error } = await supabase
          .from('modules')
          .update(moduleData)
          .eq('id', editingModule.id)
          .select();
        
        if (error) {
          console.error("❌ Erreur lors de la mise à jour du module:", error);
          alert(`Erreur: ${error.message}`);
          return;
        }
        
        console.log("✅ Module mis à jour avec succès:", data);
      } else {
        console.log("➕ Mode création - Nouveau module");
        // Création d'un nouveau module
        // Ajouter le slug pour les nouveaux modules
        moduleData.slug = slug;
        
        console.log("📦 Données du module à créer:", moduleData);
        
        // Essayer d'abord la méthode directe Supabase
        const { data, error } = await supabase
          .from('modules')
          .insert(moduleData)
          .select();
        
        if (error) {
          console.error("❌ Erreur lors de la création directe du module:", error);
          console.error("❌ Détails de l'erreur:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          
          // Si c'est un problème de permissions, essayer via l'API
          if (error.code === "42501" || error.code === "PGRST301") {
            console.log("🔄 Tentative via API route à cause des permissions...");
            try {
              const apiResult = await createModuleViaAPI(moduleData);
              console.log("✅ Module créé via API:", apiResult);
              // Continuer avec le succès
            } catch (apiError) {
              console.error("❌ Échec aussi via API:", apiError);
              alert(`Erreur: Impossible de créer le module. ${apiError instanceof Error ? apiError.message : 'Erreur inconnue'}`);
              return;
            }
          } else if (error.code === "23505") { 
            alert("Erreur: Un module avec ce nom ou slug existe déjà. Veuillez choisir un nom différent.");
            return;
          } else {
            alert(`Erreur: ${error.message || 'Erreur inconnue lors de la création du module'}`);
            return;
          }
        } else {
          console.log("✅ Module créé avec succès (méthode directe):", data);
        }
      }
      
      console.log("🔄 Rafraîchissement de la liste des modules...");
      // Rafraîchir la liste des modules
      await fetchModules();
      
      // Fermer la boîte de dialogue
      console.log("🔒 Fermeture de la boîte de dialogue...");
      setDialogOpen(false);
      resetForm();
      
      // Afficher un message de succès
      const successMessage = editingModule ? "Module mis à jour avec succès!" : "Module créé avec succès!";
      console.log("🎉", successMessage);
      alert(successMessage);
      
    } catch (error) {
      console.error("❌ Erreur inattendue:", error);
      console.error("❌ Stack trace:", error instanceof Error ? error.stack : 'Pas de stack trace');
      alert(`Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      console.log("🔄 Fin de la soumission, réinitialisation de l'état");
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) {
      return;
    }
    
    try {
      const supabase = getSupabaseBrowser();
      
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Erreur lors de la suppression:", error);
        alert(`Erreur lors de la suppression: ${error.message}`);
        return;
      }
      
      alert("Module supprimé avec succès!");
      await fetchModules();
      
    } catch (error) {
      console.error("Erreur inattendue lors de la suppression:", error);
      alert(`Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  function getModuleTypeLabel(type_module: string): string {
    switch (type_module) {
      case 'tcf':
        return 'TCF';
      case 'tef':
        return 'TEF';
      default:
        return type_module.toUpperCase();
    }
  }

  function getModuleTypeIcon(type: string): React.ReactNode {
    switch (type) {
      case 'comprehension_ecrite':
        return <FileText className="w-4 h-4" />;
      case 'comprehension_orale':
        return <Headphones className="w-4 h-4" />;
      case 'expression_ecrite':
        return <Edit className="w-4 h-4" />;
      case 'expression_orale':
        return <Mic className="w-4 h-4" />;
      default:
        return <Book className="w-4 h-4" />;
    }
  }

  // Fonction alternative utilisant l'API route
  async function createModuleViaAPI(moduleData: any) {
    console.log("🌐 Tentative de création via API route...");
    
    try {
      const response = await fetch('/api/create-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error("❌ Erreur API:", result);
        throw new Error(result.error || 'Erreur lors de la création du module');
      }
      
      console.log("✅ Module créé via API:", result);
      return result;
    } catch (error) {
      console.error("❌ Erreur lors de l'appel API:", error);
      throw error;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Modules</h3>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Ajouter un module
            </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.id}>
                <TableCell className="font-medium">{module.name}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getModuleTypeIcon(module.type)}
                    <span className="capitalize">
                      {module.type.replace('_', ' ')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {getModuleTypeLabel(module.type_module)}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {module.description || "Aucune description"}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(module)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(module.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
              {editingModule ? "Modifier le module" : "Créer un nouveau module"}
              </DialogTitle>
            <DialogDescription>
              {editingModule 
                ? "Modifiez les détails du module."
                : "Créez un nouveau module de test."
              }
              </DialogDescription>
            </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du module</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type_module">Type de test</Label>
                <Select
                  value={formData.type_module}
                  onValueChange={(value) => setFormData({...formData, type_module: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type de test" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcf">TCF</SelectItem>
                    <SelectItem value="tef">TEF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
              
            <div className="space-y-2">
              <Label htmlFor="type">Type de compétence</Label>
                <Select
                value={formData.type} 
                onValueChange={(value) => setFormData({...formData, type: value})}
                >
                  <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type de compétence" />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="comprehension_ecrite">Compréhension Écrite</SelectItem>
                  <SelectItem value="comprehension_orale">Compréhension Orale</SelectItem>
                  <SelectItem value="expression_ecrite">Expression Écrite</SelectItem>
                  <SelectItem value="expression_orale">Expression Orale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description du module..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingModule ? "Mettre à jour" : "Créer"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Pencil, Trash2, Save, Book, FileText, Headphones, Edit, Mic } from 'lucide-react';

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

export function ModulesManagerSimple() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    console.log("🔄 Chargement des modules via API...");
    setLoading(true);
    try {
      const response = await fetch('/api/admin/modules-and-tests');
      const result = await response.json();
      
      if (result.success && result.modules) {
        console.log("✅ Modules chargés:", result.modules.length);
        setModules(result.modules);
      } else {
        console.error("❌ Erreur lors du chargement:", result.error);
      }
    } catch (error) {
      console.error("❌ Erreur de fetch:", error);
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
    console.log("🚀 Soumission via API avec données:", formData);
    
    if (submitting) {
      console.log("⏳ Soumission en cours, ignorée");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const slug = formData.name.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      const moduleData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        type_module: formData.type_module,
        icon: formData.icon || null,
        slug: slug
      };
      
      console.log("📦 Envoi des données:", moduleData);
      
      const response = await fetch('/api/create-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log("✅ Module créé avec succès:", result);
        alert("Module créé avec succès!");
        
        // Rafraîchir la liste
        await fetchModules();
        
        // Fermer le dialogue
        setDialogOpen(false);
        resetForm();
      } else {
        console.error("❌ Erreur API:", result);
        alert(`Erreur: ${result.error || 'Erreur inconnue'}`);
      }
      
    } catch (error) {
      console.error("❌ Erreur de requête:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2">Chargement des modules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Modules (Version Simplifiée)</h3>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau module</DialogTitle>
            <DialogDescription>
              Créez un nouveau module de test (Version API).
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
                    Créer
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
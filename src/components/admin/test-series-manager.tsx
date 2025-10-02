"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { PlusCircle, Pencil, Trash2, Save } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type Module = {
  id: string;
  name: string;
}

type TestSeries = {
  id: string;
  module_id: string;
  name: string;
  description: string;
  time_limit: number;
  slug: string;
  created_at: string;
  module_name?: string;
  is_free?: boolean;
}

export function TestSeriesManager() {
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestSeries, setEditingTestSeries] = useState<TestSeries | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteSeries, setPendingDeleteSeries] = useState<TestSeries | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    module_id: "",
    time_limit: 30,
    is_free: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    const supabase = getSupabaseBrowser();
    
    // Récupérer les modules
    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select('id, name')
      .order('name');
    
    if (modulesError) {
      console.error("Erreur lors de la récupération des modules:", modulesError);
    } else {
      setModules(modulesData || []);
    }
    
    // Récupérer les séries de tests avec les noms des modules
    const { data, error } = await supabase
      .from('test_series')
      .select(`
        *,
        modules:module_id (name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des séries de tests:", error);
    } else {
      const formattedData = data?.map((item: any) => ({
        ...item,
        module_name: item.modules?.name
      })) || [];
      setTestSeries(formattedData);
    }
    
    setLoading(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'time_limit' ? parseInt(value) || 0 : value,
    });
  }

  function handleSelectChange(value: string) {
    setFormData({
      ...formData,
      module_id: value,
    });
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      module_id: modules.length > 0 ? modules[0].id : "",
      time_limit: 30,
      is_free: false,
    });
    setEditingTestSeries(null);
  }

  function handleOpenDialog(testSeries?: TestSeries) {
    if (testSeries) {
      setEditingTestSeries(testSeries);
      setFormData({
        name: testSeries.name,
        description: testSeries.description || "",
        module_id: testSeries.module_id,
        time_limit: testSeries.time_limit || 30,
        is_free: testSeries.is_free || false,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({ title: 'Erreur', description: 'Vous devez être connecté', variant: 'destructive' });
        return;
      }
      
      const url = editingTestSeries ? '/api/test-series' : '/api/test-series';
      const method = editingTestSeries ? 'PUT' : 'POST';
      const payload = editingTestSeries 
        ? { id: editingTestSeries.id, ...formData }
        : formData;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }
      
      const result = await response.json();
      
      toast({ 
        title: editingTestSeries ? 'Série mise à jour' : 'Série créée', 
        description: editingTestSeries ? 'La série a été mise à jour avec succès.' : 'La nouvelle série a été créée avec succès.' 
      });
      
      await fetchData();
      setDialogOpen(false);
      resetForm();
      
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({ title: 'Erreur', description: error?.message || 'Erreur lors de la sauvegarde', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteClick(series: TestSeries) {
    setPendingDeleteSeries(series);
    setDeleteDialogOpen(true);
  }
  
  async function performDelete() {
    if (!pendingDeleteSeries) return;
    
    try {
      setDeleting(true);
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({ title: 'Erreur', description: 'Session invalide', variant: 'destructive' });
        return;
      }
      
      const response = await fetch('/api/test-series', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: pendingDeleteSeries.id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }
      
      toast({ title: 'Série supprimée', description: 'La série de tests a été supprimée avec succès.' });
      await fetchData();
      
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({ title: 'Erreur', description: error?.message || 'Suppression impossible', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPendingDeleteSeries(null);
    }
  }

  function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
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
        <h3 className="text-lg font-medium">Séries de tests</h3>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="w-4 h-4 mr-2" />
          Ajouter une série
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Gratuit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testSeries.map((series) => (
              <TableRow key={series.id}>
                <TableCell className="font-medium">{series.name}</TableCell>
                <TableCell>{series.module_name || "Module inconnu"}</TableCell>
                <TableCell>{formatTime(series.time_limit)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${
                    series.is_free 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {series.is_free ? 'Gratuit' : 'Payant'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(series)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(series)}
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
              {editingTestSeries ? "Modifier la série de tests" : "Créer une nouvelle série de tests"}
              </DialogTitle>
            <DialogDescription>
              {editingTestSeries 
                ? "Modifiez les détails de la série de tests."
                : "Créez une nouvelle série de tests pour un module."
              }
              </DialogDescription>
            </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la série</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="module_id">Module</Label>
                <Select value={formData.module_id} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time_limit">Durée (minutes)</Label>
                <Input
                  id="time_limit"
                  name="time_limit"
                  type="number"
                  min="1"
                  value={formData.time_limit}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="is_free">Type</Label>
                <Select 
                  value={formData.is_free ? "true" : "false"} 
                  onValueChange={(value) => setFormData({...formData, is_free: value === "true"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Payant</SelectItem>
                    <SelectItem value="true">Gratuit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description de la série de tests..."
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingTestSeries ? "Mettre à jour" : "Créer"}
                  </>
                )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la série de tests</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer la série "{pendingDeleteSeries?.name}" ? Cette action est irréversible et supprimera également toutes les questions associées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={deleting || !pendingDeleteSeries}
                onClick={(e) => {
                  e.preventDefault();
                  performDelete();
                }}
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Suppression...
                  </>
                ) : (
                  "Supprimer"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

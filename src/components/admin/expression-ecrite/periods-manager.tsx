"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calendar, Search } from "lucide-react";
import { toast } from "sonner";
import { ExpressionEcritePeriod } from "@/types/expression-ecrite";
import { getAllPeriods, createPeriod, updatePeriod, deletePeriod } from "@/lib/supabase/expression-ecrite-utils";

// Type local pour le formulaire
interface CreatePeriodFormData {
  month: string;
  year: number;
  slug: string;
  title: string;
  description: string;
}

const MONTHS = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
] as const;

type PeriodsManagerProps = {
  initialPeriods?: ExpressionEcritePeriod[];
  onPeriodsChange?: (periods: ExpressionEcritePeriod[]) => void;
}

export default function PeriodsManager({ initialPeriods = [], onPeriodsChange }: PeriodsManagerProps) {
  const [periods, setPeriods] = useState<ExpressionEcritePeriod[]>(initialPeriods);
  const [loading, setLoading] = useState(initialPeriods.length === 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ExpressionEcritePeriod | null>(null);
  
  // Formulaire pour nouvelle période
  const [periodForm, setPeriodForm] = useState<CreatePeriodFormData>({
    month: '',
    year: new Date().getFullYear(),
    slug: '',
    title: '',
    description: ''
  });

  // Charger les périodes depuis Supabase
  useEffect(() => {
    const loadPeriodsFromSupabase = async () => {
      setLoading(true);
      
      try {
        // Si des périodes initiales sont fournies, les utiliser d'abord
        if (initialPeriods && initialPeriods.length > 0) {
          setPeriods(initialPeriods);
          setLoading(false);
          return;
        }
        
        // Sinon, charger depuis Supabase
        const { data, error } = await getAllPeriods();
        
        if (error) {
          toast.error(`Erreur: ${error}`);
          setLoading(false);
          return;
        }
        
        if (data) {
          setPeriods(data);
          // Notifier le parent du changement si nécessaire
          if (onPeriodsChange) {
            onPeriodsChange(data);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des périodes:', error);
        toast.error('Impossible de charger les périodes');
      } finally {
        setLoading(false);
      }
    };
    
    loadPeriodsFromSupabase();
  }, [initialPeriods, onPeriodsChange]);

  const generatePeriodSlug = (month: string, year: number): string => {
    return `${month.toLowerCase()}-${year}`;
  };

  const formatPeriodTitle = (month: string, year: number): string => {
    const monthNames: { [key: string]: string } = {
      'janvier': 'Janvier', 'fevrier': 'Février', 'mars': 'Mars',
      'avril': 'Avril', 'mai': 'Mai', 'juin': 'Juin',
      'juillet': 'Juillet', 'aout': 'Août', 'septembre': 'Septembre',
      'octobre': 'Octobre', 'novembre': 'Novembre', 'decembre': 'Décembre'
    };
    return `Sujets Expression Écrite - ${monthNames[month] || month} ${year}`;
  };

  const handlePeriodFormChange = (field: keyof CreatePeriodFormData, value: any) => {
    const updatedForm = { ...periodForm, [field]: value };
    
    // Auto-générer le slug et le titre
    if (field === 'month' || field === 'year') {
      if (updatedForm.month && updatedForm.year) {
        updatedForm.slug = generatePeriodSlug(updatedForm.month, updatedForm.year);
        updatedForm.title = formatPeriodTitle(updatedForm.month, updatedForm.year);
      }
    }
    
    setPeriodForm(updatedForm);
  };
  
  // Initialiser le formulaire d'édition avec les données d'une période existante
  const initEditForm = (period: ExpressionEcritePeriod) => {
    setEditingPeriod(period);
    setPeriodForm({
      month: period.month,
      year: period.year,
      slug: period.slug,
      title: period.title,
      description: period.description || ''
    });
    setShowEditDialog(true);
  };

  const handleCreatePeriod = async () => {
    if (!periodForm.month || !periodForm.year) {
      toast.error("Veuillez sélectionner un mois et une année");
      return;
    }

    // Vérifier si la période existe déjà
    const existingPeriod = periods.find(
      (p) => p.month === periodForm.month && p.year === periodForm.year
    );

    if (existingPeriod) {
      toast.error(`Une période pour ${periodForm.month} ${periodForm.year} existe déjà`);
      return;
    }

    try {
      const periodData: Omit<ExpressionEcritePeriod, 'id' | 'created_at' | 'updated_at'> = {
        month: periodForm.month,
        year: periodForm.year,
        slug: periodForm.slug || generatePeriodSlug(periodForm.month, periodForm.year),
        title: periodForm.title || formatPeriodTitle(periodForm.month, periodForm.year),
        description: periodForm.description,
        is_active: true,
        total_combinations: 0
      };

      const { data: newPeriod, error } = await createPeriod(periodData);
      
      if (error) {
        throw error;
      }
      
      if (newPeriod) {
        const updatedPeriods = [newPeriod, ...periods];
        setPeriods(updatedPeriods);
        setShowPeriodDialog(false);
        resetPeriodForm();
        toast.success("Période créée avec succès");
        
        // Notifier le parent des changements
        if (onPeriodsChange) {
          onPeriodsChange(updatedPeriods);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création de la période:", error);
      toast.error("Erreur lors de la création de la période");
    }
  };
  
  // Gérer la mise à jour d'une période existante
  const handleUpdatePeriod = async () => {
    if (!editingPeriod || !editingPeriod.id) {
      toast.error("Aucune période à modifier");
      return;
    }

    if (!periodForm.month || !periodForm.year) {
      toast.error("Veuillez sélectionner un mois et une année");
      return;
    }

    // Vérifier si la période existe déjà (autre que celle en cours d'édition)
    const existingPeriod = periods.find(
      (p) => p.id !== editingPeriod.id && 
             p.month === periodForm.month && 
             p.year === periodForm.year
    );

    if (existingPeriod) {
      toast.error(`Une période pour ${periodForm.month} ${periodForm.year} existe déjà`);
      return;
    }

    try {
      const periodUpdates: Partial<ExpressionEcritePeriod> = {
        month: periodForm.month,
        year: periodForm.year,
        slug: periodForm.slug || generatePeriodSlug(periodForm.month, periodForm.year),
        title: periodForm.title || formatPeriodTitle(periodForm.month, periodForm.year),
        description: periodForm.description
      };

      const { data: updatedPeriod, error } = await updatePeriod(editingPeriod.id, periodUpdates);
      
      if (error) {
        throw error;
      }
      
      if (updatedPeriod) {
        // Mettre à jour la liste des périodes
        const updatedPeriods = periods.map(p => 
          p.id === updatedPeriod.id ? updatedPeriod : p
        );
        
        setPeriods(updatedPeriods);
        setShowEditDialog(false);
        resetPeriodForm();
        toast.success("Période mise à jour avec succès");
        
        // Notifier le parent des changements
        if (onPeriodsChange) {
          onPeriodsChange(updatedPeriods);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la modification de la période:", error);
      toast.error("Erreur lors de la modification de la période");
    }
  };

  const resetPeriodForm = () => {
    setPeriodForm({
      month: '',
      year: new Date().getFullYear(),
      slug: '',
      title: '',
      description: ''
    });
    setEditingPeriod(null);
  };

  const filteredPeriods = periods.filter(period => {
    const matchesSearch = period.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         period.month.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === "all" || period.year.toString() === selectedYear;
    return matchesSearch && matchesYear;
  });

  const years = Array.from(new Set(periods.map(p => p.year))).sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une période..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Dialog pour créer une nouvelle période */}
        <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle période
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle période</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle période pour organiser les sujets par mois et année.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">Mois</Label>
                  <Select value={periodForm.month} onValueChange={(value) => handlePeriodFormChange('month', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un mois" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(month => (
                        <SelectItem key={month} value={month}>
                          {month.charAt(0).toUpperCase() + month.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Année</Label>
                  <Input
                    type="number"
                    value={periodForm.year}
                    onChange={(e) => handlePeriodFormChange('year', parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="slug">Slug (généré automatiquement)</Label>
                <Input
                  value={periodForm.slug}
                  onChange={(e) => handlePeriodFormChange('slug', e.target.value)}
                  placeholder="juin-2025"
                />
              </div>
              <div>
                <Label htmlFor="title">Titre (généré automatiquement)</Label>
                <Input
                  value={periodForm.title}
                  onChange={(e) => handlePeriodFormChange('title', e.target.value)}
                  placeholder="Sujets Expression Écrite - Juin 2025"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  value={periodForm.description}
                  onChange={(e) => handlePeriodFormChange('description', e.target.value)}
                  placeholder="Description de la période..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPeriodDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreatePeriod} className="bg-orange-600 hover:bg-orange-700">
                Créer la période
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialog pour éditer une période existante */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la période</DialogTitle>
              <DialogDescription>
                Modifiez les informations de la période sélectionnée.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">Mois</Label>
                  <Select value={periodForm.month} onValueChange={(value) => handlePeriodFormChange('month', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un mois" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(month => (
                        <SelectItem key={month} value={month}>
                          {month.charAt(0).toUpperCase() + month.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Année</Label>
                  <Input
                    type="number"
                    value={periodForm.year}
                    onChange={(e) => handlePeriodFormChange('year', parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  value={periodForm.slug}
                  onChange={(e) => handlePeriodFormChange('slug', e.target.value)}
                  placeholder="juin-2025"
                />
              </div>
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  value={periodForm.title}
                  onChange={(e) => handlePeriodFormChange('title', e.target.value)}
                  placeholder="Sujets Expression Écrite - Juin 2025"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  value={periodForm.description}
                  onChange={(e) => handlePeriodFormChange('description', e.target.value)}
                  placeholder="Description de la période..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                resetPeriodForm();
              }}>
                Annuler
              </Button>
              <Button onClick={handleUpdatePeriod} className="bg-orange-600 hover:bg-orange-700">
                Mettre à jour
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Chargement des périodes...</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredPeriods.length > 0 ? (
            filteredPeriods.map((period) => (
              <Card key={period.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium">{period.title}</CardTitle>
                    <Badge className={period.is_active ? "bg-orange-500" : "bg-gray-400"}>
                      {period.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-gray-500">
                    {period.description || `Période de ${period.month} ${period.year}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <p className="flex items-center text-gray-600">
                      <Calendar className="mr-2 h-4 w-4 text-orange-500" />
                      <span className="capitalize">{period.month}</span> {period.year}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {period.total_combinations} combinaison(s)
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => initEditForm(period)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2" 
                      onClick={async () => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer la période ${period.month} ${period.year} ?`)) {
                          try {
                            const { error } = await deletePeriod(period.id);
                            if (error) {
                              toast.error(`Erreur: ${error}`);
                              return;
                            }
                            
                            const updatedPeriods = periods.filter(p => p.id !== period.id);
                            setPeriods(updatedPeriods);
                            
                            // Notifier le parent du changement
                            if (onPeriodsChange) {
                              onPeriodsChange(updatedPeriods);
                            }
                            
                            toast.success("Période supprimée avec succès");
                            
                            // Notifier le parent des changements
                            if (onPeriodsChange) {
                              onPeriodsChange(updatedPeriods);
                            }
                          } catch (error) {
                            console.error("Erreur lors de la suppression:", error);
                            toast.error("Erreur lors de la suppression de la période");
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 flex flex-col items-center justify-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Aucune période trouvée</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                {searchTerm || selectedYear !== "all" ? 
                  "Aucune période ne correspond à votre recherche." : 
                  "Commencez par créer une nouvelle période."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

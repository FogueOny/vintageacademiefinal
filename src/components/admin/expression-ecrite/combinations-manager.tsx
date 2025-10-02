"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { 
  ExpressionEcritePeriod, 
  ExpressionEcriteCombination, 
  CreateCombinationData 
} from "@/types/expression-ecrite";
import { 
  getCombinationsByPeriod, 
  createCombination, 
  updateCombination, 
  deleteCombination 
} from "@/lib/supabase/expression-ecrite-utils";

interface CombinationsManagerProps {
  periods: ExpressionEcritePeriod[];
}

export function CombinationsManager({ periods }: CombinationsManagerProps) {
  // État local
  const [combinations, setCombinations] = useState<ExpressionEcriteCombination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  
  // Formulaire pour nouvelle combinaison
  const [formData, setFormData] = useState<CreateCombinationData>({
    period_id: '',
    combination_number: 1,
    title: '',
  });

  // Chargement des combinaisons
  useEffect(() => {
    if (selectedPeriodId) {
      loadCombinations(selectedPeriodId);
    } else {
      setCombinations([]);
      setLoading(false);
    }
  }, [selectedPeriodId]);

  const loadCombinations = async (periodId: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await getCombinationsByPeriod(periodId);
      
      if (error) {
        toast.error(`Erreur lors du chargement des combinaisons: ${error}`);
        setCombinations([]);
        return;
      }
      
      if (data) {
        setCombinations(data);
      } else {
        setCombinations([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des combinaisons:', error);
      toast.error('Impossible de charger les combinaisons');
      setCombinations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof CreateCombinationData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const resetForm = () => {
    setFormData({
      period_id: selectedPeriodId,
      combination_number: combinations.length > 0 ? Math.max(...combinations.map(c => c.combination_number)) + 1 : 1,
      title: '',
    });
  };

  const handleCreateCombination = async () => {
    if (!formData.period_id) {
      toast.error("Veuillez sélectionner une période");
      return;
    }

    // Vérifier si la combinaison existe déjà
    const exists = combinations.find(c => c.period_id === formData.period_id && c.combination_number === formData.combination_number);
    if (exists) {
      toast.error(`La combinaison ${formData.combination_number} existe déjà pour cette période`);
      return;
    }

    try {
      // Création via Supabase
      const { data: newCombination, error } = await createCombination({
        period_id: formData.period_id,
        combination_number: formData.combination_number,
        title: formData.title,
        is_active: true
      });
      
      if (error) {
        toast.error(`Erreur: ${error}`);
        return;
      }
      
      if (newCombination) {
        setCombinations([...combinations, newCombination]);
        setShowDialog(false);
        resetForm();
        toast.success("Combinaison créée avec succès");
        
        // Les triggers Supabase devraient mettre à jour le compteur de combinaisons automatiquement
        // Donc pas besoin de mettre à jour manuellement le compteur
      }
    } catch (error) {
      console.error("Erreur lors de la création de la combinaison:", error);
      toast.error("Erreur lors de la création de la combinaison");
    }
  };

  const handleOpenDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    // Confirmation et suppression
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette combinaison ?")) {
      try {
        const { error } = await deleteCombination(id);
        
        if (error) {
          toast.error(`Erreur: ${error}`);
          return;
        }
        
        setCombinations(combinations.filter(c => c.id !== id));
        toast.success("Combinaison supprimée avec succès");
        
        // Les triggers Supabase devraient mettre à jour le compteur de combinaisons automatiquement
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Erreur lors de la suppression de la combinaison");
      }
    }
  };

  const filteredCombinations = combinations.filter(combination =>
    combination.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `Combinaison ${combination.combination_number}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPeriodTitle = (id: string) => {
    const period = periods.find(p => p.id === id);
    return period ? period.title : "Période inconnue";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(period => (
                <SelectItem key={period.id} value={period.id}>
                  {period.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPeriodId && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une combinaison..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}
        </div>
        
        {selectedPeriodId && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle combinaison
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle combinaison</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle combinaison de sujets pour la période {getPeriodTitle(selectedPeriodId)}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="combination_number">Numéro de la combinaison</Label>
                  <Input
                    type="number"
                    value={formData.combination_number}
                    onChange={(e) => handleFormChange('combination_number', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Titre (facultatif)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="Titre descriptif de la combinaison"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateCombination} className="bg-orange-600 hover:bg-orange-700">
                  Créer la combinaison
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {selectedPeriodId ? (
        loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des combinaisons...</p>
          </div>
        ) : filteredCombinations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCombinations.map(combination => (
              <Card key={combination.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-orange-600" />
                        Combinaison {combination.combination_number}
                      </h3>
                      {combination.title && (
                        <p className="text-sm text-gray-500">{combination.title}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-2">
                        <Badge variant={combination.is_active ? "default" : "outline"} className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                          {combination.is_active ? "Actif" : "Inactif"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          3 tâches
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(combination.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune combinaison trouvée pour cette période.</p>
            <Button className="mt-4 bg-orange-600 hover:bg-orange-700" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Créer la première combinaison
            </Button>
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">Veuillez sélectionner une période pour voir ses combinaisons.</p>
        </div>
      )}
    </div>
  );
}

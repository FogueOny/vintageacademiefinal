"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, FileText, Search, Star, Check, Eye, EyeOff, User, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { 
  ExpressionEcritePeriod, 
  ExpressionEcriteCombination, 
  ExpressionEcriteTask,
  ExpressionEcriteCorrection,
  CreateCorrectionData
} from "@/types/expression-ecrite";

interface CorrectionsManagerProps {
  periods: ExpressionEcritePeriod[];
}

// Fonctions utilitaires pour le formatage

export function CorrectionsManager({ periods }: CorrectionsManagerProps) {
  // Initialisation du client Supabase
  const supabase = getSupabaseBrowser();
  
  // État local
  const [corrections, setCorrections] = useState<ExpressionEcriteCorrection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [selectedCombinationNumber, setSelectedCombinationNumber] = useState<number | null>(null);
  const [selectedTaskNumber, setSelectedTaskNumber] = useState<1|2|3|null>(null);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [correctionToEdit, setCorrectionToEdit] = useState<string | null>(null);
  const [currentCorrectionId, setCurrentCorrectionId] = useState<string | null>(null);
  
  // État du formulaire pour création/édition
  const [formData, setFormData] = useState<CreateCorrectionData>({
    period_id: '',
    combination_number: 1,
    task_number: 1,
    task_title: '',
    task_description: '',
    task_type: '',
    title: '',
    content: '',
    is_public: true,
    correction_type: 'example',
    corrector_name: 'Admin'
  });
  
  // Note: Les états liés aux champs strengths et improvements ont été supprimés
  // car ces champs n'existent plus dans la table
  
  // Combinaisons et tâches dérivées des corrections
  const availableCombinations = useMemo(() => {
    if (!selectedPeriodId || selectedPeriodId === '') return [];
    
    const availableCombinationsFiltered = corrections
      .filter((c) => c.period_id === selectedPeriodId)
      .map((c) => c.combination_number);

    // Créer un tableau à partir du Set pour éviter les erreurs de compatibilité TypeScript
    const uniqueAvailableCombinations = Array.from(new Set(availableCombinationsFiltered)).sort((a, b) => a - b);
    return uniqueAvailableCombinations;
  }, [selectedPeriodId, corrections]);
  
  // Utilisez les valeurs déjà sélectionnées si disponibles, sinon les valeurs par défaut
  const availableCombinationsWithDefault = useMemo(() => {
    if (availableCombinations.length > 0) return availableCombinations;
    
    // Si aucune combinaison n'est disponible, créez une liste par défaut
    return Array.from({length: 5}, (_, i) => i + 1); // Combinaisons 1-5 par défaut
  }, [availableCombinations]);

  // Toujours permettre de sélectionner les 3 types de tâches
  const availableTasks = useMemo(() => {
    return [1, 2, 3] as const;
  }, []);
  
  // Filtrage des corrections selon les filtres sélectionnés
  const filteredCorrections = useMemo(() => {
    if (!selectedPeriodId || selectedPeriodId === '' || selectedTaskNumber === null) {
      return [];
    }
    
    return corrections.filter(correction => 
      correction.period_id === selectedPeriodId && 
      correction.task_number === selectedTaskNumber &&
      (!showPublicOnly || correction.is_public) &&
      (!searchTerm || (
        (correction.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (correction.content ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }, [corrections, selectedPeriodId, selectedTaskNumber, showPublicOnly, searchTerm]);

  // Interface pour les données du formulaire de création/édition - mise à jour pour correspondre à la table simplifiée
  interface CreateCorrectionData {
    period_id: string;
    combination_number: number;
    task_number: 1|2|3;
    task_title: string;
    task_description: string;
    task_type: string;
    title: string;
    content: string;
    corrector_name: string;
    is_public: boolean;
    correction_type: string;
    // Note: Les champs score, feedback, strengths et improvements ne sont plus dans la table SQL
  }

  // Note: Le formulaire pour nouvelle correction est déclaré plus haut

  // Chargement des corrections lors du changement de période
  useEffect(() => {
    if (selectedPeriodId !== null && selectedPeriodId !== '') {
      loadCorrections();
      // NE PAS réinitialiser la combinaison et la tâche ici
      // On les sélectionnera automatiquement dans loadCorrections
    } else {
      setCorrections([]);
    }
  }, [selectedPeriodId]);

  // Fonction auxiliaire pour mettre à jour les états de manière synchrone
  const updateSelections = (data: ExpressionEcriteCorrection[], periodId: string) => {
    const periodsCorrections = data.filter(c => c.period_id === periodId);
    console.log(`Corrections pour période ${periodId}:`, periodsCorrections.length);
    
    if (periodsCorrections.length > 0) {
      // Sélectionner automatiquement la première combinaison et tâche disponibles
      const firstCombination = periodsCorrections[0].combination_number;
      const firstTask = periodsCorrections[0].task_number as 1 | 2 | 3;
      
      console.log(`Sélection automatique: combinaison ${firstCombination}, tâche ${firstTask}`);
      // Mettre à jour les deux états ensemble
      setSelectedCombinationNumber(firstCombination);
      setSelectedTaskNumber(firstTask);
    } else {
      // Pas de corrections pour cette période, réinitialiser les sélections
      setSelectedCombinationNumber(null);
      setSelectedTaskNumber(null);
    }
  };

  const loadCorrections = async () => {
    try {
      setLoading(true);
      console.log('Chargement des corrections...');
      
      // Récupérer les données depuis Supabase
      const { data, error } = await supabase
        .from('expression_ecrite_corrections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erreur lors du chargement des corrections:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log('Corrections chargées:', data.length, 'éléments trouvés');
        console.log('Premier élément:', data[0]);
        
        setCorrections(data);
        
        // Si aucune période n'est sélectionnée et qu'il y a des données, sélectionner la première période
        if ((!selectedPeriodId || selectedPeriodId === '') && data.length > 0) {
          const firstPeriodId = data[0].period_id;
          if (firstPeriodId) {
            setSelectedPeriodId(firstPeriodId);
            console.log('Période sélectionnée automatiquement:', firstPeriodId);
            updateSelections(data, firstPeriodId);
          }
        } else if (selectedPeriodId) {
          // Si une période est déjà sélectionnée, mettre à jour les sélections pour cette période
          updateSelections(data, selectedPeriodId);
        }
      } else {
        // En cas d'absence de données, utiliser les données mockées
        console.log('Aucune correction trouvée dans la base de données, utilisation des données mockées');
        const mockCorrections: ExpressionEcriteCorrection[] = [
          {
            id: "1",
            period_id: "1",
            combination_number: 1,
            task_number: 1,
            task_title: "Écrire une réclamation",
            task_description: "Vous avez acheté un produit défectueux. Écrivez un email au service client pour décrire le problème et demander un remboursement ou un échange.",
            task_type: "email",
            title: "Réclamation produit défectueux",
            content: `Objet : Réclamation concernant mon téléphone mobile défectueux

Madame, Monsieur,

J'ai acheté un téléphone portable dans votre magasin le 15 mai 2023 (facture n°45678). Malheureusement, après seulement deux semaines d'utilisation, j'ai constaté plusieurs problèmes.

Premièrement, la batterie se décharge très rapidement, en moins de 4 heures. Deuxièmement, l'écran tactile ne fonctionne pas correctement : il ne répond pas toujours quand je le touche.

J'ai déjà essayé de redémarrer le téléphone et de le réinitialiser, mais les problèmes continuent. J'ai aussi lu le manuel d'utilisation, mais je n'ai pas trouvé de solution.

Je voudrais un remboursement ou un échange pour un modèle qui fonctionne correctement. Je vous joins une copie de ma facture.

Merci de me répondre rapidement.

Cordialement,

Jean Dupont
Tél : 06 12 34 56 78
Email : jean.dupont@email.com`,
            correction_content: `Objet : Réclamation concernant mon téléphone mobile défectueux

Madame, Monsieur,

J'ai acheté un téléphone portable dans votre magasin le 15 mai 2023 (facture n°45678). Malheureusement, après seulement deux semaines d'utilisation, j'ai constaté plusieurs problèmes.

Premièrement, la batterie se décharge très rapidement, en moins de 4 heures. Deuxièmement, l'écran tactile ne fonctionne pas correctement : il ne répond pas toujours quand je le touche.

J'ai déjà essayé de redémarrer le téléphone et de le réinitialiser, mais les problèmes continuent. J'ai aussi lu le manuel d'utilisation, mais je n'ai pas trouvé de solution.

Je voudrais un remboursement ou un échange pour un modèle qui fonctionne correctement. Je vous joins une copie de ma facture.

Merci de me répondre rapidement.

Cordialement,

Jean Dupont
Tél : 06 12 34 56 78
Email : jean.dupont@email.com`,
            corrector_name: "Sophie Bernard",
            correction_type: "example",
            is_public: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            period_id: '1',
            combination_number: 1,
            task_number: 2,
            task_title: 'Nouvelle activité sportive',
            task_description: 'Racontez une expérience avec un nouveau sport que vous avez commencé.',
            task_type: 'récit',
            title: 'Correction modèle - B1',
            correction_type: "model_answer",
            content: `Mon nouveau sport : la natation

J'ai commencé un nouveau sport depuis un mois : la natation. Je vais à la piscine deux fois par semaine, le mardi et le jeudi soir après mon travail.

J'ai choisi la natation parce que c'est un sport complet qui fait travailler tous les muscles du corps. De plus, c'est très bon pour la respiration et le stress. Quand je suis dans l'eau, je me sens très détendu et j'oublie tous mes problèmes.

Au début, c'était difficile pour moi de nager plus de 5 minutes sans m'arrêter. Maintenant, je peux nager pendant 30 minutes sans pause. Je suis très fier de mes progrès !

J'ai aussi rencontré des personnes sympathiques dans mon cours de natation. Nous discutons souvent après la séance autour d'un café.

Mon objectif est de participer à une petite compétition locale dans six mois. Je m'entraîne dur pour être prêt.

La natation a vraiment changé ma vie quotidienne. Je me sens plus énergique et plus heureux.`,
            correction_content: `Mon nouveau sport : la natation

J'ai commencé un nouveau sport depuis un mois : la natation. Je vais à la piscine deux fois par semaine, le mardi et le jeudi soir après mon travail.

J'ai choisi la natation parce que c'est un sport complet qui fait travailler tous les muscles du corps. De plus, c'est très bon pour la respiration et le stress. Quand je suis dans l'eau, je me sens très détendu et j'oublie tous mes problèmes.

Au début, c'était difficile pour moi de nager plus de 5 minutes sans m'arrêter. Maintenant, je peux nager pendant 30 minutes sans pause. Je suis très fier de mes progrès !

J'ai aussi rencontré des personnes sympathiques dans mon cours de natation. Nous discutons souvent après la séance autour d'un café.

Mon objectif est de participer à une petite compétition locale dans six mois. Je m'entraîne dur pour être prêt.

La natation a vraiment changé ma vie quotidienne. Je me sens plus énergique et plus heureux.`,
            corrector_name: "Sophie Bernard",
            is_public: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ];
        setCorrections(mockCorrections);
        updateSelections(mockCorrections, "1");
      }
    } catch (error) {
      console.error('Erreur lors du chargement des corrections:', error);
      toast.error('Erreur lors du chargement des corrections');
      setCorrections([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonctions utilitaires pour le formatage
  const formatCombination = (number: number): string => {
    return `Combinaison ${number}`;
  };

  const getTaskLabel = (taskNumber: 1 | 2 | 3): string => {
    return `Tâche ${taskNumber}`;
  };
  
  // Charger les corrections au démarrage du composant
  useEffect(() => {
    loadCorrections();
  }, []);
  
  // Reset task number when combination changes
  useEffect(() => {
    setSelectedTaskNumber(null);
  }, [selectedCombinationNumber]);
  
  // Recharger les corrections après une création réussie
  const refreshCorrections = () => {
    loadCorrections();
  };

  const handleFormChange = (field: keyof CreateCorrectionData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Note: Les fonctions liées aux champs strengths et improvements ont été supprimées
  // car ces champs n'existent plus dans la table
  
  const getCombinationTitle = (number: number): string => {
    return `Combinaison ${number}`;
  };

  // Fonction pour ouvrir le dialogue de création et préparer le formulaire
  const handleOpenDialog = () => {
    console.log('handleOpenDialog appelé');
    const defaultCombinationNumber = selectedCombinationNumber !== null ? selectedCombinationNumber : 
      (availableCombinationsWithDefault.length > 0 ? availableCombinationsWithDefault[0] : 1);
    
    const defaultTaskNumber = selectedTaskNumber !== null ? selectedTaskNumber : 
      (availableTasks.length > 0 ? availableTasks[0] : 1 as 1|2|3);
    
    // Initialisation des données du formulaire avec des valeurs par défaut
    setFormData({
      period_id: selectedPeriodId !== null ? selectedPeriodId : '',
      combination_number: defaultCombinationNumber,
      task_number: defaultTaskNumber,
      task_title: '',
      task_description: '',
      task_type: '',
      title: '',
      content: '',
      is_public: true,
      correction_type: 'example',
      corrector_name: 'Admin'
    });
    
    // Force l'ouverture du dialogue avec un léger délai pour assurer que
    // l'état est correctement mis à jour
    setTimeout(() => {
      setShowDialog(true);
      console.log('Dialog state set to open:', true);
    }, 50);
  };
  
  // Fonction pour éditer une correction existante
  const handleEditCorrection = (correction: ExpressionEcriteCorrection) => {
    console.log('Modification de la correction:', correction);
    
    // Charger les données de la correction dans le formulaire
    setFormData({
      period_id: correction.period_id,
      combination_number: correction.combination_number,
      task_number: correction.task_number as 1|2|3,
      task_title: correction.task_title || '',
      task_description: correction.task_description || '',
      task_type: correction.task_type || '',
      title: correction.title || '',
      content: correction.content || '',
      is_public: correction.is_public || false,
      correction_type: correction.correction_type || 'example',
      corrector_name: correction.corrector_name || 'Admin'
    });
    
    // Activer le mode édition et stocker l'ID de la correction à éditer
    setIsEditing(true);
    setCorrectionToEdit(correction.id);
    
    // Ouvrir le dialogue avec un léger délai pour s'assurer que tout est chargé
    setTimeout(() => {
      setShowDialog(true);
      console.log('Dialogue d\'édition ouvert pour la correction ID:', correction.id);
    }, 50);
  };
  
  // Alias pour la cohérence du code
  const prepareNewCorrectionForm = handleOpenDialog;

  const handleCreateCorrection = async () => {
    try {
      // Log des données du formulaire pour débogage
      console.log("Données du formulaire à envoyer:", formData);
      
      // Validation du type de correction
      const validCorrectionTypes = ['example', 'user_specific', 'model_answer', 'official', 'community'] as const;
      type CorrectionType = typeof validCorrectionTypes[number];
      
      // S'assurer que correction_type est une valeur valide
      let correctionType: CorrectionType = 'example'; // valeur par défaut
      if (formData.correction_type && validCorrectionTypes.includes(formData.correction_type as any)) {
        correctionType = formData.correction_type as CorrectionType;
      }
      
      // Préparer les données pour l'insertion
      const correctionData = {
        period_id: formData.period_id,
        combination_number: formData.combination_number,
        task_number: formData.task_number,
        task_title: formData.task_title,
        task_description: formData.task_description,
        task_type: formData.task_type,
        title: formData.title || 'Exemple de correction',
        content: formData.content,
        corrector_name: formData.corrector_name || 'Admin',
        correction_type: correctionType,
        is_public: formData.is_public === undefined ? false : formData.is_public,
      };
      
      // Si mode édition, mise à jour d'une correction existante
      if (isEditing && correctionToEdit) {
        console.log(`Mise à jour de la correction ID: ${correctionToEdit}`);
        const { data, error } = await supabase
          .from('expression_ecrite_corrections')
          .update(correctionData)
          .eq('id', correctionToEdit)
          .select();
        
        if (error) {
          console.error('Erreur lors de la mise à jour:', error);
          throw error;
        }
        
        toast.success("Correction modifiée avec succès!");
        setShowDialog(false);
        setIsEditing(false);
        setCorrectionToEdit(null);
        
        // Mise à jour de la liste locale
        if (data && data.length > 0) {
          const updatedCorrection: ExpressionEcriteCorrection = data[0];
          setCorrections(corrections.map(c => 
            c.id === updatedCorrection.id ? updatedCorrection : c
          ));
        }
        
        // Recharger les corrections pour s'assurer que tout est à jour
        await loadCorrections();
      } 
      // Sinon, création d'une nouvelle correction
      else {
        console.log('Création d\'une nouvelle correction');
        const { data, error } = await supabase
          .from('expression_ecrite_corrections')
          .insert(correctionData)
          .select();
        
        if (error) {
          console.error('Erreur lors de la création:', error);
          throw error;
        }
        
        toast.success("Correction créée avec succès dans la base de données!");
        setShowDialog(false);
        
        // Si l'insertion a réussi, ajouter la correction à la liste locale
        if (data && data.length > 0) {
          const newCorrection: ExpressionEcriteCorrection = data[0];
          setCorrections([...corrections, newCorrection]);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la création de la correction", error);
      toast.error(`Erreur lors de la ${isEditing ? 'modification' : 'création'} de la correction: ${(error as any).message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    
    // Réinitialiser le mode édition
    if (isEditing) {
      setIsEditing(false);
      setCorrectionToEdit(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette correction?")) {
      try {
        // En production, ce serait un appel API pour supprimer de la base de données
        // Simulation de suppression dans l'état local
        setCorrections(corrections.filter(c => c.id !== id));
        toast.success("Correction supprimée avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression de la correction", error);
        toast.error("Erreur lors de la suppression de la correction");
      }
    }
  };

  const getTaskInfo = (periodId: string, combinationNumber: number, taskNumber: 1 | 2 | 3) => {
    // Cette fonction simule la récupération des informations d'une tâche
    // En production, ces informations viendraient de la base de données
    const taskTypes = {
      1: "Correspondance",
      2: "Narration", 
      3: "Argumentation"
    };
    
    return {
      title: `Tâche ${taskNumber} - ${taskTypes[taskNumber]}`,
      description: `Description de la tâche ${taskNumber} de la combinaison ${combinationNumber}`,
      task_type: taskTypes[taskNumber].toLowerCase()
    };
  };

  // La fonction handleDelete est déjà définie plus haut
  


  return (
    <div className="space-y-4">
      {/* Section des filtres */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Sélecteurs de filtres */}
        <Select value={selectedPeriodId || ""} onValueChange={setSelectedPeriodId}>
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

        {/* Le sélecteur de combinaison a été retiré car le numéro de combinaison est maintenant saisi directement dans le formulaire */}

        {/* Le sélecteur de tâche a été retiré pour simplifier l'interface */}
      </div>

      {selectedPeriodId !== null && selectedPeriodId !== '' && selectedTaskNumber !== null && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={showPublicOnly} 
                onCheckedChange={setShowPublicOnly} 
                id="show-public"
              />
              <Label htmlFor="show-public" className="text-sm">Corrections publiques uniquement</Label>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <Button 
              variant="default" 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleOpenDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle correction
            </Button>
          </div>
        </div>
      )}

      {/* Dialog complètement séparé */}
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Modifier la correction' : 'Créer une nouvelle correction'}
            </DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle correction en spécifiant le numéro de combinaison et les informations de la tâche.
            </DialogDescription>
          </DialogHeader>
                
          <div className="grid gap-4 py-4">
            {/* Informations sur la tâche */}
            <div className="grid gap-4 mb-4">
              <h4 className="text-sm font-medium">Informations sur la tâche</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="combination_number">Numéro de combinaison</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.combination_number}
                          onChange={(e) => handleFormChange('combination_number', parseInt(e.target.value) || 1)}
                          placeholder="Ex: 1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="task_title">Titre de la tâche</Label>
                        <Input
                          value={formData.task_title || ''}
                          onChange={(e) => handleFormChange('task_title', e.target.value)}
                          placeholder="Titre de la tâche"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="task_number">Numéro de tâche</Label>
                        <Select 
                          value={formData.task_number.toString()} 
                          onValueChange={(value) => handleFormChange('task_number', parseInt(value) as 1 | 2 | 3)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Numéro" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Tâche 1</SelectItem>
                            <SelectItem value="2">Tâche 2</SelectItem>
                            <SelectItem value="3">Tâche 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task_type">Type de tâche</Label>
                        <Select 
                          value={formData.task_type || ''} 
                          onValueChange={(value) => handleFormChange('task_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="courriel">Courriel</SelectItem>
                            <SelectItem value="lettre">Lettre</SelectItem>
                            <SelectItem value="message">Message</SelectItem>
                            <SelectItem value="blog">Blog</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="argumentation">Argumentation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="task_description">Description de la tâche</Label>
                        <Textarea
                          value={formData.task_description || ''}
                          onChange={(e) => handleFormChange('task_description', e.target.value)}
                          placeholder="Description détaillée de la tâche..."
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informations sur la correction */}
                  <div className="grid gap-4">
                    <h4 className="text-sm font-medium">Informations sur la correction</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="content">Texte de la correction</Label>
                        <Textarea
                          id="content"
                          rows={5}
                          value={formData.content}
                          onChange={(e) => handleFormChange('content', e.target.value)}
                          placeholder="Texte complet de la correction..."
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="correction_type">Type de correction</Label>
                        <Select 
                          value={formData.correction_type || 'example'} 
                          onValueChange={(value) => handleFormChange('correction_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="example">Exemple</SelectItem>
                            <SelectItem value="model_answer">Réponse modèle</SelectItem>
                            <SelectItem value="user_specific">Correction spécifique</SelectItem>
                            <SelectItem value="official">Correction officielle</SelectItem>
                            <SelectItem value="community">Contribution communautaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_public"
                            checked={formData.is_public || false}
                            onCheckedChange={(checked) => handleFormChange('is_public', checked)}
                          />
                          <Label htmlFor="is_public">Publique</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowDialog(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateCorrection}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedPeriodId !== null && selectedPeriodId !== '' && selectedTaskNumber !== null ? (
        loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des corrections...</p>
          </div>
        ) : filteredCorrections.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredCorrections.map((correction: ExpressionEcriteCorrection) => (
              <Card key={correction.id} className="overflow-hidden">
                <CardHeader className={`pb-3 ${correction.is_public ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {correction.title}
                      </CardTitle>
                      {/* Remplacé CardDescription par div pour éviter l'erreur de nidification */}
                      <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                        <Badge variant={correction.is_public ? "default" : "outline"} className={
                          correction.is_public ? 'bg-green-100 text-green-800' : 'text-yellow-800'
                        }>
                          {correction.is_public ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                          {correction.is_public ? 'Public' : 'Privé'}
                        </Badge>
                        <Badge variant="outline" className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {correction.corrector_name}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(correction.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditCorrection(correction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(correction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Texte de correction</h4>
                    <div className="bg-gray-50 p-3 rounded-md font-mono whitespace-pre-wrap text-sm">
                      {correction.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune correction trouvée pour cette tâche.</p>
            <Button 
              className="mt-4 bg-orange-600 hover:bg-orange-700" 
              onClick={handleOpenDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer la première correction
            </Button>
          </div>
        )
      ) : loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Chargement des corrections...</p>
        </div>
      ) : selectedPeriodId !== null && selectedPeriodId !== '' && selectedCombinationNumber !== null && selectedTaskNumber === null ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Veuillez sélectionner une tâche pour voir ses corrections.</p>
          <Button 
            className="mt-4 bg-orange-600 hover:bg-orange-700" 
            onClick={handleOpenDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une nouvelle correction
          </Button>
        </div>
      ) : selectedPeriodId !== null && selectedPeriodId !== '' ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Vous pouvez créer une nouvelle correction ou sélectionner une combinaison pour voir les corrections existantes.</p>
          <Button 
            className="mt-4 bg-orange-600 hover:bg-orange-700" 
            onClick={handleOpenDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une nouvelle correction
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">Veuillez d'abord sélectionner une période.</p>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText, Search, Book, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import { 
  ExpressionEcritePeriod, 
  ExpressionEcriteCombination, 
  ExpressionEcriteTask,
  CreateTaskData,
  TASK_TYPES,
  DIFFICULTY_LEVELS
} from "@/types/expression-ecrite";
import { 
  getCombinationsByPeriod,
  getTasksByCombination,
  createTask,
  updateTask,
  deleteTask
} from "@/lib/supabase/expression-ecrite-utils";

interface TasksManagerProps {
  periods: ExpressionEcritePeriod[];
}

export function TasksManager({ periods }: TasksManagerProps) {
  // État local
  const [combinations, setCombinations] = useState<ExpressionEcriteCombination[]>([]);
  const [tasks, setTasks] = useState<ExpressionEcriteTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [selectedCombinationId, setSelectedCombinationId] = useState<string>("");
  const [selectedTaskNumber, setSelectedTaskNumber] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<string>("");

  // Formulaire  // État du formulaire avec valeurs par défaut pour les champs obligatoires
  const [formData, setFormData] = useState<CreateTaskData>({
    combination_id: selectedCombinationId || '',
    task_number: 1,
    title: '',
    description: '',
    // Champs obligatoires cachés avec valeurs par défaut
    task_type: 'courriel',
    word_count_min: 60,
    word_count_max: 120,
    difficulty_level: 'intermediate'
  });
  // Valeur par défaut pour duration_minutes qui est requis dans la fonction createTask
  const defaultDurationMinutes = 30;

  // Chargement des combinaisons lors du changement de période
  useEffect(() => {
    if (selectedPeriodId) {
      loadCombinations(selectedPeriodId);
      setSelectedCombinationId("");
      setTasks([]);
    } else {
      setCombinations([]);
    }
  }, [selectedPeriodId]);

  // Chargement des tâches lors du changement de combinaison
  useEffect(() => {
    if (selectedCombinationId) {
      // Mettre à jour l'ID de la combinaison dans le formulaire
      setFormData(prev => ({ ...prev, combination_id: selectedCombinationId }));
      // Charger les tâches pour la combinaison sélectionnée
      loadTasks(selectedCombinationId);
    } else {
      setTasks([]);
    }
  }, [selectedCombinationId]);

  const loadCombinations = async (periodId: string) => {
    setLoading(true);
    try {
      const { data, error } = await getCombinationsByPeriod(periodId);
      
      if (error) {
        toast.error(`Erreur: ${error}`);
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

  const loadTasks = async (combinationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await getTasksByCombination(combinationId);
      
      if (error) {
        toast.error(`Erreur: ${error}`);
        setTasks([]);
        return;
      }
      
      if (data) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      toast.error('Impossible de charger les tâches');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Ajuster automatiquement les valeurs par défaut selon le numéro de tâche
    if (field === 'task_number') {
      if (value === 1) {
        setFormData(prev => ({
          ...prev,
          task_type: 'courriel',
          word_count_min: 60,
          word_count_max: 120
        }));
      } else if (value === 2) {
        setFormData(prev => ({
          ...prev,
          task_type: 'blog',
          word_count_min: 120,
          word_count_max: 150
        }));
      } else if (value === 3) {
        setFormData(prev => ({
          ...prev,
          task_type: 'argumentation',
          word_count_min: 120,
          word_count_max: 180
        }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      combination_id: selectedCombinationId || '',
      task_number: 1,
      title: '',
      description: '',
      // Valeurs par défaut pour les champs obligatoires
      task_type: 'courriel',
      word_count_min: 60,
      word_count_max: 120,
      difficulty_level: 'intermediate'
    });
    setIsEditing(false);
    setTaskToEdit("");
  };

  const handleSaveTask = async () => {
    if (!formData.combination_id) {
      toast.error("Veuillez sélectionner une combinaison");
      return;
    }

    try {
      // Ajuster automatiquement certains paramètres obligatoires selon le numéro de tâche
      const taskData = {
        ...formData,
        duration_minutes: defaultDurationMinutes,
        // S'assurer que les champs obligatoires sont définis
        difficulty_level: formData.difficulty_level || 'intermediate'
      };

      if (isEditing) {
        // Mode édition - mettre à jour une tâche existante
        const { data: updatedTask, error } = await updateTask(taskToEdit, taskData);
        
        if (error) {
          toast.error(`Erreur: ${error}`);
          return;
        }
        
        if (updatedTask) {
          // Mettre à jour la tâche dans l'état local
          setTasks(tasks.map(task => task.id === taskToEdit ? updatedTask : task));
          setShowDialog(false);
          resetForm();
          toast.success("Tâche mise à jour avec succès");
        }
      } else {
        // Mode création - vérifier si la tâche existe déjà
        const exists = tasks.find(t => 
          t.combination_id === formData.combination_id && 
          t.task_number === formData.task_number
        );
        
        if (exists) {
          toast.error(`La tâche ${formData.task_number} existe déjà pour cette combinaison`);
          return;
        }

        // Créer une nouvelle tâche
        const { data: newTask, error } = await createTask(taskData);
        
        if (error) {
          toast.error(`Erreur: ${error}`);
          return;
        }
        
        if (newTask) {
          setTasks([...tasks, newTask]);
          setShowDialog(false);
          resetForm();
          toast.success("Tâche créée avec succès");
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la ${isEditing ? 'mise à jour' : 'création'} de la tâche:`, error);
      toast.error(`Erreur lors de la ${isEditing ? 'mise à jour' : 'création'} de la tâche`);
    }
  };

  const handleOpenDialog = () => {
    resetForm();
    setShowDialog(true);
  };
  
  const handleEdit = (task: ExpressionEcriteTask) => {
    setIsEditing(true);
    setTaskToEdit(task.id);
    // Conserver tous les champs obligatoires lors de l'édition
    setFormData({
      combination_id: task.combination_id,
      task_number: task.task_number,
      title: task.title,
      description: task.description,
      task_type: task.task_type || 'courriel',
      word_count_min: task.word_count_min || 60,
      word_count_max: task.word_count_max || 120,
      difficulty_level: task.difficulty_level || 'intermediate',
      instructions: task.instructions
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    // Confirmation et suppression
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      try {
        const { error } = await deleteTask(id);
        
        if (error) {
          toast.error(`Erreur: ${error}`);
          return;
        }
        
        // Mettre à jour l'état local après suppression réussie
        setTasks(tasks.filter(t => t.id !== id));
        toast.success("Tâche supprimée avec succès");
      } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
        toast.error("Erreur lors de la suppression de la tâche");
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTaskNumber = selectedTaskNumber === "all" || task.task_number.toString() === selectedTaskNumber;
    return matchesSearch && matchesTaskNumber;
  });

  const getPeriodTitle = (id: string) => {
    const period = periods.find(p => p.id === id);
    return period ? period.title : "Période inconnue";
  };

  const getCombinationTitle = (id: string) => {
    const combination = combinations.find(c => c.id === id);
    return combination ? 
      (combination.title ? `Combinaison ${combination.combination_number}: ${combination.title}` : 
      `Combinaison ${combination.combination_number}`) : 
      "Combinaison inconnue";
  };

  const getTaskStatusBadge = (taskNumber: number) => {
    const task = tasks.find(t => t.task_number === taskNumber);
    if (!task) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          À créer
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800">
        Complète
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
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
          <Select value={selectedCombinationId} onValueChange={setSelectedCombinationId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner une combinaison" />
            </SelectTrigger>
            <SelectContent>
              {combinations.map(combination => (
                <SelectItem key={combination.id} value={combination.id}>
                  Combinaison {combination.combination_number} {combination.title ? `- ${combination.title}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedCombinationId && (
          <>
            <Select value={selectedTaskNumber} onValueChange={setSelectedTaskNumber}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tâche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="1">Tâche 1</SelectItem>
                <SelectItem value="2">Tâche 2</SelectItem>
                <SelectItem value="3">Tâche 3</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </>
        )}
      </div>

      {selectedCombinationId && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{getCombinationTitle(selectedCombinationId)}</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tâche 1:</span> 
              {getTaskStatusBadge(1)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tâche 2:</span> 
              {getTaskStatusBadge(2)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tâche 3:</span> 
              {getTaskStatusBadge(3)}
            </div>
          </div>
        </div>
      )}

      {selectedCombinationId && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Modifier' : 'Ajouter'} une tâche pour la {getCombinationTitle(selectedCombinationId)}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="task_number">Numéro de tâche</Label>
                <Select 
                  value={formData.task_number.toString()} 
                  onValueChange={(value) => handleFormChange('task_number', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tâche 1</SelectItem>
                    <SelectItem value="2">Tâche 2</SelectItem>
                    <SelectItem value="3">Tâche 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="Ex: La gratuité des transports en commun : pour ou contre ?"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Document / Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Ex: Document 1 : Les transports en commun gratuits, c'est une très bonne idée. Cela permet de diminuer le nombre de voitures en ville et d'éviter les bouchons."
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Pour les documents, commencez par "Document 1 :" ou "Document 2 :".<br />
                  Pour les descriptions sans document, entrez simplement la description.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Annuler</Button>
              <Button onClick={handleSaveTask} className="bg-orange-600 hover:bg-orange-700">
                {isEditing ? 'Mettre à jour' : 'Créer la tâche'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedCombinationId ? (
        loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des tâches...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredTasks.map(task => (
              <Card key={task.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-xs mr-2">
                          {task.task_number}
                        </span>
                        {task.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">
                          {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-gray-600">
                          {task.word_count_min}-{task.word_count_max} mots
                        </Badge>
                        <Badge className={
                          task.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                          task.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {
                            task.difficulty_level === 'beginner' ? 'Débutant' :
                            task.difficulty_level === 'intermediate' ? 'Intermédiaire' :
                            'Avancé'
                          }
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-sm mb-4">
                    <div className="font-medium flex items-center mb-1">
                      <AlignLeft className="h-4 w-4 mr-1 text-gray-500" />
                      Description:
                    </div>
                    <p className="text-gray-700">{task.description}</p>
                  </div>

                  <div className="text-sm">
                    <div className="font-medium flex items-center mb-1">
                      <Book className="h-4 w-4 mr-1 text-gray-500" />
                      Instructions:
                    </div>
                    <p className="text-gray-700">{task.instructions || "Aucune instruction spécifique."}</p>
                  </div>

                  {task.task_number === 3 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Documents de référence</span>
                        <Button variant="outline" size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter un document
                        </Button>
                      </div>
                      <div className="mt-2 text-gray-600 text-sm italic">
                        Aucun document ajouté pour cette tâche.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucune tâche trouvée pour cette combinaison.</p>
            <Button className="mt-4 bg-orange-600 hover:bg-orange-700" onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Créer la première tâche
            </Button>
          </div>
        )
      ) : selectedPeriodId ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Veuillez sélectionner une combinaison pour voir ses tâches.</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">Veuillez d'abord sélectionner une période.</p>
        </div>
      )}
    </div>
  );
}

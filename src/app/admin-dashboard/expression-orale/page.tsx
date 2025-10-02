"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Calendar, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MONTHS } from "@/types/expression-orale";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// Types pour l'interface d'administration
import type { 
  ExpressionOralePeriod, 
  ExpressionOraleTask, 
  ExpressionOraleSubject,
  CreatePeriodData,
  CreateTaskData,
  CreateSubjectData
} from "@/types/expression-orale";

export default function ExpressionOraleAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("periods");

  // États pour les périodes, tâches et sujets
  const [periods, setPeriods] = useState<ExpressionOralePeriod[]>([]);
  const [tasks, setTasks] = useState<ExpressionOraleTask[]>([]);
  const [subjects, setSubjects] = useState<ExpressionOraleSubject[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // États pour les formulaires
  const [periodForm, setPeriodForm] = useState<Partial<ExpressionOralePeriod>>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    title: '',
    description: '',
  });
  const [taskForm, setTaskForm] = useState<Partial<ExpressionOraleTask>>({
    period_id: '',
    task_number: 2,
    title: '',
    instructions: '',
  });
  const [subjectForm, setSubjectForm] = useState<Partial<ExpressionOraleSubject>>({
    task_id: '',
    subject_number: 1,
    content: '',
    question: '',
    is_active: true,
  });

  // État pour le mode édition
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<ExpressionOraleSubject | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<ExpressionOralePeriod | null>(null);

  const [subjectEditForm, setSubjectEditForm] = useState<Partial<ExpressionOraleSubject>>({});
  const [periodEditForm, setPeriodEditForm] = useState<Partial<ExpressionOralePeriod>>({});

  const [confirm, setConfirm] = useState<{ open: boolean; type: 'period' | 'task' | 'subject' | null; id: string; label?: string }>(
    { open: false, type: null, id: '' }
  );

  // États pour l'interface
  const [loading, setLoading] = useState({
    periods: false,
    tasks: false,
    subjects: false,
    saving: false
  });
  // State pour les formulaires

  // Fonctions pour charger les données
  const loadPeriods = async () => {
    setLoading(prev => ({ ...prev, periods: true }));
    try {
      const response = await fetch('/api/admin/expression-orale/periods');
      if (!response.ok) throw new Error('Erreur lors du chargement des périodes');
      
      const data = await response.json();
      setPeriods(data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les périodes",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, periods: false }));
    }
  };

  const loadTasks = async (periodId: string) => {
    if (!periodId) return;
    
    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      const response = await fetch(`/api/admin/expression-orale/tasks?periodId=${periodId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des tâches');
      
      const data = await response.json();
      setTasks(data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const loadSubjects = async (taskId: string) => {
    if (!taskId) return;
    
    setLoading(prev => ({ ...prev, subjects: true }));
    try {
      const response = await fetch(`/api/admin/expression-orale/subjects?taskId=${taskId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des sujets');
      
      const data = await response.json();
      setSubjects(data.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sujets",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, subjects: false }));
    }
  };

  // Fonctions pour créer de nouvelles données
  const createPeriod = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      // Générer un slug si non fourni
      if (!periodForm.slug) {
        const monthIndex = ((periodForm.month ?? (new Date().getMonth() + 1)) - 1);
        const yearVal = periodForm.year ?? new Date().getFullYear();
        const month = MONTHS[monthIndex] ?? MONTHS[new Date().getMonth()];
        periodForm.slug = `${month.toLowerCase()}-${yearVal}`;
      }

      // Générer un titre si non fourni
      if (!periodForm.title) {
        const monthIndex = ((periodForm.month ?? (new Date().getMonth() + 1)) - 1);
        const yearVal = periodForm.year ?? new Date().getFullYear();
        const month = MONTHS[monthIndex] ?? MONTHS[new Date().getMonth()];
        periodForm.title = `${month} ${yearVal}`;
      }

      const response = await fetch('/api/admin/expression-orale/periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(periodForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création de la période');
      }

      // Recharger les périodes
      loadPeriods();
      
      // Réinitialiser le formulaire
      setPeriodForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        title: '',
        description: '',
      });

      toast({
        title: 'Période créée avec succès',
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const createTask = async () => {
    if (!taskForm.period_id) {
      taskForm.period_id = selectedPeriodId;
    }
    
    if (!taskForm.task_number) {
      toast({ title: 'Erreur', description: 'Le numéro de tâche est requis', variant: 'destructive' });
      return;
    }
    
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const response = await fetch('/api/admin/expression-orale/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création de la tâche');
      }

      // Recharger les tâches
      loadTasks(selectedPeriodId);
      
      // Réinitialiser le formulaire
      setTaskForm({
        period_id: selectedPeriodId,
        task_number: 2,
        title: '',
        instructions: '',
      });

      toast({ title: 'Tâche créée avec succès' });
    } catch (error) {
      console.error('Erreur:', error);
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const updateTask = async (taskId: string) => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const response = await fetch(`/api/admin/expression-orale/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la mise à jour de la tâche');
      }

      // Recharger les tâches
      loadTasks(selectedPeriodId);
      
      // Réinitialiser le mode édition et le formulaire
      setTaskForm({
        period_id: selectedPeriodId,
        task_number: 2,
        title: '',
        instructions: '',
      });
      setEditingTaskId(null);

      toast({ title: 'Tâche mise à jour avec succès' });
    } catch (error) {
      console.error('Erreur:', error);
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const deleteTask = async (taskId: string) => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const response = await fetch(`/api/admin/expression-orale/tasks/${taskId}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression de la tâche');
      }
      await loadTasks(selectedPeriodId);
      if (editingTaskId === taskId) {
        setTaskForm({ period_id: selectedPeriodId, task_number: 2, title: '', instructions: '' });
        setEditingTaskId(null);
      }
      if (selectedTaskId === taskId) setSelectedTaskId('');
      toast({ title: 'Tâche supprimée avec succès' });
    } catch (error) {
      console.error('Erreur:', error);
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const startEditingTask = (task: ExpressionOraleTask) => {
    setTaskForm({
      period_id: task.period_id,
      task_number: task.task_number,
      title: task.title || '',
      instructions: task.instructions || '',
    });
    setEditingTaskId(task.id);
  };

  const createSubject = async () => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const response = await fetch('/api/admin/expression-orale/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectForm)
      });
      
      if (!response.ok) throw new Error('Erreur lors de la création du sujet');
      
      const data = await response.json();
      
      // Réinitialiser le formulaire et recharger les sujets
      setSubjectForm({
        task_id: selectedTaskId,
        subject_number: ((subjectForm.subject_number ?? 0) + 1), // Incrémenter pour faciliter l'ajout de plusieurs sujets
        content: "",
        question: "",
        is_active: true
      });
      
      toast({
        title: "Succès",
        description: "Le sujet a été créé avec succès",
        variant: "default"
      });
      
      loadSubjects(selectedTaskId);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le sujet",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  // Fonctions pour supprimer des données
  const deletePeriod = async (id: string) => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const response = await fetch(`/api/admin/expression-orale/periods/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur lors de la suppression de la période');
      toast({ title: 'Période supprimée avec succès' });
      await loadPeriods();
      if (selectedPeriodId === id) {
        setSelectedPeriodId('');
        setTasks([]);
        setSubjects([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer la période', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  const deleteSubject = async (id: string) => {
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const response = await fetch(`/api/admin/expression-orale/subjects/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erreur lors de la suppression du sujet');
      toast({ title: 'Sujet supprimé avec succès' });
      await loadSubjects(selectedTaskId);
    } catch (error) {
      console.error('Erreur:', error);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le sujet', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  // Edit Period
  const openEditPeriod = (period: ExpressionOralePeriod) => {
    setEditingPeriod(period);
    setPeriodEditForm({ title: period.title, description: period.description, month: period.month, year: period.year });
  };
  const saveEditPeriod = async () => {
    if (!editingPeriod) return;
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const response = await fetch(`/api/admin/expression-orale/periods/${editingPeriod.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(periodEditForm)
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour de la période');
      toast({ title: 'Période mise à jour' });
      setEditingPeriod(null);
      await loadPeriods();
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la période', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  // Edit Subject
  const openEditSubject = (subject: ExpressionOraleSubject) => {
    setEditingSubject(subject);
    setSubjectEditForm({ content: subject.content, question: subject.question, subject_number: subject.subject_number, is_active: subject.is_active });
  };
  const saveEditSubject = async () => {
    if (!editingSubject) return;
    setLoading(prev => ({ ...prev, saving: true }));
    try {
      const response = await fetch(`/api/admin/expression-orale/subjects/${editingSubject.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subjectEditForm)
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du sujet');
      toast({ title: 'Sujet mis à jour' });
      setEditingSubject(null);
      await loadSubjects(selectedTaskId);
    } catch (error) {
      console.error(error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le sujet', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  // Gestionnaire de changement pour le champ question
  const handleQuestionChange = (value: string) => {
    setSubjectForm(prev => ({
      ...prev,
      question: value
    }));
  };

  // Gestionnaires d'effet
  useEffect(() => {
    loadPeriods();
  }, []);

  // Effet pour charger les tâches quand une période est sélectionnée
  useEffect(() => {
    if (selectedPeriodId) {
      // Charger les tâches pour cette période
      loadTasks(selectedPeriodId);
      
      // Réinitialiser la sélection de tâche et le formulaire
      setSelectedTaskId('');
      setTaskForm({
        period_id: selectedPeriodId,
        task_number: 2,
        title: '',
        instructions: '',
      });
      setEditingTaskId(null);
      setSubjects([]);
    } else {
      // Réinitialiser les données si aucune période n'est sélectionnée
      setTasks([]);
      setSelectedTaskId('');
      setTaskForm({
        period_id: '',
        task_number: 2,
        title: '',
        instructions: '',
      });
    }
  }, [selectedPeriodId]);

  useEffect(() => {
    if (selectedTaskId) {
      loadSubjects(selectedTaskId);
      
      // Mettre à jour le formulaire de sujet
      setSubjectForm(prev => ({
        ...prev,
        task_id: selectedTaskId
      }));
      
      // Récupérer le prochain numéro de sujet disponible
      fetch(`/api/admin/expression-orale/next-subject-number?taskId=${selectedTaskId}`)
        .then(res => res.json())
        .then(data => {
          setSubjectForm(prev => ({
            ...prev,
            subject_number: data.nextNumber || 1
          }));
        })
        .catch(console.error);
    }
  }, [selectedTaskId]);

  // Rendu de l'interface utilisateur
  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Gestion des Sujets d'Expression Orale TCF" 
        description="Créez et gérez les périodes, tâches et sujets pour l'Expression Orale du TCF."
        icon={<FileText className="h-6 w-6" />}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="periods">
            <Calendar className="h-4 w-4 mr-2" />
            Périodes
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <FileText className="h-4 w-4 mr-2" />
            Sujets
          </TabsTrigger>
        </TabsList>
        
        {/* Onglet Périodes */}
        <TabsContent value="periods" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formulaire de création de période */}
            <Card>
              <CardHeader>
                <CardTitle>Créer une nouvelle période</CardTitle>
                <CardDescription>
                  Une période représente un mois et une année spécifiques pour les sujets TCF.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createPeriod(); }}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="month">Mois</Label>
                      <Select 
                        value={(periodForm.month ?? (new Date().getMonth() + 1)).toString()} 
                        onValueChange={value => setPeriodForm(prev => ({ ...prev, month: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un mois" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month, index) => (
                            <SelectItem key={index + 1} value={(index + 1).toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Année</Label>
                      <Select
                        value={(periodForm.year ?? new Date().getFullYear()).toString()}
                        onValueChange={value => setPeriodForm(prev => ({ ...prev, year: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une année" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 9 }, (_, i) => 2022 + i).map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre (optionnel)</Label>
                    <Input 
                      id="title" 
                      placeholder="Expression Orale Janvier 2024" 
                      value={periodForm.title} 
                      onChange={e => setPeriodForm(prev => ({ ...prev, title: e.target.value }))} 
                    />
                    <p className="text-sm text-muted-foreground">
                      Laissez vide pour utiliser le titre par défaut.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optionnelle)</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Description de la période..." 
                      value={periodForm.description || ''} 
                      onChange={e => setPeriodForm(prev => ({ ...prev, description: e.target.value }))} 
                    />
                  </div>
                  
                  <Button type="submit" disabled={loading.saving}>
                    {loading.saving ? 'Création en cours...' : 'Créer la période'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Liste des périodes */}
            <Card>
              <CardHeader>
                <CardTitle>Périodes existantes</CardTitle>
                <CardDescription>
                  Sélectionnez une période pour voir ses tâches et sujets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading.periods ? (
                  <div className="text-center py-4">Chargement des périodes...</div>
                ) : periods.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Aucune période trouvée. Créez-en une nouvelle.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {periods.map((period) => (
                      <div 
                        key={period.id} 
                        className={`flex justify-between items-center p-3 rounded-md border cursor-pointer ${selectedPeriodId === period.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                        onClick={() => setSelectedPeriodId(period.id)}
                      >
                        <div>
                          <h4 className="font-medium">{period.title}</h4>
                          <p className="text-sm text-muted-foreground">{MONTHS[period.month - 1]} {period.year}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPeriod(period);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="hover:text-destructive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirm({ open: true, type: 'period', id: period.id, label: period.title });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Gestion des tâches - visible uniquement quand une période est sélectionnée */}
          {selectedPeriodId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Formulaire de création/édition de tâche */}
              <Card>
                <CardHeader>
                  <CardTitle>{editingTaskId ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}</CardTitle>
                  <CardDescription>
                    {editingTaskId 
                      ? 'Modifiez les informations de la tâche.' 
                      : 'Les tâches 2 (interaction) et 3 (expression d\'un point de vue) représentent les exercices oraux du TCF.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => { 
                    e.preventDefault(); 
                    editingTaskId ? updateTask(editingTaskId) : createTask(); 
                  }}>
                    <input 
                      type="hidden" 
                      name="period_id" 
                      value={selectedPeriodId} 
                    />
                    
                    <div className="space-y-2">
                      <Label htmlFor="task_number">Numéro de tâche</Label>
                      <Select 
                        value={taskForm.task_number?.toString()} 
                        onValueChange={(value) => setTaskForm(prev => ({ ...prev, task_number: parseInt(value) as 2 | 3 }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un numéro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">Tâche 2 - Interaction</SelectItem>
                          <SelectItem value="3">Tâche 3 - Point de vue</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        La tâche 1 étant l'entretien dirigé, elle n'est pas gérée dans la plateforme.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre (optionnel)</Label>
                      <Input 
                        id="title" 
                        placeholder="Tâche 2 - Interaction" 
                        value={taskForm.title || ''} 
                        onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))} 
                      />
                      <p className="text-sm text-muted-foreground">
                        Laissez vide pour utiliser le titre par défaut.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions (optionnelles)</Label>
                      <Textarea 
                        id="instructions" 
                        placeholder="Instructions pour cette tâche..." 
                        value={taskForm.instructions || ''} 
                        onChange={e => setTaskForm(prev => ({ ...prev, instructions: e.target.value }))} 
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading.saving}>
                        {loading.saving ? 'Enregistrement...' : editingTaskId ? 'Mettre à jour' : 'Créer la tâche'}
                      </Button>
                      
                      {editingTaskId && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setTaskForm({
                              period_id: selectedPeriodId,
                              task_number: 2,
                              title: '',
                              instructions: '',
                            });
                            setEditingTaskId(null);
                          }}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              {/* Liste des tâches */}
              <Card>
                <CardHeader>
                  <CardTitle>Tâches existantes</CardTitle>
                  <CardDescription>
                    Sélectionnez une tâche pour gérer ses sujets ou modifiez-la.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.tasks ? (
                    <div className="text-center py-4">Chargement des tâches...</div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Aucune tâche trouvée. Créez-en une nouvelle.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={`flex justify-between items-center p-3 rounded-md border ${selectedTaskId === task.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <div>
                            <h4 className="font-medium">{task.title || `Tâche ${task.task_number}`}</h4>
                            <p className="text-sm text-muted-foreground">
                              {task.task_number === 2 ? 'Interaction' : 'Expression d\'un point de vue'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingTask(task);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="hover:text-destructive" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirm({ open: true, type: 'task', id: task.id, label: task.title || `Tâche ${task.task_number}` });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Gestion des tâches - visible uniquement quand une période est sélectionnée */}
          {selectedPeriodId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Formulaire de création/édition de tâche */}
              <Card>
                <CardHeader>
                  <CardTitle>{editingTaskId ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}</CardTitle>
                  <CardDescription>
                    {editingTaskId 
                      ? 'Modifiez les informations de la tâche.' 
                      : 'Les tâches 2 (interaction) et 3 (expression d\'un point de vue) représentent les exercices oraux du TCF.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (!taskForm.period_id) {
                      setTaskForm(prev => ({ ...prev, period_id: selectedPeriodId }));
                    }
                    editingTaskId ? updateTask(editingTaskId) : createTask(); 
                  }}>
                    <div className="space-y-2">
                      <Label htmlFor="task_number">Numéro de tâche</Label>
                      <Select 
                        value={taskForm.task_number?.toString()} 
                        onValueChange={(value) => {
                          if (value) {
                            setTaskForm(prev => ({ ...prev, task_number: parseInt(value) as 2 | 3 }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un numéro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">Tâche 2 - Interaction</SelectItem>
                          <SelectItem value="3">Tâche 3 - Point de vue</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        La tâche 1 étant l'entretien dirigé, elle n'est pas gérée dans la plateforme.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre (optionnel)</Label>
                      <Input 
                        id="title" 
                        placeholder="Tâche 2 - Interaction" 
                        value={taskForm.title || ''} 
                        onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))} 
                      />
                      <p className="text-sm text-muted-foreground">
                        Laissez vide pour utiliser le titre par défaut.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions (optionnelles)</Label>
                      <Textarea 
                        id="instructions" 
                        placeholder="Instructions pour cette tâche..." 
                        value={taskForm.instructions || ''} 
                        onChange={e => setTaskForm(prev => ({ ...prev, instructions: e.target.value }))} 
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading.saving}>
                        {loading.saving ? 'Enregistrement...' : editingTaskId ? 'Mettre à jour' : 'Créer la tâche'}
                      </Button>
                      
                      {editingTaskId && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setTaskForm({
                              period_id: selectedPeriodId,
                              task_number: 2,
                              title: '',
                              instructions: '',
                            });
                            setEditingTaskId(null);
                          }}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              {/* Liste des tâches */}
              <Card>
                <CardHeader>
                  <CardTitle>Tâches existantes</CardTitle>
                  <CardDescription>
                    Sélectionnez une tâche pour gérer ses sujets ou modifiez-la.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.tasks ? (
                    <div className="text-center py-4">Chargement des tâches...</div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Aucune tâche trouvée. Créez-en une nouvelle.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className={`flex justify-between items-center p-3 rounded-md border ${selectedTaskId === task.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <div>
                            <h4 className="font-medium">{task.title || `Tâche ${task.task_number}`}</h4>
                            <p className="text-sm text-muted-foreground">
                              {task.task_number === 2 ? 'Interaction' : 'Expression d\'un point de vue'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingTask(task);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="hover:text-destructive" 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Onglet Sujets */}
        <TabsContent value="subjects" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Sélecteur de période et tâche */}
            <Card>
              <CardHeader>
                <CardTitle>Sélection de la période et de la tâche</CardTitle>
                <CardDescription>
                  Choisissez d'abord une période, puis une tâche pour voir ou ajouter des sujets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Période</Label>
                      <Select 
                        value={selectedPeriodId} 
                        onValueChange={setSelectedPeriodId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une période" />
                        </SelectTrigger>
                        <SelectContent>
                          {periods.map((period) => (
                            <SelectItem key={period.id} value={period.id}>
                              {period.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tâche</Label>
                      <Select 
                        value={selectedTaskId} 
                        onValueChange={setSelectedTaskId}
                        disabled={!selectedPeriodId || tasks.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une tâche" />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulaire d'ajout de sujet et liste des sujets */}
            {selectedTaskId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formulaire de création de sujet */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ajouter un nouveau sujet</CardTitle>
                    <CardDescription>
                      Créez un nouveau sujet pour la tâche sélectionnée.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createSubject(); }}>
                      <div className="space-y-2">
                        <Label htmlFor="subject_number">Numéro de sujet</Label>
                        <Input 
                          id="subject_number" 
                          type="number" 
                          min={1} 
                          value={subjectForm.subject_number} 
                          onChange={e => setSubjectForm(prev => ({ ...prev, subject_number: parseInt(e.target.value) }))} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="content">Contenu du sujet</Label>
                        <Textarea 
                          id="content" 
                          placeholder="Entrez le contenu du sujet..." 
                          rows={6}
                          value={subjectForm.content || ''} 
                          onChange={e => setSubjectForm(prev => ({ ...prev, content: e.target.value }))} 
                        />
                        <p className="text-sm text-muted-foreground">
                          Saisissez le sujet complet avec les instructions et questions éventuelles.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="question">Question</Label>
                        <Textarea
                          id="question"
                          value={subjectForm.question || ""}
                          onChange={(e) => handleQuestionChange(e.target.value)}
                          placeholder="Saisir la question principale du sujet"
                          className="min-h-[80px]"
                        />
                      </div>
                      
                      <Button type="submit" disabled={loading.saving || !((subjectForm.content ?? '').trim())}>
                        {loading.saving ? 'Création en cours...' : 'Créer le sujet'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Liste des sujets */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sujets existants</CardTitle>
                    <CardDescription>
                      {subjects.length} sujet(s) pour cette tâche
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading.subjects ? (
                      <div className="text-center py-4">Chargement des sujets...</div>
                    ) : subjects.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Aucun sujet trouvé. Créez-en un nouveau.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">N°</TableHead>
                            <TableHead>Contenu</TableHead>
                            <TableHead className="w-20">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subjects.map((subject) => (
                            <TableRow key={subject.id}>
                              <TableCell>{subject.subject_number}</TableCell>
                              <TableCell>
                                <div className="max-h-24 overflow-y-auto">
                                  {subject.content.length > 100 
                                    ? `${subject.content.substring(0, 100)}...` 
                                    : subject.content}
                                </div>
                                {subject.question && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium">Question:</p>
                                    <p className="text-sm italic">« {subject.question} »</p>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => openEditSubject(subject)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="hover:text-destructive" 
                                    onClick={() => setConfirm({ open: true, type: 'subject', id: subject.id, label: `Sujet ${subject.subject_number}` })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={confirm.open} onOpenChange={(o) => setConfirm(prev => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              {confirm.type === 'period' && `Voulez-vous supprimer définitivement la période « ${confirm.label ?? ''} » ? Toutes les tâches et sujets associés seront supprimés.`}
              {confirm.type === 'task' && `Voulez-vous supprimer définitivement la tâche « ${confirm.label ?? ''} » et tous ses sujets ?`}
              {confirm.type === 'subject' && `Voulez-vous supprimer définitivement ce sujet (${confirm.label ?? ''}) ?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm({ open: false, type: null, id: '' })}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const { type, id } = confirm;
                setConfirm(prev => ({ ...prev, open: false }));
                if (type === 'period') await deletePeriod(id);
                if (type === 'task') await deleteTask(id);
                if (type === 'subject') await deleteSubject(id);
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Period Dialog */}
      <Dialog open={!!editingPeriod} onOpenChange={(o) => { if (!o) setEditingPeriod(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la période</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mois</Label>
              <Select value={(periodEditForm.month ?? 1).toString()} onValueChange={(v) => setPeriodEditForm(prev => ({ ...prev, month: parseInt(v) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un mois" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Select value={(periodEditForm.year ?? new Date().getFullYear()).toString()} onValueChange={(v) => setPeriodEditForm(prev => ({ ...prev, year: parseInt(v) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une année" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => 2022 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label>Titre</Label>
            <Input value={periodEditForm.title ?? ''} onChange={(e) => setPeriodEditForm(prev => ({ ...prev, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={periodEditForm.description ?? ''} onChange={(e) => setPeriodEditForm(prev => ({ ...prev, description: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPeriod(null)}>Annuler</Button>
            <Button onClick={saveEditPeriod} disabled={loading.saving}>{loading.saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={!!editingSubject} onOpenChange={(o) => { if (!o) setEditingSubject(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le sujet</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Numéro</Label>
              <Input type="number" value={subjectEditForm.subject_number ?? 1} onChange={(e) => setSubjectEditForm(prev => ({ ...prev, subject_number: parseInt(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Actif</Label>
              <Select value={(subjectEditForm.is_active ?? true) ? 'true' : 'false'} onValueChange={(v) => setSubjectEditForm(prev => ({ ...prev, is_active: v === 'true' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Oui</SelectItem>
                  <SelectItem value="false">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label>Contenu</Label>
            <Textarea rows={6} value={subjectEditForm.content ?? ''} onChange={(e) => setSubjectEditForm(prev => ({ ...prev, content: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Question</Label>
            <Textarea rows={4} value={subjectEditForm.question ?? ''} onChange={(e) => setSubjectEditForm(prev => ({ ...prev, question: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSubject(null)}>Annuler</Button>
            <Button onClick={saveEditSubject} disabled={loading.saving}>{loading.saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      <Dialog open={loading.saving}>
        <DialogContent className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Traitement en cours, veuillez patienter…</span>
        </DialogContent>
      </Dialog>
    </div>
  );
}

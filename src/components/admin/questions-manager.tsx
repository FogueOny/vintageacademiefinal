"use client";

type Module = {
  id: string;
  name: string;
  description: string;
  type: string;
  type_module: string;
  slug: string;
  icon?: string;
  created_at: string;
};

import { useState, useEffect } from "react";
import { getSupabaseBrowser, ensureValidSession } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { PlusCircle } from "lucide-react";

// Composants spécifiques pour l'interface des questions 
import { QuestionFormSimple } from "./question-form-simple";
import { QuestionsList } from "./questions-list";
import { TestSeriesSelector } from "./test-series-selector";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

// Types
interface TestSeries {
  id: string;
  title: string;
  name: string; // Ajouté pour compatibilité avec TestSeriesSelector
  module_id: string;
  module_title?: string;
}

interface Question {
  id: string;
  content: string;
  points: number;
  question_number: number;
  test_series_id: string;
  has_media?: boolean;
  media_types?: string[];
}

interface QuestionOption {
  id: string;
  question_id: string;
  content: string;
  is_correct: boolean;
  label: string;
}

export default function QuestionsManager() {
  // État des données
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [questionOptions, setQuestionOptions] = useState<Array<{content: string, is_correct: boolean, label: string}>>([
    { content: '', is_correct: false, label: 'A' },
    { content: '', is_correct: false, label: 'B' },
    { content: '', is_correct: false, label: 'C' },
    { content: '', is_correct: false, label: 'D' },
  ]);
  const [allOptions, setAllOptions] = useState<Record<string, QuestionOption[]>>({});

  // État de l'UI - États de chargement séparés pour éviter les conflits
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    content: '',
    points: 1,
    question_number: 1,
  });
  
  // Client Supabase - utilise l'instance singleton importée
  
  // Chargement initial des données - une seule fois au montage
  useEffect(() => {
    fetchTestSeries();
  }, []); // Dépendances vides = exécution unique au montage
  
  // Chargement des questions quand une série est sélectionnée
  useEffect(() => {
    if (selectedSeries) {
      fetchQuestions(selectedSeries);
    }
  }, [selectedSeries]); // Seulement quand selectedSeries change
  
  // Récupération des séries de tests et de leurs modules
  async function fetchTestSeries() {
    try {
      setLoadingSeries(true);
      
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Supabase client not available');
      
      // Récupérer d'abord les séries de test
      const { data: seriesData, error: seriesError } = await supabase
        .from('test_series')
        .select('id, name, module_id');
      
      console.log('Erreur de la requête séries:', seriesError);
      console.log('Données des séries récupérées:', seriesData);
      
      if (seriesError) throw seriesError;
      
      // Récupérer tous les modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, name');
      
      console.log('Erreur de la requête modules:', modulesError);
      console.log('Données des modules récupérées:', modulesData);
      
      if (modulesError) throw modulesError;
      
      // Créer un map des modules pour un accès rapide
      const modulesMap = new Map<string, any>(modulesData.map((module: any) => [module.id, module]));
      
      // Formater les données pour correspondre à notre interface
      const formattedSeries = seriesData.map((series: any) => {
        const module = modulesMap.get(series.module_id);
        return {
          id: series.id,
          title: series.name, // On utilise name comme title pour maintenir la compatibilité
          name: series.name,  // Le champ name est correct
          module_id: series.module_id,
          module_title: module?.name || "Module sans titre"
        };
      });
      
      console.log('Séries formatées:', formattedSeries);
      
      setTestSeries(formattedSeries);
      
    } catch (error) {
      console.error("Erreur lors de la récupération des séries de test:", error);
    } finally {
      setLoadingSeries(false);
    }
  }
  
  // Récupération des questions pour une série sélectionnée
  async function fetchQuestions(seriesId: string) {
    console.log(`fetchQuestions appelé pour la série: ${seriesId}`);
    try {
      setLoadingQuestions(true);
      
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Supabase client not available');
      
      // Récupérer les questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('test_series_id', seriesId)
        .order('question_number', { ascending: true });
      
      if (questionsError) throw questionsError;
      
      // Pour chaque question, vérifier si elle a des médias
      const questionsWithMediaInfo = await Promise.all(questionsData.map(async (question: Question) => {
        const { data: mediaData } = await supabase
          .from('question_media')
          .select('media_type')
          .eq('question_id', question.id);
        
        return {
          ...question,
          has_media: mediaData && mediaData.length > 0,
          media_types: mediaData?.map((media: any) => media.media_type) || []
        };
      }));
      
      console.log(`Questions récupérées (${questionsWithMediaInfo.length}):`, questionsWithMediaInfo);
      setQuestions(questionsWithMediaInfo as Question[]);
      
      // Récupérer toutes les options pour toutes les questions
      const optionsPromises = questionsData.map((question: Question) => 
        supabase
          .from('options')
          .select('*')
          .eq('question_id', question.id)
          .order('label', { ascending: true })
      );
      
      const optionsResults = await Promise.all(optionsPromises);
      
      const optionsMap: Record<string, QuestionOption[]> = {};
      questionsData.forEach((question: Question, index: any) => {
        const optionsData = optionsResults[index].data || [];
        optionsMap[question.id] = optionsData;
      });
      
      setAllOptions(optionsMap);
      
    } catch (error) {
      console.error("Erreur lors de la récupération des questions:", error);
    } finally {
      setLoadingQuestions(false);
    }
  }
  
  // Ouverture de la boîte de dialogue pour créer ou modifier une question
  function handleOpenDialog(questionId?: string) {
    // Réinitialiser l'étape du workflow à "question" à chaque ouverture
    // setCurrentStep("question"); // Removed
    setUploading(false); // ✅ AJOUT: Réinitialiser l'état uploading
    
    if (questionId) {
      // Mode édition
      setEditingQuestion(true);
      setCurrentQuestionId(questionId);
      
      // Trouver la question à éditer
      const question = questions.find(q => q.id === questionId);
      
      if (question) {
        setFormData({
          content: question.content,
          points: question.points,
          question_number: question.question_number,
        });
        
        // Charger les options existantes
        const existingOptions = allOptions[questionId] || [];
        const formattedOptions = [
          { content: '', is_correct: false, label: 'A' },
          { content: '', is_correct: false, label: 'B' },
          { content: '', is_correct: false, label: 'C' },
          { content: '', is_correct: false, label: 'D' },
        ];
        
        existingOptions.forEach((option, index) => {
          if (index < formattedOptions.length) {
            formattedOptions[index] = {
              content: option.content,
              is_correct: option.is_correct,
              label: option.label,
            };
          }
        });
        
        setQuestionOptions(formattedOptions);
        
        // Pour la modification, aller directement aux options si on a déjà une question
        // setCurrentStep("options"); // Removed
      }
    } else {
      // Mode création
      setEditingQuestion(false);
      setCurrentQuestionId(null);
      
      // Générer un ID temporaire pour les médias
      const tempId = `temp-${Date.now()}`;
      // setTempMediaId(tempId); // Removed
      
      // Calculer automatiquement le prochain numéro de question
      const nextQuestionNumber = questions.length > 0 
        ? Math.max(...questions.map(q => q.question_number)) + 1 
        : 1;
        
      setFormData({
        content: '',
        points: 1,
        question_number: nextQuestionNumber,
      });
      setQuestionOptions([
        { content: '', is_correct: false, label: 'A' },
        { content: '', is_correct: false, label: 'B' },
        { content: '', is_correct: false, label: 'C' },
        { content: '', is_correct: false, label: 'D' },
      ]);
    }
    
    setDialogOpen(true);
  }
  
  // Fonction de soumission principale - VERSION SIMPLIFIÉE
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<boolean> {
    e.preventDefault();
    setUploading(true);
    console.log("🚀 Début de handleSubmit - Version simplifiée");
    
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Supabase client not available');
      
      // Vérification de la session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("❌ Pas de session utilisateur");
        alert("Vous devez être connecté pour créer une question.");
        return false;
      }
      
      console.log("✅ Session utilisateur valide");
      
      // Vérification du rôle admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profileError || !profileData || profileData.role !== 'admin') {
        console.error("❌ Utilisateur non admin:", profileError);
        alert("Vous devez avoir un rôle administrateur pour gérer les questions.");
        return false;
      }
      
      console.log("✅ Rôle admin vérifié");
      
      let questionId: string | null = currentQuestionId;
      
      // Mise à jour ou création de la question
      if (currentQuestionId) {
        console.log("🔄 Mise à jour de la question existante:", currentQuestionId);
        
        const { error } = await supabase
          .from('questions')
          .update({
            content: formData.content,
            points: formData.points,
            question_number: formData.question_number,
          })
          .eq('id', currentQuestionId);
        
        if (error) {
          console.error("❌ Erreur lors de la mise à jour:", error);
          throw error;
        }
        
        console.log("✅ Question mise à jour avec succès");
        
      } else {
        console.log("➕ Création d'une nouvelle question");
        
        // Validation des données avant insertion
        if (!formData.content.trim()) {
          alert("Le contenu de la question est obligatoire.");
          return false;
        }
        
        if (!selectedSeries) {
          alert("Veuillez sélectionner une série de tests.");
          return false;
        }
        
        const { data, error } = await supabase
          .from('questions')
          .insert([
            {
              content: formData.content.trim(),
              points: formData.points,
              question_number: formData.question_number,
              test_series_id: selectedSeries,
              // Valeurs par défaut pour compatibilité
              media_type: 'none',
              media_url: ''
            }
          ])
          .select();
        
        if (error) {
          console.error("❌ Erreur lors de la création:", error);
          throw error;
        }
        
        if (data && data.length > 0) {
          questionId = data[0].id;
          console.log("✅ Question créée avec succès, ID:", questionId);
          setCurrentQuestionId(questionId);
        } else {
          throw new Error("Aucune donnée retournée après création");
        }
      }
      
      // ✅ MODIFICATION: Ne plus traiter les options ici - c'est le rôle de handleSubmitOptions
      // Les options seront traitées dans l'étape 3 par handleSubmitOptions
      
      // ✅ MODIFICATION: Ne pas rafraîchir ici - ce sera fait à la fin dans handleSubmitOptions
      // pour éviter les rafraîchissements multiples
      
      console.log("✅ Question créée avec succès, navigation gérée par le composant");
      
      return true;
      
    } catch (error) {
      console.error("💥 Erreur inattendue:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      return false;
    } finally {
      console.log("🏁 Fin de handleSubmit");
      setUploading(false);
    }
  }
  
  // État pour éviter les appels multiples
  const [isSubmittingOptions, setIsSubmittingOptions] = useState(false);
  // const [isProcessing, setIsProcessing] = useState(false); // Protection supplémentaire // Removed

  // Fonction de finalisation - VERSION AMÉLIORÉE
  async function handleSubmitOptions(e: React.FormEvent<HTMLFormElement>): Promise<boolean> {
    e.preventDefault();
    console.log("🎯 DÉBUT handleSubmitOptions");
    
    // Protection renforcée contre les appels multiples
    if (isSubmittingOptions) { // Changed condition
      console.log("⚠️ handleSubmitOptions déjà en cours, ignorer l'appel");
      return false;
    }
    
    if (!currentQuestionId) {
      console.error("❌ Pas d'ID de question pour finaliser");
      return false;
    }
    
    setIsSubmittingOptions(true); // Bloquer les appels multiples
    // setIsProcessing(true); // Removed
    setUploading(true);
    console.log("🎯 Finalisation de la question:", currentQuestionId);
    console.log("🎯 Options à traiter:", questionOptions);
    
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Supabase client not available');
      console.log("🎯 Client Supabase créé");
      
      // Vérification rapide de la session
      console.log("🎯 Vérification de la session...");
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("❌ Session invalide:", userError?.message);
        alert(`Session expirée. Veuillez vous reconnecter.`);
        return false;
      }
      
      console.log("✅ Session valide:", user.id);
      
      // Optionnel : Re-sauvegarder les options si elles ont été modifiées
      if (questionOptions.some(option => option.content.trim() !== '')) {
        console.log("💾 Sauvegarde finale des options...");
        
        // Supprimer les options existantes
        console.log("🗑️ Suppression des options existantes...");
        const deleteResult = await supabase
          .from('options')
          .delete()
          .eq('question_id', currentQuestionId);
        
        console.log("🗑️ Résultat suppression:", deleteResult);
        
        if (deleteResult.error) {
          console.error("❌ Erreur lors de la suppression:", deleteResult.error);
          alert(`Erreur lors de la suppression des options: ${deleteResult.error.message}`);
          return false;
        }
        
        // Préparer les nouvelles options
        const optionsToInsert = questionOptions
          .filter(option => option.content.trim() !== '')
          .map((option, index) => ({
            question_id: currentQuestionId,
            content: option.content.trim(),
            is_correct: option.is_correct,
            label: String.fromCharCode(65 + index) // A, B, C, D
          }));
        
        console.log("📝 Options à insérer:", optionsToInsert);
        
        // Insérer les nouvelles options
        console.log("💾 Insertion des options...");
        const { data: newOptions, error: insertError } = await supabase
          .from('options')
          .insert(optionsToInsert)
          .select();
        
        if (insertError) {
          console.error("❌ Erreur lors de l'insertion des options:", insertError);
          console.error("❌ Code erreur:", insertError.code);
          console.error("❌ Message détaillé:", insertError.message);
          console.error("❌ Détails:", insertError.details);
          console.error("❌ Hint:", insertError.hint);
          console.error("❌ Données envoyées:", optionsToInsert);
          
          // Message d'erreur plus spécifique
          if (insertError.code === '42501') {
            alert("Erreur de permissions. Veuillez vérifier que vous êtes bien connecté en tant qu'administrateur.");
          } else if (insertError.code === '23505') {
            alert("Erreur: Cette option existe déjà.");
          } else {
            alert(`Erreur lors de la sauvegarde des options: ${insertError.message}`);
          }
          return false;
        }
        
        console.log("✅ Options finalisées:", newOptions);
      }
      
      // Rafraîchir la liste des questions
      if (selectedSeries) {
        console.log("🔄 Rafraîchissement final de la liste...");
        await fetchQuestions(selectedSeries);
        console.log("✅ Liste rafraîchie");
      }
      
      console.log("🎉 Question finalisée avec succès !");
      
      // Fermer le dialogue
      console.log("🚪 Fermeture du dialogue...");
      handleCloseDialog();
      
      return true;
      
    } catch (error) {
      console.error("❌ Erreur lors de la finalisation:", error);
      alert("Erreur lors de la finalisation de la question");
      return false;
    } finally {
      console.log("🏁 FIN handleSubmitOptions - setUploading(false)");
      setIsSubmittingOptions(false);
      // setIsProcessing(false); // Removed
      setUploading(false);
    }
  }
  
  // Suppression d'une question
  async function handleDeleteQuestion() {
    if (!questionToDelete) return;
    
    setDeleting(true);
    
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) throw new Error('Supabase client not available');
      
      // Vérification de la session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Vous devez être connecté pour supprimer une question.");
        setDeleting(false);
        return;
      }
      
      // Vérification du rôle admin depuis la table profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profileError || !profileData || profileData.role !== 'admin') {
        console.error("Erreur lors de la vérification du profil ou utilisateur non admin:", profileError);
        alert("Vous devez avoir un rôle administrateur pour supprimer des questions.");
        setDeleting(false);
        return;
      }
      
      // Supprimer d'abord les options associées
      const { error: optionsError } = await supabase
        .from('options')
        .delete()
        .eq('question_id', questionToDelete);
      
      if (optionsError) {
        console.error("Erreur lors de la suppression des options:", optionsError);
        throw optionsError;
      }
      
      // Supprimer les médias associés
      const { error: mediaError } = await supabase
        .from('question_media')
        .delete()
        .eq('question_id', questionToDelete);
      
      if (mediaError) {
        console.error("Erreur lors de la suppression des médias:", mediaError);
        throw mediaError;
      }
      
      // Supprimer la question
      const { error: questionError } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionToDelete);
      
      if (questionError) {
        console.error("Erreur lors de la suppression de la question:", questionError);
        throw questionError;
      }
      
      // Rafraîchir la liste des questions
      if (selectedSeries) {
        await fetchQuestions(selectedSeries);
      }
      
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      
    } catch (error) {
      console.error("Erreur lors de la suppression de la question:", error);
      alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setDeleting(false);
    }
  }

  // Fonction pour fermer la boîte de dialogue
  function handleCloseDialog() {
    setDialogOpen(false);
    // setCurrentStep("question"); // Removed
    setEditingQuestion(false);
    setCurrentQuestionId(null);
    setUploading(false); // ✅ AJOUT: Réinitialiser l'état uploading
    // setTempMediaId(''); // Removed
    setFormData({
      content: '',
      points: 1,
      question_number: 1,
    });
    setQuestionOptions([
      { content: '', is_correct: false, label: 'A' },
      { content: '', is_correct: false, label: 'B' },
      { content: '', is_correct: false, label: 'C' },
      { content: '', is_correct: false, label: 'D' },
    ]);
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur de série de tests */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Sélectionner une série de tests</h3>
        <TestSeriesSelector
          testSeries={testSeries}
          selectedSeries={selectedSeries}
          setSelectedSeries={setSelectedSeries}
        />
      </div>

      {/* Affichage des questions si une série est sélectionnée */}
      {selectedSeries && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Questions de la série</h3>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Ajouter une question
            </Button>
          </div>
          
          {loadingQuestions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Chargement des questions...</p>
            </div>
          ) : (
            <QuestionsList
              questions={questions}
              options={allOptions}
              onEditQuestion={handleOpenDialog}
              onDeleteQuestion={(questionId) => {
                setQuestionToDelete(questionId);
                setDeleteDialogOpen(true);
              }}
              isDeleteDialogOpen={deleteDialogOpen}
              questionToDelete={questionToDelete}
              setQuestionToDelete={setQuestionToDelete}
              setIsDeleteDialogOpen={setDeleteDialogOpen}
            />
          )}
        </div>
      )}

      {/* Boîte de dialogue pour créer/modifier une question */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Modifier la question" : "Créer une nouvelle question"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion 
                ? "Modifiez les détails de la question et ses options de réponse."
                : "Créez une nouvelle question avec ses options de réponse."
              }
            </DialogDescription>
          </DialogHeader>
          
          <QuestionFormSimple
            formData={formData}
            setFormData={setFormData}
            options={questionOptions}
            setOptions={setQuestionOptions}
            handleSubmit={handleSubmit}
            handleSubmitOptions={handleSubmitOptions}
            onCancel={handleCloseDialog}
            editingQuestion={editingQuestion}
            currentQuestionId={currentQuestionId}
            uploading={uploading}
            // currentStep={currentStep} // Removed
            // tempMediaId={tempMediaId} // Removed
            // setTempMediaId={setTempMediaId} // Removed
            // setCurrentStep={setCurrentStep} // Removed
          />
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de confirmation de suppression */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        setIsOpen={setDeleteDialogOpen}
        onConfirm={handleDeleteQuestion}
        itemType="cette question"
        isDeleting={deleting}
      />
    </div>
  );
}

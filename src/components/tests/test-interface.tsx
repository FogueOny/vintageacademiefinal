"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";

// Importer les composants modulaires 
import { MediaRenderer, type QuestionMedia } from "./media-renderer";
import { QuestionOptions, type Option } from "./question-options";
import { QuestionNavigator } from "./question-navigator";
import { Question, UserAnswer, TestSeriesInfo } from "./test-types";

type TestSeriesRow = {
  id: string;
  name: string;
  description: string | null;
  module_id: string;
  time_limit: number | null;
  slug: string;
};

type QuestionRow = {
  id: string;
  test_series_id: string;
  content: string | null;
  question_number: number;
  points: number | null;
  speaker_name?: string | null;
  question_text?: string | null;
  context_text?: string | null;
};

type OptionRow = {
  question_id: string;
  content: string | null;
  label: string | null;
  id: string;
  is_correct: boolean | string | number | null;
};

type QuestionMediaRow = {
  id: string;
  question_id: string;
  media_url: string | null;
  media_type: string | null;
  display_order: number | null;
  title?: string | null;
  description?: string | null;
};

type UserAnswerRow = {
  id: string;
  user_test_id: string;
  question_id: string;
  selected_option_id: string | null;
};

interface TestInterfaceProps {
  testSeriesId: string;
  moduleSlug: string;
}

export function TestInterface({ testSeriesId, moduleSlug }: TestInterfaceProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [testInfo, setTestInfo] = useState<TestSeriesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTestId, setUserTestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowser();

  // Utilitaire: ajoute un timeout aux promesses pour éviter les chargements infinis
  async function withTimeout<T>(promise: PromiseLike<T>, label: string, ms = 15000): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const guardedPromise = Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          const err = new Error(`Timeout après ${ms} ms à l'étape: ${label}`);
          console.error(err.message);
          reject(err);
        }, ms);
      }),
    ]);

    try {
      return await guardedPromise;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  // Préparer l'ID de tentative si fourni dans l'URL
  useEffect(() => {
    const attemptId = searchParams?.get('attempt');
    if (attemptId) {
      setUserTestId(attemptId);
    }
  }, [searchParams]);

  // Récupérer les données du test
  useEffect(() => {
    async function fetchTestData() {
      try {
        // Récupérer les informations du test
        console.log('[TEST] Chargement test_series...');
        const { data: testData, error: testError } = await withTimeout(
          supabase
            .from('test_series')
            .select('*')
            .eq('id', testSeriesId)
            .single(),
          'fetch test_series',
          10000
        );

        if (testError) throw testError;
        if (!testData) {
          throw new Error('Test introuvable');
        }

        const testRow = testData as TestSeriesRow;
        const normalizedTest: TestSeriesInfo = {
          id: testRow.id,
          name: testRow.name,
          description: testRow.description ?? undefined,
          module_id: testRow.module_id,
          time_limit: typeof testRow.time_limit === 'number' ? testRow.time_limit : 0,
          slug: testRow.slug,
        };

        setTestInfo(normalizedTest);
        setTimeLeft(normalizedTest.time_limit);

        // Récupérer les questions et options
        console.log('[TEST] Chargement questions...');
        const { data: questionsData, error: questionsError } = await withTimeout(
          supabase
            .from('questions')
            .select('*')
            .eq('test_series_id', testSeriesId)
            .order('question_number'),
          'fetch questions'
        );

        if (questionsError) throw questionsError;

        // Pour chaque question, récupérer ses options et médias associés
        const baseQuestions = (questionsData ?? []) as QuestionRow[];
        const questionsWithOptions = await Promise.all(
          baseQuestions.map(async (question) => {
            const { data: optionsData, error: optionsError } = await withTimeout(
              supabase
                .from('options')
                .select('*')
                .eq('question_id', question.id)
                .order('label'),
              `fetch options q=${question.id}`
            );

            if (optionsError) {
              console.error(`Erreur lors de la récupération des options pour la question ${question.id}:`, optionsError);
              throw optionsError;
            }

            let optionRows = (optionsData ?? []) as OptionRow[];
            if (optionRows.length === 0) {
              console.warn(`Aucune option trouvée pour la question ${question.id} (${question.content?.substring(0, 30)}...)`);
              const { data: optionsDataAlt } = await withTimeout(
                supabase
                  .from('options')
                  .select('*')
                  .eq('question_id', String(question.id))
                  .order('label'),
                `fetch options alt q=${question.id}`
              );
              optionRows = (optionsDataAlt ?? []) as OptionRow[];
              if (optionRows.length > 0) {
                console.log(`IMPORTANT: Options trouvées après conversion en String: ${optionRows.length}`);
              } else {
                console.warn(`Vérifiez la table 'options' dans Supabase pour cette question.`);
              }
            }

            const normalizedOptions: Option[] = optionRows.map((option) => {
              const isCorrect = (() => {
                if (option.is_correct === true) return true;
                if (typeof option.is_correct === 'string') {
                  return ['true', '1'].includes(option.is_correct.trim().toLowerCase());
                }
                if (typeof option.is_correct === 'number') {
                  return option.is_correct === 1;
                }
                return false;
              })();

              return {
                id: option.id,
                content: option.content ?? '',
                label: option.label ?? '',
                is_correct: isCorrect,
              };
            });

            const { data: mediaData, error: mediaError } = await withTimeout(
              supabase
                .from('question_media')
                .select('*')
                .eq('question_id', question.id)
                .order('display_order'),
              `fetch question_media q=${question.id}`
            );

            if (mediaError) throw mediaError;

            const normalizeMediaType = (type: string | null): QuestionMedia['media_type'] | null => {
              switch (type) {
                case 'image':
                case 'audio':
                case 'video':
                case 'document':
                  return type;
                default:
                  return null;
              }
            };

            const mediaRows = (mediaData ?? []) as QuestionMediaRow[];
            const normalizedMedia: QuestionMedia[] = mediaRows.flatMap((media) => {
              const type = normalizeMediaType(media.media_type);
              if (!type || !media.media_url) {
                return [];
              }
              return [{
                id: media.id,
                question_id: media.question_id,
                media_url: media.media_url,
                media_type: type,
                display_order: media.display_order ?? 0,
                title: media.title ?? undefined,
                description: media.description ?? undefined,
              }];
            });

            const primaryMedia = normalizedMedia.length > 0 ? normalizedMedia[0] : null;
            const contentValue = (question.content ?? '').trim();
            const isContentEmpty = contentValue.length === 0;
            const isIncomplete = isContentEmpty || normalizedOptions.length === 0;

            const baseQuestion: Question = {
              id: question.id,
              content: contentValue,
              test_series_id: question.test_series_id,
              question_number: question.question_number,
              points: question.points ?? 1,
              options: normalizedOptions,
              media_url: primaryMedia?.media_url ?? null,
              media_type: primaryMedia?.media_type ?? null,
              all_media: normalizedMedia,
              speaker_name: question.speaker_name ?? null,
              question_text: question.question_text ?? null,
              context_text: question.context_text ?? null,
              isIncomplete,
            };

            if (!isIncomplete) {
              return baseQuestion;
            }

            return {
              ...baseQuestion,
              content: baseQuestion.content || "Contenu de la question non disponible. Veuillez contacter l'administrateur.",
              options: baseQuestion.options,
            };
          })
        );

        // Log simple pour le débogage
        console.log(`Chargement terminé: ${questionsWithOptions.length} questions récupérées`);
        
        // Utiliser une logique plus stricte pour identifier les questions vraiment incomplètes
        // Une question est considérée comme incomplète si:
        // - Son contenu est complètement absent (null, undefined ou chaîne vide après nettoyage)
        // - Elle n'a aucune option valide
        const incompleteQuestions = questionsWithOptions.filter(q => {
          const contentEmpty = !q.content || q.content.trim() === '';
          const noOptions = !q.options || q.options.length === 0;
          return contentEmpty || noOptions;
        });
        
        if (incompleteQuestions.length > 0) {
          console.warn(`Attention: ${incompleteQuestions.length} question(s) incomplète(s) ou invalide(s) identifiées mais incluses dans le test`);
          incompleteQuestions.forEach((q, i) => {
            console.warn(`  Question incomplète #${i+1} (ID: ${q.id}): ${!q.content || q.content.trim() === '' ? 'Contenu manquant' : ''} ${!q.options || q.options.length === 0 ? 'Options manquantes' : ''}`);
          });
          
          // Au lieu de filtrer, nous réparons les questions incomplètes
          const repairedQuestions = questionsWithOptions.map(q => {
            // Déterminer si la question est incomplète avec la nouvelle logique
            const contentEmpty = !q.content || q.content.trim() === '';
            const noOptions = !q.options || q.options.length === 0;
            const isIncomplete = contentEmpty || noOptions;
            
            return {
              ...q,
              content: q.content || "Contenu de la question non disponible. Veuillez contacter l'administrateur.",
              options: q.options && q.options.length > 0 ? q.options : [],
              isIncomplete: isIncomplete
            };
          });
          
          setQuestions(repairedQuestions);
        } else {
          setQuestions(questionsWithOptions);
        }

        // Initialiser les réponses de l'utilisateur
        const initialUserAnswers = questionsWithOptions.map((q) => ({
          questionId: q.id,
          selectedOptionId: null,
        }));
        setUserAnswers(initialUserAnswers);

        // Ne plus créer automatiquement une tentative ici.
        // Si aucune tentative fournie dans l'URL, utiliser un ID temporaire local (mode anonyme / pré-démarrage).
        if (!userTestId) {
          setUserTestId(`temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement du test:', error);
        setLoading(false);
      }
    }

    fetchTestData();
  }, [testSeriesId, userTestId]);

  // Gérer le décompte de temps
  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!loading && timeLeft === 0) {
      // Soumettre automatiquement lorsque le temps est écoulé
      handleSubmitTest();
    }
  }, [timeLeft, loading]);

  const currentQuestion = questions[currentQuestionIndex] || { options: [] };
  const userAnswer = userAnswers[currentQuestionIndex] || { selectedOptionId: null, questionId: '' };

  const handleOptionSelect = (optionId: string) => {
    // Mettre à jour la réponse de l'utilisateur
    setUserAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = {
        ...newAnswers[currentQuestionIndex],
        selectedOptionId: optionId,
      };
      return newAnswers;
    });

    // Sauvegarder la réponse dans la base de données
    saveAnswer(currentQuestion.id, optionId);
  };

  const saveAnswer = async (questionId: string, optionId: string) => {
    // Vérifier si la question est valide et complète avant de sauvegarder
    const currentQuestionObj = questions.find(q => q.id === questionId);
    if (!currentQuestionObj || currentQuestionObj.isIncomplete || !optionId) {
      console.log(`Ignorer la sauvegarde pour la question incomplète ou invalide: ${questionId}`);
      return; // Ne pas sauvegarder pour les questions incomplètes
    }
    
    // Vérifier si nous avons un ID temporaire (pas besoin de sauvegarder dans la base)
    if (!userTestId || userTestId.startsWith('temp-')) {
      console.log(`Mode local: Sauvegarde temporaire de la réponse pour question ${questionId}`);
      // Pas besoin d'enregistrer dans la base, la réponse est déjà dans l'état local
      return;
    }

    try {
      console.log(`Sauvegarde réponse dans la base pour userTestId=${userTestId} et questionId=${questionId}`);
      
      // Vérifier si une réponse existe déjà
      const { data: existingAnswer, error: checkError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_test_id', userTestId)
        .eq('question_id', questionId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingAnswer) {
        // Mettre à jour la réponse existante
        const { error: updateError } = await supabase
          .from('user_answers')
          .update({ selected_option_id: optionId })
          .eq('id', existingAnswer.id);

        if (updateError) throw updateError;
        console.log(`Réponse mise à jour avec succès pour la question ${questionId}`);
      } else {
        // Insérer une nouvelle réponse
        const { data, error: insertError } = await supabase
          .from('user_answers')
          .insert({
            user_test_id: userTestId,
            question_id: questionId,
            selected_option_id: optionId,
          })
          .select();

        if (insertError) throw insertError;
        console.log(`Nouvelle réponse créée avec succès pour la question ${questionId}`, data);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la réponse:', error);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;

    // Filtrer les questions valides (non incomplètes)
    const validQuestions = questions.filter(q => !q.isIncomplete);
    const validQuestionIds = new Set(validQuestions.map(q => q.id));
    
    // Vérifier si toutes les questions valides ont une réponse
    const unansweredQuestions = userAnswers
      .filter((answer, index) => {
        // Ignorer les questions incomplètes dans la validation
        const questionId = questions[index]?.id;
        return validQuestionIds.has(questionId) && answer.selectedOptionId === null;
      });
    
    if (unansweredQuestions.length > 0) {
      setErrorMessage(`Attention : ${unansweredQuestions.length} question(s) valide(s) n'ont pas reçu de réponse. Veuillez répondre à toutes les questions disponibles avant de soumettre le test.`);
      
      // Trouver l'index de la première question valide sans réponse
      const firstUnansweredIndex = userAnswers.findIndex((answer, index) => {
        const questionId = questions[index]?.id;
        return validQuestionIds.has(questionId) && answer.selectedOptionId === null;
      });
      
      if (firstUnansweredIndex !== -1) {
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
      
      // Faire défiler vers le message d'erreur
      setTimeout(() => {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null); // Effacer tout message d'erreur précédent
    
    try {
      // Calculer le score
      const score = calculateScore();
      console.log(`Score calculé: ${score}`);
      
      // Vérifier si l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      // Si l'utilisateur n'est pas connecté ou si nous avons un ID temporaire
      if (!user || !userTestId || userTestId.startsWith('temp-')) {
        console.log('Utilisateur non connecté ou mode local: Redirection vers page d\'incitation à l\'inscription');
        
        // Générer un ID aléatoire pour les résultats
        const tempResultId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Stocker les résultats dans sessionStorage pour que la page de résultats puisse les récupérer
        sessionStorage.setItem('tempTestResults', JSON.stringify({
          id: tempResultId,
          score: score,
          total_questions: questions.length,
          user_answers: userAnswers,
          questions: questions,
          test_series_id: testSeriesId,
          test_info: testInfo
        }));
        
        // Rediriger vers la page d'incitation à l'inscription
        router.push(`/signup-prompt?score=${score}`);
        return;
      }
      
      // Mettre à jour le statut du test (uniquement si nous avons un ID de test valide dans la BD)
      const { error: updateError } = await supabase
        .from('user_tests')
        .update({ 
          status: 'completed',
          score: score,
          completed_at: new Date().toISOString()
        })
        .eq('id', userTestId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du test:', updateError);
        // Continuer malgré l'erreur pour permettre à l'utilisateur de voir les résultats
      }
      
      console.log(`Test complété avec succès. Redirection vers /results/${userTestId}?score=${score}`);

      // Rediriger vers la page de résultats
      router.push(`/results/${userTestId}?score=${score}`);
    } catch (error) {
      console.error('Erreur lors de la soumission du test:', error);
      setErrorMessage('Une erreur est survenue lors de la soumission du test. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    let totalPoints = 0;
    let totalQuestionsChecked = 0;
    
    // Déboguer les réponses
    console.log("=== Débogage de l'évaluation des réponses ===");
    console.log(`Nombre total de questions: ${questions.length}`);
    console.log(`Nombre total de réponses utilisateur: ${userAnswers.length}`);
    
    // Vérifier rapidement s'il y a des questions sans options
    const questionsWithoutOptions = questions.filter(q => !q.options || q.options.length === 0);
    if (questionsWithoutOptions.length > 0) {
      console.warn(`ALERTE: ${questionsWithoutOptions.length} questions n'ont pas d'options!`);
      questionsWithoutOptions.forEach(q => {
        console.warn(` - Question ${q.question_number} (ID: ${q.id}): ${q.content?.substring(0, 30) || '[contenu manquant]'}...`);
      });
    }

    userAnswers.forEach((answer, index) => {
      const question = questions[index];
      if (!question) {
        console.log(`Question à l'index ${index} n'existe pas`);
        return;
      }
      
      if (question.isIncomplete) {
        console.log(`Question #${index+1} (ID: ${question.id}) ignorée car incomplète`);
        return; // Ignorer les questions incomplètes dans le calcul du score
      }
      
      totalQuestionsChecked++;
      console.log(`Vérification Question #${index+1} (ID: ${question.id}):\n - Contenu: ${question.content && question.content.substring(0, 30)}...`);
      console.log(` - Option sélectionnée: ${answer.selectedOptionId || 'aucune'}`);
      
      if (!answer.selectedOptionId) {
        console.log(` - Aucune option sélectionnée pour cette question`);
        return;
      }
      
      // Liste toutes les options pour le débogage
      if (question.options && question.options.length > 0) {
        question.options.forEach(opt => {
          console.log(` - Option ${opt.id}: "${opt.content && opt.content.substring(0, 20)}..." [${opt.is_correct ? 'CORRECTE' : 'incorrecte'}]`);
        });
      } else {
        console.log(` - Pas d'options disponibles pour cette question`);
        return;
      }

      // Vérifier si l'option sélectionnée existe, peu importe sa correction
      // D'abord, log tous les IDs pour débogage
      console.log(` - Recherche de l'option sélectionnée: ID=${answer.selectedOptionId}`);
      if (question.options.length > 0) {
        console.log(` - Options disponibles: ${question.options.map((o: { id: string }) => o.id).join(', ')}`);
      } else {
        console.log(` - ALERTE: Aucune option disponible pour cette question! Vérifier la table 'options' dans Supabase.`);
      }
      
      // Vérifier si l'option sélectionnée est correcte (utiliser une comparaison insensible à la casse)
      // et être plus tolérant sur les types
      const selectedOption = question.options.find((opt: { id: string; content?: string; is_correct?: boolean }) => {
        // Convertir explicitement en chaîne et simplifier la comparaison 
        const optId = String(opt.id).trim().toLowerCase();
        const selectedId = String(answer.selectedOptionId).trim().toLowerCase();
        const matches = optId === selectedId;
        console.log(` - Comparaison: "${optId}" === "${selectedId}" => ${matches}`);
        return matches;
      });
      
      if (selectedOption) {
        console.log(` - Option trouvée: ${selectedOption.id}, est correcte: ${selectedOption.is_correct ? 'OUI' : 'NON'}`);
        
        // Traiter la valeur is_correct avec plus de sécurité
        let isCorrect = false;
        
        // Utiliser le cast explicite pour assurer la compatibilité TypeScript
        if (selectedOption.is_correct === true) {
          // Si c'est déjà un booléen true, c'est correct
          isCorrect = true;
        } else {
          // Vérifier les autres types possibles
          const stringValue = String(selectedOption.is_correct).toLowerCase();
          isCorrect = stringValue === 'true' || stringValue === '1';
        }
        
        console.log(` - Type de is_correct: ${typeof selectedOption.is_correct}, Valeur brute: ${String(selectedOption.is_correct)}`);
        console.log(` - Est considérée comme correcte après conversion: ${isCorrect ? 'OUI' : 'NON'}`);
        
        if (isCorrect) {
          correctAnswers++;
          const points = question.points || 1; // Par défaut 1 point si non spécifié
          totalPoints += points;
          console.log(` - CORRECTE! +${points} points (Total: ${totalPoints})`);
        } else {
          console.log(` - INCORRECTE! Pas de points ajoutés`);
        }
      } else {
        console.log(` - ERREUR: L'option sélectionnée ${answer.selectedOptionId} n'a pas été trouvée parmi les options disponibles`);
      }
    });

    console.log(`Score final: ${totalPoints} points, ${correctAnswers}/${totalQuestionsChecked} réponses correctes`);
    return totalPoints;
  };

  // Formater le temps restant
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{testInfo?.name}</h1>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div 
            id="error-message"
            className="p-4 rounded-md bg-primary/10 border border-primary/30 text-primary"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-primary" />
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Navigation entre questions */}
        <QuestionNavigator
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          onQuestionSelect={setCurrentQuestionIndex}
        />

        {/* Contenu de la question */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Question {currentQuestion.question_number}
              </h2>
              <span className="text-sm text-gray-500">
                {currentQuestion.points} points
              </span>
            </div>

            {/* Afficher les médias associés */}
            {currentQuestion.all_media && currentQuestion.all_media.length > 0 && (
              <MediaRenderer media={currentQuestion.all_media} />
            )}

            {/* Afficher un message d'avertissement si la question est incomplète */}
            {currentQuestion.isIncomplete ? (
              <div className="mt-4 p-4 rounded-md bg-primary/10 border border-primary/30 text-primary">
                <p className="font-semibold">Question incomplète</p>
                <p>Cette question ne peut pas être répondue car elle est incomplète ou manque d'options de réponse. Veuillez passer à la question suivante.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Nom de la personne qui parle (en italique) */}
                {currentQuestion.speaker_name && (
                  <div className="text-sm italic text-gray-600 font-medium">
                    {currentQuestion.speaker_name}
                  </div>
                )}
                
                {/* Contenu principal de la question */}
                <div className="text-lg">{currentQuestion.content}</div>
                
                {/* Question spécifique (en gras) */}
                {currentQuestion.question_text && (
                  <div className="text-lg font-bold text-gray-800">
                    {currentQuestion.question_text}
                  </div>
                )}
                
                {/* Texte de contexte */}
                {currentQuestion.context_text && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-primary">
                    {currentQuestion.context_text}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options de réponse */}
          {!currentQuestion.isIncomplete && currentQuestion.options && currentQuestion.options.length > 0 ? (
            <QuestionOptions
              options={currentQuestion.options}
              selectedOptionId={userAnswer.selectedOptionId}
              onOptionSelect={handleOptionSelect}
            />
          ) : currentQuestion.isIncomplete ? (
            <div className="p-4 rounded-md bg-primary/10 border-t border-primary/20 text-primary">
              <p>Aucune option de réponse n'est disponible pour cette question.</p>
            </div>
          ) : null}

          {/* Boutons de navigation */}
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Précédent
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button 
                onClick={handleSubmitTest}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Soumission en cours..." : "Terminer le test"}
              </Button>
            ) : (
              <Button 
                onClick={handleNextQuestion}
              >
                Suivant
              </Button>
            )}
          </div>
        </Card>

        {/* Barre de progression */}
        <div className="flex justify-center mt-4">
          <Progress 
            value={(currentQuestionIndex + 1) / questions.length * 100} 
            className="w-full" 
          />
        </div>
      </div>
    </div>
  );
}
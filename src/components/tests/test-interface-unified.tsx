"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUnified } from '@/hooks/use-auth-unified';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MediaRenderer, type QuestionMedia } from '@/components/tests/media-renderer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Question {
  id: string;
  content: string;
  question_number: number;
  points: number;
  has_media?: boolean;
  media_types?: string[];
  speaker_name?: string;
  question_text?: string;
  context_text?: string;
}

interface Option {
  id: string;
  question_id: string;
  label: string;
  content: string;
  is_correct: boolean;
}

interface TestInfo {
  id: string;
  name: string;
  description: string;
  time_limit: number;
  category: string;
}

interface TestInterfaceProps {
  testSeriesId: string;
  attemptId?: string;
}

export function TestInterfaceUnified({ testSeriesId, attemptId }: TestInterfaceProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUnified();
  
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<{ [questionId: string]: Option[] }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaByQuestion, setMediaByQuestion] = useState<Record<string, QuestionMedia[]>>({});
  const [stopOpen, setStopOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [timeUpOpen, setTimeUpOpen] = useState(false);
  const [stage, setStage] = useState<'answering' | 'review'>('answering');
  const [anonResult, setAnonResult] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [showAnonResult, setShowAnonResult] = useState(false);

  // Helper: retry with exponential backoff
  async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 400): Promise<T> {
    let lastErr: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (attempt < retries) {
          const wait = baseDelayMs * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
      }
    }
    throw lastErr;
  }

  // Chargement principal: requêtes parallèles + retry
  const fetchTestData = async () => {
    if (authLoading) return;
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowser();

      // Récupérer série et questions en parallèle (colonnes minimales)
      const [seriesData, questionsData] = await fetchWithRetry(async () => {
        const [seriesRes, questionsRes] = await Promise.all([
          supabase
            .from('test_series')
            .select('id,name,time_limit')
            .eq('id', testSeriesId)
            .single(),
          supabase
            .from('questions')
            .select('id,question_number,content,points,media_url,media_type,speaker_name,question_text,context_text')
            .eq('test_series_id', testSeriesId)
            .order('question_number', { ascending: true }),
        ]);
        if (seriesRes.error) throw seriesRes.error;
        if (questionsRes.error) throw questionsRes.error;
        return [seriesRes.data, questionsRes.data] as const;
      });

      setTestInfo(seriesData as unknown as TestInfo);
      setQuestions(questionsData as unknown as Question[]);

      const questionIds = (questionsData as any[]).map((q) => q.id);

      // Si aucune question, on prépare l'état et on sort proprement
      if (!questionIds || questionIds.length === 0) {
        setOptions({});
        setMediaByQuestion({});
        const durationSec = (seriesData as any)?.time_limit || 0;
        setTimeLeft(durationSec);
        return;
      }

      // Options + médias en parallèle
      const [optionsData, medias] = await fetchWithRetry(async () => {
        const [optsRes, mediaRes] = await Promise.all([
          supabase
            .from('options')
            .select('id,question_id,label,content,is_correct')
            .in('question_id', questionIds)
            .order('label', { ascending: true }),
          supabase
            .from('question_media')
            .select('id,question_id,media_type,media_url,display_order,description')
            .in('question_id', questionIds)
            .order('display_order', { ascending: true }),
        ]);
        if (optsRes.error) throw optsRes.error;
        if (mediaRes.error) throw mediaRes.error;
        return [optsRes.data, mediaRes.data] as const;
      });

      const groupedOptions: { [key: string]: Option[] } = {};
      (optionsData as any[]).forEach((opt: any) => {
        if (!groupedOptions[opt.question_id]) groupedOptions[opt.question_id] = [];
        groupedOptions[opt.question_id].push(opt as Option);
      });

      // Fallback: si certaines questions n'ont aucune option après la requête batch, tenter une requête par question
      const missingOptionQuestionIds = questionIds.filter((qid) => !groupedOptions[qid] || groupedOptions[qid].length === 0);
      if (missingOptionQuestionIds.length > 0) {
        try {
          const fetchedPerQuestion = await Promise.all(
            missingOptionQuestionIds.map(async (qid) => {
              const { data, error } = await getSupabaseBrowser()
                .from('options')
                .select('id,question_id,label,content,is_correct')
                .eq('question_id', qid)
                .order('label', { ascending: true });
              if (error) {
                console.warn('Fallback options fetch error for', qid, error.message);
                return { qid, data: [] as Option[] };
              }
              return { qid, data: (data || []) as Option[] };
            })
          );
          fetchedPerQuestion.forEach(({ qid, data }) => {
            groupedOptions[qid] = data;
          });
        } catch (e) {
          console.warn('Fallback options fetch failed:', e);
        }
      }
      setOptions(groupedOptions);

      const groupedMedia: Record<string, QuestionMedia[]> = {};
      (medias as any[]).forEach((m: any) => {
        if (!groupedMedia[m.question_id]) groupedMedia[m.question_id] = [];
        groupedMedia[m.question_id].push(m as QuestionMedia);
      });
      setMediaByQuestion(groupedMedia);

      // Timer: time_limit est en secondes
      const durationSec = (seriesData as any)?.time_limit || 0;
      setTimeLeft(durationSec);
    } catch (e: any) {
      console.error('Erreur de chargement du test:', e?.message || e, e);
      setError(e?.message || "Une erreur s'est produite lors du chargement du test. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, testSeriesId]);

  // Timer
  useEffect(() => {
    if (loading) return;
    if (timeLeft <= 0) {
      // Ouvrir le modal de fin de temps si non déjà ouvert
      setTimeUpOpen(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Ne pas auto-soumettre. Afficher un modal et guider l'utilisateur.
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  // Gérer la sélection d'une réponse
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // Passer à l'écran de révision
  const handleGoToReview = () => {
    // Validation: toutes les questions doivent être répondues
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      setValidationMessage(`Veuillez répondre à toutes les questions (${unanswered.length} manquante(s)).`);
      const firstMissingIndex = questions.findIndex(q => !answers[q.id]);
      if (firstMissingIndex !== -1) setCurrentQuestionIndex(firstMissingIndex);
      return;
    }
    setValidationMessage(null);
    setStage('review');
    // Remonter en haut de page
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitFromAnswering = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setValidationMessage(`Veuillez répondre à toutes les questions (${unanswered.length} manquante(s)).`);
      const firstMissingIndex = questions.findIndex((q) => !answers[q.id]);
      if (firstMissingIndex !== -1) {
        setCurrentQuestionIndex(firstMissingIndex);
      }
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationMessage(null);
    await handleFinalSubmit();
  };

  // Soumettre le test (après révision)
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const supabase = getSupabaseBrowser();

      // Calculer le score
      let score = 0;
      let totalPoints = 0;
      
      questions.forEach(question => {
        totalPoints += question.points || 1;
        const selectedOptionId = answers[question.id];
        const questionOptions = options[question.id] || [];
        const selectedOption = questionOptions.find(opt => opt.id === selectedOptionId);
        
        if (selectedOption?.is_correct) {
          score += question.points || 1;
        }
      });

      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

      // Sauvegarder les résultats si utilisateur connecté
      if (user && attemptId) {
        await supabase
          .from('user_tests')
          .update({
            status: 'completed',
            score: percentage,
            end_time: new Date().toISOString(),
          })
          .eq('id', attemptId);

        // Sauvegarder les réponses
        const responses = Object.entries(answers).map(([questionId, optionId]) => ({
          user_test_id: attemptId,
          question_id: questionId,
          selected_option_id: optionId,
        }));

        if (responses.length > 0) {
          await supabase.from('user_answers').insert(responses);
        }
      }

      // Rediriger vers les résultats
      if (attemptId) {
        router.push(`/results/${attemptId}`);
      } else {
        setAnonResult({ score, total: totalPoints, percentage });
        setShowAnonResult(true);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      alert('Erreur lors de la sauvegarde. Vos réponses ont été perdues.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation entre questions
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Arrêter le test (confirmé via modal)
  const handleStopTest = async () => {
    try {
      const supabase = getSupabaseBrowser();
      if (user && attemptId) {
        await supabase
          .from('user_tests')
          .update({ status: 'abandoned', completed_at: new Date().toISOString() })
          .eq('id', attemptId);
      }
    } catch (e) {
      console.warn('Erreur lors de l\'abandon du test:', e);
    } finally {
      setStopOpen(false);
      router.push(user ? '/dashboard' : '/');
    }
  };

  // Formatage du temps
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // États de chargement et d'erreur
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="rounded-xl animate-pulse">
          <CardHeader>
            <CardTitle>Chargement du test…</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <p className="text-sm text-gray-600 mb-4">Vérifiez votre connexion, puis relancez.</p>
            <Button onClick={fetchTestData} variant="outline">Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testInfo || questions.length === 0) {
    return (
      <div className="container py-10">
        <div className="text-center py-20">
          <p className="text-lg text-gray-600">Aucune question disponible pour ce test.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentOptions = currentQuestion ? (options[currentQuestion.id] || []) : [];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const progress = stage === 'answering' ? (((currentQuestionIndex + 1) / questions.length) * 100) : 100;
  const currentMediaCount = currentQuestion ? (mediaByQuestion[currentQuestion.id]?.length || 0) : 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const unansweredQuestions = questions.filter((q) => !answers[q.id]);
  const allQuestionsAnswered = questions.length > 0 && unansweredQuestions.length === 0;
  // Do not hide the Next button after a selection is made.
  // Historically we hid Next when there were 2+ media (to force user interaction),
  // but this blocked progression. Now, allow Next as soon as an option is selected.
  const hideNextButton = currentMediaCount >= 2 && !selectedAnswer;

  return (
    <div className="min-h-screen bg-gray-50">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="p-6 rounded-xl border bg-white shadow-lg text-center">
            <p className="text-lg font-medium mb-2">Soumission en cours…</p>
            <p className="text-sm text-gray-600">Merci de patienter, vos réponses sont en cours d'enregistrement.</p>
          </div>
        </div>
      )}
      {/* Top bar minimaliste sans navbar globale */}
      <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={user ? "/dashboard" : "/"} className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700">
              ← {user ? 'Retour au tableau de bord' : 'Retour à l\'accueil'}
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            {testInfo ? (
              <span className="hidden sm:inline">{testInfo.name} • </span>
            ) : null}
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="container py-6 max-w-4xl">
      {/* Header avec timer et progression */}
      <div className="mb-6 p-4 bg-white rounded-xl shadow-sm border">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{testInfo.name}</h1>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} sur {questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold border ${timeLeft < 300 ? 'text-red-700 border-red-200 bg-red-50' : 'text-gray-800 border-gray-200 bg-gray-50'}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-600">
              {user ? 'Connecté' : 'Mode anonyme'}
            </div>
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStopOpen(true)}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Arrêter le test
              </Button>
            </div>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Message de validation */}
        {validationMessage && (
          <div className="mt-3 p-3 rounded-md bg-orange-50 border border-orange-200 text-orange-800">
            {validationMessage}
          </div>
        )}
        {stage === 'answering' && unansweredQuestions.length > 0 && (
          <div className="mt-3 text-sm text-orange-700">
            {unansweredQuestions.length} question{unansweredQuestions.length > 1 ? 's' : ''} restante{unansweredQuestions.length > 1 ? 's' : ''} à répondre.
          </div>
        )}

        {/* Navigation entre questions (multi-lignes, tout visible) */}
        <div className="mt-4">
          <div className="p-2 border rounded-lg bg-gray-50">
            <div className="flex flex-wrap items-center gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${
                    index === currentQuestionIndex
                      ? 'bg-orange-500 text-white'
                      : answers[questions[index].id]
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                  aria-label={`Aller à la question ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Étape Révision */}
      {stage === 'review' ? (
        <Card className="mb-6 rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Révision des réponses</CardTitle>
              <Badge variant="outline">{Object.keys(answers).length} / {questions.length} répondues</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const opts = options[q.id] || [];
                const selectedId = answers[q.id];
                const selectedOpt = opts.find(o => o.id === selectedId);
                return (
                  <div key={q.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Question {idx + 1} • {q.points || 1} pt{(q.points || 1) > 1 ? 's' : ''}</div>
                        {q.speaker_name ? (
                          <p className="text-sm italic text-gray-600">{q.speaker_name}</p>
                        ) : null}
                        {q.question_text ? (
                          <p className="font-semibold">{q.question_text}</p>
                        ) : null}
                        {q.context_text ? (
                          <div className="bg-gray-50 p-2 rounded border-l-4 border-orange-500 my-2">
                            <p className="text-sm">{q.context_text}</p>
                          </div>
                        ) : null}
                        <p className="mt-2">{q.content}</p>
                        <div className="mt-2 text-sm">
                          {selectedOpt ? (
                            <span>
                              Votre réponse: <span className="font-medium">{selectedOpt.label}.</span> {selectedOpt.content}
                            </span>
                          ) : (
                            <span className="text-red-700">Non répondu</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStage('answering');
                            setCurrentQuestionIndex(idx);
                            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Modifier
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStage('answering')}>← Retour aux questions</Button>
              <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? 'Soumission...' : 'Soumettre définitivement'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Question actuelle */}
      {stage === 'answering' && currentQuestion && (
      <Card className="mb-6 rounded-xl">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">
              Question {currentQuestion.question_number}
            </CardTitle>
            <Badge variant="outline">
              {currentQuestion.points || 1} point{(currentQuestion.points || 1) > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Médias avant l'énoncé de la question */}
          {mediaByQuestion[currentQuestion.id] && mediaByQuestion[currentQuestion.id].length > 0 && (
            <div className="mb-4">
              <MediaRenderer media={mediaByQuestion[currentQuestion.id]} />
            </div>
          )}

          {/* Nom du locuteur (tests écrits) */}
          {currentQuestion.speaker_name && (
            <p className="text-sm italic text-gray-600 mb-2">
              {currentQuestion.speaker_name}
            </p>
          )}
          
          {/* Question principale */}
          {currentQuestion.question_text && (
            <p className="font-bold mb-3">
              {currentQuestion.question_text}
            </p>
          )}
          
          {/* Contexte */}
          {currentQuestion.context_text && (
            <div className="bg-gray-50 p-3 rounded border-l-4 border-orange-500 mb-4">
              <p className="text-sm">{currentQuestion.context_text}</p>
            </div>
          )}
          
          {/* Contenu principal de la question */}
          <div className="mb-4">
            <p>{currentQuestion.content}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {(options[currentQuestion.id]?.length ?? 0) === 0 && (
              <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
                Aucune option trouvée pour cette question. Vérifiez la table `options` dans la base de données.
              </div>
            )}
            {(options[currentQuestion.id] || []).map((option) => (
              <label key={option.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                answers[currentQuestion.id] === option.id ? 'border-orange-500 bg-orange-50' : 'hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name={`question_${currentQuestion.id}`}
                  checked={answers[currentQuestion.id] === option.id}
                  onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                  className="mt-1 h-4 w-4 accent-orange-600"
                />
                <div>
                  <span className="font-medium">{option.label}.</span> {option.content}
                </div>
              </label>
            ))}
          </div>

          {/* Navigation sous les options */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              disabled={currentQuestionIndex === 0}
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
            >
              ← Précédent
            </Button>
            {currentQuestionIndex < questions.length - 1 && !hideNextButton ? (
              <Button onClick={() => goToQuestion(currentQuestionIndex + 1)}>
                Suivant →
              </Button>
            ) : isLastQuestion ? (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoToReview}
                  disabled={isSubmitting}
                >
                  Réviser mes réponses
                </Button>
                <Button
                  onClick={handleSubmitFromAnswering}
                  disabled={isSubmitting || !allQuestionsAnswered}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Afficher mon résultat
                </Button>
              </div>
            ) : (
              <div />
            )}
          </div>
          {isLastQuestion && !allQuestionsAnswered && (
            <p className="mt-2 text-sm text-gray-600">
              Répondez à toutes les questions pour pouvoir afficher votre résultat.
            </p>
          )}
        </CardContent>
      </Card>
      )}

      {/* Actions basiques: en étape answering, proposer accès rapide à la révision sur la dernière question */}
      {stage === 'answering' && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {isLastQuestion && (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoToReview}
                disabled={isSubmitting}
              >
                Réviser mes réponses
              </Button>
              <Button
                onClick={handleSubmitFromAnswering}
                disabled={isSubmitting || !allQuestionsAnswered}
                className="bg-green-600 hover:bg-green-700"
              >
                Afficher mon résultat
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Résumé des réponses (floating widget centered bottom) */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="rounded-lg sm:rounded-xl border shadow-md sm:shadow-lg bg-white/90 backdrop-blur px-3 py-2 sm:px-4 sm:py-3 max-w-[90vw]">
          <h3 className="font-medium text-xs sm:text-sm mb-0.5 sm:mb-1">Progression</h3>
          <p className="text-xs sm:text-sm text-gray-700">
            {Object.keys(answers).filter((qid) => Boolean(answers[qid])).length} / {questions.length} questions répondues
          </p>
        </div>
      </div>
      </div>
      {showAnonResult && anonResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-orange-200 bg-white/95 p-6 shadow-2xl">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Test terminé ✅</h2>
              <p className="mt-2 text-sm text-gray-600">
                Score TCF : <span className="font-semibold text-orange-600">{anonResult.percentage}%</span> ({anonResult.score}/{anonResult.total} points)
              </p>
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <center><p>
                Créez un compte  pour afficher vos performances TCF et suivre vos progrès détaillés.
              </p></center>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/register" className="w-full">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Créer un compte
                  </Button>
                </Link>
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    Se connecter
                  </Button>
                </Link>
              </div>
              <Button
                variant="ghost"
                className="w-full text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowAnonResult(false);
                  setAnonResult(null);
                  router.push('/services/tcf');
                }}
              >
                Continuer sans compte
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de confirmation: Arrêter le test */}
      <AlertDialog open={stopOpen} onOpenChange={setStopOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arrêter le test ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez quitter cette épreuve. Les réponses non enregistrées seront perdues. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer le test</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleStopTest}>
              Oui, arrêter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Temps écoulé */}
      <AlertDialog open={timeUpOpen} onOpenChange={setTimeUpOpen}>
        <AlertDialogContent className="backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <AlertDialogHeader>
            <AlertDialogTitle>Temps écoulé ⏱️</AlertDialogTitle>
            <AlertDialogDescription>
              Le délai imparti pour cette épreuve est terminé. Vous pouvez revenir plus tard pour réessayer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setTimeUpOpen(false);
                router.push(user ? '/dashboard' : '/');
              }}
            >
              {user ? 'Aller au tableau de bord' : 'Retour à l\'accueil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
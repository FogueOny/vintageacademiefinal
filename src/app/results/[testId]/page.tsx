"use client";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useAuthUnified } from "@/hooks/use-auth-unified";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Award } from "lucide-react";
import { CECRLLevelIndicator } from "@/components/tests/cecrl-level-indicator";

export default function ResultsPage() {
  // Utiliser useParams pour accéder aux paramètres de route de manière sécurisée
  const params = useParams();
  const testId = params.testId as string;
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<any>(null);
  const [testSeries, setTestSeries] = useState<any>(null);
  const [userResponses, setUserResponses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUnified();
  const [detectedSkill, setDetectedSkill] = useState<"comprehension_orale" | "comprehension_ecrite">("comprehension_ecrite");

  useEffect(() => {
    async function fetchResults() {
      try {
        // Si pas authentifié, ne pas tenter d'appels protégés: afficher CTA d'inscription/accueil
        if (!user) {
          setLoading(false);
          return;
        }

        const supabase = getSupabaseBrowser();

        // Récupérer les données du test (inclure la série)
        const { data: testData, error: testError } = await supabase
          .from('user_tests')
          .select('*, test_series:test_series_id(id,name,time_limit)')
          .eq('id', testId)
          .single();

        if (testError) throw testError;

        // Vérifier propriété du test
        if (testData.user_id !== user.id) {
          router.push("/dashboard");
          return;
        }

        setTestData(testData);
        setTestSeries(testData.test_series);
        // Détecter automatiquement CO vs CE depuis le nom de la série
        try {
          const name: string = (testData?.test_series?.name || "").toLowerCase();
          if (/orale|compréhension orale|comprehension orale|co\b/.test(name)) {
            setDetectedSkill("comprehension_orale");
          } else if (/écrite|ecrite|compréhension écrite|comprehension ecrite|ce\b/.test(name)) {
            setDetectedSkill("comprehension_ecrite");
          } else {
            // défaut CE si non déterminable
            setDetectedSkill("comprehension_ecrite");
          }
        } catch (_) {}

        // Récupérer les questions du test
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_number, content, question_text, context_text, points')
          .eq('test_series_id', testData.test_series_id)
          .order('question_number');

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);

        // Récupérer les options associées
        const qids = (questionsData || []).map((q: any) => q.id);
        if (qids.length > 0) {
          const { data: optionsData, error: optionsError } = await supabase
            .from('options')
            .select('id, question_id, label, content, is_correct')
            .in('question_id', qids);
          if (optionsError) throw optionsError;
          // Attacher options aux questions côté client
          const grouped: Record<string, any[]> = {};
          (optionsData || []).forEach((o: any) => {
            if (!grouped[o.question_id]) grouped[o.question_id] = [];
            grouped[o.question_id].push(o);
          });
          setQuestions((prev) => prev.map((q: any) => ({ ...q, options: grouped[q.id] || [] })));
        }

        // Récupérer les réponses de l'utilisateur (table correcte: user_answers)
        const { data: responses, error: answersError } = await supabase
          .from('user_answers')
          .select('id, question_id, selected_option_id')
          .eq('user_test_id', testId);
        if (answersError) {
          // Si la table n'existe pas ou RLS bloque, continuer sans bloquer la page
          console.warn('Answers fetch warning:', answersError.message);
          setUserResponses([]);
        } else {
          setUserResponses(responses || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des résultats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchResults();
    }
  }, [testId, router, user, authLoading]);

  const findUserAnswer = (questionId: string) => {
    return userResponses.find(answer => answer.question_id === questionId);
  };

  const findSelectedOption = (questionId: string, optionId: string | null) => {
    if (!optionId) return null;
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return null;
    
    return question.options.find((opt: any) => opt.id === optionId);
  };

  const findCorrectOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return null;
    
    return question.options.find((opt: any) => opt.is_correct);
  };

  const calculatePercentage = (score: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((score / total) * 100);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container flex h-14 items-center justify-between">
            <Link href="/" className="text-sm font-medium text-orange-600 hover:text-orange-700">← Accueil</Link>
            <div className="text-sm text-gray-600">Chargement…</div>
          </div>
        </div>
        <div className="container max-w-4xl py-10">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-lg">Chargement des résultats…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non authentifié: proposer inscription/accueil
  if (!user && !loading && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container flex h-14 items-center justify-between">
            <Link href="/" className="text-sm font-medium text-orange-600 hover:text-orange-700">← Accueil</Link>
            <div className="text-sm text-gray-600">Résultats</div>
          </div>
        </div>
        <div className="container max-w-2xl py-16">
          <Card>
            <CardHeader>
              <CardTitle>Créez un compte pour voir vos résultats</CardTitle>
              <CardDescription>
                Inscrivez-vous gratuitement pour sauvegarder votre score, voir les réponses correctes et accéder à votre tableau de bord.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link href="/register">Créer un compte</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login">Se connecter</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/">Retour à l'accueil</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="container py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Résultats non disponibles</h2>
          <p className="mt-2 text-gray-500">
            Impossible de trouver les résultats pour ce test.
          </p>
          <Link href="/dashboard">
            <Button className="mt-6">Retour au tableau de bord</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculer le score total possible
  const totalPossiblePoints = questions.reduce((total, q) => total + q.points, 0);
  const rawPoints = Math.round((testData?.score / 100) * totalPossiblePoints);
  const normalized699 = detectedSkill === 'comprehension_ecrite' || detectedSkill === 'comprehension_orale'
    ? Math.round((rawPoints / Math.max(1, totalPossiblePoints)) * 699)
    : undefined;
  const percent = totalPossiblePoints > 0 ? Math.round((rawPoints / totalPossiblePoints) * 100) : 0;
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar minimaliste */}
      <div className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/dashboard" className="text-sm font-medium text-orange-600 hover:text-orange-700">← Retour au tableau de bord</Link>
          <div className="text-sm text-gray-600">Résultats</div>
        </div>
      </div>

      <div className="container max-w-4xl py-10">
        <h1 className="text-3xl font-bold mb-6">Résultats du test</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{testSeries?.name}</CardTitle>
            <CardDescription>
              Test complété le {new Date(testData.completed_at || testData.end_time).toLocaleDateString()} à {new Date(testData.completed_at || testData.end_time).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6">
              {/* Score amélioré avec meilleure visibilité */}
              <div className="text-center bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl shadow-md border-2 border-orange-300">
                <h3 className="text-lg font-medium mb-2 text-orange-800">Score total</h3>
                <div className="text-6xl font-bold text-orange-600 flex items-center justify-center">
                  {detectedSkill === 'comprehension_ecrite' || detectedSkill === 'comprehension_orale' ? (
                    <>
                      <span className="text-7xl mr-2">{normalized699}</span>
                      <span className="text-4xl text-orange-400 font-medium">/ 699</span>
                    </>
                  ) : (
                    <>
                      <span className="text-7xl mr-2">{rawPoints}</span>
                      <span className="text-4xl text-orange-400 font-medium">/ {totalPossiblePoints}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bannière simplifiée façon tableau général TCF lorsque CE/CO */}
        {(detectedSkill === 'comprehension_ecrite' || detectedSkill === 'comprehension_orale') && (
          <div className="mb-8">
            <div className="w-full rounded-md border bg-gray-50 px-4 py-3 text-center text-gray-800">
              Vous avez atteint <strong>{normalized699}</strong> sur <strong>699</strong> point(s), (<strong>{percent}%</strong>).
            </div>
          </div>
        )}

        {/* Niveau CECRL basé sur le score */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Évaluation du niveau linguistique ({detectedSkill === 'comprehension_orale' ? 'Compréhension Orale' : 'Compréhension Écrite'})</CardTitle>
            <CardDescription>
              Votre niveau selon l'échelle du Cadre Européen Commun de Référence pour les Langues (CECRL)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CECRLLevelIndicator
              score={(detectedSkill === 'comprehension_ecrite' || detectedSkill === 'comprehension_orale') ? normalized699 : rawPoints}
              maxScore={(detectedSkill === 'comprehension_ecrite' || detectedSkill === 'comprehension_orale') ? 699 : totalPossiblePoints}
              skill={detectedSkill}
            />
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4">Révision des questions</h2>

        <div className="space-y-4">
          {questions.map((question) => {
            const userAnswer = userResponses.find((ans) => ans.question_id === question.id);
            const hasQuestionText = typeof question?.question_text === 'string' && question.question_text.trim().length > 0;
            const hasContextText = typeof question?.context_text === 'string' && question.context_text.trim().length > 0;
            const questionPrompt = hasQuestionText ? question.question_text : question.content;

            // Vérifier si la réponse sélectionnée est correcte
            let isCorrect = false;
            if (userAnswer && userAnswer.selected_option_id) {
              const selectedOption = (question.options || []).find((opt: any) => String(opt.id) === String(userAnswer.selected_option_id));
              if (selectedOption) {
                // Traiter la valeur is_correct avec plus de sécurité
                if (selectedOption.is_correct === true) {
                  isCorrect = true;
                } else {
                  const stringValue = String(selectedOption.is_correct).toLowerCase();
                  isCorrect = stringValue === 'true' || stringValue === '1';
                }
              }
            }

            return (
              <Card key={question.id} className={`mb-4 ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Question {question.question_number}</CardTitle>
                    <div className="flex items-center">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-green-500">Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-orange-500 mr-2" />
                          <span className="text-orange-500">Incorrect</span>
                        </>
                      )}
                    </div>
                  </div>
                  {questionPrompt && (
                    <CardDescription className="whitespace-pre-wrap">{questionPrompt}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {hasContextText && (
                    <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {question.context_text}
                    </div>
                  )}
                  <div className="space-y-2">
                    {(question.options || []).map((option: any) => (
                      <div
                        key={option.id}
                        className={`p-3 rounded-md ${
                          option.is_correct
                            ? 'bg-green-50 border border-green-200'
                            : option.id === userAnswer?.selected_option_id && !option.is_correct
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="font-semibold mr-2">{option.label}.</div>
                          <div className="flex-grow">{option.content}</div>
                          {option.is_correct && (
                            <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                          )}
                          {option.id === userAnswer?.selected_option_id && !option.is_correct && (
                            <XCircle className="h-5 w-5 text-orange-500 ml-2" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!userAnswer && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-yellow-800">Vous n'avez pas répondu à cette question.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

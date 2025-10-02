"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Award } from "lucide-react";
import { CECRLLevelIndicator } from "@/components/tests/cecrl-level-indicator";

// Composant interne qui utilise useSearchParams
function TempResultsContent() {
  const searchParams = useSearchParams();
  const score = searchParams.get('score');
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // Récupérer les résultats temporaires depuis sessionStorage
      const tempResults = sessionStorage.getItem('tempTestResults');
      
      if (!tempResults) {
        setErrorMessage("Aucun résultat de test trouvé. Veuillez refaire le test.");
        setLoading(false);
        return;
      }
      
      const parsedResults = JSON.parse(tempResults);
      setTestResults(parsedResults);
      
      console.log("Résultats temporaires chargés avec succès:", parsedResults);
    } catch (error) {
      console.error("Erreur lors du chargement des résultats temporaires:", error);
      setErrorMessage("Une erreur s'est produite lors du chargement des résultats.");
    } finally {
      setLoading(false);
    }
  }, []);
  
  if (loading) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-4">Chargement des résultats...</h1>
      </div>
    );
  }
  
  if (errorMessage) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{errorMessage}</p>
          </CardContent>
          <CardFooter>
            <Link href="/tests">
              <Button>Retour aux tests</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!testResults) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Résultats non disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Les résultats de ce test ne sont pas disponibles ou ont expiré.</p>
          </CardContent>
          <CardFooter>
            <Link href="/tests">
              <Button>Retour aux tests</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Calcul des statistiques
  const totalQuestions = testResults.questions?.length || 0;
  const scoreValue = parseInt(score as string) || 0;
  const scorePercentage = totalQuestions > 0 ? (scoreValue / totalQuestions) * 100 : 0;
  
  // Déterminer le niveau CECRL basé sur le score
  let level = '';
  if (scorePercentage >= 90) level = 'C2';
  else if (scorePercentage >= 80) level = 'C1';
  else if (scorePercentage >= 70) level = 'B2';
  else if (scorePercentage >= 60) level = 'B1';
  else if (scorePercentage >= 50) level = 'A2';
  else level = 'A1';
  
  return (
    <div className="container py-10">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl mb-2">Résultats de votre test</CardTitle>
          <CardDescription>
            {testResults.test_info?.title || "Test terminé"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Score et niveau */}
          <div className="bg-orange-50 p-6 rounded-lg text-center">
            <div className="flex justify-center items-center gap-4 mb-4">
              <Award className="h-10 w-10 text-orange-600" />
              <h2 className="text-3xl font-bold">
                {scoreValue} / {totalQuestions} points
              </h2>
            </div>
            <p className="text-lg mb-2">
              Score: {scorePercentage.toFixed(1)}%
            </p>
            <div className="inline-block">
              <CECRLLevelIndicator level={level} />
            </div>
          </div>
          
          {/* Message basé sur le score */}
          <div className="text-center p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">Évaluation</h3>
            <p>
              {scorePercentage >= 70 ? (
                "Félicitations pour cette excellente performance! Votre maîtrise du français est très bonne."
              ) : scorePercentage >= 50 ? (
                "Bon travail! Vous avez une bonne compréhension du français mais certains points peuvent encore être améliorés."
              ) : (
                "Continuez vos efforts! Avec de la pratique, vous pourrez améliorer votre niveau de français."
              )}
            </p>
          </div>
          
          {testResults.questions && testResults.questions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Détail des questions</h3>
              <div className="space-y-6">
                {testResults.questions.map((question: any, index: number) => {
                  const userAnswer = testResults.user_answers.find(
                    (a: any) => a.questionId === question.id
                  );
                  
                  const selectedOption = question.options?.find(
                    (opt: any) => opt.id === userAnswer?.selectedOptionId
                  );
                  
                  const correctOption = question.options?.find(
                    (opt: any) => opt.is_correct
                  );
                  
                  const isCorrect = selectedOption?.is_correct || false;
                  
                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <span className="font-medium">{index + 1}.</span>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium">{question.content}</p>
                            {isCorrect ? (
                              <CheckCircle className="h-6 w-6 text-green-600 ml-2" />
                            ) : (
                              <XCircle className="h-6 w-6 text-orange-600 ml-2" />
                            )}
                          </div>
                          
                          {/* Afficher la réponse choisie */}
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">Votre réponse:</p>
                            <p className={`${isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                              {selectedOption?.content || "Aucune réponse"}
                            </p>
                          </div>
                          
                          {/* Afficher la réponse correcte uniquement si la réponse est incorrecte */}
                          {!isCorrect && correctOption && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500">Réponse correcte:</p>
                              <p className="text-green-600">{correctOption.content}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4">
          <Link href="/tests">
            <Button>Retour aux tests</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Accueil</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

// Composant principal qui utilise Suspense pour wrapper le contenu
export default function TempResultsPage() {
  return (
    <Suspense fallback={<div className="container py-12 text-center">Chargement des résultats...</div>}>
      <TempResultsContent />
    </Suspense>
  );
}

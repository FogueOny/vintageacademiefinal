"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TestDebugProps {
  testSeriesId: string;
  moduleSlug: string;
}

export function TestDebug({ testSeriesId, moduleSlug }: TestDebugProps) {
  const [testInfo, setTestInfo] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStructure, setDbStructure] = useState<any | null>(null);

  useEffect(() => {
    async function fetchTestData() {
      try {
        const supabase = getSupabaseBrowser();
        console.log(`TestDebug - Chargement du test avec ID=${testSeriesId} (${typeof testSeriesId}) et moduleSlug=${moduleSlug}`);

        // Récupérer les informations du test
        const { data: testData, error: testError } = await supabase
          .from('test_series')
          .select('*')
          .eq('id', testSeriesId)
          .single();

        if (testError) {
          console.error("Erreur test_series:", testError);
          setError(`Erreur lors de la récupération du test: ${testError.message}`);
          
          // Essayer avec la table 'tests' au cas où
          console.log("Tentative avec la table 'tests'...");
          const { data: altTestData, error: altTestError } = await supabase
            .from('tests')
            .select('*')
            .eq('id', testSeriesId)
            .single();
            
          if (altTestError) {
            console.error("Erreur tests:", altTestError);
            return;
          } else {
            setTestInfo(altTestData);
            console.log("Test trouvé dans la table 'tests':", altTestData);
          }
        } else {
          setTestInfo(testData);
          console.log("Test trouvé dans la table 'test_series':", testData);
        }
        
        // Analyser la structure de la base de données
        const tableNames = ['questions', 'options', 'question_media', 'tests', 'test_series', 'modules'];
        const dbInfo: any = {};
        
        for (const table of tableNames) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
            
          if (error) {
            console.error(`Erreur lors de l'accès à la table ${table}:`, error);
            dbInfo[table] = { error: error.message };
          } else {
            const count = data?.length || 0;
            const sample = data && data.length > 0 ? data[0] : null;
            const columns = sample ? Object.keys(sample) : [];
            
            dbInfo[table] = { 
              exists: true, 
              count, 
              columns,
              sample
            };
            
            console.log(`Table ${table}: ${count} enregistrements trouvés`);
            if (sample) {
              console.log(`Colonnes de ${table}:`, columns);
            }
          }
        }
        
        setDbStructure(dbInfo);
        
        // Essayer de récupérer les questions liées au test
        console.log("Tentative de récupération des questions...");
        
        // D'abord, essayer avec test_series_id (structure attendue)
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('test_series_id', testSeriesId)
          .order('question_number');
          
        if (questionsError) {
          console.error("Erreur questions avec test_series_id:", questionsError);
          
          // Essayer avec test_id
          const { data: altQuestionsData, error: altQuestionsError } = await supabase
            .from('questions')
            .select('*')
            .eq('test_id', testSeriesId)
            .order('question_number');
            
          if (altQuestionsError) {
            console.error("Erreur questions avec test_id:", altQuestionsError);
          } else if (altQuestionsData && altQuestionsData.length > 0) {
            console.log(`${altQuestionsData.length} questions trouvées avec test_id:`, altQuestionsData);
            setQuestions(altQuestionsData);
          } else {
            console.warn("Aucune question trouvée avec test_id");
          }
        } else if (questionsData && questionsData.length > 0) {
          console.log(`${questionsData.length} questions trouvées avec test_series_id:`, questionsData);
          setQuestions(questionsData);
        } else {
          console.warn("Aucune question trouvée avec test_series_id");
        }
      } catch (error: any) {
        console.error("Erreur globale:", error);
        setError(`Erreur: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchTestData();
  }, [testSeriesId, moduleSlug]);

  if (loading) {
    return <div className="p-8 text-center">Analyse de la structure de données en cours...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold">Débogage du Test</h2>
      
      {error && (
        <Card>
          <CardContent className="p-4 bg-orange-50 text-orange-600">
            {error}
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold mb-2">Paramètres reçus:</h3>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify({ testSeriesId, moduleSlug }, null, 2)}
          </pre>
        </CardContent>
      </Card>
      
      {testInfo && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">Informations du test:</h3>
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(testInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-bold mb-2">Questions ({questions.length}):</h3>
          {questions.length > 0 ? (
            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(questions.slice(0, 2), null, 2)}
              {questions.length > 2 ? "... (plus d'éléments disponibles)" : ""}
            </pre>
          ) : (
            <p className="text-amber-600">Aucune question trouvée pour ce test.</p>
          )}
        </CardContent>
      </Card>
      
      {dbStructure && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">Structure de la base de données:</h3>
            <div className="space-y-4">
              {Object.keys(dbStructure).map(table => (
                <div key={table} className="bg-gray-100 p-2 rounded">
                  <h4 className="font-medium">{table}:</h4>
                  {dbStructure[table].error ? (
                    <p className="text-orange-500">{dbStructure[table].error}</p>
                  ) : (
                    <div>
                      <p>{dbStructure[table].count} enregistrements trouvés</p>
                      <p>Colonnes: {dbStructure[table].columns?.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600">
        Rafraîchir
      </Button>
    </div>
  );
}

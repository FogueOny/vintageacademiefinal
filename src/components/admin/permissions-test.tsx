'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestResult {
  operation: string;
  table: string;
  success: boolean;
  error?: string;
}

export function PermissionsTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  async function testDeletePermissions() {
    setTesting(true);
    setResults([]);
    const testResults: TestResult[] = [];
    const supabase = getSupabaseBrowser();

    console.log('🔬 Début du test des permissions de suppression...');

    try {
      // Vérifier la session (déjà vérifiée dans admin-client)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Session non trouvée');
        return;
      }

      // Étape préparatoire: Trouver une série de test existante
      console.log('🔬 Recherche d\'une série de test existante...');
      const { data: testSeries, error: seriesError } = await supabase
        .from('test_series')
        .select('id')
        .limit(1)
        .single();

      if (seriesError || !testSeries) {
        console.error('❌ Aucune série de test trouvée:', seriesError);
        testResults.push({
          operation: 'PREREQUISITE',
          table: 'test_series',
          success: false,
          error: 'Aucune série de test existante trouvée. Créez d\'abord une série de test.'
        });
        setResults(testResults);
        setTesting(false);
        return;
      }

      console.log('✅ Série de test trouvée:', testSeries.id);

      // Test 1: Créer une question de test
      console.log('🔬 Test 1: Création d\'une question de test...');
      const { data: testQuestion, error: createError } = await supabase
        .from('questions')
        .insert({
          test_series_id: testSeries.id, // Utilise une vraie série de test
          question_number: 999,
          content: 'Question de test pour vérifier les permissions de suppression',
          points: 1
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Erreur création question:', createError);
        testResults.push({
          operation: 'CREATE',
          table: 'questions',
          success: false,
          error: createError.message
        });
      } else {
        console.log('✅ Question créée:', testQuestion.id);
        testResults.push({
          operation: 'CREATE',
          table: 'questions',
          success: true
        });

        // Test 2: Créer des options pour la question
        console.log('🔬 Test 2: Création d\'options de test...');
        const { error: optionsError } = await supabase
          .from('options')
          .insert([
            {
              question_id: testQuestion.id,
              content: 'Option A test',
              is_correct: true,
              label: 'A'
            },
            {
              question_id: testQuestion.id,
              content: 'Option B test',
              is_correct: false,
              label: 'B'
            }
          ]);

        if (optionsError) {
          console.error('Erreur création options:', optionsError);
          testResults.push({
            operation: 'CREATE',
            table: 'options',
            success: false,
            error: optionsError.message
          });
        } else {
          console.log('✅ Options créées');
          testResults.push({
            operation: 'CREATE',
            table: 'options',
            success: true
          });
        }

        // Test 3: Créer un média pour la question
        console.log('🔬 Test 3: Création d\'un média de test...');
        const { error: mediaError } = await supabase
          .from('question_media')
          .insert({
            question_id: testQuestion.id,
            media_url: 'https://example.com/test-media.jpg',
            media_type: 'image',
            description: 'Media de test pour vérifier les permissions'
          });

        if (mediaError) {
          console.error('Erreur création média:', mediaError);
          testResults.push({
            operation: 'CREATE',
            table: 'question_media',
            success: false,
            error: mediaError.message
          });
        } else {
          console.log('✅ Média créé');
          testResults.push({
            operation: 'CREATE',
            table: 'question_media',
            success: true
          });
        }

        // Test 4: Supprimer les médias
        console.log('🔬 Test 4: Suppression des médias...');
        const { error: deleteMediaError } = await supabase
          .from('question_media')
          .delete()
          .eq('question_id', testQuestion.id);

        if (deleteMediaError) {
          console.error('❌ Erreur suppression média:', deleteMediaError);
        } else {
          console.log('✅ Média supprimé');
        }

        testResults.push({
          operation: 'DELETE',
          table: 'question_media',
          success: !deleteMediaError,
          error: deleteMediaError?.message
        });

        // Test 5: Supprimer les options
        console.log('🔬 Test 5: Suppression des options...');
        const { error: deleteOptionsError } = await supabase
          .from('options')
          .delete()
          .eq('question_id', testQuestion.id);

        if (deleteOptionsError) {
          console.error('❌ Erreur suppression options:', deleteOptionsError);
        } else {
          console.log('✅ Options supprimées');
        }

        testResults.push({
          operation: 'DELETE',
          table: 'options',
          success: !deleteOptionsError,
          error: deleteOptionsError?.message
        });

        // Test 6: Supprimer la question
        console.log('🔬 Test 6: Suppression de la question...');
        const { error: deleteQuestionError } = await supabase
          .from('questions')
          .delete()
          .eq('id', testQuestion.id);

        if (deleteQuestionError) {
          console.error('❌ Erreur suppression question:', deleteQuestionError);
        } else {
          console.log('✅ Question supprimée');
        }

        testResults.push({
          operation: 'DELETE',
          table: 'questions',
          success: !deleteQuestionError,
          error: deleteQuestionError?.message
        });
      }
    } catch (error) {
      console.error('Erreur générale lors des tests:', error);
      testResults.push({
        operation: 'ERROR',
        table: 'general',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }

    console.log('🔬 Tests terminés, résultats:', testResults);
    setResults(testResults);
    setTesting(false);
  }

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test des Permissions de Suppression</CardTitle>
          <CardDescription>
            Testez si les permissions de suppression fonctionnent correctement pour les questions, options et médias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testDeletePermissions} 
            disabled={testing}
            className="w-full"
          >
            {testing ? 'Test en cours...' : 'Lancer le test des permissions'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats des Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getStatusIcon(result.success)}</span>
                      <span className="font-medium">
                        {result.operation} sur {result.table}
                      </span>
                    </div>
                    <span className={`text-sm ${getStatusColor(result.success)}`}>
                      {result.success ? 'Succès' : 'Échec'}
                    </span>
                  </div>
                  {result.error && (
                    <div className="mt-2 text-sm text-red-600">
                      <strong>Erreur:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Alert className="mt-6">
              <AlertDescription>
                <strong>Interprétation des résultats:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Si tous les tests sont ✅, les permissions sont correctement configurées</li>
                  <li>• Si les CREATE sont ✅ mais les DELETE sont ❌, il faut appliquer le script SQL de correction</li>
                  <li>• Si les CREATE sont ❌, il y a un problème avec les permissions de base</li>
                  <li>• Si le PREREQUISITE échoue, créez d'abord un module et une série de test</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Script SQL de Correction</CardTitle>
          <CardDescription>
            Si les tests de suppression échouent, appliquez ce script dans Supabase SQL Editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded text-sm">
            <p><strong>Fichier:</strong> <code>supabase/fix_admin_delete_policies.sql</code></p>
            <p className="mt-2">
              Copiez le contenu de ce fichier et exécutez-le dans Supabase Dashboard → SQL Editor
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
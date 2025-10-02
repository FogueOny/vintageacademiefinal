"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function TestDbPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabase = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      const supabase = getSupabaseBrowser();
      addResult("🔍 Début du test de base de données...");

      // Test 1: Utilisateur connecté
      addResult("1. 🔐 Test utilisateur connecté...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        addResult(`❌ Erreur getUser: ${userError.message}`);
        return;
      }
      
      if (!user) {
        addResult("❌ Aucun utilisateur connecté");
        return;
      }
      
      addResult(`✅ Utilisateur connecté: ${user.email}`);

      // Test 2: Profil utilisateur
      addResult("2. 👤 Test profil utilisateur...");
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        addResult(`❌ Erreur profil: ${profileError.message}`);
        addResult(`   Code: ${profileError.code}`);
        addResult(`   Détails: ${profileError.details || 'Aucun détail'}`);
        addResult(`   Hint: ${profileError.hint || 'Aucun hint'}`);
      } else {
        addResult(`✅ Profil trouvé: ${profile.email} (rôle: ${profile.role})`);
      }

      // Test 3: Permissions sur les tables
      addResult("3. 📊 Test permissions tables...");
      const tables = ['modules', 'test_series', 'questions', 'options'];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1);
          if (error) {
            addResult(`❌ Table ${table}: ${error.message}`);
          } else {
            addResult(`✅ Table ${table}: ${data?.length || 0} résultats`);
          }
        } catch (err) {
          addResult(`❌ Table ${table}: erreur inattendue`);
        }
      }

      // Test 4: Test création question (si admin)
      if (profile?.role === 'admin') {
        addResult("4. 🔑 Test permissions admin...");
        
        // Récupérer une série de test
        const { data: testSeries, error: seriesError } = await supabase
          .from('test_series')
          .select('id')
          .limit(1);
          
        if (seriesError) {
          addResult(`❌ Erreur récupération test_series: ${seriesError.message}`);
        } else if (testSeries && testSeries.length > 0) {
          // Test création question
          const { data: question, error: questionError } = await supabase
            .from('questions')
            .insert({
              content: 'Question de test - À SUPPRIMER',
              points: 1,
              question_number: 9999,
              test_series_id: testSeries[0].id
            })
            .select()
            .single();
            
          if (questionError) {
            addResult(`❌ Création question: ${questionError.message}`);
            addResult(`   Code: ${questionError.code}`);
            addResult(`   Détails: ${questionError.details || 'Aucun détail'}`);
          } else {
            addResult(`✅ Création question: succès (ID: ${question.id})`);
            
            // Test création options
            const { error: optionsError } = await supabase
              .from('options')
              .insert([
                {
                  content: 'Option A test',
                  is_correct: true,
                  label: 'A',
                  question_id: question.id
                },
                {
                  content: 'Option B test',
                  is_correct: false,
                  label: 'B',
                  question_id: question.id
                }
              ]);
              
            if (optionsError) {
              addResult(`❌ Création options: ${optionsError.message}`);
            } else {
              addResult(`✅ Création options: succès`);
            }
            
            // Nettoyer - supprimer la question de test
            await supabase.from('questions').delete().eq('id', question.id);
            addResult(`🧹 Question de test supprimée`);
          }
        }
      }

      addResult("✅ Test terminé avec succès !");
      
    } catch (error) {
      addResult(`💥 Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Test des permissions de base de données</h1>
      
      <div className="mb-6">
        <button
          onClick={testDatabase}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? "Test en cours..." : "Lancer le test"}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Résultats du test :</h2>
        <div className="space-y-1 font-mono text-sm">
          {results.length === 0 ? (
            <p className="text-gray-500">Aucun test lancé</p>
          ) : (
            results.map((result, index) => (
              <div key={index} className="text-sm">
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 
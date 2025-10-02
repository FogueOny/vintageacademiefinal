"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export default function FixOptions() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testOptionsPermissions = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog("🔍 Test des permissions sur la table options...");

    try {
      // Test 1: Vérifier la session utilisateur
      const { data: { session }, error: sessionError } = await supabase().auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        addLog("❌ Aucune session utilisateur active");
        return;
      }
      
      addLog(`✅ Utilisateur connecté: ${session.user.email}`);
      
      // Test 2: Vérifier le rôle admin
      const { data: profile, error: profileError } = await supabase()
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        addLog(`❌ Erreur profil: ${profileError.message}`);
        return;
      }
      
      addLog(`✅ Rôle utilisateur: ${profile?.role}`);
      
      if (profile?.role !== 'admin') {
        addLog("❌ Utilisateur non admin - permissions insuffisantes");
        return;
      }
      
      // Test 3: Tenter une lecture des options
      const { data: existingOptions, error: readError } = await supabase()
        .from('options')
        .select('*')
        .limit(5);
        
      if (readError) {
        addLog(`❌ Erreur lecture options: ${readError.message}`);
      } else {
        addLog(`✅ Lecture options réussie: ${existingOptions?.length || 0} options trouvées`);
      }
      
      // Test 4: Trouver une question test
      const { data: questions, error: questionsError } = await supabase()
        .from('questions')
        .select('id, content')
        .limit(1);
        
      if (questionsError) {
        addLog(`❌ Erreur lecture questions: ${questionsError.message}`);
        return;
      }
      
      if (!questions || questions.length === 0) {
        addLog("❌ Aucune question trouvée pour tester l'insertion d'options");
        return;
      }
      
      const testQuestion = questions[0];
      addLog(`✅ Question test trouvée: ${testQuestion.id}`);
      
      // Test 5: Tenter d'insérer une option test
      const testOption = {
        id: uuidv4(),
        question_id: testQuestion.id,
        content: "Option test " + Date.now(),
        is_correct: false,
        label: "TEST"
      };
      
      addLog("🧪 Test d'insertion d'une option...");
      
      const { data: insertedOption, error: insertError } = await supabase()
        .from('options')
        .insert(testOption)
        .select();
        
      if (insertError) {
        addLog(`❌ ERREUR INSERTION: ${insertError.message}`);
        addLog(`Code d'erreur: ${insertError.code}`);
        addLog(`Détails: ${insertError.details}`);
      } else {
        addLog(`✅ Insertion réussie: ${JSON.stringify(insertedOption)}`);
        
        // Nettoyer l'option test
        await supabase()
          .from('options')
          .delete()
          .eq('id', testOption.id);
        addLog("🧹 Option test supprimée");
      }
      
    } catch (error: any) {
      addLog(`❌ Erreur inattendue: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const fixOptions = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog("🚀 Début de la correction des options manquantes...");

    try {
      // Récupérer toutes les questions
      const { data: questions, error: questionsError } = await supabase()
        .from('questions')
        .select('*')
        .order('question_number');

      if (questionsError) throw questionsError;

      addLog(`📊 ${questions?.length || 0} questions trouvées`);

      // Pour chaque question, vérifier si elle a des options
      for (const question of questions || []) {
        const { data: options, error: optionsError } = await supabase()
          .from('options')
          .select('*')
          .eq('question_id', question.id);
          
        if (optionsError) throw optionsError;
        
        if (!options || options.length === 0) {
          addLog(`❌ Question ${question.question_number} (ID: ${question.id}) n'a pas d'options. Ajout en cours...`);
          
          // Créer 4 options par défaut (A, B, C, D) avec C comme réponse correcte
          const defaultOptions = [
            {
              id: uuidv4(),
              question_id: question.id,
              label: "A",
              content: "Option A",
              is_correct: false
            },
            {
              id: uuidv4(),
              question_id: question.id,
              label: "B",
              content: "Option B",
              is_correct: false
            },
            {
              id: uuidv4(),
              question_id: question.id,
              label: "C",
              content: "Option C (Correcte)",
              is_correct: true
            },
            {
              id: uuidv4(),
              question_id: question.id,
              label: "D",
              content: "Option D",
              is_correct: false
            }
          ];
          
          // Insérer les options dans la base de données
          const { error: insertError } = await supabase()
            .from('options')
            .insert(defaultOptions);
            
          if (insertError) {
            addLog(`❌ ERREUR d'insertion pour la question ${question.id}: ${insertError.message}`);
            addLog(`Code: ${insertError.code}, Détails: ${insertError.details}`);
          } else {
            addLog(`✅ Options créées avec succès pour la question ${question.question_number}`);
          }
        } else {
          addLog(`✅ Question ${question.question_number} a déjà ${options.length} options. Ignorée.`);
        }
      }

      addLog("✨ Processus de correction terminé!");

    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔧 Correction des Options Manquantes</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testOptionsPermissions}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          🧪 Tester les permissions options
        </button>
        
        <button
          onClick={fixOptions}
          disabled={isRunning}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 ml-2"
        >
          {isRunning ? "⏳ En cours..." : "🔧 Corriger les options manquantes"}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">📋 Logs:</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500">Aucun log pour le moment</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

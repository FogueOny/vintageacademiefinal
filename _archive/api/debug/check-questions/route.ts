import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialiser le client Supabase avec la clé de service pour ignorer les RLS policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Utiliser la clé de service pour contourner les politiques RLS
// Note: Ceci n'est pas idéal en production, mais c'est utile pour le débogage
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Ajouter un commentaire sur le problème d'accès possible
// Si cette API ne retourne pas de données mais que vous en voyez dans l'interface Supabase,
// c'est probablement dû aux politiques d'accès (RLS) dans Supabase.

export async function GET(request: Request) {
  try {
    // Récupérer les paramètres de requête
    const url = new URL(request.url);
    const testSeriesId = url.searchParams.get('testSeriesId');
    
    // Préparer l'objet de réponse
    const response: {
      test?: any;
      questions: any[];
      questionMedia: any[];
      options: any[];
      tableStructure: {
        [key: string]: {
          exists: boolean;
          columns?: string[];
          error?: string;
        };
      };
    } = {
      questions: [],
      questionMedia: [],
      options: [],
      tableStructure: {}
    };

    // 1. Vérifier les informations du test si un ID est fourni
    if (testSeriesId) {
      const { data: test, error: testError } = await supabase
        .from('test_series')
        .select('*')
        .eq('id', testSeriesId)
        .single();
      
      if (testError) {
        response.tableStructure['test_series'] = {
          exists: false,
          error: testError.message
        };
      } else {
        response.test = test;
        response.tableStructure['test_series'] = { exists: true };
      }
    }

    // 2. Vérifier l'existence et la structure de la table questions
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .limit(testSeriesId ? 100 : 5);
      
      if (questionsError) {
        response.tableStructure['questions'] = {
          exists: false,
          error: questionsError.message
        };
      } else {
        response.tableStructure['questions'] = { exists: true };
        
        // Si des questions sont trouvées, récupérer les colonnes
        if (questionsData && questionsData.length > 0) {
          response.tableStructure['questions'].columns = Object.keys(questionsData[0]);
          
          // Si un testSeriesId est fourni, filtrer les questions correspondantes
          if (testSeriesId) {
            const { data: testQuestions, error: testQuestionsError } = await supabase
              .from('questions')
              .select('*')
              .eq('test_series_id', testSeriesId);
            
            if (!testQuestionsError && testQuestions) {
              response.questions = testQuestions;
            }
          } else {
            response.questions = questionsData.slice(0, 5); // Limiter à 5 pour l'aperçu
          }
        }
      }
    } catch (error: any) {
      response.tableStructure['questions'] = {
        exists: false,
        error: error.message
      };
    }

    // 3. Vérifier l'existence et la structure de la table question_media
    try {
      const { data: mediaData, error: mediaError } = await supabase
        .from('question_media')
        .select('*')
        .limit(testSeriesId ? 100 : 5);
      
      if (mediaError) {
        response.tableStructure['question_media'] = {
          exists: false,
          error: mediaError.message
        };
      } else {
        response.tableStructure['question_media'] = { exists: true };
        
        // Si des médias sont trouvés, récupérer les colonnes
        if (mediaData && mediaData.length > 0) {
          response.tableStructure['question_media'].columns = Object.keys(mediaData[0]);
          
          // Si un testSeriesId est fourni, on doit trouver les médias liés aux questions de ce test
          if (testSeriesId && response.questions.length > 0) {
            const questionIds = response.questions.map(q => q.id);
            const { data: testMedia, error: testMediaError } = await supabase
              .from('question_media')
              .select('*')
              .in('question_id', questionIds);
            
            if (!testMediaError && testMedia) {
              response.questionMedia = testMedia;
            }
          } else {
            response.questionMedia = mediaData.slice(0, 5); // Limiter à 5 pour l'aperçu
          }
        }
      }
    } catch (error: any) {
      response.tableStructure['question_media'] = {
        exists: false,
        error: error.message
      };
    }
    
    // 4. Vérifier l'existence et la structure de la table options
    try {
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .limit(testSeriesId ? 100 : 5);
      
      if (optionsError) {
        response.tableStructure['options'] = {
          exists: false,
          error: optionsError.message
        };
      } else {
        response.tableStructure['options'] = { exists: true };
        
        // Si des options sont trouvées, récupérer les colonnes
        if (optionsData && optionsData.length > 0) {
          response.tableStructure['options'].columns = Object.keys(optionsData[0]);
          
          // Si un testSeriesId est fourni et qu'on a des questions, récupérer les options associées
          if (testSeriesId && response.questions.length > 0) {
            const questionIds = response.questions.map(q => q.id);
            const { data: testOptions, error: testOptionsError } = await supabase
              .from('options')
              .select('*')
              .in('question_id', questionIds);
            
            if (!testOptionsError && testOptions) {
              response.options = testOptions;
            }
          } else {
            response.options = optionsData.slice(0, 5); // Limiter à 5 pour l'aperçu
          }
        }
      }
    } catch (error: any) {
      response.tableStructure['options'] = {
        exists: false,
        error: error.message
      };
    }

    // 5. Vérifier les relations entre tables
    if (testSeriesId && response.questions.length > 0) {
      // Analyser la relation entre questions et médias
      const questionIds = response.questions.map(q => q.id);
      const { data: linkedMedia, error: mediaRelationError } = await supabase
        .from('question_media')
        .select('*')
        .in('question_id', questionIds);
      
      if (!mediaRelationError) {
        response.tableStructure['relations'] = {
          exists: true,
          columns: [`${response.questions.length} questions liées à ${linkedMedia ? linkedMedia.length : 0} médias`]
        };
      }
    }

    return NextResponse.json(response);
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

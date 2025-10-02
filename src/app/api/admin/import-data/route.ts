import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import slugify from 'slugify';
import * as xlsx from 'xlsx';
import type { Database } from './types';

// Configuration pour les fichiers volumineux
export const config = {
  api: {
    bodyParser: false, // Désactiver le parser par défaut pour les fichiers volumineux
    responseLimit: '10mb',
  },
};

export async function POST(req: NextRequest) {
  try {
    console.log('Démarrage du traitement de la requête d\'importation');
    
    // Logs complets des en-têtes pour diagnostic
    console.log('En-têtes reçus:', {
      authorization: req.headers.get('authorization'),
      contentType: req.headers.get('content-type'),
      cookie: req.headers.get('cookie')
    });
    
    // Extraire le token d'authentification de l'en-tête Authorization
    const authHeader = req.headers.get('authorization');
    console.log('En-tête Authorization brut:', authHeader);
    
    if (!authHeader) {
      console.error('En-tête Authorization complètement manquant');
      return NextResponse.json({ error: 'Non autorisé: aucun en-tête Authorization' }, { status: 401 });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.error('En-tête Authorization mal formaté:', authHeader.substring(0, 20));
      return NextResponse.json({ error: 'Non autorisé: format de token incorrect (doit être Bearer)' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token || token.length < 10) {
      console.error('Token manquant ou trop court');
      return NextResponse.json({ error: 'Non autorisé: token invalide ou vide' }, { status: 401 });
    }
    
    console.log('Token d\'authentification extrait avec succès:', { 
      longueur: token.length,
      debut: token.substring(0, 10) + '...',
      fin: '...' + token.substring(token.length - 5)
    });
    
    // Création du client admin avec clé de service (pour les opérations d'import)
    const adminSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Vérification du token et récupération de l'utilisateur
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token);
    
    console.log('Vérification du token:', {
      hasUser: !!user,
      userId: user?.id || 'non trouvé',
      error: authError?.message || 'aucune erreur'
    });
    
    if (authError || !user) {
      console.error('Erreur dauthentification:', authError?.message || 'Utilisateur non trouvé');
      return NextResponse.json({ error: 'Non autorisé: token invalide' }, { status: 401 });
    }
    
    // Vérification du rôle admin
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();
    
    console.log('Vérification admin pour', user.id, ':', { 
      hasProfile: !!profile, 
      role: profile?.role || 'inconnu',
      email: profile?.email || 'inconnu',
      error: profileError?.message || 'aucune erreur'
    });
    
    if (profileError || !profile) {
      console.error('Erreur ou profil non trouvé:', profileError?.message || 'Profil non trouvé');
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    if (profile.role !== 'admin') {
      console.error(`Accès refusé: l'utilisateur ${profile.email} a le rôle ${profile.role} au lieu d'admin`);
      return NextResponse.json({ error: 'Non autorisé: droits administrateur requis' }, { status: 403 });
    }
    
    console.log(`Authentification admin réussie pour ${profile.email}`);
    
    // Lecture du formData après avoir vérifié l'authentification
    let uploadData;
    try {
      uploadData = await req.formData();
    } catch (error: any) {
      console.error('Erreur lors de la lecture du formData:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la lecture du formulaire: ' + (error.message || 'Erreur inconnue') },
        { status: 400 }
      );
    }
    
    // On utilise le client admin pour la suite des opérations
    const supabase = adminSupabase;

    // On a déjà lu le formData, pas besoin de le lire à nouveau
    // Note: le corps de la requête ne peut être lu qu'une seule fois dans Next.js
    
    const file = uploadData.get('file') as File | null;
    const type = uploadData.get('type') as string | null;
    
    if (!file || !type) {
      return NextResponse.json(
        { error: 'Fichier et type dimportation requis' },
        { status: 400 }
      );
    }
    
    console.log(`Fichier reçu: ${file.name}, taille: ${file.size} octets, type: ${file.type}`);
    
    // Vérification du type d'importation
    const validTypes = ['modules', 'series', 'questions'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Type dimportation non valide' },
        { status: 400 }
      );
    }
    
    // Lecture du fichier
    const fileBuffer = await file.arrayBuffer();
    const data = parseFileData(fileBuffer, file.name);
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée valide trouvée dans le fichier' },
        { status: 400 }
      );
    }
    
    console.log(`Début de l'importation de ${data.length} enregistrements pour le type: ${type}`);
    // Traitement des données selon le type
    let result;
    switch (type) {
      case 'modules':
        result = await importModules(data, supabase);
        break;
      case 'series':
        result = await importTestSeries(data, supabase);
        break;
      case 'questions':
        result = await importQuestions(data, supabase);
        break;
    }
    console.log('Importation terminée avec succès');
    console.log(result);
    
    return NextResponse.json({
      success: true,
      total: data.length,
      ...result
    });
    
  } catch (error: any) {
    console.error('Erreur lors de limportation:', error);
    return NextResponse.json(
      { error: error.message || 'Une erreur sest produite lors de l\'importation' },
      { status: 500 }
    );
  }
}

// Fonction pour parser une ligne CSV en gérant les guillemets
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Fin d'une valeur
      result.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Ajouter la dernière valeur
  result.push(currentValue.trim());
  return result;
}

function parseFileData(fileBuffer: ArrayBuffer, fileName: string): any[] {
  try {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    console.log(`Extension du fichier détectée: ${fileExtension}`);
    
    if (fileExtension === 'csv') {
      // Parsing CSV
      console.log('Traitement du fichier CSV...');
      const text = new TextDecoder().decode(fileBuffer);
      console.log(`Contenu du CSV (premières 100 caractères): ${text.substring(0, 100)}...`);
      
      // Découper les lignes en tenant compte des sauts de ligne dans les guillemets
      const rows: string[] = [];
      let currentRow = '';
      let inQuotes = false;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
          currentRow += char;
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
          if (currentRow.trim()) {
            rows.push(currentRow);
          }
          currentRow = '';
          // Sauter le \n après un \r (cas des CRLF)
          if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
            i++;
          }
        } else {
          currentRow += char;
        }
      }
      
      // Ajouter la dernière ligne si elle existe
      if (currentRow.trim()) {
        rows.push(currentRow);
      }
      
      console.log(`Nombre de lignes détectées: ${rows.length}`);
      if (rows.length === 0) {
        throw new Error('Aucune ligne trouvée dans le fichier CSV');
      }
      
      // Parser chaque ligne
      const headers = parseCSVLine(rows[0]);
      console.log(`En-têtes détectées: ${headers.join(', ')}`);
      
      return rows.slice(1).map((row, rowIndex) => {
        try {
          if (!row.trim()) return null;
          
          const values = parseCSVLine(row);
          const obj: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            // Nettoyer l'entête des guillemets si présents
            const cleanHeader = header.replace(/^"|"$/g, '');
            // Nettoyer la valeur des guillemets si présents
            const value = values[index] ? values[index].replace(/^"|"$/g, '') : '';
            obj[cleanHeader] = value;
          });
          
          return obj;
        } catch (error) {
          console.error(`Erreur lors du parsing de la ligne ${rowIndex + 2}:`, error);
          return null;
        }
      }).filter(Boolean) as any[];
      
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parsing Excel
      console.log('Traitement du fichier Excel...');
      try {
        const workbook = xlsx.read(fileBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        console.log(`Feuille trouvée: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
        console.log(`Nombre d'enregistrements dans Excel: ${data.length}`);
        return data;
      } catch (error: any) {
        console.error('Erreur lors du parsing Excel:', error);
        throw new Error(`Erreur lors du parsing du fichier Excel: ${error.message || 'Format invalide'}`);
      }
    } else {
      throw new Error(`Format de fichier non pris en charge: ${fileExtension}. Utilisez CSV, XLS ou XLSX.`);
    }
  } catch (error: any) {
    console.error('Erreur générale lors du parsing du fichier:', error);
    throw new Error(`Erreur lors du parsing du fichier: ${error.message || 'Erreur inconnue'}`);
  }
}

// Importation des modules
async function importModules(data: any[], supabase: any) {
  console.log(`Importation de ${data.length} modules...`);
  const results = {
    success: 0,
    errors: 0,
    logs: [] as string[]
  };
  
  for (const item of data) {
    try {
      // Valider les données obligatoires
      if (!item.name || !item.type || !item.type_module) {
        throw new Error(`Champs obligatoires manquants pour l'entrée: ${JSON.stringify(item)}`);
      }
      
      // Générer le slug si non fourni
      const slug = item.slug || slugify(item.name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
      
      const module = {
        name: item.name,
        description: item.description || '',
        type: item.type,
        type_module: item.type_module,
        icon: item.icon || null,
        slug
      };
      
      // Vérifier si le module existe déjà (par slug)
      const { data: existingModule } = await supabase
        .from('modules')
        .select('id')
        .eq('slug', slug)
        .single();
      
      let result;
      
      if (existingModule) {
        // Mise à jour
        result = await supabase
          .from('modules')
          .update(module)
          .eq('id', existingModule.id);
        
        if (result.error) throw result.error;
        results.logs.push(`Module mis à jour: ${module.name}`);
      } else {
        // Insertion
        result = await supabase
          .from('modules')
          .insert(module);
        
        if (result.error) throw result.error;
        results.logs.push(`Module créé: ${module.name}`);
      }
      
      results.success++;
      
    } catch (error: any) {
      console.error(`Erreur avec le module:`, error);
      results.errors++;
      results.logs.push(`Erreur: ${error.message}`);
    }
  }
  
  return results;
}

// Importation des séries de tests
async function importTestSeries(data: any[], supabase: any) {
  const results = {
    success: 0,
    errors: 0,
    logs: [] as string[]
  };
  
  for (const item of data) {
    try {
      // Valider les données obligatoires
      if (!item.title || !item.module_id) {
        throw new Error(`Champs obligatoires manquants pour l'entrée: ${JSON.stringify(item)}`);
      }
      
      // Générer le slug si non fourni
      const slug = item.slug || slugify(item.title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
      
      // Vérifier que le module existe
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .select('id')
        .eq('id', item.module_id)
        .single();
      
      if (moduleError || !module) {
        throw new Error(`Le module avec l'ID ${item.module_id} n'existe pas`);
      }
      
      // Construire l'objet test_series selon le schéma de base de données
      const testSeries = {
        name: item.title, // Le schéma utilise 'name' mais le CSV a 'title'
        description: item.description || '',
        module_id: item.module_id,
        time_limit: parseInt(item.time_limit) || 1800, // Convertir en entier
        slug,
        is_free: item.is_free ? (typeof item.is_free === 'string' 
          ? item.is_free.toLowerCase() === 'true' || item.is_free === '1'
          : Boolean(item.is_free)) : false
      };
      
      // Vérifier si la série existe déjà (par slug)
      const { data: existingSeries } = await supabase
        .from('test_series')
        .select('id')
        .eq('slug', slug)
        .single();
      
      let result;
      
      if (existingSeries) {
        // Mise à jour
        result = await supabase
          .from('test_series')
          .update(testSeries)
          .eq('id', existingSeries.id);
        
        if (result.error) throw result.error;
        results.logs.push(`Série mise à jour: ${testSeries.name}`);
      } else {
        // Insertion
        result = await supabase
          .from('test_series')
          .insert(testSeries);
        
        if (result.error) throw result.error;
        results.logs.push(`Série créée: ${testSeries.name}`);
      }
      
      results.success++;
      
    } catch (error: any) {
      console.error(`Erreur avec la série:`, error);
      results.errors++;
      results.logs.push(`Erreur: ${error.message}`);
    }
  }
  
  return results;
}

// Importation des questions
async function importQuestions(data: any[], supabase: any) {
  const results = {
    success: 0,
    errors: 0,
    logs: [] as string[]
  };
  
  for (const item of data) {
    try {
      // Valider les données obligatoires
      if (!item.test_series_id || !item.question_text || !item.type) {
        throw new Error(`Champs obligatoires manquants pour l'entrée: ${JSON.stringify(item)}`);
      }
      
      // Vérifier que la série de test existe
      const { data: series, error: seriesError } = await supabase
        .from('test_series')
        .select('id')
        .eq('id', item.test_series_id)
        .single();
      
      if (seriesError || !series) {
        throw new Error(`La série de test avec l'ID ${item.test_series_id} n'existe pas`);
      }
      
      // Construire l'objet question selon son type
      const question = {
        test_series_id: item.test_series_id,
        question_text: item.question_text,
        type: item.type,
        order: item.order || null,
        media_url: item.media_url || null,
        media_type: item.media_type || null,
        options: parseOptions(item)
      };
      
      // Pour les questions, on fait toujours une insertion
      // car une mise à jour serait trop complexe à gérer
      const result = await supabase
        .from('questions')
        .insert(question);
      
      if (result.error) throw result.error;
      results.logs.push(`Question créée: ${question.question_text.substring(0, 30)}...`);
      
      results.success++;
      
    } catch (error: any) {
      console.error(`Erreur avec la question:`, error);
      results.errors++;
      results.logs.push(`Erreur: ${error.message}`);
    }
  }
  
  return results;
}

// Fonction pour parser les options selon le type de question
function parseOptions(item: any) {
  const options = [];
  
  switch (item.type) {
    case 'multiple_choice':
      // Format attendu pour les options: 
      // option1:is_correct1,option2:is_correct2,...
      if (item.options) {
        const optionPairs = item.options.split(',');
        for (const pair of optionPairs) {
          const [text, isCorrect] = pair.split(':');
          if (text) {
            options.push({
              text: text.trim(),
              is_correct: isCorrect === 'true' || isCorrect === '1'
            });
          }
        }
      }
      break;
      
    case 'fill_blank':
      // Format attendu: answer1,answer2,...
      if (item.answers) {
        const answers = item.answers.split(',');
        for (const answer of answers) {
          if (answer) {
            options.push({
              text: answer.trim(),
              is_correct: true
            });
          }
        }
      }
      break;
      
    case 'matching':
      // Format attendu: left1:right1,left2:right2,...
      if (item.pairs) {
        const pairs = item.pairs.split(',');
        for (const pair of pairs) {
          const [left, right] = pair.split(':');
          if (left && right) {
            options.push({
              left_text: left.trim(),
              right_text: right.trim()
            });
          }
        }
      }
      break;
  }
  
  return options;
}

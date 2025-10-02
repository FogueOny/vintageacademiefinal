/**
 * Script pour nettoyer les buckets de stockage Supabase
 * 
 * Pour utiliser ce script:
 * 1. Installez les dépendances: npm install @supabase/supabase-js dotenv
 * 2. Créez un fichier .env avec SUPABASE_URL et SUPABASE_SERVICE_KEY
 * 3. Lancez le script: node cleanup-storage-buckets.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// URL et clé Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erreur: SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis dans un fichier .env');
  process.exit(1);
}

// Création du client Supabase avec la clé de service (pas la clé anonyme)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Liste des buckets à vider
const bucketsToClear = [
  'modules',
  'questions',
  'user-uploads',
  // Ajoutez d'autres buckets selon vos besoins
];

/**
 * Récupère tous les fichiers dans un bucket
 */
async function listFiles(bucketName) {
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .list();

  if (error) {
    console.error(`Erreur lors de la récupération des fichiers du bucket ${bucketName}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Supprime un fichier du bucket
 */
async function deleteFile(bucketName, filePath) {
  const { error } = await supabase
    .storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    console.error(`Erreur lors de la suppression de ${filePath} dans ${bucketName}:`, error);
    return false;
  }

  console.log(`✅ Fichier supprimé: ${bucketName}/${filePath}`);
  return true;
}

/**
 * Vide un bucket complet
 */
async function emptyBucket(bucketName) {
  console.log(`\n🔍 Nettoyage du bucket: ${bucketName}`);
  
  try {
    const files = await listFiles(bucketName);
    
    if (files.length === 0) {
      console.log(`Le bucket ${bucketName} est déjà vide.`);
      return;
    }
    
    console.log(`Suppression de ${files.length} fichiers du bucket ${bucketName}...`);
    
    for (const file of files) {
      await deleteFile(bucketName, file.name);
    }
    
    console.log(`✅ Bucket ${bucketName} vidé avec succès.`);
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage du bucket ${bucketName}:`, error);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Début du nettoyage des buckets de stockage Supabase...');
  
  for (const bucket of bucketsToClear) {
    await emptyBucket(bucket);
  }
  
  console.log('\n✅ Opération terminée!');
}

// Exécution du script
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

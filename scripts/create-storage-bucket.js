const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variables d\'environnement manquantes');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Définie' : 'Manquante');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Définie' : 'Manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  try {
    console.log('🔍 Vérification des buckets existants...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Erreur lors de la récupération des buckets:', listError.message);
      return;
    }
    
    console.log('📦 Buckets existants:');
    buckets.forEach(bucket => {
      console.log('  -', bucket.name, bucket.public ? '(public)' : '(privé)');
    });
    
    const questionsBucket = buckets.find(bucket => bucket.name === 'questions-media');
    
    if (questionsBucket) {
      console.log('✅ Le bucket questions-media existe déjà');
      return;
    }
    
    console.log('🚀 Création du bucket questions-media...');
    
    const { data, error } = await supabase.storage.createBucket('questions-media', {
      public: true,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp3',
        'audio/webm',
        'video/mp4',
        'video/webm',
        'video/ogg'
      ],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.log('❌ Erreur lors de la création du bucket:', error.message);
      return;
    }
    
    console.log('✅ Bucket questions-media créé avec succès!');
    
    // Vérifier la création
    const { data: newBuckets, error: verifyError } = await supabase.storage.listBuckets();
    if (!verifyError) {
      const createdBucket = newBuckets.find(bucket => bucket.name === 'questions-media');
      if (createdBucket) {
        console.log('✅ Vérification réussie - bucket accessible');
      }
    }
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

createStorageBucket(); 
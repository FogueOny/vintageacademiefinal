// Script de test pour vérifier les corrections de session
// Exécuter avec: node scripts/test-session-fix.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration similaire à celle du client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    }
  }
);

async function testSessionFix() {
  console.log('🧪 Test des corrections de session...\n');

  // Test 1: Connexion admin
  console.log('1. Test connexion admin');
  const adminEmail = 'fogueponyvictor@gmail.com';
  
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: 'testpassword123' // Remplacer par le vrai mot de passe
    });

    if (signInError) {
      console.log('❌ Erreur connexion admin:', signInError.message);
      return;
    }

    console.log('✅ Connexion admin OK');

    // Test 2: Vérifier la fonction ensureValidSession simulée
    console.log('\n2. Test validation session');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('⚠️ Erreur session:', sessionError.message);
      
      // Essayer de rafraîchir la session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.log('❌ Impossible de rafraîchir la session:', refreshError.message);
        return;
      }
      
      console.log('✅ Session rafraîchie avec succès');
    } else if (!session) {
      console.log('❌ Aucune session trouvée');
      return;
    } else {
      console.log('✅ Session valide');
      
      // Vérifier si la session expire bientôt
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;
      
      console.log(`⏰ Session expire dans ${Math.floor(timeUntilExpiry / 60)} minutes`);
      
      if (timeUntilExpiry < 300) { // 5 minutes
        console.log('⚠️ Session expire bientôt, rafraîchissement préventif...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.log('❌ Erreur rafraîchissement:', refreshError.message);
        } else {
          console.log('✅ Session rafraîchie préventivement');
        }
      }
    }

    // Test 3: Test création question (simulation)
    console.log('\n3. Test création question (simulation)');
    
    const testQuestion = {
      question_text: 'Test question avec session améliorée',
      question_number: 9998,
      points: 1,
      module_id: 1,
      temp_media_id: null
    };

    const { data: newQuestion, error: createError } = await supabase
      .from('questions')
      .insert([testQuestion])
      .select()
      .single();

    if (createError) {
      console.log('❌ Erreur création question:', createError.message);
      console.log('Code erreur:', createError.code);
    } else {
      console.log('✅ Question créée avec succès:', newQuestion.id);
      
      // Nettoyage
      await supabase.from('questions').delete().eq('id', newQuestion.id);
      console.log('✅ Question de test supprimée');
    }

    // Test 4: Test de performance de session
    console.log('\n4. Test performance session');
    
    const startTime = Date.now();
    
    for (let i = 0; i < 5; i++) {
      const { data: { session: testSession } } = await supabase.auth.getSession();
      if (!testSession) {
        console.log(`❌ Test ${i + 1}: Session perdue`);
        break;
      }
    }
    
    const endTime = Date.now();
    console.log(`✅ 5 vérifications de session en ${endTime - startTime}ms`);

    // Déconnexion
    await supabase.auth.signOut();
    console.log('✅ Déconnexion OK');

  } catch (err) {
    console.log('❌ Exception générale:', err.message);
  }

  console.log('\n🎉 Test terminé !');
}

// Fonction pour tester les timeouts
async function testSessionTimeout() {
  console.log('\n🕐 Test timeout session...');
  
  // Simuler une session qui prend du temps
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Session timeout')), 5000);
  });
  
  const sessionPromise = supabase.auth.getSession();
  
  try {
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    console.log('✅ Session récupérée avant timeout');
  } catch (error) {
    console.log('⚠️ Timeout ou erreur:', error.message);
  }
}

// Exécuter les tests
testSessionFix()
  .then(() => testSessionTimeout())
  .catch(console.error); 
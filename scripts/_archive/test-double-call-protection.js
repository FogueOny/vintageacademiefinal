// Script de test pour la protection anti-double-appel
// Simule le comportement du composant React

class MockQuestionsManager {
  constructor() {
    this.isSubmittingOptions = false;
    this.isProcessing = false;
    this.uploading = false;
    this.currentQuestionId = 'test-question-id';
    this.questionOptions = [
      { id: '1', content: 'Option A', is_correct: true, label: 'A' },
      { id: '2', content: 'Option B', is_correct: false, label: 'B' },
      { id: '3', content: 'Option C', is_correct: false, label: 'C' },
      { id: '4', content: 'Option D', is_correct: false, label: 'D' }
    ];
    this.callCount = 0;
  }

  async handleSubmitOptions() {
    this.callCount++;
    const callId = this.callCount;
    
    console.log(`🎯 [Appel ${callId}] DÉBUT handleSubmitOptions`);
    
    // Protection renforcée contre les appels multiples
    if (this.isSubmittingOptions || this.isProcessing) {
      console.log(`⚠️ [Appel ${callId}] handleSubmitOptions déjà en cours, ignorer l'appel`);
      return false;
    }
    
    if (!this.currentQuestionId) {
      console.error(`❌ [Appel ${callId}] Pas d'ID de question pour finaliser`);
      return false;
    }
    
    this.isSubmittingOptions = true; // Bloquer les appels multiples
    this.isProcessing = true; // Protection supplémentaire
    this.uploading = true;
    
    console.log(`🎯 [Appel ${callId}] Finalisation de la question:`, this.currentQuestionId);
    console.log(`🎯 [Appel ${callId}] Options à traiter:`, this.questionOptions.length);
    
    try {
      // Simuler le traitement (durée variable)
      const processingTime = Math.random() * 2000 + 1000; // 1-3 secondes
      console.log(`⏱️ [Appel ${callId}] Simulation traitement (${Math.round(processingTime)}ms)...`);
      
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Simuler une erreur occasionnelle
      if (Math.random() < 0.2) {
        throw new Error('Erreur simulée de traitement');
      }
      
      console.log(`✅ [Appel ${callId}] Traitement terminé avec succès`);
      return true;
      
    } catch (error) {
      console.error(`❌ [Appel ${callId}] Erreur lors du traitement:`, error.message);
      return false;
    } finally {
      console.log(`🏁 [Appel ${callId}] FIN handleSubmitOptions - reset flags`);
      this.isSubmittingOptions = false;
      this.isProcessing = false;
      this.uploading = false;
    }
  }
}

async function testDoubleCallProtection() {
  console.log('🧪 Test protection anti-double-appel...\n');
  
  const manager = new MockQuestionsManager();
  
  // Test 1: Appel unique normal
  console.log('1. Test appel unique normal');
  const result1 = await manager.handleSubmitOptions();
  console.log('Résultat:', result1 ? '✅ Succès' : '❌ Échec');
  
  // Test 2: Double appel simultané
  console.log('\n2. Test double appel simultané');
  const promise1 = manager.handleSubmitOptions();
  const promise2 = manager.handleSubmitOptions(); // Appel immédiat
  
  const [result2a, result2b] = await Promise.all([promise1, promise2]);
  console.log('Résultat appel 1:', result2a ? '✅ Succès' : '❌ Échec');
  console.log('Résultat appel 2:', result2b ? '✅ Succès' : '❌ Échec (attendu)');
  
  // Test 3: Triple appel avec délai
  console.log('\n3. Test triple appel avec délai');
  const promise3a = manager.handleSubmitOptions();
  
  setTimeout(() => {
    console.log('⏰ Tentative d\'appel pendant traitement...');
    manager.handleSubmitOptions();
  }, 500);
  
  setTimeout(() => {
    console.log('⏰ Autre tentative d\'appel pendant traitement...');
    manager.handleSubmitOptions();
  }, 1000);
  
  const result3 = await promise3a;
  console.log('Résultat appel principal:', result3 ? '✅ Succès' : '❌ Échec');
  
  // Test 4: Appels séquentiels (autorisés)
  console.log('\n4. Test appels séquentiels (autorisés)');
  const result4a = await manager.handleSubmitOptions();
  const result4b = await manager.handleSubmitOptions();
  
  console.log('Résultat appel séquentiel 1:', result4a ? '✅ Succès' : '❌ Échec');
  console.log('Résultat appel séquentiel 2:', result4b ? '✅ Succès' : '❌ Échec');
  
  // Test 5: Stress test
  console.log('\n5. Stress test (10 appels simultanés)');
  const stressPromises = [];
  for (let i = 0; i < 10; i++) {
    stressPromises.push(manager.handleSubmitOptions());
  }
  
  const stressResults = await Promise.all(stressPromises);
  const successCount = stressResults.filter(r => r === true).length;
  const failCount = stressResults.filter(r => r === false).length;
  
  console.log(`📊 Résultats stress test: ${successCount} succès, ${failCount} échecs`);
  console.log('✅ Un seul succès attendu, le reste devrait échouer');
  
  console.log('\n🎉 Test terminé !');
  console.log(`📈 Total appels effectués: ${manager.callCount}`);
}

// Simulation d'un scénario réel React
async function testReactScenario() {
  console.log('\n🔄 Test scénario React réel...\n');
  
  const manager = new MockQuestionsManager();
  
  // Simuler un re-render qui cause un double appel
  console.log('Simulation: Utilisateur clique sur le bouton');
  console.log('Simulation: React re-render cause un double appel');
  
  // Premier appel (légitime)
  const legitCall = manager.handleSubmitOptions();
  
  // Deuxième appel causé par re-render (0-100ms plus tard)
  setTimeout(() => {
    console.log('🔄 Re-render React cause un appel supplémentaire...');
    manager.handleSubmitOptions();
  }, Math.random() * 100);
  
  // Troisième appel si l'utilisateur clique à nouveau par impatience
  setTimeout(() => {
    console.log('😤 Utilisateur impatient clique à nouveau...');
    manager.handleSubmitOptions();
  }, Math.random() * 1500 + 500);
  
  const result = await legitCall;
  console.log('Résultat final:', result ? '✅ Succès' : '❌ Échec');
  
  // Attendre un peu pour voir tous les logs
  await new Promise(resolve => setTimeout(resolve, 3000));
}

// Exécuter les tests
testDoubleCallProtection()
  .then(() => testReactScenario())
  .catch(console.error); 
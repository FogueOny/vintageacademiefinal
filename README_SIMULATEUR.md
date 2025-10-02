# Simulateur TCF – Expression Écrite

Ce document décrit les fonctionnalités actuelles du simulateur, l’architecture technique, la configuration, et la roadmap des prochaines étapes.

## 1) Fonctionnalités implémentées

- **Soumissions utilisateur (Attempts)**
  - Démarrer/terminer une tentative depuis `/simulateur`.
  - Afficher la liste des soumissions dans `/simulateur/soumissions`.
  - Voir les détails d’une soumission (tâches, documents, réponses et compteur de mots).

- **Évaluation IA par tâche (OpenAI)**
  - Bouton **« Évaluer avec IA (OpenAI) »** sur chaque tâche dans `AttemptDetails`.
  - Sortie structurée: `score_20`, `cecr_level`, `positives[]`, `improvements[]`, `suggested_correction`.
  - Durcissement du parsing côté client (détection du `content-type`, gestion d’erreurs propre).
  - Gestion des erreurs 429 (rate limit) et messages utilisateur clairs.

- **Santé du provider IA**
  - Route `GET /api/simulator/health` qui expose `{ ok, provider, model, hasKey, timestamp }`.
  - Affichée en haut des détails pour information rapide.

- **Prompt système centralisé**
  - Fichier `prompt_system.txt` chargé automatiquement par la route IA.
  - Contenu pédagogique exigeant: orthographe, grammaire, connecteurs, formulation, longueur, tâche & intention, narration & cohérence.
  - Forçage de la sortie JSON avec `response_format: { type: 'json_object' }` et `max_tokens`.

## 2) Architecture technique

- **Front (Next.js / App Router)**
  - `src/app/(dashboard)/simulateur/page.tsx`: démarrage/fin de tentative.
  - `src/app/(dashboard)/simulateur/soumissions/page.tsx`: liste et ouverture d’une tentative.
  - `src/app/(dashboard)/simulateur/soumissions/components/AttemptHeader.tsx`: en-tête d’une carte tentative.
  - `src/app/(dashboard)/simulateur/soumissions/components/AttemptDetails.tsx`: affichage des tâches, réponses et actions IA.

- **API Routes**
  - `src/app/api/simulator/evaluate-task/route.ts` (POST)
    - Lit `prompt_system.txt` si présent.
    - Construit le message utilisateur (consignes, description, documents, réponse + `word_count`).
    - Appelle OpenAI Chat Completions (modèle par défaut `gpt-4o-mini`).
    - `response_format: json_object`, `max_tokens: 700`.
    - Gestion **429**: retry/backoff (1s, 2s) puis retour 429 avec `retry_after`.
  - `src/app/api/simulator/health/route.ts` (GET)
    - Retourne la présence de la clé et le modèle actif.

- **Données**
  - Les tentatives, tâches et documents sont récupérés via `/api/simulator/attempts` et `/api/simulator/attempts/:id` (routes déjà présentes côté projet).
  - `AttemptDetails` affiche les tâches, documents (T3), et réponses saisies, avec compteur de mots.

## 3) Configuration & démarrage

- **Variables d’environnement (.env.local)**
  - `OPENAI_API_KEY=sk-...`
  - `OPENAI_MODEL=gpt-4o-mini` (recommandé)

- **Dépendances**
  - OpenAI utilisée via `fetch` (pas de SDK).
  - `sonner` pour les toasts.

- **Run**
  - `npm run dev` ou `yarn dev`.
  - Tester `/simulateur`, puis `/simulateur/soumissions`.

## 4) Bonnes pratiques d’utilisation

- **Éviter les 429**
  - Évaluer **une tâche à la fois**, attendre la réponse avant de relancer.
  - Ne pas spammer les clics.
  - Vérifier la facturation et le budget dans le dashboard OpenAI.

- **Qualité pédagogique**
  - Le prompt force un retour détaillé dans `improvements` avec sous-sections normalisées: `[Orthographe]`, `[Grammaire/Syntaxe]`, `[Connecteurs à utiliser]`, `[Formulation]`, `[Longueur]`, `[Tâche & intention]`, `[Narration & cohérence]`.
  - La **reformulation C2** respecte la consigne et la plage de mots.

## 5) Roadmap (ce qui reste à faire)

- **A. UI pédagogique enrichie (priorité haute)**
  - Détecter et mettre en forme les sous-sections d’`improvements` dans `AttemptDetails` (titres, listes, styles).
  - Afficher une estimation de mots et un verdict (insuffisant/ok/au-dessus) de manière visible.

- **B. Évaluer toutes les tâches**
  - Bouton « Évaluer toutes les tâches » avec file d’attente locale et **délai entre appels** pour éviter les 429.
  - Indicateur d’avancement (T1 → T2 → T3).

- **C. Persistance et historique des évaluations**
  - Option pour **sauvegarder** les évaluations IA (aujourd’hui, résultat en mémoire côté client). 
  - Historiser les évaluations (timestamps, modèle utilisé) pour suivi des progrès.

- **D. Assistant OpenAI (migration progressive)**
  - Créer un **Assistant “Évaluateur TCF Canada”** (instructions = `prompt_system.txt`).
  - Nouvelle route `/api/simulator/assistants/evaluate-task` avec Threads/Runs.
  - Avantages: cohérence, versionnage, ajout de fichiers (barèmes/exemples).

- **E. Améliorations prompt**
  - Affiner des règles par **tâche** (registre T1 amical/poli; T2 récit/chronologie; T3 argumentation/comparaison). 
  - Ajouter des exemples structurés par niveau CECR pour calibrer les scores.

- **F. Contrôles anti-abus**
  - Limiter la taille maximale des réponses utilisateur.
  - Filtrer/normaliser les documents T3 pour éviter contenu parasite.

- **G. Monitoring**
  - Logs serveurs pour latence OpenAI, taux d’erreur, occurrences 429.
  - Compteurs d’usage simple par utilisateur.

## 6) FAQ rapide

- **Pourquoi 429 ?** Quota ou rate-limit OpenAI. Activer la facturation et éviter les clics rapides.
- **Puis-je changer le modèle ?** Oui via `OPENAI_MODEL`. Garde un modèle léger (ex: `gpt-4o-mini`).
- **Puis-je modifier le barème/contenu pédagogique ?** Oui, édite `prompt_system.txt` (charge automatique).

---
Dernière mise à jour: auto-générée.

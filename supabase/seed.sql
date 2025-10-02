-- Insertion des modules
INSERT INTO public.modules (name, description, type, slug, icon)
VALUES 
  ('Compréhension Orale', 'Exercices de compréhension orale pour le TCF', 'comprehension_orale', 'comprehension-orale', 'audio'),
  ('Compréhension Écrite', 'Exercices de compréhension écrite pour le TCF', 'comprehension_ecrite', 'comprehension-ecrite', 'book'),
  ('Expression Orale - Tâche 2', 'Exercices d''expression orale - Tâche 2 pour le TCF', 'expression_orale', 'expression-orale-tache-2', 'mic'),
  ('Expression Orale - Tâche 3', 'Exercices d''expression orale - Tâche 3 pour le TCF', 'expression_orale', 'expression-orale-tache-3', 'mic'),
  ('Expression Écrite', 'Exercices d''expression écrite pour le TCF', 'expression_ecrite', 'expression-ecrite', 'pen');

-- Insertion des séries de tests pour la compréhension orale
WITH module_id AS (SELECT id FROM public.modules WHERE slug = 'comprehension-orale' LIMIT 1)
INSERT INTO public.test_series (module_id, name, description, time_limit, slug)
VALUES 
  ((SELECT id FROM module_id), 'Compréhension Orale - Série 1', 'Première série d''exercices de compréhension orale', 1800, 'co-serie-1'),
  ((SELECT id FROM module_id), 'Compréhension Orale - Série 2', 'Deuxième série d''exercices de compréhension orale', 1800, 'co-serie-2');

-- Insertion des séries de tests pour la compréhension écrite
WITH module_id AS (SELECT id FROM public.modules WHERE slug = 'comprehension-ecrite' LIMIT 1)
INSERT INTO public.test_series (module_id, name, description, time_limit, slug)
VALUES 
  ((SELECT id FROM module_id), 'Compréhension Écrite - Série 1', 'Première série d''exercices de compréhension écrite', 2700, 'ce-serie-1'),
  ((SELECT id FROM module_id), 'Compréhension Écrite - Série 2', 'Deuxième série d''exercices de compréhension écrite', 2700, 'ce-serie-2');

-- Insertion des séries de tests pour l'expression orale - Tâche 2
WITH module_id AS (SELECT id FROM public.modules WHERE slug = 'expression-orale-tache-2' LIMIT 1)
INSERT INTO public.test_series (module_id, name, description, time_limit, slug)
VALUES 
  ((SELECT id FROM module_id), 'Expression Orale - Tâche 2 - Série 1', 'Première série d''exercices d''expression orale - Tâche 2', 1200, 'eot2-serie-1');

-- Insertion des séries de tests pour l'expression orale - Tâche 3
WITH module_id AS (SELECT id FROM public.modules WHERE slug = 'expression-orale-tache-3' LIMIT 1)
INSERT INTO public.test_series (module_id, name, description, time_limit, slug)
VALUES 
  ((SELECT id FROM module_id), 'Expression Orale - Tâche 3 - Série 1', 'Première série d''exercices d''expression orale - Tâche 3', 1200, 'eot3-serie-1');

-- Insertion des séries de tests pour l'expression écrite
WITH module_id AS (SELECT id FROM public.modules WHERE slug = 'expression-ecrite' LIMIT 1)
INSERT INTO public.test_series (module_id, name, description, time_limit, slug)
VALUES 
  ((SELECT id FROM module_id), 'Expression Écrite - Série 1', 'Première série d''exercices d''expression écrite', 3600, 'ee-serie-1');

-- Insertion de questions pour la première série de compréhension orale
WITH test_series_id AS (SELECT id FROM public.test_series WHERE slug = 'co-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-orale') LIMIT 1)
INSERT INTO public.questions (test_series_id, question_number, content, media_url, media_type, points)
VALUES 
  ((SELECT id FROM test_series_id), 1, 'Écoutez l''extrait sonore et choisissez la bonne réponse. Où se passe cette conversation ?', 'https://example.com/audio/conversation1.mp3', 'audio', 3),
  ((SELECT id FROM test_series_id), 2, 'Écoutez l''extrait sonore et choisissez la bonne réponse. Que propose la femme ?', 'https://example.com/audio/conversation2.mp3', 'audio', 3),
  ((SELECT id FROM test_series_id), 3, 'Écoutez l''extrait sonore et choisissez la bonne réponse. Quel est le problème de l''homme ?', 'https://example.com/audio/conversation3.mp3', 'audio', 3),
  ((SELECT id FROM test_series_id), 4, 'Écoutez l''extrait sonore et choisissez la bonne réponse. Où va l''homme ?', 'https://example.com/audio/conversation4.mp3', 'audio', 3),
  ((SELECT id FROM test_series_id), 5, 'Écoutez l''extrait sonore et choisissez la bonne réponse. Quel est le métier de la femme ?', 'https://example.com/audio/conversation5.mp3', 'audio', 3);

-- Insertion des options pour la question 1 (compréhension orale)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 1 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'co-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-orale')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'Dans un restaurant', true, 'A'),
  ((SELECT id FROM question_id), 'Dans un magasin', false, 'B'),
  ((SELECT id FROM question_id), 'Dans une bibliothèque', false, 'C'),
  ((SELECT id FROM question_id), 'Dans un hôtel', false, 'D');

-- Insertion des options pour la question 2 (compréhension orale)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 2 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'co-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-orale')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'D''aller au cinéma', false, 'A'),
  ((SELECT id FROM question_id), 'D''aller au restaurant', false, 'B'),
  ((SELECT id FROM question_id), 'D''aller faire les courses', true, 'C'),
  ((SELECT id FROM question_id), 'D''aller à la piscine', false, 'D');

-- Insertion des options pour la question 3 (compréhension orale)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 3 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'co-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-orale')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'Il est malade', false, 'A'),
  ((SELECT id FROM question_id), 'Il est en retard', true, 'B'),
  ((SELECT id FROM question_id), 'Il a perdu son portefeuille', false, 'C'),
  ((SELECT id FROM question_id), 'Il est fatigué', false, 'D');

-- Insertion des options pour la question 4 (compréhension orale)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 4 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'co-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-orale')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'Au travail', false, 'A'),
  ((SELECT id FROM question_id), 'À la gare', true, 'B'),
  ((SELECT id FROM question_id), 'À l''école', false, 'C'),
  ((SELECT id FROM question_id), 'Au musée', false, 'D');

-- Insertion des options pour la question 5 (compréhension orale)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 5 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'co-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-orale')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'Médecin', false, 'A'),
  ((SELECT id FROM question_id), 'Professeur', true, 'B'),
  ((SELECT id FROM question_id), 'Ingénieur', false, 'C'),
  ((SELECT id FROM question_id), 'Journaliste', false, 'D');

-- Insertion de questions pour la première série de compréhension écrite
WITH test_series_id AS (SELECT id FROM public.test_series WHERE slug = 'ce-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-ecrite') LIMIT 1)
INSERT INTO public.questions (test_series_id, question_number, content, media_url, media_type, points)
VALUES 
  ((SELECT id FROM test_series_id), 1, 'Lisez le texte suivant et répondez à la question. Quel est le sujet principal du texte ?', 'https://example.com/images/text1.jpg', 'image', 3),
  ((SELECT id FROM test_series_id), 2, 'Lisez le texte suivant et répondez à la question. Que fait l''auteur comme métier ?', 'https://example.com/images/text2.jpg', 'image', 3),
  ((SELECT id FROM test_series_id), 3, 'Lisez le texte suivant et répondez à la question. Quel est le problème évoqué ?', 'https://example.com/images/text3.jpg', 'image', 3),
  ((SELECT id FROM test_series_id), 4, 'Lisez le texte suivant et répondez à la question. Quelle est la solution proposée ?', 'https://example.com/images/text4.jpg', 'image', 3),
  ((SELECT id FROM test_series_id), 5, 'Lisez le texte suivant et répondez à la question. Que pense l''auteur de cette situation ?', 'https://example.com/images/text5.jpg', 'image', 3);

-- Insertion des options pour la question 1 (compréhension écrite)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 1 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'ce-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-ecrite')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'L''environnement', true, 'A'),
  ((SELECT id FROM question_id), 'La politique', false, 'B'),
  ((SELECT id FROM question_id), 'L''économie', false, 'C'),
  ((SELECT id FROM question_id), 'La santé', false, 'D');

-- Insertion des options pour la question 2 (compréhension écrite)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 2 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'ce-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-ecrite')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'Journaliste', false, 'A'),
  ((SELECT id FROM question_id), 'Scientifique', true, 'B'),
  ((SELECT id FROM question_id), 'Politicien', false, 'C'),
  ((SELECT id FROM question_id), 'Écrivain', false, 'D');

-- Insertion des options pour la question 3 (compréhension écrite)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 3 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'ce-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-ecrite')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'La pollution de l''air', false, 'A'),
  ((SELECT id FROM question_id), 'La déforestation', true, 'B'),
  ((SELECT id FROM question_id), 'Le réchauffement climatique', false, 'C'),
  ((SELECT id FROM question_id), 'La surpopulation', false, 'D');

-- Insertion des options pour la question 4 (compréhension écrite)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 4 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'ce-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-ecrite')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'Réduire la consommation', false, 'A'),
  ((SELECT id FROM question_id), 'Planter plus d''arbres', true, 'B'),
  ((SELECT id FROM question_id), 'Utiliser moins d''énergie', false, 'C'),
  ((SELECT id FROM question_id), 'Recycler davantage', false, 'D');

-- Insertion des options pour la question 5 (compréhension écrite)
WITH question_id AS (SELECT id FROM public.questions WHERE question_number = 5 AND test_series_id = (SELECT id FROM public.test_series WHERE slug = 'ce-serie-1' AND module_id = (SELECT id FROM public.modules WHERE slug = 'comprehension-ecrite')) LIMIT 1)
INSERT INTO public.options (question_id, content, is_correct, label)
VALUES 
  ((SELECT id FROM question_id), 'Il est optimiste', false, 'A'),
  ((SELECT id FROM question_id), 'Il est pessimiste', false, 'B'),
  ((SELECT id FROM question_id), 'Il est neutre', false, 'C'),
  ((SELECT id FROM question_id), 'Il est inquiet mais espère un changement', true, 'D');

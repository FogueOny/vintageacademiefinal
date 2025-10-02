-- Script d'importation des données pour Expression Écrite Mars 2025
-- Date de création: 26 July 2025
-- ID de la période: 146701ef-2ea4-4bae-9405-9cbd297e4b40

-- Note: Les UUID dans ce script sont générés automatiquement.
-- Chaque exécution produira des UUID différents.

-- ======================================================================================
-- COMBINAISON 1
-- ======================================================================================
INSERT INTO expression_ecrite_combinations (id, period_id, combination_number, title, is_active, created_at, updated_at)
VALUES 
('4e264c48-e8a7-401b-a7a5-330b06d90b97', '146701ef-2ea4-4bae-9405-9cbd297e4b40', 1, 'Combinaison 1', true, NOW(), NOW());

-- Tâches pour Combinaison 1
INSERT INTO expression_ecrite_tasks (id, combination_id, task_number, title, description, word_count_min, word_count_max, 
  task_type, duration_minutes, difficulty_level, instructions, created_at, updated_at)
VALUES
-- Tâche 1
('dd21b543-03b0-41ff-bb08-8e03f116cba9', '4e264c48-e8a7-401b-a7a5-330b06d90b97', 1, 'Vous avez récemment acheté un...', 
'Vous avez récemment acheté un ordinateur portable dans une boutique en ligne, mais celui-ci est défectueux. Écrivez un courriel au service client pour demander un remboursement ou un échange. Précisez la nature du problème et ce que vous attendez comme solution.', 
60, 80, 'correspondance', 20, 'beginner', 'Répondez au message en donnant tous les détails demandés.', NOW(), NOW()),

-- Tâche 2
('3c370ef1-7e5d-44eb-ba6b-63d56838b4b9', '4e264c48-e8a7-401b-a7a5-330b06d90b97', 2, 'Racontez une expérience positive que...', 
'Racontez une expérience positive que vous avez vécue récemment dans votre quartier. Décrivez l''événement, les personnes impliquées et expliquez pourquoi cette expérience a été significative pour vous.', 
80, 100, 'narration', 20, 'intermediate', 'Racontez votre expérience et donnez votre opinion.', NOW(), NOW()),

-- Tâche 3
('1c83d976-0903-4fed-a60c-a308d673efa2', '4e264c48-e8a7-401b-a7a5-330b06d90b97', 3, 'À votre avis, est-il préférable...', 
'À votre avis, est-il préférable de travailler à distance ou au bureau ? Présentez les avantages et les inconvénients de chaque option, puis donnez votre opinion personnelle sur ce sujet en vous appuyant sur les documents suivants.', 
120, 180, 'argumentation', 20, 'advanced', 'Présentez les différents points de vue et donnez votre opinion personnelle.', NOW(), NOW());

-- Documents pour Tâche 3 Combinaison 1
INSERT INTO expression_ecrite_documents (id, task_id, document_number, title, content, document_type, created_at, updated_at)
VALUES
-- Document 1
('14014c97-8b45-421b-8b4b-92346c902442', '1c83d976-0903-4fed-a60c-a308d673efa2', 1, 'Le travail à distance s''est largement développé depuis la pandémie de Covid-19', 
'Le travail à distance s''est largement développé depuis la pandémie de Covid-19. Selon une étude récente menée par l''Institut national de statistique, 65% des employés qui pratiquent le télétravail se disent plus productifs et apprécient particulièrement la flexibilité des horaires et l''absence de temps de trajet. Cependant, 42% d''entre eux signalent également se sentir isolés socialement et avoir des difficultés à séparer vie professionnelle et vie privée. Les entreprises, quant à elles, constatent une réduction des coûts immobiliers mais s''inquiètent parfois du manque de cohésion d''équipe et de la difficulté à maintenir une culture d''entreprise forte.', 
'support', NOW(), NOW()),

-- Document 2
('05e12509-b3ef-48d1-ac16-d08377022586', '1c83d976-0903-4fed-a60c-a308d673efa2', 2, 'Le bureau traditionnel offre un cadre structuré qui favorise la collaboration spontanée et renforce le sentiment d''appartenance', 
'Le bureau traditionnel offre un cadre structuré qui favorise la collaboration spontanée et renforce le sentiment d''appartenance. D''après une enquête menée auprès de 1500 salariés, 78% des répondants estiment que les interactions en personne sont essentielles pour l''innovation et la résolution de problèmes complexes. Par ailleurs, le bureau permet une séparation nette entre vie professionnelle et vie personnelle, ce qui aide à maintenir un équilibre sain. Toutefois, les trajets quotidiens représentent en moyenne 52 minutes par jour pour les travailleurs urbains, ce qui constitue une source importante de stress et de fatigue.', 
'support', NOW(), NOW());

-- ======================================================================================
-- COMBINAISON 2
-- ======================================================================================
INSERT INTO expression_ecrite_combinations (id, period_id, combination_number, title, is_active, created_at, updated_at)
VALUES 
('ac838dbc-6ba6-4ae9-ac34-6787fb8d4c41', '146701ef-2ea4-4bae-9405-9cbd297e4b40', 2, 'Combinaison 2', true, NOW(), NOW());

-- Tâches pour Combinaison 2
INSERT INTO expression_ecrite_tasks (id, combination_id, task_number, title, description, word_count_min, word_count_max, 
  task_type, duration_minutes, difficulty_level, instructions, created_at, updated_at)
VALUES
-- Tâche 1
('10c68623-15ae-4b72-81b6-19645d7767ec', 'ac838dbc-6ba6-4ae9-ac34-6787fb8d4c41', 1, 'Vous devez annuler votre participation...', 
'Vous devez annuler votre participation à un événement culturel auquel votre ami vous a invité. Écrivez-lui un message pour vous excuser de ne pas pouvoir venir. Expliquez les raisons de votre absence et proposez une alternative.', 
60, 80, 'correspondance', 20, 'beginner', 'Répondez au message en donnant tous les détails demandés.', NOW(), NOW()),

-- Tâche 2
('87561009-b50d-47d7-8bec-805237803af4', 'ac838dbc-6ba6-4ae9-ac34-6787fb8d4c41', 2, 'Décrivez un lieu de votre...', 
'Décrivez un lieu de votre enfance qui a été important pour vous. Expliquez pourquoi ce lieu était spécial et quels souvenirs vous y associez.', 
80, 100, 'narration', 20, 'intermediate', 'Racontez votre expérience et donnez votre opinion.', NOW(), NOW()),

-- Tâche 3
('64fad9b0-9ce0-4358-a22d-424ab507ecfe', 'ac838dbc-6ba6-4ae9-ac34-6787fb8d4c41', 3, 'Les réseaux sociaux ont-ils un...', 
'Les réseaux sociaux ont-ils un impact positif ou négatif sur les relations sociales ? Présentez les différents points de vue en vous appuyant sur les documents suivants, puis exprimez votre opinion personnelle.', 
120, 180, 'argumentation', 20, 'advanced', 'Présentez les différents points de vue et donnez votre opinion personnelle.', NOW(), NOW());

-- Documents pour Tâche 3 Combinaison 2
INSERT INTO expression_ecrite_documents (id, task_id, document_number, title, content, document_type, created_at, updated_at)
VALUES
-- Document 1
('e02b4ac8-4303-468f-aca6-7b74a617d469', '64fad9b0-9ce0-4358-a22d-424ab507ecfe', 1, 'Les réseaux sociaux ont révolutionné notre façon de communiquer et de maintenir des relations', 
'Les réseaux sociaux ont révolutionné notre façon de communiquer et de maintenir des relations. Une étude de l''Université de Toronto montre que 67% des utilisateurs affirment que les plateformes comme Facebook et Instagram leur permettent de rester en contact avec des amis éloignés géographiquement et de retrouver d''anciennes connaissances. De plus, 42% des personnes interrogées disent avoir développé de nouvelles amitiés grâce à ces outils. Pour les personnes isolées ou à mobilité réduite, ces plateformes représentent souvent une fenêtre essentielle sur le monde extérieur.', 
'support', NOW(), NOW()),

-- Document 2
('76284d59-46e1-4cb8-ab09-a93a299ea8b1', '64fad9b0-9ce0-4358-a22d-424ab507ecfe', 2, 'Malgré leurs avantages apparents, les réseaux sociaux peuvent avoir des effets délétères sur nos relations', 
'Malgré leurs avantages apparents, les réseaux sociaux peuvent avoir des effets délétères sur nos relations. Selon des recherches en psychologie sociale, la qualité des interactions en ligne est généralement inférieure à celle des rencontres en personne. Le psychiatre Jean Dupont explique : "Nous observons une tendance à la superficialité dans les échanges numériques. Les conversations profondes sont rares et les malentendus fréquents." Par ailleurs, 53% des jeunes de 18 à 25 ans reconnaissent passer plus de temps à communiquer virtuellement qu''à rencontrer physiquement leurs amis, ce qui peut contribuer à un sentiment paradoxal d''isolement.', 
'support', NOW(), NOW());


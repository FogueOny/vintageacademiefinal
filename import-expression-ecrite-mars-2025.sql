 -- Script d'importation des données pour Expression Écrite Mars 2025
-- Date de création: 26 juillet 2025
-- ID de la période: 22696eb8-6fc9-41a4-8744-b6fa94116cd5

-- Note: Les UUID utilisés dans ce script sont fictifs et devront être générés 
-- lors de l'exécution réelle ou remplacés par votre système de génération d'UUID.

-- ======================================================================================
-- COMBINAISON 1
-- ======================================================================================
INSERT INTO expression_ecrite_combinations (id, period_id, combination_number, title, is_active, created_at, updated_at)
VALUES 
('c1-mars25-uuid', '22696eb8-6fc9-41a4-8744-b6fa94116cd5', 1, 'Combinaison 1', true, NOW(), NOW());

-- Tâches pour Combinaison 1
INSERT INTO expression_ecrite_tasks (id, combination_id, task_number, title, description, word_count_min, word_count_max, 
  task_type, duration_minutes, difficulty_level, instructions, created_at, updated_at)
VALUES
-- Tâche 1
('t1-c1-mars25-uuid', 'c1-mars25-uuid', 1, 'Courriel à Lucas', 
'Répondez au courriel de votre ami Lucas pour lui donner des informations sur les nouveaux locaux de votre entreprise (lieu, disposition des pièces, équipements, etc.).', 
60, 80, 'correspondance', 20, 'beginner', 'Répondez au courriel en donnant des détails précis.', NOW(), NOW()),

-- Tâche 2
('t2-c1-mars25-uuid', 'c1-mars25-uuid', 2, 'Une semaine sans voiture', 
'Vous avez assisté à un événement intitulé "Une semaine sans voiture". Racontez votre expérience et donnez votre impression sur cette initiative. Décrivez le déroulement de l''événement (dates, lieu, activités proposées).', 
80, 100, 'narration', 20, 'intermediate', 'Racontez votre expérience personnelle et donnez votre avis.', NOW(), NOW()),

-- Tâche 3
('t3-c1-mars25-uuid', 'c1-mars25-uuid', 3, 'Les Vêtements de Grandes Marques', 
'À partir des deux documents, vous présenterez les différents points de vue sur l''importance des vêtements de marque pour les enfants et donnerez votre opinion sur ce sujet.', 
120, 180, 'argumentation', 20, 'advanced', 'Présentez les arguments pour et contre, puis donnez votre opinion personnelle.', NOW(), NOW());

-- Documents pour Tâche 3 Combinaison 1
INSERT INTO expression_ecrite_documents (id, task_id, document_number, title, content, document_type, created_at, updated_at)
VALUES
-- Document 1
('d1-t3-c1-mars25-uuid', 't3-c1-mars25-uuid', 1, 'Importance des marques', 
'Les vêtements de marques sont très importants pour les enfants et les adolescents. C''est un moyen de s''exprimer et de se rattacher à un groupe social. Cette attirance pour les marques est très présente chez les adolescents qui se cherchent et montrent leur personnalité. Les enfants aiment également porter des vêtements de marques avec des images des dessins animés qu''ils regardent ou des logos qu''ils apprécient.', 
'support', NOW(), NOW()),

-- Document 2
('d2-t3-c1-mars25-uuid', 't3-c1-mars25-uuid', 2, 'Usure rapide', 
'Les enfants grandissent très vite et les vêtements sont portés pendant une courte période. Ainsi, les vêtements deviennent rapidement trop petits. Mais il y a aussi le fait que les enfants usent assez rapidement les vêtements en jouant à l''extérieur avec les copains, en s''amusant dans l''herbe ou à l''aire de jeux. Les habits sont très vite sales ou troués.', 
'support', NOW(), NOW());

-- ======================================================================================
-- COMBINAISON 9
-- ======================================================================================
INSERT INTO expression_ecrite_combinations (id, period_id, combination_number, title, is_active, created_at, updated_at)
VALUES 
('c9-mars25-uuid', '22696eb8-6fc9-41a4-8744-b6fa94116cd5', 9, 'Combinaison 9', true, NOW(), NOW());

-- Tâches pour Combinaison 9
INSERT INTO expression_ecrite_tasks (id, combination_id, task_number, title, description, word_count_min, word_count_max, 
  task_type, duration_minutes, difficulty_level, instructions, created_at, updated_at)
VALUES
-- Tâche 1
('t1-c9-mars25-uuid', 'c9-mars25-uuid', 1, 'Projet de décoration', 
'Vous voulez changer la décoration de votre appartement (meubles, peinture, objets, etc.). Vous écrivez un message à un(e) ami(e). Vous lui décrivez votre projet et vous lui demandez de vous aider.', 
60, 80, 'correspondance', 20, 'beginner', 'Rédigez un message pour décrire votre projet et demander de l''aide.', NOW(), NOW()),

-- Tâche 2
('t2-c9-mars25-uuid', 'c9-mars25-uuid', 2, 'École De Musique', 
'« Ecole De Musique ! Cours Gratuits, Concerts, Jeux.Rendez-Vous Vendredi, À partir de 9 Heures »
Vous avez participé à cet évènement. Vous écrivez à vos amis pour raconter votre expérience et vous donnez votre opinion sur cette journée.', 
80, 100, 'narration', 20, 'intermediate', 'Racontez votre expérience et partagez votre opinion.', NOW(), NOW()),

-- Tâche 3
('t3-c9-mars25-uuid', 'c9-mars25-uuid', 3, 'Petits magasins ou supermarchés', 
'Faut-il faire ses courses dans des petits magasins ou dans des supermarchés ? À partir des deux documents, vous présenterez les différents points de vue et donnerez votre opinion sur ce sujet.', 
120, 180, 'argumentation', 20, 'advanced', 'Présentez les avantages et inconvénients des deux options, puis donnez votre opinion.', NOW(), NOW());

-- Documents pour Tâche 3 Combinaison 9
INSERT INTO expression_ecrite_documents (id, task_id, document_number, title, content, document_type, created_at, updated_at)
VALUES
-- Document 1
('d1-t3-c9-mars25-uuid', 't3-c9-mars25-uuid', 1, 'Avantages du supermarché', 
'Le supermarché est très pratique ; on y trouve une grande variété de produits, tous à portée de main. Vous pouvez garer votre voiture dans le parking et faire le tour des rayons pour acheter tout ce dont vous avez besoin : fruits, légumes, fromages, viandes, boissons… De plus, les supermarchés offrent plusieurs marques pour un même produit, tout en proposant régulièrement des promotions et des remises.', 
'support', NOW(), NOW()),

-- Document 2
('d2-t3-c9-mars25-uuid', 't3-c9-mars25-uuid', 2, 'Soutien aux petits commerces', 
'ASSOCIATION POUR LA SAUVEGARDE DES PETITS COMMERCES
Le défi « Février sans supermarché » a été créé pour limiter la superpuissance des supermarchés et, par conséquent, permettre aux petits commerces de survivre et de réaliser des chiffres d''affaires plus conséquents. Ce défi consiste à boycotter les supermarchés pendant une durée d''un mois, en faisant toutes ses courses dans les épiceries de quartier. Le client aura tout à gagner : il bénéficiera non seulement de produits frais de meilleure qualité, mais aura également l''opportunité de papoter avec les voisins.', 
'support', NOW(), NOW());

-- ======================================================================================
-- COMBINAISON 2
-- ======================================================================================
INSERT INTO expression_ecrite_combinations (id, period_id, combination_number, title, is_active, created_at, updated_at)
VALUES 
('c2-mars25-uuid', '22696eb8-6fc9-41a4-8744-b6fa94116cd5', 2, 'Combinaison 2', true, NOW(), NOW());

-- Tâches pour Combinaison 2
INSERT INTO expression_ecrite_tasks (id, combination_id, task_number, title, description, word_count_min, word_count_max, 
  task_type, duration_minutes, difficulty_level, instructions, created_at, updated_at)
VALUES
-- Tâche 1
('t1-c2-mars25-uuid', 'c2-mars25-uuid', 1, 'Cours de langue', 
'Ecrivez un message à votre ami(e) qui souhaite suivre des cours de langue dans votre école. Donnez les détails spécifiques pour aider votre ami(e) à faire son choix. (lieu, tarifs, types de cours disponible, etc.).', 
60, 80, 'correspondance', 20, 'beginner', 'Décrivez les détails pertinents pour aider à la décision.', NOW(), NOW()),

-- Tâche 2
('t2-c2-mars25-uuid', 'c2-mars25-uuid', 2, 'Association d''aide aux personnes âgées', 
'Vous travaillez dans une association qui aident les personnes âgées. Rédigez un un article de blog pour raconter vos expériences et convaincre d''autres personnes de rejoindre l''association.', 
80, 100, 'narration', 20, 'intermediate', 'Racontez vos expériences de façon convaincante.', NOW(), NOW()),

-- Tâche 3
('t3-c2-mars25-uuid', 'c2-mars25-uuid', 3, 'Les animaux de compagnie pour les enfants', 
'Les animaux de compagnie pour les enfants, pour ou contre ? À partir des deux documents, vous présenterez les différents points de vue et donnerez votre opinion sur ce sujet.', 
120, 180, 'argumentation', 20, 'advanced', 'Présentez les avantages et inconvénients, puis donnez votre opinion.', NOW(), NOW());

-- Documents pour Tâche 3 Combinaison 2
INSERT INTO expression_ecrite_documents (id, task_id, document_number, title, content, document_type, created_at, updated_at)
VALUES
-- Document 1
('d1-t3-c2-mars25-uuid', 't3-c2-mars25-uuid', 1, 'Avantages des animaux pour les enfants', 
'Offrir un animal de compagnie à un enfant présente de nombreux avantages, comme le soulignent beaucoup de psychologues. Pour des enfants qui n''ont pas des frères et/ou des sœurs, l''animal est un compagnon qui leur évitera la solitude. Grâce à lui, un enfant prendra confiance en lui et il apprendra vite qu''un animal est un être vivant qui a besoin d''attention et de respect. En sa présence, l''enfant se sentira en sécurité et pourra agir de manière autonome, sans l''aide de ses parents.', 
'support', NOW(), NOW()),

-- Document 2
('d2-t3-c2-mars25-uuid', 't3-c2-mars25-uuid', 2, 'Responsabilités liées aux animaux', 
'Beaucoup d''enfants demandent, un jour ou l''autre, un animal à leurs parents, le plus souvent un chien ou un chat. Mais même si vous avez envie de faire plaisir à votre enfant, il vaut mieux réfléchir sérieusement avant d''acheter un animal domestique. L''animal devient un nouveau membre de la famille et représente un engagement sur de nombreuses années. Or, avoir un animal coûte souvent très cher, et c''est une grande responsabilité. On ne peut pas le traiter comme un jouet que l''on met à la poubelle quand l''enfant s''en désintéresse.', 
'support', NOW(), NOW());

-- ======================================================================================
-- AUTRES COMBINAISONS (3-8, 10-14)
-- ======================================================================================
-- Note: Pour les autres combinaisons, suivre le même modèle que ci-dessus
-- Vous pouvez compléter avec les données extraites de la page pour chacune des combinaisons

-- ======================================================================================
-- INSTRUCTIONS POUR L'UTILISATION
-- ======================================================================================
-- 1. Remplacez les UUID fictifs par de vrais UUID lors de l'importation
-- 2. Assurez-vous que la période avec l'ID "22696eb8-6fc9-41a4-8744-b6fa94116cd5" existe dans la table expression_ecrite_periods
-- 3. Exécutez ce script contre votre base de données après avoir vérifié les contraintes

-- Exemple de génération d'UUID en PostgreSQL:
-- SELECT uuid_generate_v4();
-- OU
-- SET u = gen_random_uuid();
-- INSERT INTO ... VALUES ($u, ...);
-- Tu es un expert en developpement python specialiser dans le scrapping et j'aimerais ton aide pour creer un fichier python pour scrapper et stucturer les combinaison et les tage d'une page. le put est d'exploiter ces donnees pour les migrer vers une base de donnees plus dynamique. tout d'abord voici la page ou on dois scrapper unquimenet les combinaison et tache.
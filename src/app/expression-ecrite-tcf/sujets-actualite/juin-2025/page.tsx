"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Clock, Users, Target, CheckCircle, Star, MessageCircle, Calendar, Award, BookOpen } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { getPeriodBySlugWithContent } from "@/lib/supabase/expression-ecrite-utils";
import { useEffect, useState } from "react";
import { ExpressionEcritePeriod, ExpressionEcriteCombination, ExpressionEcriteTask } from "@/types/expression-ecrite";

// Types pour notre page
type PeriodWithContent = ExpressionEcritePeriod & { 
  combinations: (ExpressionEcriteCombination & { 
    tasks: ExpressionEcriteTask[] 
  })[] 
};

export default function SujetsJuin2025Page() {
  // État pour stocker les données de la période
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodData, setPeriodData] = useState<PeriodWithContent | null>(null);
  
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // Charger les données de la période
  useEffect(() => {
    async function loadPeriodData() {
      try {
        setLoading(true);
        const { data, error } = await getPeriodBySlugWithContent('juin-2025');
        
        if (error) {
          setError(error);
        } else if (data) {
          setPeriodData(data);
        } else {
          setError('Aucune donnée trouvée pour Juin 2025');
        }
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadPeriodData();
  }, []);
  
  // Données de secours si la période n'est pas trouvée dans la base (définie plus bas)
  // Fonction pour transformer les données de la base au format d'affichage
  const transformCombinations = () => {
    if (!periodData?.combinations?.length) return fallbackCombinations;
    
    return periodData.combinations.map(combination => {
      // Transformer le format de la base de données au format d'affichage
      const tache1 = combination.tasks.find(t => t.task_number === 1);
      const tache2 = combination.tasks.find(t => t.task_number === 2);
      const tache3 = combination.tasks.find(t => t.task_number === 3);
      
      return {
        id: combination.id,
        numero: `Combinaison ${combination.combination_number}`,
        tache1: tache1 ? {
          titre: tache1.title,
          description: tache1.description,
          mots: `${tache1.word_count_min}-${tache1.word_count_max} mots`,
          type: tache1.task_type
        } : undefined,
        tache2: tache2 ? {
          titre: tache2.title,
          description: tache2.description,
          mots: `${tache2.word_count_min}-${tache2.word_count_max} mots`,
          type: tache2.task_type
        } : undefined,
        tache3: tache3 ? {
          titre: tache3.title,
          description: tache3.description,
          mots: `${tache3.word_count_min}-${tache3.word_count_max} mots`,
          type: tache3.task_type,
          // Les documents sont intégrés dans la description, nous extrayons les éléments document1/document2
          // à partir du texte de description si nécessaire
          document1: tache3.description.includes("Document 1") ? {
            titre: tache3.description.split("Document 1 :")[1]?.split("\n")[0]?.trim() || "Document 1",
            contenu: tache3.description.split("Document 1 :")[1]?.split("Document 2 :")[0]?.trim() || ""
          } : undefined,
          document2: tache3.description.includes("Document 2") ? {
            titre: tache3.description.split("Document 2 :")[1]?.split("\n")[0]?.trim() || "Document 2",
            contenu: tache3.description.split("Document 2 :")[1]?.trim() || ""
          } : undefined
        } : undefined
      };
    });
  };
  
  // Récupérer les combinaisons à afficher (depuis la base ou les fallbacks)
  const combinaisons = loading ? [] : transformCombinations();
  
  // Données de secours si la période n'est pas trouvée dans la base
  const fallbackCombinations = [
    {
      id: 1,
      numero: "Combinaison 1",
      tache1: {
        titre: "Invitation au restaurant",
        description: "Vous terminez un séjour professionnel dans un pays étranger et vous souhaitez fêter votre départ. Vous écrivez un courriel à vos collègues pour les inviter au restaurant. Vous décrivez votre projet et vous leur donnez les informations nécessaires (adresse, date, heure, etc.).",
        mots: "60-120 mots",
        type: "Courriel professionnel"
      },
      tache2: {
        titre: "Nouvelle activité sportive",
        description: "Vous avez commencé une nouvelle activité sportive. Sur votre blog, vous racontez votre expérience. Vous expliquez pourquoi cette activité peut être intéressante pour tout le monde.",
        mots: "120-150 mots",
        type: "Article de blog"
      },
      tache3: {
        titre: "Les animaux de compagnie : Pour ou Contre ?",
        description: "Vous participez à un débat sur la présence d'animaux de compagnie au bureau. Rédigez un texte argumenté en vous appuyant sur les documents fournis.",
        mots: "120-180 mots",
        type: "Texte argumentatif",
        document1: {
          titre: "Les bienfaits des animaux au bureau",
          contenu: "Venir au bureau avec son animal de compagnie, c'est à la mode. L'intérêt de cette présence ? C'est simple : diminuer le stress des employés. La présence d'un chien ou d'un chat change l'ambiance générale d'une entreprise : elle réduit les tensions entre collègues, ce qui n'est pas négligeable car chaque année, l'État français dépense entre 2 et 3 milliards d'euros pour soigner les salariés malades du stress. Selon une enquête, un quart des employés pensent aussi que la présence des animaux permet d'être plus motivé au travail."
        },
        document2: {
          titre: "Témoignage d'Iris, 34 ans",
          contenu: "« Dans l'entreprise où je travaille, les employés sont autorisés à venir avec leur animal de compagnie, chat ou chien. Personnellement, cela me dérange. Je ne suis pas très à l'aise avec les animaux, qui peuvent avoir des comportements imprévisibles. D'autre part, je trouve que cela peut poser des problèmes de santé. Que faire si un employé est allergique aux chats ? Sera-t-il obligé de rester enfermé dans son bureau ? Et puis c'est aussi une source de distraction. Mes collègues et moi ne serons pas plus productifs grâce à un chien ou un chat ! »"
        }
      }
    },
    {
      id: 2,
      numero: "Combinaison 2",
      tache1: {
        titre: "Réclamation produit défectueux",
        description: "Vous avez acheté un appareil électronique qui ne fonctionne pas correctement. Vous écrivez un courriel au service client pour expliquer le problème et demander une solution (échange, remboursement, réparation).",
        mots: "60-120 mots",
        type: "Courriel de réclamation"
      },
      tache2: {
        titre: "Découverte d'un nouveau quartier",
        description: "Vous avez récemment déménagé dans un nouveau quartier. Sur les réseaux sociaux, vous partagez vos premières impressions et vous recommandez les lieux intéressants que vous avez découverts.",
        mots: "120-150 mots",
        type: "Publication réseaux sociaux"
      },
      tache3: {
        titre: "Le télétravail : avantages et inconvénients",
        description: "Votre entreprise envisage de généraliser le télétravail. Rédigez un texte argumenté pour donner votre opinion en vous appuyant sur les documents fournis.",
        mots: "120-180 mots",
        type: "Texte argumentatif",
        document1: {
          titre: "Les avantages du télétravail",
          contenu: "Le télétravail présente de nombreux avantages tant pour les employés que pour les entreprises. Pour les salariés, il permet une meilleure conciliation entre vie professionnelle et vie privée, une réduction du temps de transport et des économies substantielles. Les entreprises, quant à elles, peuvent réduire leurs coûts immobiliers et accéder à un bassin de talents plus large. Une étude récente montre que 78% des télétravailleurs se déclarent plus productifs à domicile, bénéficiant d'un environnement moins stressant et de moins d'interruptions."
        },
        document2: {
          titre: "Les défis du travail à distance",
          contenu: "« Après deux ans de télétravail, je ressens un véritable isolement social. Les échanges informels avec les collègues me manquent énormément. De plus, la frontière entre vie privée et professionnelle devient floue : je travaille souvent plus tard le soir. Sans compter les problèmes techniques récurrents et la difficulté à collaborer efficacement sur certains projets complexes. » — Marc, chef de projet, 42 ans"
        }
      }
    },
    {
      id: 3,
      numero: "Combinaison 3",
      tache1: {
        titre: "Demande d'informations cours de langue",
        description: "Vous souhaitez vous inscrire à des cours de français dans une école de langues. Vous écrivez un courriel pour demander des informations sur les horaires, les tarifs et les niveaux proposés.",
        mots: "60-120 mots",
        type: "Courriel d'information"
      },
      tache2: {
        titre: "Expérience culinaire",
        description: "Vous avez testé un nouveau restaurant dans votre ville. Sur votre blog culinaire, vous décrivez votre expérience et vous donnez votre avis sur la qualité des plats et du service.",
        mots: "120-150 mots",
        type: "Critique culinaire"
      },
      tache3: {
        titre: "L'impact des réseaux sociaux sur les jeunes",
        description: "Un débat s'ouvre sur l'influence des réseaux sociaux sur la jeunesse. Rédigez votre point de vue en vous appuyant sur les documents fournis.",
        mots: "120-180 mots",
        type: "Texte argumentatif",
        document1: {
          titre: "Les réseaux sociaux : outil de connexion",
          contenu: "Les réseaux sociaux permettent aux jeunes de maintenir des liens avec leurs amis et leur famille, même à distance. Ils offrent également des opportunités d'apprentissage et de découverte de nouvelles cultures. De nombreux jeunes utilisent ces plateformes pour développer leur créativité, partager leurs passions et même créer des opportunités professionnelles. Les réseaux sociaux peuvent aussi servir de support pour des causes importantes et sensibiliser à des enjeux sociétaux."
        },
        document2: {
          titre: "Les risques pour la santé mentale",
          contenu: "« Ma fille de 16 ans passe plus de 6 heures par jour sur les réseaux sociaux. Je remarque qu'elle compare constamment sa vie à celle des autres et développe des complexes. Elle a des troubles du sommeil et ses notes ont chuté. Les réseaux sociaux créent une addiction réelle et exposent les jeunes au cyberharcèlement. » — Sophie, mère de famille"
        }
      }
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 mt-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-lg text-gray-600">Chargement des sujets...</p>
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-12">
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg my-8" role="alert">
              <strong className="font-bold">Erreur :</strong>
              <span className="block sm:inline ml-1">{error}</span>
              <p className="mt-2">Les sujets d'exemple sont affichés à la place.</p>
            </div>
          </div>
        ) : null}
        
        {/* Breadcrumb et Header */}
        <section className="w-full py-8 bg-white border-b">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/expression-ecrite-tcf" className="hover:text-orange-600">
                Expression Écrite TCF
              </Link>
              <span>/</span>
              <Link href="/expression-ecrite-tcf/sujets-actualite" className="hover:text-orange-600">
                Sujets d'Actualité
              </Link>
              <span>/</span>
              <span className="text-gray-900">{periodData?.title || "Juin 2025"}</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" asChild>
                <Link href="/expression-ecrite-tcf/sujets-actualite">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux sujets
                </Link>
              </Button>
            </div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium text-sm">
                  {periodData?.title || "Juin 2025"}
                </div>
                <Badge variant="outline" className="border-orange-200 text-orange-700">
                  {combinaisons.length} combinaisons
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Expression Écrite {periodData?.title || "Juin 2025"}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Découvrez les sujets d'actualité pour l'expression écrite du TCF Canada. 
                Chaque combinaison comprend les 3 tâches avec des thèmes variés et actuels.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Informations générales */}
        <section className="w-full py-12 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Sujets d'Actualité - {periodData?.title || "Juin 2025"}
                  </h1>
                  <div className="text-sm text-gray-600">Combinaisons</div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">60 min</div>
                  <div className="text-sm text-gray-600">Durée totale</div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">3</div>
                  <div className="text-sm text-gray-600">Tâches par combinaison</div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3">
                    <BookOpen className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">360</div>
                  <div className="text-sm text-gray-600">Mots maximum</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Liste des combinaisons */}
        <section className="w-full py-16 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="space-y-12">
                {combinaisons.map((combinaison, index) => (
                  <motion.div
                    key={combinaison.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="overflow-hidden border-t-4 border-t-orange-500">
                      <CardHeader className="bg-orange-50">
                        <CardTitle className="text-2xl flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold">
                            {combinaison.id}
                          </div>
                          {combinaison.numero}
                        </CardTitle>
                        <CardDescription>
                          Entraînez-vous avec cette combinaison complète des 3 tâches
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Tabs defaultValue="tache1" className="w-full">
                          <TabsList className="grid w-full grid-cols-3 rounded-none">
                            <TabsTrigger value="tache1" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
                              Tâche 1
                            </TabsTrigger>
                            <TabsTrigger value="tache2" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
                              Tâche 2
                            </TabsTrigger>
                            <TabsTrigger value="tache3" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
                              Tâche 3
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="tache1" className="p-6 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-semibold">{combinaison.tache1?.titre ?? ''}</h3>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="border-orange-200 text-orange-700">
                                  {combinaison.tache1?.mots ?? ''}
                                </Badge>
                                <Badge variant="secondary">{combinaison.tache1?.type ?? ''}</Badge>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-gray-700 leading-relaxed">
                                {combinaison.tache1?.description ?? ''}
                              </p>
                            </div>
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                onClick={() => window.location.href = `https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite la correction de la Tâche 1 - ${combinaison.tache1?.titre ?? 'Tâche 1'} (${combinaison.numero}).`}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Demander la correction
                              </Button>
                            </div>
                          </TabsContent>

                          <TabsContent value="tache2" className="p-6 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-semibold">{combinaison.tache2?.titre ?? ''}</h3>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="border-orange-200 text-orange-700">
                                  {combinaison.tache2?.mots ?? ''}
                                </Badge>
                                <Badge variant="secondary">{combinaison.tache2?.type ?? ''}</Badge>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-gray-700 leading-relaxed">
                                {combinaison.tache2?.description ?? ''}
                              </p>
                            </div>
                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                onClick={() => window.location.href = `https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite la correction de la Tâche 2 - ${combinaison.tache2?.titre ?? 'Tâche 2'} (${combinaison.numero}).`}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Demander la correction
                              </Button>
                            </div>
                          </TabsContent>

                          <TabsContent value="tache3" className="p-6 space-y-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-semibold">{combinaison.tache3?.titre ?? ''}</h3>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="border-orange-200 text-orange-700">
                                  {combinaison.tache3?.mots ?? ''}
                                </Badge>
                                <Badge variant="secondary">{combinaison.tache3?.type ?? ''}</Badge>
                              </div>
                            </div>
                            
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                              <p className="text-gray-700 leading-relaxed">
                                {combinaison.tache3?.description ?? ''}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Card className="border-orange-200">
                                <CardHeader className="bg-orange-50">
                                  <CardTitle className="text-lg">Document 1</CardTitle>
                                  <CardDescription>{combinaison.tache3?.document1?.titre ?? ''}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {combinaison.tache3?.document1?.contenu ?? ''}
                                  </p>
                                </CardContent>
                              </Card>

                              <Card className="border-orange-200">
                                <CardHeader className="bg-orange-50">
                                  <CardTitle className="text-lg">Document 2</CardTitle>
                                  <CardDescription>{combinaison.tache3?.document2?.titre ?? ''}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {combinaison.tache3?.document2?.contenu ?? ''}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>

                            <div className="flex justify-end">
                              <Button 
                                variant="outline" 
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                onClick={() => window.location.href = `https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite la correction de la Tâche 3 - ${combinaison.tache3?.titre ?? 'Tâche 3'} (${combinaison.numero}).`}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Demander la correction
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Conseils pratiques */}
        <section className="w-full py-16 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Conseils pour {periodData?.title || "Juin 2025"}
                </h2>
                <p className="text-lg text-gray-600">
                  Optimisez votre préparation avec ces recommandations spécifiques
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="border-t-4 border-t-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                      Thèmes récurrents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Vie professionnelle et télétravail</li>
                      <li>• Impact de la technologie</li>
                      <li>• Bien-être et santé mentale</li>
                      <li>• Relations sociales modernes</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-t-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-orange-600" />
                      Stratégies gagnantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Structurez vos arguments clairement</li>
                      <li>• Utilisez des exemples concrets</li>
                      <li>• Respectez le nombre de mots</li>
                      <li>• Soignez les transitions</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-t-4 border-t-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-orange-600" />
                      Points d'attention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Adaptez le registre de langue</li>
                      <li>• Variez votre vocabulaire</li>
                      <li>• Vérifiez la cohérence</li>
                      <li>• Relisez attentivement</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-12 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="max-w-2xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Besoin d'aide pour ces sujets ?
              </h2>
              <p className="text-lg text-orange-100 mb-8">
                Nos formateurs experts vous accompagnent avec des corrections personnalisées 
                et des conseils adaptés à votre niveau.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/expression-ecrite-tcf/formations">
                    <Users className="h-5 w-5 mr-2" />
                    Découvrir nos Formations
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-orange-600"
                  onClick={() => window.location.href = `https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite des corrections pour les sujets d'expression écrite de ${periodData?.title || "Juin 2025"}.`}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Demander des Corrections
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, FileText, CheckCircle, AlertCircle, Lightbulb, Target } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";

export default function MethodologiePage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const tasks = [
    {
      id: "tache1",
      title: "Tâche 1 - Message Personnel",
      duration: "15-20 minutes",
      wordCount: "60-120 mots",
      description: "Rédaction d'un message pour décrire, raconter et/ou expliquer",
      color: "blue"
    },
    {
      id: "tache2", 
      title: "Tâche 2 - Article/Courrier",
      duration: "20-25 minutes",
      wordCount: "120-150 mots",
      description: "Rédiger un article, courrier ou note avec un objectif précis",
      color: "green"
    },
    {
      id: "tache3",
      title: "Tâche 3 - Synthèse et Opinion",
      duration: "20-25 minutes", 
      wordCount: "120-180 mots",
      description: "Comparer deux opinions et exprimer votre point de vue",
      color: "purple"
    }
  ];

  const evaluationCriteria = [
    "Communiquer un message de façon claire",
    "Donner les informations demandées",
    "Décrire, raconter, expliquer",
    "Justifier un choix, une position, une décision",
    "Enchaîner des idées et faire preuve de cohérence",
    "Comparer deux points de vue",
    "Exprimer votre avis et l'argumenter",
    "Utiliser un vocabulaire et des structures adaptés",
    "Être capable de faire une synthèse et de reformuler"
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        {/* Breadcrumb et Header */}
        <section className="w-full py-8 bg-white border-b">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/expression-ecrite-tcf" className="hover:text-blue-600">
                Expression Écrite TCF
              </Link>
              <span>/</span>
              <span className="text-gray-900">Méthodologie</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" asChild>
                <Link href="/expression-ecrite-tcf">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>
            </div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Méthodologie Expression Écrite TCF Canada
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Maîtrisez les techniques et stratégies pour exceller dans les 3 tâches de l'expression écrite du TCF Canada.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Informations générales */}
        <section className="w-full py-12 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="text-center">
                  <CardHeader>
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <CardTitle>Durée</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">60 min</p>
                    <p className="text-gray-600">Pour les 3 tâches</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardHeader>
                    <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <CardTitle>Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">3 Tâches</p>
                    <p className="text-gray-600">Difficulté croissante</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardHeader>
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <CardTitle>Objectif</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">C1</p>
                    <p className="text-gray-600">Niveau visé</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Critères d'évaluation */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Critères d'Évaluation
              </h2>
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Vous êtes évalué sur vos capacités à :
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {evaluationCriteria.map((criteria, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{criteria}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Détail des tâches */}
        <section className="w-full py-12 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                Les 3 Tâches en Détail
              </h2>
              
              <Tabs defaultValue="tache1" className="max-w-6xl mx-auto">
                <TabsList className="grid w-full grid-cols-3">
                  {tasks.map((task) => (
                    <TabsTrigger key={task.id} value={task.id} className="text-sm">
                      {task.title.split(' - ')[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="tache1" className="mt-8">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-xl">Tâche 1 - Message Personnel</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">60-120 mots</Badge>
                          <Badge variant="outline">15-20 min</Badge>
                        </div>
                      </div>
                      <CardDescription>
                        Rédaction d'un message pour décrire, raconter et/ou expliquer, adressé à un ou plusieurs destinataires.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Structure du message
                        </h4>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                          <li><strong>Objet :</strong> Titre clair du message (ex: "Mes congés à Marrakech")</li>
                          <li><strong>Salutations :</strong> Formule d'ouverture adaptée au destinataire</li>
                          <li><strong>Objectif général :</strong> Raison du message</li>
                          <li><strong>Détails :</strong> Qui ? Quoi ? Quand ? Où ? Avec qui ?</li>
                          <li><strong>Attentes concrètes :</strong> Ce que vous demandez au destinataire</li>
                          <li><strong>Formule de politesse :</strong> Remerciements, recommandations</li>
                          <li><strong>Formule d'au revoir :</strong> Adaptée au registre</li>
                        </ol>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          Conseils pratiques
                        </h5>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Adaptez le registre de langue au destinataire</li>
                          <li>• Respectez la structure du message</li>
                          <li>• Soyez précis dans les détails demandés</li>
                          <li>• Vérifiez le nombre de mots (60-120)</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tache2" className="mt-8">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-xl">Tâche 2 - Article/Courrier</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">120-150 mots</Badge>
                          <Badge variant="outline">20-25 min</Badge>
                        </div>
                      </div>
                      <CardDescription>
                        Rédiger un article, courrier ou note avec un objectif précis (attirer, convaincre, réconcilier, etc.).
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          Structure recommandée
                        </h4>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                          <li><strong>Titre accrocheur :</strong> Captez l'attention du lecteur</li>
                          <li><strong>Introduction :</strong> Présentation succincte et séduisante du sujet</li>
                          <li><strong>Développement :</strong> Votre expérience personnelle et détails</li>
                          <li><strong>Conclusion :</strong> Recommandations et incitation à l'action</li>
                        </ol>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          Points clés
                        </h5>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Identifiez clairement l'objectif (convaincre, attirer, etc.)</li>
                          <li>• Adaptez le ton au type de document</li>
                          <li>• Utilisez des exemples concrets</li>
                          <li>• Terminez par un appel à l'action</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tache3" className="mt-8">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-xl">Tâche 3 - Synthèse et Opinion</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">120-180 mots</Badge>
                          <Badge variant="outline">20-25 min</Badge>
                        </div>
                      </div>
                      <CardDescription>
                        Comparer deux documents avec des opinions différentes et exprimer votre point de vue.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          Structure obligatoire
                        </h4>
                        <div className="space-y-4">
                          <div className="border-l-4 border-purple-500 pl-4">
                            <h5 className="font-medium">1. Titre</h5>
                            <p className="text-sm text-gray-600">Titre accrocheur qui résume le débat</p>
                          </div>
                          <div className="border-l-4 border-purple-500 pl-4">
                            <h5 className="font-medium">2. Synthèse (40-60 mots)</h5>
                            <p className="text-sm text-gray-600">Résumé objectif des deux points de vue</p>
                          </div>
                          <div className="border-l-4 border-purple-500 pl-4">
                            <h5 className="font-medium">3. Opinion personnelle (80-120 mots)</h5>
                            <p className="text-sm text-gray-600">Votre position argumentée sur le sujet</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-purple-600" />
                          Attention
                        </h5>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Respectez impérativement la répartition des mots</li>
                          <li>• Restez objectif dans la synthèse</li>
                          <li>• Argumentez votre opinion avec des exemples</li>
                          <li>• Utilisez des connecteurs logiques</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 bg-blue-600">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div 
              className="text-center text-white"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Prêt à mettre en pratique ?
              </h2>
              <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">
                Maintenant que vous connaissez la méthodologie, entraînez-vous avec nos sujets d'actualité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  asChild
                >
                  <Link href="/expression-ecrite-tcf/sujets-actualite">
                    Voir les sujets d'actualité
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-blue-600"
                  asChild
                >
                  <Link href="/expression-ecrite-tcf/formations">
                    Découvrir nos formations
                  </Link>
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

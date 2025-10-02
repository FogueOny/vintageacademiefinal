"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mic, Clock, Users, Target, CheckCircle, Star, MessageCircle, Calendar, Award } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";

export default function MethodologieOraleePage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const taches = [
    {
      id: "tache1",
      title: "Tâche 1 - Entretien dirigé",
      duration: "2 minutes",
      description: "Questions personnelles simples pour vous mettre à l'aise",
      objectif: "Montrer votre capacité à parler de vous de manière simple et claire",
      structure: [
        "Présentation personnelle",
        "Questions sur votre parcours",
        "Vos goûts et préférences",
        "Vos projets futurs"
      ],
      conseils: [
        "Restez naturel et détendu",
        "Répondez de manière concise mais complète",
        "Utilisez un vocabulaire simple mais précis",
        "Montrez votre personnalité"
      ],
      exemples: [
        "Pouvez-vous vous présenter ?",
        "Que faites-vous dans la vie ?",
        "Quels sont vos loisirs ?",
        "Pourquoi voulez-vous aller au Canada ?"
      ]
    },
    {
      id: "tache2", 
      title: "Tâche 2 - Exercice en interaction",
      duration: "5 minutes 30",
      description: "Jeu de rôle avec l'examinateur dans une situation de la vie quotidienne",
      objectif: "Démontrer votre capacité à interagir efficacement dans des situations concrètes",
      structure: [
        "Lecture de la consigne (1 min)",
        "Préparation mentale",
        "Interaction avec l'examinateur (4 min 30)",
        "Adaptation aux réactions de l'interlocuteur"
      ],
      conseils: [
        "Lisez attentivement la situation",
        "Identifiez votre rôle et vos objectifs",
        "Posez des questions pour clarifier",
        "Adaptez-vous aux réponses de l'examinateur",
        "Utilisez des formules de politesse appropriées"
      ],
      exemples: [
        "Vous voulez échanger un article dans un magasin",
        "Vous cherchez un logement et appelez une agence",
        "Vous organisez une sortie avec des amis",
        "Vous vous plaignez d'un service défaillant"
      ]
    },
    {
      id: "tache3",
      title: "Tâche 3 - Expression d'un point de vue", 
      duration: "4 minutes 30",
      description: "Présentation et défense d'un point de vue sur un sujet de société",
      objectif: "Exprimer clairement votre opinion et l'argumenter de manière convaincante",
      structure: [
        "Préparation (10 minutes)",
        "Présentation du sujet (1 min)",
        "Développement de votre point de vue (2 min)",
        "Réponses aux questions de l'examinateur (1 min 30)"
      ],
      conseils: [
        "Choisissez une position claire",
        "Structurez votre argumentation",
        "Utilisez des exemples concrets",
        "Anticipez les objections",
        "Restez cohérent dans votre discours"
      ],
      exemples: [
        "L'impact des réseaux sociaux sur les jeunes",
        "Le télétravail : avantages et inconvénients",
        "L'importance de la protection de l'environnement",
        "Le rôle de l'éducation dans la société moderne"
      ]
    }
  ];

  const criteres = [
    {
      nom: "Adéquation sociolinguistique",
      description: "Adaptation du registre de langue au contexte",
      points: [
        "Utilisation du vouvoiement/tutoiement approprié",
        "Formules de politesse adaptées",
        "Registre de langue cohérent",
        "Respect des codes sociaux"
      ]
    },
    {
      nom: "Correction linguistique",
      description: "Maîtrise de la grammaire et du vocabulaire",
      points: [
        "Grammaire correcte",
        "Vocabulaire précis et varié",
        "Prononciation claire",
        "Structures syntaxiques appropriées"
      ]
    },
    {
      nom: "Aisance et interaction",
      description: "Fluidité du discours et capacité d'échange",
      points: [
        "Débit de parole naturel",
        "Peu d'hésitations",
        "Capacité à maintenir l'interaction",
        "Réactivité aux questions"
      ]
    },
    {
      nom: "Cohérence et cohésion",
      description: "Organisation logique du discours",
      points: [
        "Idées bien organisées",
        "Utilisation de connecteurs",
        "Progression logique",
        "Conclusion appropriée"
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        {/* Breadcrumb et Header */}
        <section className="w-full py-8 bg-white border-b">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Link href="/expression-orale-tcf" className="hover:text-blue-600">
                Expression Orale TCF
              </Link>
              <span>/</span>
              <span className="text-gray-900">Méthodologie</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" asChild>
                <Link href="/expression-orale-tcf">
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
                Méthodologie Expression Orale TCF Canada
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Maîtrisez les techniques et stratégies pour exceller dans les 3 tâches 
                de l'expression orale du TCF Canada.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Vue d'ensemble */}
        <section className="w-full py-12 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="max-w-4xl mx-auto text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Vue d'ensemble de l'épreuve
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  L'expression orale du TCF Canada évalue votre capacité à communiquer 
                  efficacement en français dans différentes situations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center">
                  <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Durée totale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 mb-2">12 minutes</div>
                    <p className="text-gray-600">+ 10 minutes de préparation pour la tâche 3</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>3 Tâches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 mb-2">Progressives</div>
                    <p className="text-gray-600">De la plus simple à la plus complexe</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>Évaluation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600 mb-2">4 Critères</div>
                    <p className="text-gray-600">Notation sur l'échelle CECRL</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Détail des tâches */}
        <section className="w-full py-16 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Les 3 Tâches en Détail
                </h2>
                <p className="text-lg text-gray-600">
                  Découvrez la structure, les objectifs et les stratégies pour chaque tâche
                </p>
              </div>

              <Tabs defaultValue="tache1" className="max-w-6xl mx-auto">
                <TabsList className="grid w-full grid-cols-3">
                  {taches.map((tache) => (
                    <TabsTrigger key={tache.id} value={tache.id}>
                      {tache.title.split(' - ')[0]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {taches.map((tache) => (
                  <TabsContent key={tache.id} value={tache.id} className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{tache.title}</CardTitle>
                          <Badge variant="outline">{tache.duration}</Badge>
                        </div>
                        <CardDescription className="text-lg">
                          {tache.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-blue-50 p-4 rounded-lg mb-6">
                          <h4 className="font-semibold text-blue-900 mb-2">Objectif :</h4>
                          <p className="text-blue-800">{tache.objectif}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3">Structure de la tâche :</h4>
                            <ul className="space-y-2">
                              {tache.structure.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                                  <span className="text-gray-700">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-3">Conseils stratégiques :</h4>
                            <ul className="space-y-2">
                              {tache.conseils.map((conseil, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Star className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                                  <span className="text-gray-700">{conseil}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="font-semibold mb-3">Exemples de sujets :</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {tache.exemples.map((exemple, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-700 italic">"{exemple}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          </div>
        </section>

        {/* Critères d'évaluation */}
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
                  Critères d'Évaluation
                </h2>
                <p className="text-lg text-gray-600">
                  Comprenez sur quoi vous serez évalué pour optimiser votre performance
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                {criteres.map((critere, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{critere.nom}</CardTitle>
                        <CardDescription>{critere.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {critere.points.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-gray-700">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Conseils pratiques */}
        <section className="w-full py-16 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Conseils Pratiques pour Réussir
                  </h2>
                  <p className="text-lg text-gray-600">
                    Des stratégies éprouvées pour optimiser votre performance le jour J
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Avant l'épreuve
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Pratiquez régulièrement l'expression orale</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Enregistrez-vous pour analyser votre prononciation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Enrichissez votre vocabulaire thématique</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Familiarisez-vous avec l'actualité canadienne</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-green-600" />
                        Pendant l'épreuve
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Restez calme et confiant</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Écoutez attentivement les consignes</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Gérez votre temps efficacement</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>N'hésitez pas à demander des clarifications</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-12 bg-blue-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="max-w-2xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Besoin d'un accompagnement personnalisé ?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Nos formateurs experts vous aident à maîtriser parfaitement 
                chaque aspect de l'expression orale.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/expression-orale-tcf/formations">
                    <Users className="h-5 w-5 mr-2" />
                    Découvrir nos Formations
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite des informations sur la méthodologie d'expression orale TCF Canada."}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Nous Contacter
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
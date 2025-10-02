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

export default function FormationsOraleePage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  // Données supprimées - remplacées par la section de prise de rendez-vous

  const objectifs = [
    "Maîtrise parfaite des 3 tâches d'expression orale",
    "Développement de la confiance en soi à l'oral",
    "Amélioration de la prononciation et de l'intonation",
    "Techniques de gestion du stress et du trac",
    "Enrichissement du vocabulaire et des expressions",
    "Stratégies d'argumentation et de persuasion"
  ];

  const profils = [
    {
      niveau: "Débutant (A2-B1)",
      description: "Vous avez des bases en français mais manquez de confiance à l'oral",
      besoins: [
        "Améliorer la fluidité du discours",
        "Enrichir le vocabulaire de base",
        "Gagner en confiance",
        "Maîtriser les situations simples"
      ]
    },
    {
      niveau: "Intermédiaire (B1-B2)",
      description: "Vous vous exprimez correctement mais souhaitez perfectionner votre technique",
      besoins: [
        "Structurer efficacement vos idées",
        "Développer l'argumentation",
        "Améliorer la prononciation",
        "Gérer les situations complexes"
      ]
    },
    {
      niveau: "Avancé (B2-C1)",
      description: "Vous maîtrisez bien le français et visez l'excellence au TCF",
      besoins: [
        "Perfectionner les nuances linguistiques",
        "Optimiser la gestion du temps",
        "Développer l'aisance naturelle",
        "Atteindre un niveau natif"
      ]
    }
  ];

  const methodologie = [
    {
      etape: "1. Évaluation initiale",
      description: "Test de positionnement complet pour identifier vos forces et axes d'amélioration",
      duree: "1h"
    },
    {
      etape: "2. Programme personnalisé",
      description: "Création d'un plan de formation adapté à votre niveau et vos objectifs",
      duree: "30min"
    },
    {
      etape: "3. Sessions de pratique",
      description: "Entraînement intensif sur les 3 tâches avec simulations d'examen",
      duree: "Variable"
    },
    {
      etape: "4. Corrections détaillées",
      description: "Analyse approfondie de vos performances avec conseils personnalisés",
      duree: "30min/session"
    },
    {
      etape: "5. Suivi continu",
      description: "Accompagnement jusqu'à votre réussite avec ajustements du programme",
      duree: "Continu"
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
              <span className="text-gray-900">Formations</span>
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
                Formations Expression Orale TCF Canada
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Développez votre aisance à l'oral et maîtrisez parfaitement les 3 tâches 
                de l'expression orale du TCF Canada avec nos formations personnalisées.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Objectifs de la Formation */}
        <section className="w-full py-16 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Objectifs de la Formation
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Notre formation vous prépare de manière complète et efficace 
                  à exceller dans l'épreuve d'expression orale.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {objectifs.map((objectif, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full text-center">
                      <CardContent className="pt-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                          <CheckCircle className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-gray-700">{objectif}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Profil et Prérequis */}
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
                    Profil et Prérequis
                  </h2>
                  <CardDescription>
                    Nos formations s'adaptent à tous les niveaux
                  </CardDescription>
                </div>

                <div className="space-y-6">
                  {profils.map((profil, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Badge variant="outline">{profil.niveau}</Badge>
                          </CardTitle>
                          <CardDescription>{profil.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <h4 className="font-semibold mb-3">Besoins spécifiques :</h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {profil.besoins.map((besoin, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-700">{besoin}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Méthodologie */}
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
                  Notre Méthodologie
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Une approche structurée et progressive pour garantir votre réussite
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                  {methodologie.map((etape, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">{etape.etape}</h3>
                                <Badge variant="outline">{etape.duree}</Badge>
                              </div>
                              <p className="text-gray-600">{etape.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Prise de Rendez-vous */}
        <section className="w-full py-16 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Formations Personnalisées
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Chaque candidat est unique. Nous adaptons nos formations à votre niveau, 
                  vos objectifs et votre rythme d'apprentissage.
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <Card className="overflow-hidden border-t-4 border-t-blue-500 hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Calendar className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Prenez Rendez-vous pour une Consultation Gratuite
                      </h3>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Discutons de vos besoins spécifiques en expression orale et 
                        définissons ensemble le programme qui vous mènera au succès.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                          Consultation en Ligne
                        </h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Test oral de positionnement</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Analyse de vos points forts/faibles</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Programme d'entraînement personnalisé</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Tarifs adaptés à votre budget</span>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Rendez-vous en Bureau
                        </h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Simulation complète d'examen oral</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Évaluation détaillée en face-à-face</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Présentation des méthodes de travail</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Planning détaillé de formation</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            Consultation gratuite • Sans engagement
                          </span>
                        </div>
                        <p className="text-gray-600">
                          Prenez le temps de nous connaître avant de vous engager. 
                          Notre première consultation est entièrement gratuite.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button 
                          size="lg"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                          onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite prendre rendez-vous pour une consultation gratuite concernant les formations d'expression orale TCF Canada. Je préfère un rendez-vous en bureau."}
                        >
                          <Calendar className="h-5 w-5 mr-2" />
                          Rendez-vous en Bureau
                        </Button>
                        <Button 
                          size="lg"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
                          onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite prendre rendez-vous pour une consultation gratuite en ligne concernant les formations d'expression orale TCF Canada."}
                        >
                          <MessageCircle className="h-5 w-5 mr-2" />
                          Consultation en Ligne
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pendant la Formation */}
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
                  Pendant la Formation
                </h2>
                <p className="text-lg text-gray-600">
                  Un accompagnement complet pour maximiser vos chances de réussite
                </p>
              </div>

              <Tabs defaultValue="suivi" className="max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="suivi">Suivi Particulier</TabsTrigger>
                  <TabsTrigger value="equilibre">Équilibre Théorie/Pratique</TabsTrigger>
                  <TabsTrigger value="travail">Travail Personnel</TabsTrigger>
                </TabsList>

                <TabsContent value="suivi" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Accompagnement Personnalisé
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Sessions individuelles avec formateur expert</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Corrections audio détaillées de vos productions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Suivi de progression avec objectifs mesurables</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Disponibilité du formateur entre les sessions</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="equilibre" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-600" />
                        Approche Équilibrée
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>30% théorie : méthodologie et techniques</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>70% pratique : simulations et exercices</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Entraînement progressif sur les 3 tâches</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Mise en situation réelle d'examen</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="travail" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-600" />
                        Travail Personnel Guidé
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Exercices personnalisés entre les sessions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Enregistrements audio à analyser</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Lectures et ressources complémentaires</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <span>Auto-évaluation avec grilles de correction</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </section>

        {/* Call to Action Final */}
        <section className="w-full py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Prêt à commencer votre formation ?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Rejoignez les centaines de candidats qui ont réussi leur TCF Canada 
                grâce à notre accompagnement personnalisé.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/expression-orale-tcf/methodologie">
                    <Mic className="h-5 w-5 mr-2" />
                    Découvrir la Méthodologie
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-600"
                  onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite commencer une formation d'expression orale TCF Canada."}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Commencer Maintenant
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

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, Target, Users, Clock, Calendar, CheckCircle, Star, Award, TrendingUp, MessageCircle } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";

export default function FormationsPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const objectifs = [
    "Passation d'un examen blanc avec correction individualisée",
    "Présentation complète de l'examen TCF Canada",
    "Programme adapté aux besoins du candidat",
    "Identification des forces et faiblesses",
    "Familiarisation avec la forme et le contenu des épreuves",
    "Maîtrise des structures d'expression écrite",
    "Entraînement intensif avec exercices représentatifs",
    "Apprentissage de la gestion du temps"
  ];

  const prerequis = [
    "Niveau d'entrée supérieur à B1",
    "Test de positionnement obligatoire (gratuit)",
    "Autonomie informatique requise",
    "Ordinateur avec webcam et connexion internet",
    "Motivation et engagement personnel"
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
              <span className="text-gray-900">Formations</span>
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
                Formations Expression Écrite TCF Canada
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Formations personnalisées avec suivi individuel pour maximiser vos chances de réussite 
                au TCF Canada. Choisissez la formule qui correspond à vos besoins.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Objectifs et Prérequis */}
        <section className="w-full py-12 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <Tabs defaultValue="objectifs" className="max-w-6xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="objectifs">Objectifs de la Formation</TabsTrigger>
                  <TabsTrigger value="prerequis">Profil et Prérequis</TabsTrigger>
                </TabsList>

                <TabsContent value="objectifs" className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Objectifs de la Formation
                      </CardTitle>
                      <CardDescription>
                        Ce que vous allez acquérir pendant votre formation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {objectifs.map((objectif, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">{objectif}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="prerequis" className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        Profil et Prérequis
                      </CardTitle>
                      <CardDescription>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Public cible :</h4>
                          <p className="text-gray-700 mb-4">
                            Francophone ou non-francophone ayant besoin d'évaluer ses connaissances en français 
                            pour des raisons personnelles, universitaires ou professionnelles.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Prérequis techniques et pédagogiques :</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {prerequis.map((prerequis, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <CheckCircle className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                                <span className="text-gray-700">{prerequis}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
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
                        Discutons de vos besoins et définissons ensemble le programme 
                        de formation qui vous mènera au succès.
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
                            <span className="text-gray-700">Évaluation de votre niveau actuel</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Définition de vos objectifs</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Programme personnalisé</span>
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
                            <span className="text-gray-700">Rencontre personnalisée</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Test de positionnement sur place</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Présentation des supports</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Planification détaillée</span>
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
                          onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite prendre rendez-vous pour une consultation gratuite concernant les formations d'expression écrite TCF Canada. Je préfère un rendez-vous en bureau."}
                        >
                          <Calendar className="h-5 w-5 mr-2" />
                          Rendez-vous en Bureau
                        </Button>
                        <Button 
                          size="lg"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
                          onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite prendre rendez-vous pour une consultation gratuite en ligne concernant les formations d'expression écrite TCF Canada."}
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
        <section className="w-full py-12 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                  Pendant la Formation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="text-center">
                    <CardHeader>
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <CardTitle className="text-lg">Suivi Particulier</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Nous offrons un suivi particulier à chacun de nos candidats et nous nous assurons 
                        de leur progrès dans les différentes épreuves du TCF.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardHeader>
                      <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <CardTitle className="text-lg">Équilibre Théorie/Pratique</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Nos cours respectent l'équilibre entre la théorie et la pratique dans le but 
                        de mieux vous aider à préparer votre test.
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardHeader>
                      <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <CardTitle className="text-lg">Travail Personnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Selon le déroulement de la formation, vous devrez prévoir d'envoyer le travail 
                        personnel réalisé après chaque séance.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 bg-blue-600">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div 
              className="text-center text-white"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Prêt à commencer votre formation ?
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                Contactez-nous pour un test de positionnement gratuit et choisissez la formation 
                qui vous convient le mieux.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite passer le test de positionnement gratuit pour les formations d'expression écrite TCF Canada."}
                >
                  Test de positionnement gratuit
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-blue-600"
                  onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1"}
                >
                  Parler à un conseiller
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

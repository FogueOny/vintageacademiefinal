"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Monitor, Clock, Target, CheckCircle, Calendar, Bell, Wrench } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";

export default function SimulateurPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const features = [
    {
      icon: Clock,
      title: "Conditions réelles",
      description: "Chronomètre de 60 minutes comme au vrai test"
    },
    {
      icon: Target,
      title: "3 Tâches complètes",
      description: "Entraînement sur les 3 tâches du TCF Canada"
    },
    {
      icon: CheckCircle,
      title: "Correction automatique",
      description: "Évaluation instantanée de vos productions"
    },
    {
      icon: Monitor,
      title: "Interface moderne",
      description: "Plateforme intuitive et responsive"
    }
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
              <span className="text-gray-900">Simulateur</span>
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
                Simulateur Expression Écrite TCF Canada
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Entraînez-vous dans des conditions réelles avec notre simulateur interactif. 
                Bientôt disponible pour une préparation optimale.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Coming Soon Hero */}
        <section className="w-full py-16 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-block p-4 bg-orange-100 rounded-full mb-6">
                <Wrench className="h-12 w-12 text-orange-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Bientôt Disponible
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Notre équipe travaille activement sur le développement du simulateur. 
                Il sera bientôt prêt pour vous offrir la meilleure expérience d'entraînement.
              </p>
              <div className="inline-flex items-center gap-2 bg-orange-200 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Lancement prévu : Q2 2025
              </div>
            </motion.div>
          </div>
        </section>

        {/* Fonctionnalités à venir */}
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
                  Fonctionnalités du Simulateur
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Découvrez ce qui vous attend avec notre simulateur interactif
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card className="text-center h-full">
                        <CardHeader>
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                            <IconComponent className="h-6 w-6 text-blue-600" />
                          </div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600">{feature.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Aperçu des fonctionnalités */}
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-center">
                      Ce que vous pourrez faire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Entraînement complet</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Simulation des 3 tâches en 60 minutes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Sujets variés et actualisés</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Interface identique au vrai test</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Compteur de mots en temps réel</span>
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Analyse et suivi</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Correction automatique intelligente</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Statistiques détaillées</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Historique des performances</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-gray-700">Conseils personnalisés</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Notification */}
        <section className="w-full py-12 bg-blue-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="max-w-2xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    Être notifié du lancement
                  </CardTitle>
                  <CardDescription>
                    Soyez parmi les premiers à tester notre simulateur
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Contactez-nous pour être informé dès que le simulateur sera disponible. 
                    Vous bénéficierez d'un accès prioritaire et d'une réduction de lancement.
                  </p>
                  <Button 
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite être notifié du lancement du simulateur d'expression écrite TCF Canada."}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Me notifier du lancement
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Alternatives en attendant */}
        <section className="w-full py-12 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  En attendant, découvrez nos autres ressources
                </h2>
                <p className="text-lg text-gray-600">
                  Commencez dès maintenant votre préparation avec nos outils disponibles
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle>Méthodologie</CardTitle>
                    <CardDescription>
                      Apprenez les techniques essentielles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href="/expression-ecrite-tcf/methodologie">
                        Découvrir la méthodologie
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <CardTitle>Sujets d'Actualité</CardTitle>
                    <CardDescription>
                      Entraînez-vous avec des sujets récents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href="/expression-ecrite-tcf/sujets-actualite">
                        Voir les sujets
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <CardTitle>Formations</CardTitle>
                    <CardDescription>
                      Bénéficiez d'un accompagnement personnalisé
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <Link href="/expression-ecrite-tcf/formations">
                        Découvrir les formations
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
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

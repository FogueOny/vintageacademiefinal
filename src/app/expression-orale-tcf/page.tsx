"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, Users, Clock, Calendar, CheckCircle, Star, Award, TrendingUp, Mic, MessageCircle, ClipboardList } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";

export default function ExpressionOraleMainPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const sections = [
    {
      id: "methodologie",
      title: "Méthodologie",
      description: "Maîtrisez les techniques des 3 tâches d'expression orale",
      icon: BookOpen,
      href: "/expression-orale-tcf/methodologie",
      features: [
        "Structure des 3 tâches (Tâche 1, 2 et 3)",
        "Techniques de présentation orale",
        "Gestion du temps et du stress",
        "Critères d'évaluation détaillés"
      ]
    },
    {
      id: "sujets", 
      title: "Banque de Sujets",
      description: "Entraînez-vous avec notre collection de sujets réels",
      icon: Calendar,
      href: "/expression-orale-tcf/sujets",
      features: [
        "Sujets classés par période",
        "Tâche 2 et Tâche 3",
        "Tags thématiques",
        "Mise à jour régulière"
      ]
    },
    {
      id: "corrections",
      title: "Corrections",
      description: "Exemples de réponses et retours ciblés pour progresser",
      icon: ClipboardList,
      href: "/expression-orale-tcf/corrections",
      features: [
        "Exemples structurés par tâche",
        "Conseils et erreurs fréquentes",
        "Améliorations concrètes",
        "Mises à jour régulières"
      ]
    }
  ];

  const stats = [
    { label: "Candidats formés", value: "2,500+", icon: Users },
    { label: "Taux de réussite", value: "94%", icon: Target },
    { label: "Sujets disponibles", value: "150+", icon: BookOpen },
    { label: "Années d'expérience", value: "8+", icon: Award }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center max-w-4xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <div className="inline-block p-3 bg-primary/15 rounded-full mb-6">
                <Mic className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Expression Orale
                <span className="block text-primary">TCF Canada</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Maîtrisez l'expression orale du TCF Canada avec nos ressources complètes, 
                méthodologies éprouvées et accompagnement personnalisé.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/expression-orale-tcf/methodologie">
                  <Button size="lg">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Découvrir la Méthodologie
                  </Button>
                </Link>
                <Link href="/expression-orale-tcf/sujets">
                  <Button size="lg" variant="outline">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Voir les Sujets
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Statistiques */}
        <section className="w-full py-12 bg-card">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/15 rounded-lg mb-3">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sections principales */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Nos Ressources d'Expression Orale
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Tout ce dont vous avez besoin pour réussir l'épreuve d'expression orale du TCF Canada
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {sections.map((section, index) => {
                  const IconComponent = section.icon;
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-primary">
                        <CardHeader>
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/15 rounded-lg mb-4">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-xl">{section.title}</CardTitle>
                          <CardDescription className="text-muted-foreground">
                            {section.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-2">
                            {section.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-foreground/80">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Link href={section.href}>
                            <Button className="w-full">
                              Découvrir {section.title}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* À propos de l'Expression Orale TCF */}
        <section className="w-full py-16 bg-card">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    L'Expression Orale au TCF Canada
                  </h2>
                  <p className="text-xl text-gray-600">
                    Comprendre les enjeux et les spécificités de cette épreuve cruciale
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Format de l'Épreuve
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-1">Tâche 1</Badge>
                          <div>
                            <strong>Entretien dirigé (2 min)</strong>
                            <p className="text-sm text-muted-foreground">Questions personnelles simples</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-1">Tâche 2</Badge>
                          <div>
                            <strong>Exercice en interaction (5 min 30)</strong>
                            <p className="text-sm text-muted-foreground">Jeu de rôle avec l'examinateur</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-1">Tâche 3</Badge>
                          <div>
                            <strong>Expression d'un point de vue (4 min 30)</strong>
                            <p className="text-sm text-muted-foreground">Présentation et argumentation</p>
                          </div>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Critères d'Évaluation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <div>
                            <strong>Adéquation sociolinguistique</strong>
                            <p className="text-sm text-muted-foreground">Adaptation au contexte</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <div>
                            <strong>Correction linguistique</strong>
                            <p className="text-sm text-muted-foreground">Grammaire et vocabulaire</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <div>
                            <strong>Aisance et interaction</strong>
                            <p className="text-sm text-muted-foreground">Fluidité et capacité d'échange</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          <div>
                            <strong>Cohérence et cohésion</strong>
                            <p className="text-sm text-muted-foreground">Organisation du discours</p>
                          </div>
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
        <section className="w-full py-16 bg-gradient-to-r from-primary to-secondary">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Prêt à exceller en Expression Orale ?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Commencez votre préparation dès aujourd'hui avec nos ressources complètes 
                et notre accompagnement personnalisé.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/expression-orale-tcf/formations">
                  <Button size="lg" variant="secondary">
                    <Users className="h-5 w-5 mr-2" />
                    Découvrir nos Formations
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-primary"
                  onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1?text=Bonjour, je souhaite des informations sur la préparation à l'expression orale TCF Canada."}
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

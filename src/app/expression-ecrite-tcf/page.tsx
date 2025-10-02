"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, FileText, Monitor, ChevronRight, Clock, Target, Users } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";

export default function ExpressionEcriteTCFPage() {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const sections = [
    {
      id: "methodologie",
      title: "Méthodologie",
      description: "Apprenez les techniques et stratégies pour réussir l'expression écrite du TCF Canada",
      icon: BookOpen,
      color: "blue",
      href: "/expression-ecrite-tcf/methodologie",
      features: [
        "Structure des 3 tâches",
        "Techniques de rédaction",
        "Conseils d'experts",
        "Exemples pratiques"
      ]
    },
    {
      id: "sujets-actualite",
      title: "Sujets d'Actualité",
      description: "Entraînez-vous avec les sujets récents et les thèmes qui tombent fréquemment",
      icon: FileText,
      color: "green",
      href: "/expression-ecrite-tcf/sujets-actualite",
      features: [
        "Sujets par mois/année",
        "Thèmes récurrents",
        "Corrections détaillées",
        "Mise à jour régulière"
      ]
    },
    {
      id: "corrections",
      title: "Corrections Détaillées",
      description: "Consultez les corrections complètes des sujets d'expression écrite récents",
      icon: GraduationCap,
      color: "amber",
      href: "/expression-ecrite-tcf/corrections",
      features: [
        "Corrections par période",
        "Exemples commentés",
        "Points forts et améliorations",
        "Formulations recommandées"
      ]
    },
    {
      id: "repondre",
      title: "Saisissez en Condition d'examen",
      description: "Lancez un test chronométré (10 min), respectez la limite de mots et envoyez votre réponse",
      icon: Target,
      color: "purple",
      href: "/expression-ecrite-tcf/repondre/choisir-tache",
      features: [
        "Choisir la tâche",
        "Sélectionner un sujet",
        "Timer 10 minutes + limite de mots",
        "Envoi par EmailJS"
      ]
    },
    {
      id: "simulateur",
      title: "Simulateur",
      description: "Simulateur interactif pour vous entraîner dans des conditions réelles",
      icon: Monitor,
      color: "orange",
      href: "/expression-ecrite-tcf/simulateur",
      features: [
        "Conditions réelles",
        "Chronomètre intégré",
        "Correction automatique",
        "Statistiques détaillées"
      ],
      comingSoon: true
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div 
              className="max-w-4xl mx-auto text-center"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <div className="inline-block px-4 py-2 rounded-full bg-primary/15 text-primary font-medium text-sm mb-6">
                TCF Canada - Expression Écrite
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
                Maîtrisez l'Expression Écrite du TCF Canada
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Découvrez nos ressources complètes pour exceller dans l'épreuve d'expression écrite : 
                méthodologie, sujets d'actualité, formations personnalisées et simulateur interactif.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#sections">
                  <Button size="lg">
                    Explorer les ressources
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = "https://wa.me/message/Q7VI4S4STSCPM1"}
                >
                  Contactez-nous
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full py-12 bg-card">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div className="text-center" variants={fadeIn}>
                <div className="flex items-center justify-center w-12 h-12 bg-primary/15 rounded-lg mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">60 min</h3>
                <p className="text-muted-foreground">Durée de l'épreuve</p>
              </motion.div>
              <motion.div className="text-center" variants={fadeIn}>
                <div className="flex items-center justify-center w-12 h-12 bg-primary/15 rounded-lg mx-auto mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">3 Tâches</h3>
                <p className="text-muted-foreground">Structure de l'épreuve</p>
              </motion.div>
              <motion.div className="text-center" variants={fadeIn}>
                <div className="flex items-center justify-center w-12 h-12 bg-primary/15 rounded-lg mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">500+</h3>
                <p className="text-muted-foreground">Candidats accompagnés</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Sections principales */}
        <section id="sections" className="w-full py-16 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Nos Ressources pour l'Expression Écrite
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Tout ce dont vous avez besoin pour réussir votre épreuve d'expression écrite du TCF Canada
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {sections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <motion.div key={section.id} variants={fadeIn}>
                    <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-primary relative">
                      {section.comingSoon && (
                        <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                          Bientôt disponible
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="rounded-lg p-3 bg-primary/15 flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{section.title}</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-base">
                          {section.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-6">
                          {section.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center text-sm text-muted-foreground">
                              <ChevronRight className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        {section.comingSoon ? (
                          <Button className="w-full" disabled>
                            Bientôt disponible
                          </Button>
                        ) : (
                          <Link href={section.href}>
                            <Button className="w-full">
                              Accéder à {section.title}
                              <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 bg-gradient-to-r from-primary to-secondary">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div 
              className="text-center text-white"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Prêt à commencer votre préparation ?
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                Rejoignez des centaines de candidats qui ont réussi leur TCF Canada grâce à nos méthodes éprouvées.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/expression-ecrite-tcf/methodologie">
                  <Button size="lg" variant="secondary">
                    Commencer par la méthodologie
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-primary"
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

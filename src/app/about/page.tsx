"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Award, Users, Globe, Target } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { ProfessionalFooter } from "@/components/professional-footer";

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

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Page Header */}
        <section className="w-full py-12 md:py-16 lg:py-20 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center space-y-4"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeIn}>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  À propos de <span className="text-orange-500">Vintage Académie</span>
                </h1>
              </motion.div>
              <motion.p 
                className="max-w-[700px] mx-auto text-gray-600 md:text-xl"
                variants={fadeIn}
              >
                Votre partenaire de confiance pour la formation, les certifications et l'accompagnement vers l'excellence.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Notre Mission */}
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter">Notre Mission</h2>
                  <p className="text-gray-600 text-lg">
                    Chez Vintage Académie, nous croyons que chaque individu mérite d'avoir accès à une formation de qualité 
                    pour réaliser ses rêves professionnels et personnels.
                  </p>
                </div>
                <p className="text-gray-600">
                  Nous accompagnons nos étudiants dans leur parcours d'apprentissage en proposant des formations 
                  adaptées aux exigences du marché du travail actuel. Que ce soit pour les tests de langue française 
                  (TCF, TEF), les certifications professionnelles, ou l'accompagnement à l'immigration, 
                  nous mettons notre expertise à votre service.
                </p>
                <Link href="/contact">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Contactez-nous <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="relative"
              >
                <Image
                  src="/images/vintage-founder.jpg"
                  alt="Équipe Vintage Académie"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Nos Valeurs */}
        <section className="w-full py-12 md:py-24 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center space-y-4 mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-3xl font-bold tracking-tighter sm:text-4xl"
                variants={fadeIn}
              >
                Nos Valeurs
              </motion.h2>
              <motion.p 
                className="max-w-[600px] mx-auto text-gray-600 md:text-lg"
                variants={fadeIn}
              >
                Les principes qui guident notre action au quotidien
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={cardVariant}>
                <Card className="h-full text-center p-6">
                  <CardContent className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold">Excellence</h3>
                    <p className="text-gray-600 text-sm">
                      Nous nous engageons à fournir des formations de la plus haute qualité pour garantir votre réussite.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariant}>
                <Card className="h-full text-center p-6">
                  <CardContent className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold">Accompagnement</h3>
                    <p className="text-gray-600 text-sm">
                      Un suivi personnalisé pour chaque apprenant, adapté à ses besoins et objectifs spécifiques.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariant}>
                <Card className="h-full text-center p-6">
                  <CardContent className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Globe className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold">Innovation</h3>
                    <p className="text-gray-600 text-sm">
                      Des méthodes pédagogiques modernes et des outils technologiques à la pointe.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariant}>
                <Card className="h-full text-center p-6">
                  <CardContent className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold">Résultats</h3>
                    <p className="text-gray-600 text-sm">
                      Notre priorité : votre réussite et l'atteinte de vos objectifs professionnels.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Nos Services */}
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center space-y-4 mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-3xl font-bold tracking-tighter sm:text-4xl"
                variants={fadeIn}
              >
                Nos Domaines d'Expertise
              </motion.h2>
              <motion.p 
                className="max-w-[600px] mx-auto text-gray-600 md:text-lg"
                variants={fadeIn}
              >
                Une gamme complète de services pour vous accompagner dans votre parcours
              </motion.p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={cardVariant}>
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-bold">Tests de Langue</h3>
                    <p className="text-gray-600">
                      Préparation aux tests TCF, TEF et IELTS avec des modules interactifs 
                      et un suivi personnalisé pour maximiser vos chances de réussite.
                    </p>
                    <Link href="/services/tcf">
                      <Button variant="outline" className="w-full">
                        En savoir plus
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariant}>
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-bold">Immigration</h3>
                    <p className="text-gray-600">
                      Accompagnement complet pour vos projets d'immigration au Canada et en Allemagne, 
                      de la préparation des dossiers au suivi administratif.
                    </p>
                    <Link href="/services/immigration-canada">
                      <Button variant="outline" className="w-full">
                        En savoir plus
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariant}>
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-bold">Certifications Professionnelles</h3>
                    <p className="text-gray-600">
                      Formations certifiantes en technologies, gestion de projet et marketing digital 
                      pour booster votre carrière professionnelle.
                    </p>
                    <Link href="/services/certifications">
                      <Button variant="outline" className="w-full">
                        En savoir plus
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-12 md:py-24 bg-orange-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="text-center space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-3xl font-bold tracking-tighter sm:text-4xl"
                variants={fadeIn}
              >
                Prêt à commencer votre parcours ?
              </motion.h2>
              <motion.p 
                className="max-w-[600px] mx-auto text-gray-600 md:text-lg"
                variants={fadeIn}
              >
                Rejoignez des milliers d'étudiants qui ont fait confiance à Vintage Académie 
                pour atteindre leurs objectifs.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center"
                variants={fadeIn}
              >
                <Link href="/contact">
                  <Button className="bg-orange-500 hover:bg-orange-600" size="lg">
                    Contactez-nous
                  </Button>
                </Link>
                <Link href="/services/tcf">
                  <Button variant="outline" size="lg">
                    Découvrir nos services
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
} 
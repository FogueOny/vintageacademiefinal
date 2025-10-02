"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, Award, ArrowRight } from "lucide-react";

export function TestCertificationSpotlight() {
  return (
    <div className="w-full bg-white py-16">
      <div className="container mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-4">Tests de langue officiels & Certifications</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Maximisez vos chances d'immigration et votre carrière professionnelle grâce à nos préparations 
            intensives aux tests de langue et certifications reconnues mondialement.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Partie gauche: Visuel */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
              <Image 
                src="/images/tcf-tef-preparation.jpg" 
                alt="Préparation aux tests TCF et TEF" 
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
                <span className="text-white text-xl font-bold mb-2">Préparation complète au TCF & TEF</span>
                <span className="text-orange-200">Taux de réussite élevé 95%+</span>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-orange-500 text-white p-4 rounded-lg shadow-lg">
              <div className="font-bold text-3xl">+2500</div>
              <div className="text-sm">Étudiants certifiés</div>
            </div>
          </motion.div>

          {/* Partie droite: Infos et CTA */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold">Pourquoi choisir nos tests et certifications?</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                <div className="ml-4">
                  <h4 className="font-semibold">Sessions régulières de TCF & TEF</h4>
                  <p className="text-gray-600">Testez votre niveau de français pour vos démarches d'immigration au Canada ou en France.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                <div className="ml-4">
                  <h4 className="font-semibold">Formation intensive disponible</h4>
                  <p className="text-gray-600">Programmes de préparation accélérée pour maximiser vos résultats en temps limité.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Award className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                <div className="ml-4">
                  <h4 className="font-semibold">Certifications ICE & Cisco</h4>
                  <p className="text-gray-600">Certifications professionnelles reconnues pour booster votre carrière dans l'IT et le digital.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/services/tcf-tef">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Explorer TCF & TEF
                </Button>
              </Link>
              <Link href="/services/certifications">
                <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50">
                  Voir nos certifications
                </Button>
              </Link>
            </div>

            {/* Dates prochaines sessions */}
            <Card className="border-orange-200 bg-orange-50 mt-6">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Prochaines sessions de tests
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-l-2 border-orange-500 pl-3">
                    <p className="font-medium">TCF Canada</p>
                    <p className="text-sm text-gray-600">3 & 17 Juillet 2025</p>
                  </div>
                  <div className="border-l-2 border-orange-500 pl-3">
                    <p className="font-medium">TEF Canada</p>
                    <p className="text-sm text-gray-600">10 & 24 Juillet 2025</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

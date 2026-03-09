"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { ProfessionalFooter } from "@/components/professional-footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


// Fonction pour ouvrir WhatsApp avec un message prédéfini
const openWhatsApp = (message: string) => {
  const phoneNumber = "237652385531"; // Numéro WhatsApp de Vintage Académie de ARMEL
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

export default function Home() {
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const openComingSoon: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = (e) => {
    try { e.preventDefault(); } catch (_) {}
    setComingSoonOpen(true);
  };
  const closeComingSoon = () => setComingSoonOpen(false);
  const openCourseModal: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = (e) => {
    try { e.preventDefault(); } catch (_) {}
    setCourseModalOpen(true);
  };
  const closeCourseModal = () => setCourseModalOpen(false);
  // Close on Escape
  useEffect(() => {
    if (!comingSoonOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setComingSoonOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [comingSoonOpen]);
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1">
        {/* Hero Section inspiré de PrepMyFuture */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="text-orange-500">Révisez efficacement</span><br /> 
                  vos examens.
                </h1>
                
                {/* Cartes principales style PrepMyFuture  */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {/* Card Nos Cours */}
                  <div className="bg-orange-500 text-white rounded-lg p-6 transform transition-transform hover:scale-105">
                    <h2 className="text-2xl font-bold mb-4">Nos Cours</h2>
                    <p className="mb-4">Préparez-vous aux examens TCF, TEF, IELTS et vos certifications avec nos cours spécialisés.</p>
                    <button onClick={openCourseModal} className="inline-block w-full bg-white text-orange-500 font-bold py-3 px-4 rounded text-center">
                      Je choisis un cours
                    </button>
                  </div>
                  
                  {/* Card Contact WhatsApp */}
                  <div className="bg-gray-800 text-white rounded-lg p-6 transform transition-transform hover:scale-105">
                    <h2 className="text-2xl font-bold mb-4">Nous contacter</h2>
                    <p className="mb-4">Discutez avec nos conseillers pour trouver la meilleure solution avec nous. </p>
                    <button 
                      onClick={() => openWhatsApp("Bonjour, je souhaite des informations sur vos services. Merci.")} 
                      className="inline-block w-full bg-white text-gray-800 font-bold py-3 px-4 rounded text-center"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <Image 
                  src="/images/hero2.png" 
                  alt="Étudiant en préparation d'examen" 
                  width={600} 
                  height={450}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Modal (glass style) */}
        {comingSoonOpen && (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center"
            onClick={closeComingSoon}
            aria-modal="true"
            role="dialog"
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div
              className="relative mx-4 max-w-md w-full rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl shadow-2xl p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-white/60 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-gray-800">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Bientôt disponible</h3>
              <p className="mt-2 text-sm text-gray-700">Cette fonctionnalité arrive très bientôt. Revenez dans quelques jours ou contactez-nous pour plus d'informations.</p>
              <div className="mt-6 flex gap-3 justify-center">
                <button onClick={closeComingSoon} className="px-4 py-2 rounded-md border border-gray-300 bg-white/70 hover:bg-white text-gray-900">Fermer</button>
                <button onClick={() => { closeComingSoon(); openWhatsApp("Bonjour, j'aimerais être notifié quand cette fonctionnalité sera disponible."); }} className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700">Nous contacter</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Section Nos programmes de préparation */}
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Nos programmes de préparation</h2>
              <p className="text-gray-600">Choisissez le programme adapté à vos objectifs</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Card TCF */}
              <a 
                href="https://tcf.vintageacademie.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1"
              >
                <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">TCF</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6">Test de Connaissance du Français - Préparez-vous efficacement avec nos ressources complètes et nos exercices interactifs.</p>
                  
                  <div className="flex items-center text-blue-600 font-medium">
                    <span>Accéder au programme</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </a>
              
              {/* Card IELTS */}
              <a 
                href="https://ielts.vintageacademie.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1"
              >
                <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-full bg-green-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M2 12h20"></path>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">IELTS</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6">International English Language Testing System - Atteignez vos objectifs avec notre programme de préparation complet.</p>
                  
                  <div className="flex items-center text-green-600 font-medium">
                    <span>Accéder au programme</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </a>
              
              {/* Card Cours d'Allemand */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 opacity-60 cursor-not-allowed">
                <div className="h-1 bg-gradient-to-r from-gray-300 to-gray-400"></div>
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-full bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Cours d'Allemand</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6">Apprenez l'allemand avec nos cours structurés et nos formateurs expérimentés. Programme complet pour tous les niveaux.</p>
                  
                  <div className="flex items-center text-gray-400 font-medium">
                    <span>Bientôt disponible</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Partenaires */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Plus de <span className="text-orange-500">500 écoles</span> partenaires !</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
              <div className="grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/images/partenaires/HEC.png"
                  alt="HEC Paris"
                  width={150}
                  height={70}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div className="grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/images/partenaires/essec.png"
                  alt="ESSEC Business School"
                  width={150}
                  height={70}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div className="grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/images/partenaires/af.png"
                  alt="Alliance Française"
                  width={150}
                  height={70}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div className="grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110">
                <Image
                  src="/images/partenaires/if.png"
                  alt="Institut Français"
                  width={150}
                  height={70}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <Button onClick={() => openWhatsApp("Bonjour, je souhaite en savoir plus sur vos partenariats avec les écoles.")} className="bg-orange-500 hover:bg-orange-600">
                Contactez-nous
              </Button>
            </div>
          </div>
        </section>
        
        {/* Témoignages et services additionnels */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Pourquoi choisir Vintage Académie ?</h2>
              <p className="text-gray-600 mt-2">Des résultats prouvés et une approche personnalisée</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Expertise reconnue</h3>
                <p className="text-gray-600">Centre officiel pour les tests TCF et TEF avec des formateurs certifiés et expérimentés.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Accompagnement personnalisé</h3>
                <p className="text-gray-600">Des programmes adaptés à votre niveau et à vos objectifs spécifiques.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Résultats garantis</h3>
                <p className="text-gray-600">Plus de 90% de nos étudiants atteignent leurs objectifs de score pour l'immigration.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section avant le footer */}
        <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à commencer votre préparation ?</h2>
              <p className="text-lg mb-8 text-orange-50">Rejoignez des milliers d'étudiants qui ont réussi leurs examens avec Vintage Académie</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={openCourseModal}
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-lg px-8 py-6"
                >
                  Choisir un programme
                </Button>
                <Button 
                  onClick={() => openWhatsApp("Bonjour, je souhaite des informations sur vos programmes de préparation.")} 
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold text-lg px-8 py-6"
                >
                  Nous contacter
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Course Selection Modal */}
      <Dialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Choisissez votre programme</DialogTitle>
            <DialogDescription>
              Sélectionnez le programme qui correspond à vos objectifs
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <a
              href="https://tcf.vintageacademie.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-500 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                      </svg>
                    </div>
                    <CardTitle>TCF</CardTitle>
                  </div>
                  <CardDescription>Test de Connaissance du Français</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Préparation complète avec exercices interactifs et corrections détaillées.</p>
                  <div className="flex items-center text-blue-600 font-medium text-sm">
                    <span>Accéder maintenant</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </a>

            <a
              href="https://ielts.vintageacademie.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-green-500 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M2 12h20"></path>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                    <CardTitle>IELTS</CardTitle>
                  </div>
                  <CardDescription>International English Language Testing System</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Programme complet pour atteindre vos objectifs de score.</p>
                  <div className="flex items-center text-green-600 font-medium text-sm">
                    <span>Accéder maintenant</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </a>

            <Card className="opacity-60 cursor-not-allowed col-span-1 md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <CardTitle className="text-gray-500">Cours d'Allemand</CardTitle>
                </div>
                <CardDescription>Programme complet pour tous les niveaux</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-3">Apprenez l'allemand avec nos formateurs expérimentés.</p>
                <div className="flex items-center text-gray-400 font-medium text-sm">
                  <span>Bientôt disponible</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      
      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
}

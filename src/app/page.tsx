"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";
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
    transition: { duration: 0.4 }
  }
};

// Fonction pour ouvrir WhatsApp avec un message prédéfini
const openWhatsApp = (message: string) => {
  const phoneNumber = "+237652385531"; // Numéro WhatsApp de Vintage Académie
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const openComingSoon: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = (e) => {
    try { e.preventDefault(); } catch (_) {}
    setComingSoonOpen(true);
  };
  const closeComingSoon = () => setComingSoonOpen(false);
  // Close on Escape
  useEffect(() => {
    if (!comingSoonOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setComingSoonOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [comingSoonOpen]);
  
  // Vérifier si l'utilisateur est connecté au chargement de la page
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const supabaseClient = supabase();
        if (!supabaseClient) {
          console.error("Supabase client not available");
          return;
        }
        const { data: { session } } = await supabaseClient.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error("Erreur de vérification de session:", error);
        setIsLoggedIn(false);
      }
    };
    
    checkLoginStatus();
    
    // Écouter les changements d'authentification d
    const { data: authListener } = supabase().auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // Public homepage: no client-side redirection based on session
  
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
                    <Link href="/services/tcf" className="inline-block w-full bg-white text-orange-500 font-bold py-3 px-4 rounded text-center">
                      Je choisis un cours
                    </Link>
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
        
        {/* Section des cartes de services */}
        <section className="py-16 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
              {/* Card 1: Préparations aux tests de langues - Nouveau design */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">Préparations aux tests de langues</h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">Préparez-vous efficacement aux tests standardisés avec nos programmes complets. Coaching personnalisé et ressources exclusives.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    <Link href="#toeic" onClick={openComingSoon} className="group py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg text-center text-sm font-medium text-blue-600 transition-all flex items-center justify-center">
                      <span>TOEIC</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#toefl" onClick={openComingSoon} className="group py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg text-center text-sm font-medium text-blue-600 transition-all flex items-center justify-center">
                      <span>TOEFL</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#ielts" onClick={openComingSoon} className="group py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg text-center text-sm font-medium text-blue-600 transition-all flex items-center justify-center">
                      <span>IELTS</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#dele" onClick={openComingSoon} className="group py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg text-center text-sm font-medium text-blue-600 transition-all flex items-center justify-center">
                      <span>DELE</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="/services/tcf" className="group py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg text-center text-sm font-medium text-blue-600 transition-all flex items-center justify-center">
                      <span>TCF</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#tef" onClick={openComingSoon} className="group py-2 px-3 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg text-center text-sm font-medium text-blue-600 transition-all flex items-center justify-center">
                      <span>TEF</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Card 2: Immigration et mobilité internationale */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="h-1 bg-gradient-to-r from-red-400 to-red-600"></div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-orange-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M2 12h20"></path>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">Immigration & Mobilité</h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">Accompagnement complet pour vos projets d'immigration et de mobilité internationale. Conseils personnalisés et suivi administratif.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    <Link href="#services/immigration-allemagne" onClick={openComingSoon} className="group py-2 px-3 bg-orange-50 hover:bg-orange-600 hover:text-white rounded-lg text-center text-sm font-medium text-orange-600 transition-all flex items-center justify-center">
                      <span>Allemagne</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#services/immigration-canada" onClick={openComingSoon} className="group py-2 px-3 bg-orange-50 hover:bg-orange-600 hover:text-white rounded-lg text-center text-sm font-medium text-orange-600 transition-all flex items-center justify-center">
                      <span>Canada</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    
                  </div>
                </div>
              </div>
              
              {/* Card 3: Certifications et Formation - Nouveau design fusionné maintenant D'ACCORD, */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                <div className="h-1 bg-gradient-to-r from-green-400 to-purple-600"></div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-gradient-to-br from-green-100 to-purple-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gradient-to-r from-green-600 to-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">Certifications & Formation</h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">Renforcez vos compétences professionnelles avec nos formations spécialisées en informatique et en management de projet.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    <Link href="#services/cisco" onClick={openComingSoon} className="group py-2 px-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-600 hover:to-green-700 hover:text-white rounded-lg text-center text-sm font-medium text-green-600 transition-all flex items-center justify-center">
                      <span>CISCO</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#services/pmp" onClick={openComingSoon} className="group py-2 px-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-600 hover:to-green-700 hover:text-white rounded-lg text-center text-sm font-medium text-green-600 transition-all flex items-center justify-center">
                      <span>PMP</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#services/aws" onClick={openComingSoon} className="group py-2 px-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-600 hover:to-green-700 hover:text-white rounded-lg text-center text-sm font-medium text-green-600 transition-all flex items-center justify-center">
                      <span>AWS</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#services/developpement-web" onClick={openComingSoon} className="group py-2 px-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-600 hover:to-purple-700 hover:text-white rounded-lg text-center text-sm font-medium text-purple-600 transition-all flex items-center justify-center">
                      <span>Dév Web</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#services/marketing-digital" onClick={openComingSoon} className="group py-2 px-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-600 hover:to-purple-700 hover:text-white rounded-lg text-center text-sm font-medium text-purple-600 transition-all flex items-center justify-center">
                      <span>Marketing</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                    <Link href="#services/bureautique" onClick={openComingSoon} className="group py-2 px-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-600 hover:to-purple-700 hover:text-white rounded-lg text-center text-sm font-medium text-purple-600 transition-all flex items-center justify-center">
                      <span>Bureautique</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Section Tarification */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Nos formules d'abonnement</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Choisissez la formule qui convient à vos besoins et commencez votre préparation dès aujourd'hui</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pack Bronze */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl overflow-hidden border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                <div className="p-6 flex-1">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-500 inline-block rounded-full px-3 py-1 text-sm font-medium text-white mb-4">Bronze</div>
                  <h3 className="text-2xl font-bold mb-2">5 jours</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">15 000 FCFA</div>
                  <p className="text-gray-600 mb-6">Accès pendant 5 jours</p>
                  <ul className="mb-8 space-y-3">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Compréhension Écrite : 36 tests d'entraînement</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Compréhension Orale : 32 tests d'entraînement</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Expression Orale : Corrections Tâche 2</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Expression Orale : Corrections Tâche 3</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 bg-amber-50">
                  <Button 
                    onClick={() => openWhatsApp("Bonjour, je souhaite m'abonner à la formule Bronze.")} 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                    size="lg"
                  >
                    S'abonner
                  </Button>
                </div>
              </div>
              
              {/* Pack Silver */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col relative">
                <div className="absolute top-0 right-0 bg-gray-500 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">Populaire</div>
                <div className="p-6 flex-1">
                  <div className="bg-gradient-to-r from-gray-400 to-gray-500 inline-block rounded-full px-3 py-1 text-sm font-medium text-white mb-4">Silver</div>
                  <h3 className="text-2xl font-bold mb-2">30 jours</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">30 000 FCFA</div>
                  <p className="text-gray-600 mb-6">Accès pendant 1 mois</p>
                  <ul className="mb-8 space-y-3">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Compréhension Écrite : 36 tests d'entraînement</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Compréhension Orale : 32 tests d'entraînement</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Expression Orale : Corrections Tâche 2</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-gray-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Expression Orale : Corrections Tâche 3</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 bg-gray-50">
                  <Button 
                    onClick={() => openWhatsApp("Bonjour, je souhaite m'abonner à la formule Silver.")} 
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white" 
                    size="lg"
                  >
                    S'abonner
                  </Button>
                </div>
              </div>
              
              {/* Pack Gold */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl overflow-hidden border border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                <div className="p-6 flex-1">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 inline-block rounded-full px-3 py-1 text-sm font-medium text-white mb-4">Gold</div>
                  <h3 className="text-2xl font-bold mb-2">60 jours</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">55 000 FCFA</div>
                  <p className="text-gray-600 mb-6">Accès pendant 2 mois</p>
                  <ul className="mb-8 space-y-3">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-orange-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Compréhension Écrite : 36 tests d'entraînement</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-orange-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Compréhension Orale : 32 tests d'entraînement</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-orange-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Expression Orale : Corrections Tâche 2</span>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-orange-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">Expression Orale : Corrections Tâche 3</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 bg-orange-50">
                  <Button 
                    onClick={() => openWhatsApp("Bonjour, je souhaite m'abonner à la formule Gold.")} 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                    size="lg"
                  >
                    S'abonner
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Banner */}
        <section className="py-8 bg-blue-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <p className="text-blue-800 text-lg">Découvrez notre simulateur d'examen pour vous préparer efficacement aux certifications :</p>
              </div>
              <button 
                onClick={() => openWhatsApp("Bonjour, je suis enseignant et je souhaite des informations sur vos services de préparation aux certifications. Merci.")} 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                Réservez une démo !
              </button>
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
      </main>
      
      <FloatingWhatsAppButton />
      <ProfessionalFooter />
    </div>
  );
}

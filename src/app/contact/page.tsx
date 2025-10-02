"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, PhoneCall, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

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

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");
    
    try {
      // Format du message pour WhatsApp
      const message = `*Nouveau message de ${formState.name}*\n\n*Sujet:* ${formState.subject}\n*Email:* ${formState.email}\n\n*Message:*\n${formState.message}`;
      
      // Numéro WhatsApp (au format international sans + ou espaces)
      const whatsappNumber = "237652385531";
      
      // Création du lien WhatsApp avec le message
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      
      // Ouvrir WhatsApp dans un nouvel onglet
      window.open(whatsappUrl, "_blank");
      
      // Marquer comme succès et réinitialiser le formulaire
      setFormStatus("success");
      setFormState({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      console.error("Erreur lors de l'ouverture de WhatsApp:", error);
      setFormStatus("error");
    }
  };

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
                  Contactez <span className="text-orange-500">Vintage Académie</span>
                </h1>
              </motion.div>
              <motion.p 
                className="max-w-[700px] mx-auto text-gray-600 md:text-xl"
                variants={fadeIn}
              >
                Une question ? Un projet ? N'hésitez pas à nous contacter. Notre équipe se fera un plaisir de vous répondre dans les plus brefs délais.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Contact Form */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter">Envoyez-nous un message</h2>
                  <p className="text-gray-600">
                    Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-medium">
                        Nom complet
                      </label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="Votre nom"
                        value={formState.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="your.email@example.com"
                        value={formState.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-sm font-medium">
                      Sujet
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      required
                      placeholder="Objet de votre message"
                      value={formState.subject}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      placeholder="Votre message..."
                      rows={5}
                      value={formState.message}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2" 
                    disabled={formStatus === "submitting"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                    </svg>
                    {formStatus === "submitting" ? "Envoi en cours..." : "Envoyer via WhatsApp"}
                  </Button>
                  
                  {formStatus === "success" && (
                    <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">
                      Votre message a été préparé. WhatsApp va s'ouvrir pour l'envoi direct.
                    </div>
                  )}
                  
                  {formStatus === "error" && (
                    <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                      Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer.
                    </div>
                  )}
                </form>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold tracking-tighter">Informations de contact</h2>
                
                <div className="grid gap-6">
                  <motion.div variants={cardVariant}>
                    <Card className="bg-orange-50 border-orange-100">
                      <CardContent className="flex items-start gap-4 p-6">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="font-bold">Nos adresses</h3>
                          <p className="text-gray-600 mt-1">
                            <strong>Douala:</strong> Ange Raphael fin barrière ESSEC<br />
                            <strong>Yaoundé:</strong> Essos Camps Sonel
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div variants={cardVariant}>
                    <Card className="bg-orange-50 border-orange-100">
                      <CardContent className="flex items-start gap-4 p-6">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <PhoneCall className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="font-bold">Téléphone</h3>
                          <p className="text-gray-600 mt-1">+237 653 18 20 01</p>
                          <p className="text-gray-600 mt-1">+237 655 43 41 44</p>
                          <p className="text-gray-500 text-sm">Lun-Sam: 8h-18h</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div variants={cardVariant}>
                    <Card className="bg-orange-50 border-orange-100">
                      <CardContent className="flex items-start gap-4 p-6">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="font-bold">WhatsApp</h3>
                          <p className="text-gray-600 mt-1">+237 6 52 38 55 31</p>
                          <p className="text-gray-500 text-sm">Réponse rapide</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-bold mb-4">Nos horaires d'ouverture</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-600">Lundi - Vendredi:</span>
                      <span>8:00 - 18:00</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Samedi:</span>
                      <span>8:00 - 18:00</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Dimanche:</span>
                      <span>Fermé</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Map Section */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-2xl font-bold mb-6 text-center">Notre localisation</h2>
              <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-200">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3980.6963266311435!2d9.70702!3d4.05353!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x10610de90ab3437f%3A0xa7c5f84d308eaef!2sVintage%20Académie!5e0!3m2!1sfr!2scm!4v1687254768309!5m2!1sfr!2scm" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

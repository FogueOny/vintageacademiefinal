"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

type ServiceCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  whatsappMessage: string;
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function ServiceCardWhatsApp({ icon, title, description, whatsappMessage }: ServiceCardProps) {
  const openWhatsApp = (message: string) => {
    // Numéro WhatsApp (au format international sans + ou espaces)
    const whatsappNumber = "237652385531";
    
    // Création du lien WhatsApp avec le message
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Ouvrir WhatsApp dans un nouvel onglet
    window.open(whatsappUrl, "_blank");
  };

  return (
    <motion.div variants={cardVariant}>
      <Card className="overflow-hidden border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
            {icon}
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">{description}</p>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="ghost" 
            className="text-orange-500 p-0 h-auto hover:text-orange-600 hover:bg-transparent flex items-center gap-1"
            onClick={() => openWhatsApp(whatsappMessage)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592z"/>
            </svg>
            Nous contacter
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

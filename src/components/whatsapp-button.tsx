"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export const WhatsappButton = () => {
  const [isHovering, setIsHovering] = useState(false);
  
  const phoneNumber = "+237652385531"; // Numéro de téléphone Vintage Académie
  const message = "Bonjour, j'ai une question concernant la préparation à l'expression orale du TCF Canada.";
  
  const handleClick = () => {
    // Encoder le message pour l'URL WhatsApp
    const encodedMessage = encodeURIComponent(message);
    // Créer le lien WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    // Ouvrir dans un nouvel onglet
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Button
      variant="default"
      className="bg-[#25D366] hover:bg-[#128C7E] text-white transition-all"
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <MessageCircle className={`mr-2 h-4 w-4 ${isHovering ? 'animate-bounce' : ''}`} />
      Besoin d&apos;aide pour votre préparation TCF ? Contactez-nous directement sur WhatsApp pour un accompagnement personnalisé !
    </Button>
  );
};
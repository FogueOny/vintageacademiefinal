"use client";

import { Phone } from "lucide-react";
import { motion } from "framer-motion";

export function FloatingWhatsAppButton() {
  const openWhatsApp = () => {
    const whatsappNumber = "237652385531";
    const message = "Bonjour, je souhaite en savoir plus sur vos services.";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <motion.button
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onClick={openWhatsApp}
      aria-label="Contacter sur WhatsApp"
    >
      <span className="sr-only">Contacter sur WhatsApp</span>
      <div className="flex items-center justify-center relative">
        <Phone className="h-7 w-7" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
        </span>
      </div>
    </motion.button>
  );
}
// 
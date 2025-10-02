"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Images pour le fond défilant 
const backgroundImages = [
  "/images/hero1.png",  // Assurez-vous de créer ces images
  "/images/hero2.png",
];

export function SlidingBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 15000); // Change toutes les 15 secondes pour réduire la distraction
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <>
      {/* Fond de couleur solide pour garantir la lisibilité */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 z-0" />
      
      {/* Images d'arrière-plan avec une faible opacité */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-[1]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.12 }}  // Opacité très faible pour le fond
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src={backgroundImages[currentIndex]}
              alt="Vintage Académie background"
              fill
              priority
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Overlays pour améliorer la lisibilité du texte */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/10 mix-blend-overlay z-[2]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-100/70 z-[2]" />
      
      {/* Texture subtile pour ajouter de la profondeur */}
      <div className="absolute inset-0 opacity-5 z-[3]" 
        style={{ 
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0V0zm10 17.5c4.142 0 7.5-3.358 7.5-7.5 0-4.142-3.358-7.5-7.5-7.5-4.142 0-7.5 3.358-7.5 7.5 0 4.142 3.358 7.5 7.5 7.5zM20 20v20h20V20H20zm10 17.5c4.142 0 7.5-3.358 7.5-7.5 0-4.142-3.358-7.5-7.5-7.5-4.142 0-7.5 3.358-7.5 7.5 0 4.142 3.358 7.5 7.5 7.5z\' fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E')",
          backgroundSize: "200px 200px"
        }}
      />
    </>
  );
}

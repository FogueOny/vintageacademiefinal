"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ServiceCarouselCard } from "@/components/service-carousel-card";

export function ServicesCarousel() {
  const serviceData = [
    {
      title: "TCF - Test de Connaissance du Français",
      description: "Préparez-vous au TCF Canada et TCF Québec avec notre programme intensif. Maximisez vos points pour l'immigration!",
      imageSrc: "/images/tcf-preparation.jpg",
      linkHref: "/services/tcf",
      color: "orange"
    },
    {
      title: "TEF - Test d'Évaluation de Français",
      description: "Formations intensives et examens blancs pour réussir le TEF Canada et TEF pour la Résidence Permanente.",
      imageSrc: "/images/tef-preparation.jpg",
      linkHref: "/services/tef",
      color: "blue"
    },
    {
      title: "IELTS Certification",
      description: "Devenez un expert certifié en marketing digital et commerce électronique avec nos formations professionnelles.",
      imageSrc: "/images/ice-certification.jpg", // Même image pour l'instant, à remplacer par une image IELTS plus tard
      linkHref: "/services/ielts-certification",
      color: "purple"
    },
    {
      title: "Immigration au Canada",
      description: "Accompagnement complet pour votre projet d'immigration: Entrée Express, PEQ, travailleurs qualifiés.",
      imageSrc: "/images/canada-immigration.jpg", 
      linkHref: "/services/immigration-canada",
      color: "red"
    },
    {
      title: "Immigration en Allemagne",
      description: "Accompagnement personnalisé pour étudier, travailler et vous installer en Allemagne avec un visa adapté.",
      imageSrc: "/images/germany-immigration.jpg",
      linkHref: "/services/immigration-allemagne",
      color: "yellow"
    },
    {
      title: "Développement Web",
      description: "Conception de sites web professionnels, e-commerce et applications mobiles pour booster votre présence digitale.",
      imageSrc: "/images/web-development.jpg",
      linkHref: "/services/developpement-web",
      color: "green"
    },
  ];

  // Auto-scroll avec pause au survol
  const [api, setApi] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!api || isPaused) return;
    
    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [api, isPaused]);

  return (
    <div 
      className="w-full py-8"
      onMouseEnter={() => setIsPaused(true)} 
      onMouseLeave={() => setIsPaused(false)}
    >
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {serviceData.map((service, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4 pr-4">
              <ServiceCarouselCard
                title={service.title}
                description={service.description}
                imageSrc={service.imageSrc}
                linkHref={service.linkHref}
                color={service.color}
                index={index + 1}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
}

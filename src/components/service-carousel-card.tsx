"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ServiceCarouselCardProps {
  title: string;
  description: string;
  imageSrc: string;
  linkHref: string;
  color: string;
  index: number;
}

export function ServiceCarouselCard({
  title,
  description,
  imageSrc,
  linkHref,
  color,
  index
}: ServiceCarouselCardProps) {
  // Couleurs dynamiques basées sur la prop color
  const getBgColor = () => {
    switch(color) {
      case "orange": return "bg-gradient-to-br from-orange-50 to-orange-100";
      case "blue": return "bg-gradient-to-br from-blue-50 to-blue-100";
      case "green": return "bg-gradient-to-br from-green-50 to-green-100";
      case "purple": return "bg-gradient-to-br from-purple-50 to-purple-100";
      case "red": return "bg-gradient-to-br from-red-50 to-red-100";
      case "yellow": return "bg-gradient-to-br from-amber-50 to-amber-100";
      default: return "bg-gradient-to-br from-gray-50 to-gray-100";
    }
  };

  const getAccentColor = () => {
    switch(color) {
      case "orange": return "border-orange-500 text-orange-600";
      case "blue": return "border-blue-500 text-blue-600";
      case "green": return "border-green-500 text-green-600";
      case "purple": return "border-purple-500 text-purple-600";
      case "red": return "border-orange-500 text-orange-600";
      case "orange": return "border-orange-500 text-orange-600";
      case "yellow": return "border-amber-500 text-amber-600";
      default: return "border-gray-500 text-gray-600";
    }
  };

  const getButtonClass = () => {
    switch(color) {
      case "orange": return "bg-orange-500 hover:bg-orange-600";
      case "blue": return "bg-blue-500 hover:bg-blue-600";
      case "green": return "bg-green-500 hover:bg-green-600";
      case "purple": return "bg-purple-500 hover:bg-purple-600";
      case "red": return "bg-red-500 hover:bg-red-600";
      case "yellow": return "bg-amber-500 hover:bg-amber-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <div className={`relative flex flex-col items-center overflow-hidden rounded-xl ${getBgColor()} p-8 shadow-lg h-[460px]`}>
      <div className="absolute top-0 right-0 p-2 rounded-bl-xl bg-white/80">
        <span className={`font-bold text-sm px-2 py-1 rounded border-l-4 ${getAccentColor()}`}>
          {`0${index}`}
        </span>
      </div>

      <div className="text-center mb-6 z-10">
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-gray-600 text-sm line-clamp-3">{description}</p>
      </div>

      <div className="relative w-full h-48 mb-6 rounded-lg overflow-hidden">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      <div className="mt-auto w-full">
        <Link href={linkHref} className="w-full block">
          <Button className={`w-full ${getButtonClass()} text-white`}>
            En savoir plus <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Ne pas afficher le header sur les pages admin
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    // Masquer le header sur les pages d'authentification
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth") ||
    // Masquer le header sur les pages de test actives
    pathname.startsWith("/comprehension-orale") ||
    pathname.startsWith("/comprehension-ecrite") ||
    // Pour expression, NE PAS masquer sur les sections publiques '-tcf'
    (pathname.startsWith("/expression-orale") && !pathname.startsWith("/expression-orale-tcf")) ||
    (pathname.startsWith("/expression-ecrite") && !pathname.startsWith("/expression-ecrite-tcf")) ||
    // Masquer également sur la page des résultats
    pathname.startsWith("/results")
  ) {
    return null;
  }
  
  return <Header />;
}
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MainNavigation } from "@/components/main-navigation";
import { Menu, X } from "lucide-react";

const openWhatsApp = () => {
  const phoneNumber = "237652385531";
  const message = "Bonjour, je souhaite des informations sur vos services.";
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Image 
            src="/images/logo.png" 
            alt="Vintage Académie" 
            width={40} 
            height={40}
            style={{ width: 'auto', height: 'auto' }} // Maintenir le ratio d'aspect 
          />
          <span className="hidden sm:inline-block font-bold text-lg">Vintage Académie</span>
        </Link>
        
        <div className="flex-1 hidden md:block">
          <MainNavigation />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center">
            <Button 
              onClick={openWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white" 
              size="sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </Button>
          </div>
          
          <button 
            className="md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          <div className="container px-4 py-4 space-y-4">
            <nav className="space-y-3">
              <Link 
                href="/" 
                className={`block px-2 py-1 rounded-md ${pathname === "/" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Accueil
              </Link>
              <div className="space-y-2 pl-2 border-l border-gray-200">
                <p className="text-sm font-medium text-gray-500 mb-1">Services</p>
                <Link 
                  href="/services/tcf" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/tcf" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  TCF
                </Link>
                <Link 
                  href="/services/tef" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/tef" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  TEF
                </Link>
                <Link 
                  href="/services/ice-certification" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/ice-certification" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ICE Certification
                </Link>
                <Link 
                  href="/services/marketing-digital" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/marketing-digital" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Marketing Digital
                </Link>
                <Link 
                  href="/services/immigration-canada" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/immigration-canada" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Immigration Canada
                </Link>
                <Link 
                  href="/services/immigration-allemagne" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/immigration-allemagne" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Immigration Allemagne
                </Link>
                <Link 
                  href="/services/developpement-web" 
                  className={`block px-2 py-1 rounded-md text-sm ${pathname === "/services/developpement-web" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Développement Web
                </Link>
              </div>
              <Link 
                href="/about" 
                className={`block px-2 py-1 rounded-md ${pathname === "/about" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                À propos
              </Link>
              <Link 
                href="/contact" 
                className={`block px-2 py-1 rounded-md ${pathname === "/contact" ? "bg-orange-50 text-orange-600 font-medium" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
            
            <Button 
              onClick={() => { setMobileMenuOpen(false); openWhatsApp(); }}
              className="bg-green-500 hover:bg-green-600 text-white w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

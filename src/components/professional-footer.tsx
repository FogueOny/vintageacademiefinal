import Image from "next/image";
import { Phone } from "lucide-react";

export function ProfessionalFooter() {
  const currentYear = new Date().getFullYear();
  const evolueWhatsapp = (process.env.NEXT_PUBLIC_EVOLUE_WHATSAPP ?? '').toString();
  const evolueMessage = "J'ai vu votre travail sur le site de Vintage Académie et je souhaite discuter avec vous.";
  const evolueUrl = evolueWhatsapp
    ? `https://wa.me/${evolueWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(evolueMessage)}`
    : '';
  const hasEvolueUrl = Boolean(evolueUrl);
  const evolueHref = hasEvolueUrl ? evolueUrl : '#';
  
  return (
    <footer className="bg-gray-900 text-gray-300 py-8" suppressHydrationWarning>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo et nom */}
          <div className="flex items-center">
            <Image 
              src="/images/logo.png" 
              alt="Vintage Académie Logo" 
              width={40} 
              height={40}
              className="mr-3"
            />
            <h3 className="text-xl font-bold text-white">Vintage Académie</h3>
          </div>

          {/* Informations de contact */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm">
            <div className="flex items-center">
              <Phone size={16} className="mr-2 text-orange-500" />
              <a 
                href="https://wa.me/237652385531?text=Bonjour,%20je%20souhaite%20des%20informations%20sur%20vos%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-orange-500 transition-colors"
              >
                +237 6 52 38 55 31
              </a>
            </div>
            <div>
              <span>Douala, Cameroun</span>
            </div>
            <div>
              <span>info@vintageacademie.com</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-sm text-center md:text-right">
            <p>© {currentYear} Vintage Académie. Tous droits réservés.</p>
            <p className="mt-1">
              En partenariat avec{' '}
              <a
                href="https://hevolue.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-500 hover:underline transition-colors"
              >
                Hevolue
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}


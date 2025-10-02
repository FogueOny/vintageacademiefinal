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
              <span>+237 652 385 531</span>
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
            <p>© {currentYear} Vintage Académie</p>
            <a
              href={evolueHref}
              target={hasEvolueUrl ? "_blank" : undefined}
              rel={hasEvolueUrl ? "noopener noreferrer" : undefined}
              className={
                "text-orange-500 hover:text-orange-400 hover:underline" +
                (hasEvolueUrl ? "" : " cursor-not-allowed opacity-80 no-underline")
              }
              aria-disabled={hasEvolueUrl ? undefined : true}
            >
              Développé par EVOLUE
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}


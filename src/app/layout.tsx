import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConditionalHeader } from "@/components/layout/conditional-header";
import { TopLoader } from "@/components/ui/top-loader";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vintage Academie - Préparation TCF",
  description: "Préparez-vous au Test de Connaissance du Français avec Vintage Academie",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className} suppressHydrationWarning>
        <div className="flex min-h-screen flex-col">
          <TopLoader />
          <ConditionalHeader />
          <main className="flex-1">
            {children}
          </main>
          {/* Le footer professionnel est maintenant géré par le composant ProfessionalFooter */}
          <Toaster />
          <SonnerToaster position="top-right" richColors />
        </div>
      </body>
    </html>
  );
}
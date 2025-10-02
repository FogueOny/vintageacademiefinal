"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ComprehensionOraleTCFPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ComprehensionOraleTCFPage({ params }: ComprehensionOraleTCFPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers la page correcte
    const resolvedParams = params.then(({ slug }) => {
      console.log("Redirection depuis comprehension-orale-tcf/[slug]:", slug);
      // Rediriger vers la page principale du module
      router.replace("/module/comprehension-orale-tcf");
    });
  }, [params, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Redirection en cours...
                </h1>
                <p className="text-gray-600">
                  Vous allez être redirigé vers la page de compréhension orale TCF.
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Link href="/module/comprehension-orale-tcf">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Aller à la compréhension orale TCF
                  </Button>
                </Link>
                
                <Link href="/tests">
                  <Button variant="outline">
                    Voir tous les tests
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 
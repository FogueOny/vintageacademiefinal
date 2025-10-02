"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProfessionalFooter } from "@/components/professional-footer";
import { supabase } from "@/lib/supabase/client";
import { TestInterface } from "@/components/tests/test-interface";
import { TestDebug } from "@/components/tests/test-debug";

type Test = {
  id: string;
  name: string;
  slug: string;
  description: string;
  questions?: any[];
  duration?: string;
  instructions?: string;
  type_module?: string;
  module_id?: string;
}

type Module = {
  id: string;
  name: string;
  slug: string;
  description: string;
  type_module: string;
}

interface TestPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function TestPage({ params }: TestPageProps) {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers la page correcte selon le slug
    const resolvedParams = params.then(({ slug }) => {
      if (slug === "comprehension-orale-tcf") {
        router.replace("/module/comprehension-orale-tcf");
      } else if (slug.startsWith("comprehension-orale-tcf/")) {
        // Si c'est une sous-route, rediriger vers la page principale
        router.replace("/module/comprehension-orale-tcf");
      } else {
        // Pour les autres cas, rediriger vers la page des tests
        router.replace("/tests");
      }
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
                  Vous allez être redirigé vers la page appropriée.
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

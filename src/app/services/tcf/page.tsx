"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, BookOpen, Flag, Clock, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { ProfessionalFooter } from "@/components/professional-footer";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

type Module = {
  id: string;
  name: string;
  description: string;
  slug: string;
  type_module: string;
  features?: string | string[];
};

export default function TCFPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simModalOpen, setSimModalOpen] = useState(false);
  const ADMIN_WA = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '237652385531';
  const waMessage = encodeURIComponent(
    "Bonjour Vintage Académie, je souhaite des informations sur le simulateur TCF et les services TCF."
  );
  const waLink = `https://wa.me/${ADMIN_WA}?text=${waMessage}`;

  useEffect(() => {
    const controller = new AbortController();
    const loadModules = async () => {
      try {
        const response = await fetch('/api/services/modules?type=tcf', {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API responded with ${response.status}`);
        }

        const payload = await response.json();
        if (!controller.signal.aborted) {
          setModules(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch (e: any) {
        if (controller.signal.aborted) return;
        console.error('[TCF] Fetch modules error:', e?.message || e);
        setError("Impossible de charger les modules TCF pour le moment.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadModules();

    return () => {
      controller.abort();
    };
  }, []);

  const getModuleIcon = (slug: string) => {
    const s = (slug || '').toLowerCase();
    if (s.includes('canada')) {
      return <Image src="/images/canada-flag.png" alt="Canada" width={40} height={24} className="object-cover rounded-sm" />;
    }
    if (s.includes('quebec')) {
      return <Image src="/images/quebec-flag.png" alt="Québec" width={40} height={24} className="object-cover rounded-sm" />;
    }
    if (s.includes('france') || s.includes('irn')) {
      return <Image src="/images/france-flag.png" alt="France" width={40} height={24} className="object-cover rounded-sm" />;
    }
    return <Flag className="h-10 w-10 text-orange-500" />;
  };

  const getModuleLink = (m: Module) => {
    // Normaliser utilitaires
    const normalize = (str: string) =>
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[_\s]+/g, '-');

    const sSlug = normalize(m.slug || '');
    const sName = normalize((m as any).name || '');
    const text = `${sSlug}-${sName}`; // concat pour couvrir les 2

    const hasAll = (t: string, tokens: string[]) => tokens.every(tok => t.includes(tok));

    // Compréhension
    if (hasAll(text, ['comprehension', 'orale'])) return '/comprehension-orale';
    if (hasAll(text, ['comprehension', 'ecrite'])) return '/comprehension-ecrite';

    // Expression
    if (hasAll(text, ['expression', 'ecrite'])) return '/expression-ecrite-tcf';
    if (hasAll(text, ['expression', 'orale'])) return '/expression-orale-tcf';

    return null;
  };

  const parseFeatures = (raw?: string | string[]) => {
    if (!raw) return [] as string[];
    if (Array.isArray(raw)) return raw as string[];
    try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return []; }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-12 md:py-16 bg-gradient-to-br from-orange-50 to-orange-100 border-b">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium text-sm mb-4">
                <Sparkles className="h-4 w-4" />
                Services TCF Canada
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                Préparation complète au TCF
              </h1>
              <p className="text-gray-600 text-base md:text-lg mb-6">
                Méthodologie, sujets d’actualité, simulateur chronométré et corrections personnalisées.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setSimModalOpen(true)}
              >
                Lancer le simulateur <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
                <Link href="/expression-ecrite-tcf">
                  <Button size="lg" variant="outline">Expression Écrite</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Entrées rapides */}
        <section className="w-full py-8 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-t-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold">Expression Écrite TCF</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Méthodologie, sujets par mois, documents et corrections.</p>
                  <Link href="/expression-ecrite-tcf">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Découvrir</Button>
                  </Link>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold">Expression Orale TCF</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Méthodologie, sujets et corrections pour s’entraîner à l’oral.</p>
                  <Link href="/expression-orale-tcf">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Découvrir</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Accès directs Compréhension (affichés seulement si aucun module n'est disponible) */}
        {modules.length === 0 && !loading && !error && (
          <section className="w-full py-8 bg-white">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-t-4 border-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Flag className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">Compréhension Orale TCF</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Module de compréhension orale du TCF.</p>
                    <Link href="/comprehension-orale">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Accéder</Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-t-4 border-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Flag className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">Compréhension Écrite TCF</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Module de compréhension écrite du TCF.</p>
                    <Link href="/comprehension-ecrite">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Accéder</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Modules depuis Supabase  */}
        <section className="w-full py-10 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-36 rounded-lg border animate-pulse bg-gray-50" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => location.reload()} className="mt-4 bg-orange-500 hover:bg-orange-600">Réessayer</Button>
              </div>
            ) : modules.length === 0 ? (
              <div className="mt-2">
                <div className="mb-6 text-center">
                  <p className="text-gray-500">Aucun module TCF n’est disponible actuellement. Accédez directement aux entraînements:</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-t-4 border-orange-500">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Flag className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold">Compréhension Orale TCF</h3>
                      </div>
                      <p className="text-gray-600 mb-4">Module de compréhension orale du TCF.</p>
                      <Link href="/comprehension-orale">
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Accéder</Button>
                      </Link>
                    </CardContent>
                  </Card>
                  <Card className="border-t-4 border-orange-500">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Flag className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold">Compréhension Écrite TCF</h3>
                      </div>
                      <p className="text-gray-600 mb-4">Module de compréhension écrite du TCF.</p>
                      <Link href="/comprehension-ecrite">
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Accéder</Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {modules.map((m, idx) => {
                  const features = parseFeatures(m.features);
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-300 border-t-4 border-orange-500">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="rounded-md p-2 bg-orange-50 flex items-center justify-center">
                              {getModuleIcon(m.slug)}
                            </div>
                            <h3 className="text-xl font-bold">{m.name}</h3>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-3">{m.description}</p>
                          {features.length > 0 && (
                            <ul className="mb-4 grid grid-cols-2 gap-2 text-sm">
                              {features.slice(0,4).map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-gray-600">
                                  <CheckCircle className="h-4 w-4 text-orange-500" />
                                  <span className="truncate">{f}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex justify-end">
                            {(() => {
                              const link = getModuleLink(m);
                              if (link) {
                                return (
                                  <Link href={link}>
                                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                                      Accéder <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                  </Link>
                                );
                              }
                              return (
                                <Button
                                  className="bg-orange-500 hover:bg-orange-600 text-white"
                                  onClick={() => setSimModalOpen(true)}
                                >
                                  Accéder <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Avantages clés */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg bg-white border">
                <h3 className="font-semibold mb-2">Guides méthodologiques</h3>
                <p className="text-sm text-gray-600">Structure des 3 tâches, critères d’évaluation, exemples commentés.</p>
              </div>
              <div className="p-6 rounded-lg bg-white border">
                <h3 className="font-semibold mb-2">Simulateur chronométré</h3>
                <p className="text-sm text-gray-600">Conditions réelles avec timer et interface optimisée.</p>
              </div>
              <div className="p-6 rounded-lg bg-white border">
                <h3 className="font-semibold mb-2">Corrections personnalisées</h3>
                <p className="text-sm text-gray-600">Feedback détaillé sur vos productions écrites et orales.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="w-full py-12 bg-orange-50">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">Besoin d’aide pour démarrer ?</h2>
            <p className="text-gray-600 mb-6">Contactez-nous pour choisir la meilleure préparation.</p>
            <div className="flex items-center justify-center gap-3">
              <a href="https://wa.me/message/Q7VI4S4STSCPM1" target="_blank" rel="noopener noreferrer">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">Nous écrire sur WhatsApp</Button>
              </a>
              <Link href="/contact">
                <Button variant="outline">Formulaire de contact</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Dialog open={simModalOpen} onOpenChange={setSimModalOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Accès au simulateur TCF</DialogTitle>
      <DialogDescription>
        Pour accéder au simulateur chronométré, vous devez disposer d’un compte Vintage Académie.
        Créez un compte si vous n’en avez pas encore, ou connectez‑vous à votre espace.
      </DialogDescription>
    </DialogHeader>
    <div className="text-sm text-gray-600 space-y-2">
      <p>Le simulateur reproduit les conditions réelles (timer, navigation, structure officielle).</p>
      <p>Cette fonctionnalité est réservée aux utilisateurs authentifiés.</p>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setSimModalOpen(false)}>
        Fermer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      <ProfessionalFooter />
      <FloatingWhatsAppButton />
    </div>
  );
}

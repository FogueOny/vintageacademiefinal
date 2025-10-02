"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TestSeries {
  id: string;
  name: string;
  description: string;
  time_limit: number;
  slug: string;
  module_id: string;
  is_free?: boolean;
}

interface TestSeriesListProps {
  moduleSlug: string;
  moduleTitle: string;
}

interface AccessInfo {
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
  subscriptionStatus: string | null;
  subscriptionExpiry: string | null;
}

export function TestSeriesListUnified({ moduleSlug, moduleTitle }: TestSeriesListProps) {
  const router = useRouter();
  const [series, setSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inProgressAttempt, setInProgressAttempt] = useState<{ id: string; test_series_id: string } | null>(null);
  const [starting, setStarting] = useState(false);
  const [access, setAccess] = useState<AccessInfo>({
    isAuthenticated: false,
    hasActiveSubscription: false,
    subscriptionStatus: null,
    subscriptionExpiry: null,
  });
  const [resolvedUser, setResolvedUser] = useState<{ id: string; email?: string } | null>(null);

  // Helper: extract intended test index for natural sorting
  // Priority:
  // 1) Targeted match: "test 12" or "série 12"
  // 2) From slug
  // 3) Fallback: last number in the string
  // Safeguard: ignore obviously unrelated big numbers (> 300)
  const extractSeriesIndex = (input?: string, fallback?: string): number | null => {
    const pick = (txt?: string): number | null => {
      if (!txt) return null;
      // Normalize accents for pattern matching but keep digits
      const normalized = txt.normalize('NFD').replace(/\p{Diacritic}/gu, ''); // remove accents
      // Targeted: test|serie followed by digits (handles "Série", "Serie", "Test")
      const targeted = normalized.match(/\b(?:test|serie|srie)\b[^\d]*(\d{1,3})/i);
      if (targeted) {
        const n = parseInt(targeted[1], 10);
        return Number.isFinite(n) ? n : null;
      }
      // Fallback: choose the smallest reasonable number to avoid picking counts like "40 questions"
      const nums = (normalized.match(/\d{1,4}/g) || [])
        .map((v) => parseInt(v, 10))
        .filter((v) => Number.isFinite(v));
      if (nums.length) {
        const small = nums.filter((v) => v <= 300);
        const pick = (small.length ? Math.min(...small) : Math.min(...nums));
        return Number.isFinite(pick) ? pick : null;
      }
      return null;
    };
    return pick(input) ?? pick(fallback) ?? null;
  };

  useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      // Ne pas bloquer sur l'auth; on chargera en mode anonyme si besoin et on réactualisera après

      try {
        if (!mounted) return;
        setLoading(true);
        setError(null);

        console.log(`[TestSeries] Chargement pour module: ${moduleSlug}`);

        // 1. Récupérer les séries via API avec timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);

        let seriesData: TestSeries[] = [];
        let accessPayload: AccessInfo | null = null;
        let userPayload: { id: string; email?: string } | null = null;

        type TestSeriesApiResponse = {
          data: TestSeries[] | null;
          access: AccessInfo | null;
          user: { id: string; email?: string } | null;
        };

        try {
          const response = await fetch(`/api/test-series?moduleSlug=${encodeURIComponent(moduleSlug)}`, {
            signal: controller.signal,
            cache: 'no-store',
          });

          if (!response.ok) {
            if (response.status === 404) {
              console.warn(`[TestSeries] Module '${moduleSlug}' non trouvé`);
              setError(`Module "${moduleSlug}" non trouvé. Vérifiez qu&apos;il existe en base de données.`);
              return;
            }
            throw new Error(`HTTP ${response.status}`);
          }

          const result = (await response.json()) as TestSeriesApiResponse;
          seriesData = result.data ?? [];
          accessPayload = result.access ?? null;
          userPayload = result.user ?? null;
          
        } catch (fetchError: unknown) {
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            setError("Timeout lors du chargement des tests");
          } else {
            console.error('[TestSeries] Erreur API:', fetchError);
            setError("Erreur lors du chargement des tests");
          }
          return;
        } finally {
          clearTimeout(timeout);
        }

        console.log(`[TestSeries] ${seriesData.length} séries récupérées`);

        // 2. Filtrer selon l'abonnement
        let filteredSeries = seriesData;
        const resolvedAccess: AccessInfo = accessPayload ?? {
          isAuthenticated: false,
          hasActiveSubscription: false,
          subscriptionStatus: null,
          subscriptionExpiry: null,
        };

        if (!resolvedAccess.hasActiveSubscription) {
          filteredSeries = seriesData.filter(s => s.is_free === true);
          console.log(`[TestSeries] Accès restreint - ${filteredSeries.length} tests gratuits`);
        } else {
          console.log(`[TestSeries] Abonnement actif - ${filteredSeries.length} tests disponibles`);
        }

        // 2.1. Sort naturally: by number in name/slug if present, else localeCompare with numeric
        // Debug: log parsed indices once (dev aid)
        try {
          const sample = filteredSeries.slice(0, 8).map(s => ({
            name: s.name,
            slug: s.slug,
            idx: extractSeriesIndex(s.name, s.slug),
          }));
          console.table(sample);
        } catch {}

        const sortedSeries = [...filteredSeries].sort((a, b) => {
          const an = extractSeriesIndex(a.name, a.slug);
          const bn = extractSeriesIndex(b.name, b.slug);
          if (an != null && bn != null && an !== bn) return an - bn;
          if (an != null && bn == null) return -1;
          if (an == null && bn != null) return 1;
          return a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' });
        });

        setSeries(sortedSeries);
        setAccess(resolvedAccess);
        setResolvedUser(userPayload);

        // 3. Si utilisateur connecté, vérifier les tentatives en cours
        if (resolvedAccess.isAuthenticated && seriesData.length > 0 && userPayload?.id) {
          try {
            const supabase = getSupabaseBrowser();
            const seriesIds = seriesData.map(s => s.id);
            
            const { data: attemptData } = await supabase
              .from('user_tests')
              .select('id, test_series_id, status, created_at')
              .eq('user_id', userPayload.id)
              .eq('status', 'in_progress')
              .in('test_series_id', seriesIds)
              .order('created_at', { ascending: false })
              .limit(1);

            if (attemptData && attemptData.length > 0) {
              setInProgressAttempt({ 
                id: attemptData[0].id, 
                test_series_id: attemptData[0].test_series_id 
              });
            }
          } catch (attemptError) {
            console.warn('[TestSeries] Erreur tentatives en cours:', attemptError);
            // Ne pas bloquer pour cette erreur
          }
        }

      } catch (error) {
        if (!mounted) return;
        console.error("[TestSeries] Erreur générale:", error);
        setError("Une erreur inattendue s'est produite");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [moduleSlug]);

  // Démarrer un test
  const handleStart = async (seriesId: string) => {
    try {
      // Affiche un overlay bloquant et empêche toute interaction
      setStarting(true);
      const basePath = moduleSlug === 'comprehension-ecrite' ? '/comprehension-ecrite' : '/comprehension-orale';
      if (access.isAuthenticated && resolvedUser?.id) {
        // Utilisateur connecté : créer une tentative
        const supabase = getSupabaseBrowser();
        const { data, error } = await supabase
          .from('user_tests')
          .insert({ 
            user_id: resolvedUser.id, 
            test_series_id: seriesId, 
            status: 'in_progress' 
          })
          .select('id')
          .single();

        if (error) {
          console.error('[TestSeries] Erreur création tentative:', error);
          // Continuer sans attempt ID
          router.push(`${basePath}/${seriesId}`);
        } else {
          router.push(`${basePath}/${seriesId}?attempt=${data.id}`);
        }
      } else {
        // Utilisateur anonyme : navigation simple
        router.push(`${basePath}/${seriesId}`);
      }
    } catch (e) {
      console.error('[TestSeries] Erreur handleStart:', e);
      const basePath = moduleSlug === 'comprehension-ecrite' ? '/comprehension-ecrite' : '/comprehension-orale';
      // En cas d'erreur de création, tenter quand même la navigation
      try { router.push(`${basePath}/${seriesId}`); } finally { setStarting(false); }
    }
  };

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center py-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Chargement des tests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">{moduleTitle}</h1>
        <div className="text-center py-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-700 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} variant="outline">
                Réessayer
              </Button>
              <br />
              <Link href={access.isAuthenticated ? "/dashboard" : "/"}>
                <Button>{access.isAuthenticated ? 'Retour au tableau de bord' : "Retour à l&apos;accueil"}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">{moduleTitle}</h1>
        <div className="text-center py-10">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-lg text-gray-600 mb-4">
              {!access.isAuthenticated 
                ? "Connectez-vous pour accéder aux tests gratuits et payants."
                : !access.hasActiveSubscription
                ? "Aucun test gratuit disponible. Passez à un abonnement pour accéder à tous les tests."
                : "Aucune série de tests n\u2019est disponible pour le moment."
              }
            </p>
            {!access.isAuthenticated ? (
              <div className="space-x-4">
                <Link href="/login">
                  <Button>Se connecter</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline">S&apos;inscrire</Button>
                </Link>
              </div>
            ) : !access.hasActiveSubscription ? (
              <Link href="/pricing">
                <Button>Voir les abonnements</Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button>Retour au tableau de bord</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">{moduleTitle}</h1>
      
      {/* Bannière reprise de test */}
      {inProgressAttempt && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-primary font-medium">Vous avez une tentative en cours.</p>
            <p className="text-primary/80 text-sm">Vous pouvez la reprendre ou démarrer une nouvelle série ci-dessous.</p>
          </div>
          <Link href={`${moduleSlug === 'comprehension-ecrite' ? '/comprehension-ecrite' : '/comprehension-orale'}/${inProgressAttempt.test_series_id}?attempt=${inProgressAttempt.id}`}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Reprendre</Button>
          </Link>
        </div>
      )}
      
      {/* Statut utilisateur */}
      {access.isAuthenticated && resolvedUser && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            Connecté en tant que : <strong>{resolvedUser.email ?? 'Utilisateur'}</strong>
            <span className="ml-4">
              Statut : <Badge variant={access.hasActiveSubscription ? 'default' : 'secondary'}>
                {access.hasActiveSubscription ? 'Abonnement actif' : 'Abonnement inactif'}
              </Badge>
            </span>
          </div>
        </div>
      )}
      
      {/* Liste des tests */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {series.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{item.name}</CardTitle>
                {item.is_free && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Gratuit
                  </Badge>
                )}
              </div>
              <CardDescription>
                {item.description || "Série de questions pour vous entraîner"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Durée: {Math.floor(item.time_limit / 60)} minutes</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleStart(item.id)} disabled={starting} aria-busy={starting}>
                Commencer le test
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {starting && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          aria-live="assertive"
          aria-busy="true"
          role="alert"
          style={{ pointerEvents: 'all', touchAction: 'none' }}
        >
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <h2 className="mb-2 text-lg font-semibold">Chargement du test...</h2>
            <p className="text-sm text-muted-foreground">
              Merci de patienter quelques secondes sans cliquer. Nous préparons votre session.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

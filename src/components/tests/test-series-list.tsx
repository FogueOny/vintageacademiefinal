"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

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

interface UserProfile {
  id: string;
  email: string;
  subscription_status: string;
  subscription_expiry: string | null;
}

interface TestSeriesListProps {
  moduleSlug: string;
  moduleTitle: string;
}

export function TestSeriesList({ moduleSlug, moduleTitle }: TestSeriesListProps) {
  const router = useRouter();
  const [series, setSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inProgressAttempt, setInProgressAttempt] = useState<{ id: string; test_series_id: string } | null>(null);

  const subscriptionExpiryDate = userProfile?.subscription_expiry
    ? (() => {
        const parsed = new Date(userProfile.subscription_expiry);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      })()
    : null;

  const hasActiveSubscription = Boolean(
    user &&
    userProfile?.subscription_status === "active" &&
    subscriptionExpiryDate &&
    subscriptionExpiryDate.getTime() > Date.now()
  );

  const subscriptionStatusLabel = hasActiveSubscription ? "Abonnement actif" : "Abonnement inactif";
  const subscriptionExpiryLabel = subscriptionExpiryDate
    ? subscriptionExpiryDate.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const emptyStateMessage = !user
    ? "Connectez-vous pour accéder aux tests gratuits et payants."
    : hasActiveSubscription
      ? "Aucune série de tests n\u2019est disponible pour le moment."
      : "Aucun test gratuit disponible. Passez à un abonnement pour accéder à tous les tests.";

  useEffect(() => {
    let isMounted = true;
    let globalTimeout: ReturnType<typeof setTimeout> | null = null;
    let apiController: AbortController | null = null;

    async function fetchData() {
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          if (isMounted) {
            setError('Client Supabase non disponible');
            setLoading(false);
          }
          return;
        }

        console.log(`Recherche du module avec le slug: ${moduleSlug}`);

        globalTimeout = setTimeout(() => {
          if (!isMounted) {
            return;
          }
          console.warn('Timeout global atteint - arrêt du chargement');
          setError('Timeout lors du chargement des données');
          setLoading(false);
        }, 15000);

        let currentUser: User | null = null;

        try {
          const userPromise = supabase.auth.getUser();
          const userTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Auth timeout')), 5000)
          );

          const { data } = await Promise.race([userPromise, userTimeout]) as Awaited<typeof userPromise>;
          currentUser = data.user ?? null;
        } catch (authError: unknown) {
          console.warn('Erreur auth, continuation en mode anonyme:', authError);
          currentUser = null;
        }

        if (!isMounted) {
          return;
        }
        setUser(currentUser);
        console.log('Utilisateur:', currentUser?.email || 'Non connecté');

        let resolvedProfile: UserProfile | null = null;
        if (currentUser) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (profileError) {
            console.error('Erreur lors de la récupération du profil:', profileError);
          } else {
            resolvedProfile = profileData ?? null;
          }
        }

        if (!isMounted) {
          return;
        }
        setUserProfile(resolvedProfile);

        apiController = new AbortController();
        const apiTimeout = setTimeout(() => apiController?.abort(), 12000);

        type TestSeriesApiResponse = { data: TestSeries[] | null };
        let seriesData: TestSeries[] = [];

        try {
          const res = await fetch(`/api/test-series?moduleSlug=${encodeURIComponent(moduleSlug)}`, {
            signal: apiController.signal,
            cache: 'no-store',
          });

          if (!res.ok) {
            const payload = await res.json().catch(() => ({}));
            throw new Error(payload?.error || `HTTP ${res.status}`);
          }

          const payload = (await res.json()) as TestSeriesApiResponse;
          seriesData = payload.data ?? [];
        } catch (fetchError: unknown) {
          if (!isMounted) {
            return;
          }

          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.warn('Récupération des séries annulée (Abort)');
            setError('Timeout lors du chargement des données');
          } else {
            console.error('Erreur API /api/test-series:', fetchError);
            setError('Une erreur est survenue lors du chargement');
          }
          return;
        } finally {
          clearTimeout(apiTimeout);
        }

        if (!isMounted) {
          return;
        }
        console.log(`${seriesData.length} séries de tests récupérées via API`);

        let filteredSeries = seriesData;

        const now = new Date();
        const expiryDate = resolvedProfile?.subscription_expiry ? new Date(resolvedProfile.subscription_expiry) : null;
        const isActiveSubscription =
          !!currentUser &&
          resolvedProfile?.subscription_status === 'active' &&
          !!expiryDate &&
          expiryDate > now;

        if (!currentUser) {
          filteredSeries = filteredSeries.filter((seriesItem) => seriesItem.is_free === true);
          console.log('Utilisateur non connecté - Tests gratuits seulement:', filteredSeries.length);
        } else if (!isActiveSubscription) {
          filteredSeries = filteredSeries.filter((seriesItem) => seriesItem.is_free === true);
          console.log('Abonnement inactif/expiré - Tests gratuits seulement:', filteredSeries.length, {
            subscription_status: resolvedProfile?.subscription_status,
            subscription_expiry: resolvedProfile?.subscription_expiry,
          });
        } else {
          console.log('Abonnement actif - Tous les tests visibles:', filteredSeries.length);
        }

        setSeries(filteredSeries);

        if (currentUser && seriesData.length > 0) {
          const seriesIds = seriesData.map((seriesItem) => seriesItem.id);
          const { data: attemptData, error: attemptError } = await supabase
            .from('user_tests')
            .select('id, test_series_id, status, created_at')
            .eq('user_id', currentUser.id)
            .eq('status', 'in_progress')
            .in('test_series_id', seriesIds)
            .order('created_at', { ascending: false })
            .limit(1);

          if (attemptError) {
            console.error('Erreur lors de la récupération de la tentative en cours:', attemptError);
          } else {
            type AttemptRow = { id: string; test_series_id: string };
            const typedAttempts = attemptData as AttemptRow[] | null;
            if (typedAttempts && typedAttempts.length > 0) {
              setInProgressAttempt({ id: typedAttempts[0].id, test_series_id: typedAttempts[0].test_series_id });
            } else {
              setInProgressAttempt(null);
            }
          }
        } else {
          setInProgressAttempt(null);
        }
      } catch (loadError: unknown) {
        console.error('Erreur lors du chargement des séries de tests:', loadError);
        if (isMounted) {
          setError('Une erreur est survenue lors du chargement');
        }
      } finally {
        if (globalTimeout) {
          clearTimeout(globalTimeout);
        }
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
      if (globalTimeout) {
        clearTimeout(globalTimeout);
      }
      if (apiController) {
        apiController.abort();
      }
    };
  }, [moduleSlug]);

  // Créer une tentative au clic (authentifié seulement)
  const handleStart = async (seriesId: string) => {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data, error } = await supabase
          .from('user_tests')
          .insert({ user_id: currentUser.id, test_series_id: seriesId, status: 'in_progress' })
          .select('id')
          .single();
        if (error) {
          console.error('Erreur création tentative:', error);
          // Fallback: aller sans attempt param
          router.push(`/comprehension-orale/${seriesId}`);
          return;
        }
        router.push(`/comprehension-orale/${seriesId}?attempt=${data.id}`);
      } else {
        // Utilisateur anonyme: pas de création, navigation simple
        router.push(`/comprehension-orale/${seriesId}`);
      }
    } catch (startError: unknown) {
      console.error('Erreur handleStart:', startError);
      router.push(`/comprehension-orale/${seriesId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Chargement des séries de tests...</p>
        <p className="text-sm text-muted-foreground">Si le chargement prend trop de temps, actualisez la page (F5)</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">{moduleTitle}</h1>
        <div className="text-center py-10">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/dashboard">
            <Button>Retour au tableau de bord</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">{moduleTitle}</h1>
        <div className="text-center py-10">
          <p className="text-lg text-gray-500 mb-4">{emptyStateMessage}</p>
          {!user ? (
            <div className="space-x-4">
              <Link href="/login">
                <Button>Se connecter</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">S&apos;inscrire</Button>
              </Link>
            </div>
          ) : !hasActiveSubscription ? (
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
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">{moduleTitle}</h1>
      {/* Bannière reprise de test */}
      {inProgressAttempt && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-blue-800 font-medium">Vous avez une tentative en cours.</p>
            <p className="text-blue-700 text-sm">Vous pouvez la reprendre ou démarrer une nouvelle série ci-dessous.</p>
          </div>
          <Link href={`/comprehension-orale/${inProgressAttempt.test_series_id}?attempt=${inProgressAttempt.id}`}>
            <Button className="bg-blue-600 hover:bg-blue-700">Reprendre</Button>
          </Link>
        </div>
      )}
      
      {/* Statut de l'utilisateur */}
      {user && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            Connecté en tant que : <strong>{user.email}</strong>
            {userProfile && (
              <span className="ml-4">
                <>
                  Statut : <Badge variant={hasActiveSubscription ? 'default' : 'secondary'}>
                    {subscriptionStatusLabel}
                  </Badge>
                  {subscriptionExpiryLabel && (
                    <span className="ml-2 text-xs text-gray-500">(expire le {subscriptionExpiryLabel})</span>
                  )}
                </>
              </span>
            )}
          </div>
        </div>
      )}
      
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
              <Button className="w-full" onClick={() => handleStart(item.id)}>
                Commencer le test
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
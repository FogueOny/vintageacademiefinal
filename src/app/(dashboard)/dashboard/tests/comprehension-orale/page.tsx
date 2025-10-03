"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TestSeriesListUnified } from "@/components/tests/test-series-list-unified";
import { useAuthUnified } from "@/hooks/use-auth-unified";

export default function DashboardComprehensionOralePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, refreshAuth } = useAuthUnified();
  const redirectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function ensureAuthThenMaybeRedirect() {
      if (authLoading || redirectingRef.current) return;
      if (isAuthenticated) return;

      try {
        redirectingRef.current = true;
        const state = await refreshAuth();
        if (!cancelled && !state.isAuthenticated) {
          router.push("/");
        }
      } finally {
        redirectingRef.current = false;
      }
    }

    ensureAuthThenMaybeRedirect();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, router, refreshAuth]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Chargement de vos tests...</p>
          <p className="text-sm text-muted-foreground">Si le chargement prend trop de temps, actualisez la page (F5)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Compréhension orale (Espace membre)</h1>
        <p className="text-gray-600 text-base">
          Accédez à vos entraînements de compréhension orale réservés aux membres.
        </p>
      </div>

      <TestSeriesListUnified 
        moduleSlug="comprehension-orale" 
        moduleTitle="Tests de Compréhension Orale TCF"
      />
    </div>
  );
}

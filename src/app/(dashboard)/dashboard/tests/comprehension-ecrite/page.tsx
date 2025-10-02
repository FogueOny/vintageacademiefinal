"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TestSeriesListUnified } from "@/components/tests/test-series-list-unified";
import { useAuthUnified } from "@/hooks/use-auth-unified";

export default function DashboardComprehensionEcritePage() {
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
          router.push("/login?next=/dashboard/tests/comprehension-ecrite");
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
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Chargement…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Compréhension écrite (Espace membre)</h1>
        <p className="text-gray-600 text-base">
          Accédez à vos entraînements de compréhension écrite réservés aux membres.
        </p>
      </div>

      <TestSeriesListUnified 
        moduleSlug="comprehension-ecrite" 
        moduleTitle="Tests de Compréhension Écrite TCF"
      />
    </div>
  );
}

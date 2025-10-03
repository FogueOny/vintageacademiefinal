"use client";

import { TestSeriesListUnified } from "@/components/tests/test-series-list-unified";

export default function DashboardComprehensionOralePage() {
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

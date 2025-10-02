"use client";

import { TestSeriesListUnified } from "@/components/tests/test-series-list-unified";

export default function ComprehensionOralePage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Tests de Compréhension Orale</h1>
        <p className="text-gray-600 text-lg">
          Améliorez votre compréhension orale avec nos tests interactifs. 
          Écoutez des enregistrements audio et répondez aux questions pour évaluer votre niveau.
        </p>
      </div>
      
      <TestSeriesListUnified 
        moduleSlug="comprehension-orale" 
        moduleTitle="Tests de Compréhension Orale TCF"
      />
    </div>
  );
} 
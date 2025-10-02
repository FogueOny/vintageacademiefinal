"use client";

import { TestSeriesListUnified } from "@/components/tests/test-series-list-unified";

export default function ComprehensionEcritePage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Tests de Compréhension Écrite</h1>
        <p className="text-gray-600 text-lg">
          Améliorez votre compréhension écrite avec nos tests interactifs. 
          Lisez des textes variés et répondez aux questions pour évaluer votre niveau.
        </p>
      </div>
      
      <TestSeriesListUnified 
        moduleSlug="comprehension-ecrite" 
        moduleTitle="Tests de Compréhension Écrite TCF"
      />
    </div>
  );
}
// 
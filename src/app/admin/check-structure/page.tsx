"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CheckStructurePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkStructure = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/check-table-structure");
      const data = await response.json();

      setResult(data);
    } catch (error) {
      setResult({ error: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Vérifier la structure de la table</h1>
      
      <div className="max-w-2xl">
        <Button 
          onClick={checkStructure} 
          disabled={loading}
          className="mb-6"
        >
          {loading ? "Vérification..." : "Vérifier la structure"}
        </Button>
        
        {result && (
          <div className="bg-gray-100 p-4 rounded-md">
            <h2 className="font-bold mb-2">Résultat :</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 
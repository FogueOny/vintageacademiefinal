"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AddIsFreeFieldPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const addIsFreeField = async () => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/admin/add-is-free-field", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`Succès: ${data.message}`);
      } else {
        setResult(`Erreur: ${data.error}`);
      }
    } catch (error) {
      setResult(`Erreur: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Ajouter le champ is_free</h1>
      
      <div className="max-w-md">
        <Button 
          onClick={addIsFreeField} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Ajout en cours..." : "Ajouter le champ is_free"}
        </Button>
        
        {result && (
          <div className={`mt-4 p-4 rounded-md ${
            result.includes("Succès") 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
} 
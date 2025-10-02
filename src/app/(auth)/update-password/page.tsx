"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function UpdatePasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [done, setDone] = useState(false);

  // Vérifie le lien de récupération et établit une session
  useEffect(() => {
    const code = searchParams.get("code") || searchParams.get("token_hash");
    if (!code) {
      setError("Lien de réinitialisation invalide (paramètre manquant). Veuillez renvoyer un nouvel email depuis la page précédente.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: code });
        if (error) throw error;
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Lien invalide ou expiré. Il a peut-être déjà été utilisé. Veuillez renvoyer un nouvel email de réinitialisation et réessayer.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async () => {
    try {
      setError(null);
      if (!password || password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }
      if (password !== password2) {
        throw new Error("Les mots de passe ne correspondent pas");
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      // Redirige vers la page de login après 1.5s
      setTimeout(() => router.push("/login"), 1500);
    } catch (e: any) {
      setError(e.message || "Impossible de mettre à jour le mot de passe");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Mettre à jour votre mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Validation du lien…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : done ? (
            <div className="text-sm text-green-600">Mot de passe mis à jour. Redirection…</div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nouveau mot de passe</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
              </div>
              <div>
                <label className="text-sm font-medium">Confirmer le mot de passe</label>
                <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••" />
              </div>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={onSubmit}>
                Enregistrer
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Chargement…</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Initialisation…</div>
          </CardContent>
        </Card>
      </div>
    }>
      <UpdatePasswordInner />
    </Suspense>
  );
}
 

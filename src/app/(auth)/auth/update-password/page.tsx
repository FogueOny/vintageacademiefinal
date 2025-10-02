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
  const [verified, setVerified] = useState(false);
  const [needEmailVerify, setNeedEmailVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");

  // Vérifie le lien de récupération et établit une session
  useEffect(() => {
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash") || searchParams.get("token");
    console.debug('[update-password] params', { code, tokenHash });
    if (!code && !tokenHash) {
      setError("Lien de réinitialisation invalide (paramètre manquant). Veuillez renvoyer un nouvel email depuis la page précédente.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        if (tokenHash) {
          // Try recovery first, then magiclink/email fallbacks
          console.debug('[update-password] verify with token_hash (recovery)');
          let { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
          if (error) {
            console.debug('[update-password] recovery failed, try magiclink');
            ({ error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: tokenHash } as any));
          }
          if (error) {
            console.debug('[update-password] magiclink failed, try email');
            ({ error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash } as any));
          }
          if (error) throw error;
          setVerified(true);
        } else if (code) {
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
            setVerified(true);
          } catch (err) {
            // PKCE/code_verifier issues: fallback to verifyOtp with the code as token_hash
            console.debug('[update-password] exchangeCodeForSession failed, fallback verify with code');
            let { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: code });
            if (error) {
              ({ error } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: code } as any));
            }
            if (error) {
              ({ error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: code } as any));
            }
            if (error) {
              // Some projects require email+token instead of token_hash
              setNeedEmailVerify(true);
              throw error;
            }
            setVerified(true);
          }
        }
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
      if (!verified) throw new Error("Veuillez d'abord valider le lien de réinitialisation");
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

  const handleManualVerify = async () => {
    try {
      setError(null);
      const code = searchParams.get("code");
      if (!verifyEmail || !code) {
        setError("Email et code requis");
        return;
      }
      const { error } = await supabase.auth.verifyOtp({ type: 'recovery', email: verifyEmail, token: code } as any);
      if (error) throw error;
      setVerified(true);
      setNeedEmailVerify(false);
    } catch (e: any) {
      setError(e.message || "Échec de la validation manuelle du lien");
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
            <div className="space-y-3">
              <div className="text-sm text-red-600">{error}</div>
              {needEmailVerify && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Entrez l'email du compte pour valider manuellement le lien.</div>
                  <Input type="email" placeholder="email@exemple.com" value={verifyEmail} onChange={(e) => setVerifyEmail(e.target.value)} />
                  <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleManualVerify}>Valider le lien</Button>
                </div>
              )}
            </div>
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

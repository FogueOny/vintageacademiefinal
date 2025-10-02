"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { AuthReset } from "@/components/auth/auth-reset";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    password: z.string().min(6, { message: "6 caractères minimum" }),
    confirm: z.string().min(6, { message: "6 caractères minimum" }),
  })
  .refine((vals) => vals.password === vals.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    "Saisissez un nouveau mot de passe pour votre compte."
  );

  // Hint to the user if no session token present yet
  useEffect(() => {
    // Just show a gentle note; Supabase sets the session automatically via the link
    setInfo(
      "Si vous venez du lien email, vous pouvez définir un nouveau mot de passe ci-dessous."
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Mot de passe invalide");
      return;
    }

    try {
      setSubmitting(true);
      const supabase = getSupabaseBrowser();

      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (error) throw error;

      setInfo("Votre mot de passe a été mis à jour. Vous allez être redirigé...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (e: any) {
      setError(e?.message || "Impossible de mettre à jour le mot de passe");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      {/* Nettoyage d'état/auth à l'arrivée sur la page */}
      <AuthReset />
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Réinitialiser le mot de passe</CardTitle>
          <CardDescription className="text-center">
            Définissez un nouveau mot de passe pour votre compte.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouveau mot de passe</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmer le mot de passe</label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="********"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {info && <p className="text-sm text-muted-foreground">{info}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

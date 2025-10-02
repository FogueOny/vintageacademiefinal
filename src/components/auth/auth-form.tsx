"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { resolveUserRole } from "@/lib/auth/roles";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer un email valide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer un email valide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  fullName: z.string().min(2, { message: "Veuillez entrer votre nom complet" }),
});

interface AuthFormProps {
  defaultTab?: "login" | "register";
}

// Convertit les messages d'erreur Supabase génériques en messages clairs en français
function humanizeAuthError(raw: unknown): string {
  const msg = String((raw as any)?.message ?? raw ?? '').toLowerCase();
  // Cas fréquents
  if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
    return "Identifiants incorrects. Vérifiez votre email et votre mot de passe.";
  }
  if (msg.includes('email not confirmed') || msg.includes('email not confirmed') || msg.includes('email not verified')) {
    return "Votre email n'est pas encore vérifié. Consultez votre boîte mail pour valider votre compte.";
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('connection')) {
    return "Problème réseau. Vérifiez votre connexion et réessayez.";
  }
  if (msg.includes('user already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
    return "Cet email est déjà enregistré. Utilisez la connexion ou 'Mot de passe oublié'.";
  }
  if (msg.includes('password')) {
    return "Mot de passe invalide. Vérifiez et réessayez.";
  }
  // Fallback générique
  return (typeof raw === 'string' && raw) ? raw : "Une erreur est survenue. Réessayez.";
}

export function AuthForm({ defaultTab = "login" }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  // Loading flags for forgot-password flow
  const [forgotLoadingRequest, setForgotLoadingRequest] = useState(false);
  const [forgotLoadingResend, setForgotLoadingResend] = useState(false);
  const [forgotLoadingVerify, setForgotLoadingVerify] = useState(false);
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const searchParams = useSearchParams();
  const rawNext = searchParams?.get('next') || searchParams?.get('redirectedFrom') || null;
  const safeNext = rawNext && rawNext.startsWith('/') ? rawNext : null;
  const rawSiteUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://vafinals.netlify.app');
  const siteUrl = (rawSiteUrl || 'https://vafinals.netlify.app').replace(/\/$/, "");
  const evolueWhatsapp = (process.env.NEXT_PUBLIC_EVOLUE_WHATSAPP ?? '').toString();
  const evolueMessage = "J'ai vu votre travail sur le site de Vintage Académie et je souhaite discuter avec vous.";
  const evolueUrl = evolueWhatsapp
    ? `https://wa.me/${evolueWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(evolueMessage)}`
    : '';
  const isBusy = loading || redirecting;

  // On-mount: si déjà authentifié, rediriger selon le rôle et le paramètre next
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowser();
        // Précharger destinations probables
        try { router.prefetch('/dashboard'); router.prefetch('/admin-dashboard'); } catch (_) {}
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        if (!session || cancelled) return;

        const go = (target: string) => {
          if (cancelled) return;
          setRedirecting(true);
          try {
            router.replace(target);
            router.refresh();
          } catch (_) {
            try { window.location.replace(target); } catch {}
          }
        };

        const nextIsDashboard = !!safeNext && safeNext.startsWith('/dashboard');
        const roleResult = await resolveUserRole(supabase, session.user.id, {
          rpcTimeouts: [800, 1200],
          profileTimeoutMs: 2000,
        });

        if (roleResult.errors.length) {
          console.warn('[auth-form] resolveUserRole (mount) reported issues', roleResult.errors);
        }

        if (roleResult.isAdmin) {
          try { window.localStorage.setItem('va_role', 'admin'); } catch (_) {}
          const target = nextIsDashboard ? '/admin-dashboard' : (safeNext || '/admin-dashboard');
          go(target);
          return;
        }

        // Rediriger vers dashboard utilisateur par défaut
        const target = safeNext && !safeNext.startsWith('/admin-dashboard') ? safeNext : '/dashboard';
        go(target);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [safeNext, router]);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    if (loading || redirecting) return; // guard against double submit
    setLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabaseBrowser();
      // Prefetch likely destinations to speed up redirect
      try {
        router.prefetch('/dashboard');
        router.prefetch('/admin-dashboard');
      } catch (_) {}
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;
      
      // Vérifier le rôle de l'utilisateur, mais ne pas bloquer si la table profiles pose problème
      const goAdmin = async () => {
        setRedirecting(true);
        const target = safeNext && !safeNext.startsWith('/dashboard') ? safeNext : '/admin-dashboard';
        try {
          try { window.localStorage.setItem('va_role', 'admin'); } catch (_) {}
          router.replace(target);
          router.refresh();
          // Hard fallback si jamais la navigation client échoue
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.replace(target);
            }
          }, 600);
        } catch {
          if (typeof window !== 'undefined') {
            window.location.replace(target);
          }
        }
      };

      const goUser = async () => {
        console.log('[auth-form] Redirecting to user dashboard...');
        setRedirecting(true);
        const target = safeNext && !safeNext.startsWith('/admin-dashboard') ? safeNext : '/dashboard';
        console.log('[auth-form] Target:', target);
        try {
          try { window.localStorage.removeItem('va_role'); } catch (_) {}
          router.replace(target);
          router.refresh();
          setTimeout(() => {
            console.log('[auth-form] Hard redirect fallback to:', target);
            if (typeof window !== 'undefined') {
              window.location.replace(target);
            }
          }, 800);
        } catch (err) {
          console.error('[auth-form] Router redirect failed:', err);
          if (typeof window !== 'undefined') {
            window.location.replace(target);
          }
        }
      };

      if (data.user) {
        console.log('[auth-form] User logged in, resolving role...');
        const roleResult = await resolveUserRole(supabase, data.user.id, {
          rpcTimeouts: [1000, 1400],
          profileTimeoutMs: 2000,
        });

        console.log('[auth-form] Role result:', { isAdmin: roleResult.isAdmin, errors: roleResult.errors.length });

        if (roleResult.errors.length) {
          console.warn('[login] resolveUserRole reported issues', roleResult.errors);
        }

        if (roleResult.isAdmin) {
          console.log('[auth-form] Admin detected, redirecting to admin dashboard');
          await goAdmin();
          return;
        }

        // Si erreur mais pas admin, rediriger vers dashboard utilisateur par défaut
        console.log('[auth-form] Regular user, redirecting to user dashboard');
        await goUser();
        return;
      }

      console.log('[auth-form] No user data, redirecting to user dashboard');
      await goUser();
    } catch (error: any) {
      setError(humanizeAuthError(error) || "Une erreur est survenue lors de la connexion");
      setLoading(false);
    }
  }

  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    setLoading(true);
    setError(null);
    
    try {
      const email = values.email.trim().toLowerCase();
      // 1) Vérifie si l'email existe déjà via l'API admin sécurisée
      try {
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json?.error || "Vérification d'email indisponible. Réessayez plus tard.");
          setLoading(false);
          return;
        }
        if (json?.exists) {
          setError("Un compte avec cet email existe déjà. Essayez de vous connecter ou utilisez 'Mot de passe oublié'.");
          setLoading(false);
          return;
        }
      } catch (_) {
        setError("Vérification d'email indisponible (réseau). Réessayez plus tard.");
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
          emailRedirectTo: `${siteUrl}/login`,
        },
      });

      if (error) throw error;

      // Le profil utilisateur est automatiquement créé par le trigger handle_new_user dans Supabase
      router.push("/auth/verify");
    } catch (error: any) {
      // Harmonise les messages d'erreur de duplication
      const msg = String(error?.message || '').toLowerCase();
      if (msg.includes('user already registered') || msg.includes('duplicate') || msg.includes('already exists')) {
        setError("Cet email est déjà enregistré. Utilisez la connexion ou 'Mot de passe oublié'.");
      } else {
        setError(humanizeAuthError(error) || "Une erreur est survenue lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  }

  

  return (
    <>
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <img src="/images/logo.png" alt="Vintage Academie" className="h-10 mx-auto mb-2" />
        <CardTitle className="text-2xl text-center">Bienvenue chez Vintage Academie</CardTitle>
        <CardDescription className="text-center">
          Connectez-vous ou créez un compte pour accéder aux tests TCF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Form {...loginForm}>
              <form
                method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  loginForm.handleSubmit(onLoginSubmit)(e);
                }}
                className="space-y-4 pt-4"
                noValidate
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="votre@email.com"
                          disabled={isBusy}
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="********"
                            disabled={isBusy}
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((v) => !v)}
                            className="absolute inset-y-0 right-2 flex items-center px-2 text-muted-foreground hover:text-foreground"
                            aria-label={showLoginPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          >
                            {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && <p className="text-orange-500 text-sm">{error}</p>}
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOpen((o) => !o);
                      setForgotStatus(null);
                      setForgotEmail(loginForm.getValues("email") || "");
                      setForgotStep("request");
                      setOtpCode("");
                      setNewPwd("");
                      setNewPwd2("");
                      setForgotLoadingRequest(false);
                      setForgotLoadingResend(false);
                      setForgotLoadingVerify(false);
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                {/* Popup handled below */}
                <Button type="submit" className="w-full" disabled={loading || redirecting} aria-busy={loading || redirecting}>
                  {redirecting ? "Redirection..." : loading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="register">
            <Form {...registerForm}>
              <form
                method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  registerForm.handleSubmit(onRegisterSubmit)(e);
                }}
                className="space-y-4 pt-4"
                noValidate
              >
                <FormField
                  control={registerForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean Dupont" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="votre@email.com" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showRegisterPassword ? "text" : "password"}
                            placeholder="********"
                            autoComplete="new-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword((v) => !v)}
                            className="absolute inset-y-0 right-2 flex items-center text-xs font-medium text-muted-foreground hover:text-foreground"
                            aria-label={showRegisterPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          >
                            {showRegisterPassword ? "Masquer" : "Afficher"}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && <p className="text-orange-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Création..." : "Créer un compte"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="w-full flex flex-col items-center gap-1">
          <p className="text-sm text-muted-foreground">
            En vous connectant, vous acceptez nos conditions d'utilisation.
          </p>
          {evolueUrl ? (
            <a
              href={evolueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-600 hover:text-orange-700 hover:underline"
            >
              Développé par <span className="font-semibold">EVOLUE</span>
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">Développé par <span className="font-semibold">EVOLUE</span></p>
          )}
        </div>
      </CardFooter>
    </Card>
    {forgotOpen && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Réinitialisation du mot de passe"
      >
        <div className="mx-4 w-full max-w-md rounded-xl bg-white/90 shadow-lg border p-5">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-lg font-semibold">Mot de passe oublié</h2>
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
          {forgotStep === "request" ? (
            <p className="text-sm text-muted-foreground mb-3">
              Entrez votre email pour recevoir un code (OTP) à 6 chiffres. Ce code est valable 10 minutes.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">
              Un code vous a été envoyé par email. Saisissez-le ci-dessous puis choisissez votre nouveau mot de passe.
            </p>
          )}
          <div className="space-y-3">
            {forgotStep === "request" ? (
              <>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoFocus
                  disabled={forgotLoadingRequest}
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setForgotOpen(false)} disabled={forgotLoadingRequest}>
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    disabled={forgotLoadingRequest}
                    aria-busy={forgotLoadingRequest}
                    onClick={async () => {
                      if (forgotLoadingRequest) return;
                      setForgotStatus(null);
                      const email = (forgotEmail || "").trim().toLowerCase();
                      if (!email) { setForgotStatus("Veuillez entrer un email valide"); return; }
                      setForgotLoadingRequest(true);
                      try {
                        const res = await fetch('/api/auth/request-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email }),
                        });
                        const json = await res.json().catch(() => ({}));
                        if (!res.ok) { setForgotStatus(json?.error || "Échec de l'envoi du code"); return; }
                        setForgotStatus("Code envoyé. Vérifiez votre boîte mail.");
                        setForgotStep("verify");
                      } catch (e: any) {
                        setForgotStatus("Erreur réseau. Réessayez.");
                      } finally {
                        setForgotLoadingRequest(false);
                      }
                    }}
                  >
                    {forgotLoadingRequest ? "Envoi…" : "Recevoir le code"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0,6))}
                  placeholder="Code à 6 chiffres"
                  autoFocus
                  disabled={forgotLoadingVerify}
                />
                <Input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Nouveau mot de passe (6+ caractères)"
                  disabled={forgotLoadingVerify}
                />
                <Input
                  type="password"
                  value={newPwd2}
                  onChange={(e) => setNewPwd2(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  disabled={forgotLoadingVerify}
                />
                <div className="flex gap-2 justify-between">
                  <Button type="button" variant="secondary" onClick={() => setForgotStep("request")} disabled={forgotLoadingVerify || forgotLoadingResend}>Retour</Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" disabled={forgotLoadingResend || forgotLoadingVerify} aria-busy={forgotLoadingResend} onClick={async () => {
                      if (forgotLoadingResend) return;
                      // resend code
                      setForgotStatus(null);
                      const email = (forgotEmail || "").trim().toLowerCase();
                      if (!email) { setForgotStatus("Email manquant"); return; }
                      setForgotLoadingResend(true);
                      try {
                        const res = await fetch('/api/auth/request-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email }),
                        });
                        const json = await res.json().catch(() => ({}));
                        if (!res.ok) { setForgotStatus(json?.error || "Échec de renvoi du code"); return; }
                        setForgotStatus("Nouveau code envoyé.");
                      } catch (e: any) {
                        setForgotStatus("Erreur réseau. Réessayez.");
                      } finally {
                        setForgotLoadingResend(false);
                      }
                    }}>{forgotLoadingResend ? "Renvoi…" : "Renvoyer"}</Button>
                    <Button
                      type="button"
                      disabled={forgotLoadingVerify}
                      aria-busy={forgotLoadingVerify}
                      onClick={async () => {
                        if (forgotLoadingVerify) return;
                        setForgotStatus(null);
                        const email = (forgotEmail || "").trim().toLowerCase();
                        if (!email) { setForgotStatus("Email manquant"); return; }
                        if (!otpCode || otpCode.length !== 6) { setForgotStatus("Code invalide"); return; }
                        if (!newPwd || newPwd.length < 6) { setForgotStatus("Mot de passe trop court"); return; }
                        if (newPwd !== newPwd2) { setForgotStatus("Les mots de passe ne correspondent pas"); return; }
                        setForgotLoadingVerify(true);
                        try {
                          const res = await fetch('/api/auth/verify-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, otp: otpCode, new_password: newPwd }),
                          });
                          const json = await res.json().catch(() => ({}));
                          if (!res.ok) { setForgotStatus(json?.error || "Échec de la vérification"); return; }
                          setForgotStatus("Mot de passe mis à jour. Vous pouvez vous connecter.");
                          setTimeout(() => {
                            setForgotOpen(false);
                            // Optionnel: pré-remplir l'email et switch focus
                          }, 600);
                        } catch (e: any) {
                          setForgotStatus("Erreur réseau. Réessayez.");
                        } finally {
                          setForgotLoadingVerify(false);
                        }
                      }}
                    >
                      {forgotLoadingVerify ? "Validation…" : "Valider"}
                    </Button>
                  </div>
                </div>
              </>
            )}
            {forgotStatus && (
              <div className={`text-sm rounded-md border p-2 ${/impossible|échec|erreur|invalide|court|correspondent|réseau|expiré|incorrect/i.test(forgotStatus || '') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {forgotStatus}
              </div>
            )}
            <div className="flex justify-end">
              {evolueUrl ? (
                <a
                  href={evolueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Développé par <span className="font-semibold">EVOLUE</span>
                </a>
              ) : (
                <p className="text-[10px] text-muted-foreground">Développé par <span className="font-semibold">EVOLUE</span></p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    {isBusy && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        role="alertdialog"
        aria-live="assertive"
        aria-busy="true"
        aria-modal="true"
      >
        <div className="mx-4 max-w-sm w-full rounded-xl bg-white/90 shadow-lg p-6 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h2 className="text-lg font-semibold mb-1">Connexion en cours…</h2>
          <p className="text-sm text-muted-foreground">Merci de patienter quelques secondes pendant que nous préparons votre espace.</p>
        </div>
      </div>
    )}
    </>
  );
}

import { AuthForm } from "@/components/auth/auth-form";
import { AuthReset } from "@/components/auth/auth-reset";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      {/* Nettoyage d'état/auth à l'arrivée sur la page */}
      <AuthReset />
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </div>
  );
}

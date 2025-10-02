import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { AuthReset } from "@/components/auth/auth-reset";

export default function VerifyPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      {/* Nettoyage d'état/auth à l'arrivée sur la page */}
      <AuthReset />
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-center">Vérifiez votre email</CardTitle>
          <CardDescription className="text-center">
            Un lien de vérification a été envoyé à votre adresse email.
            Veuillez vérifier votre boîte de réception et cliquer sur le lien pour activer votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Si vous n&apos;avez pas reçu d&apos;email, vérifiez votre dossier de spam
            ou demandez un nouvel email de vérification.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Link href="/login">
            <Button variant="outline">Retour à la connexion</Button>
          </Link>
          <Link href="/">
            <Button>Page d&apos;accueil</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
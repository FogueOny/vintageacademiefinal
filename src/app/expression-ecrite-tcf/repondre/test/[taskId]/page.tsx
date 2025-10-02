"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthUnified } from "@/hooks/use-auth-unified";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ETask { id: string; task_number: number; title: string | null; description: string | null; instructions?: string | null }
interface EDoc { id: string; task_id: string; document_number: number; title: string | null; content: string | null; source: string | null; document_type: string | null }

const WORD_LIMITS: Record<number, number> = { 1: 120, 2: 150, 3: 180 };
const TASK_DURATIONS_SEC: Record<number, number> = { 1: 10 * 60, 2: 20 * 60, 3: 30 * 60 };

function countWords(text: string): number {
  const words = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 1 && words[0] === "") return 0;
  return words.length;
}

export default function TestPage() {
  const router = useRouter();
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuthUnified();

  const [task, setTask] = useState<ETask | null>(null);
  const [answer, setAnswer] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeUpOpen, setTimeUpOpen] = useState(false);
  const [documents, setDocuments] = useState<EDoc[]>([]);

  const durationSeconds = useMemo(() => (task ? (TASK_DURATIONS_SEC[task.task_number] ?? 600) : 600), [task]);
  const [remaining, setRemaining] = useState<number>(600);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/expression-ecrite/tasks/${taskId}`);
        if (!res.ok) throw new Error("Sujet introuvable");
        const data = await res.json();
        if (mounted) setTask(data.task);
        // Charger les documents si Tâche 3
        try {
          const docRes = await fetch(`/api/expression-ecrite/tasks/${taskId}/documents`);
          if (docRes.ok) {
            const dj = await docRes.json();
            if (mounted) setDocuments(Array.isArray(dj.documents) ? dj.documents : []);
          }
        } catch {}
      } catch (e: any) {
        console.error(e);
        if (mounted) setError(e.message ?? "Erreur de chargement");
      }
    })();
    return () => { mounted = false; };
  }, [taskId]);

  const wordLimit = task ? WORD_LIMITS[task.task_number] ?? 150 : 150;
  const wordCount = countWords(answer);
  const overLimit = wordCount > wordLimit;
  const timeOver = remaining <= 0;

  const storageKey = task ? `va-ee-test:${task.id}` : "";

  // Charger une réponse sauvegardée (si existante) AVANT le démarrage
  useEffect(() => {
    if (!storageKey) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) setAnswer(saved);
  }, [storageKey]);

  // Sauvegarde auto
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, answer);
  }, [answer, storageKey]);

  // Reset du temps quand la tâche (et donc la durée) est connue et que le test n'est pas démarré
  useEffect(() => {
    if (!task || started) return;
    setRemaining(durationSeconds);
  }, [task, durationSeconds, started]);

  // Fin du temps: auto-soumettre une seule fois puis ouvrir le modal
  useEffect(() => {
    if (!started || sending || !task) return;
    if (remaining > 0) return;
    // Auto submit once
    if (!autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      // Lancer un envoi automatique sans bloquer sur nom/email
      onSubmit(true).finally(() => {
        setTimeUpOpen(true);
      });
    } else {
      setTimeUpOpen(true);
    }
  }, [remaining, started, sending, task]);

  // Gestion du timer déclenché par l'utilisateur
  const startTest = () => {
    if (started) return;
    setStarted(true);
    const startKey = `va-ee-test:start:${task?.id}`;
    const now = Date.now();
    localStorage.setItem(startKey, String(now));

    const tick = () => {
      const s0 = localStorage.getItem(startKey);
      const base = s0 ? parseInt(s0, 10) : now;
      const elapsed = Math.floor((Date.now() - base) / 1000);
      const left = Math.max(0, durationSeconds - elapsed);
      setRemaining(left);
      if (left <= 0 && timerRef.current) {
        clearInterval(timerRef.current as any);
        timerRef.current = null;
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000) as any;
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current as any); }, []);

  const onSubmit = async (auto: boolean = false) => {
    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      if (!task) throw new Error("Aucun sujet");
      if (!answer.trim()) throw new Error("Votre réponse est vide");
      if (!started) throw new Error("Veuillez démarrer le test");
      // Bloquer seulement si ce n'est PAS un envoi auto et que le temps est écoulé
      if (!auto && timeOver && !autoSubmittedRef.current) throw new Error("Temps écoulé");
      // En mode auto, ne pas bloquer sur nom/email. En mode manuel, valider.
      let email = userEmail.trim();
      if (!auto) {
        if (!userName.trim()) throw new Error("Le nom est requis");
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) throw new Error("Email invalide");
      } else {
        // En auto, si email invalide ou vide, ne pas l'envoyer
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) email = "";
      }

      const res = await fetch("/api/submit-reponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: task.id,
          task_number: task.task_number,
          task_title: task.title,
          answer_text: answer,
          word_count: wordCount,
          time_spent_sec: durationSeconds - remaining,
          user_name: auto ? (userName?.trim() || undefined) : userName || undefined,
          user_email: (email && email.length > 0) ? email : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Envoi impossible");

      // L'API a envoyé l'email via Resend côté serveur
      setSuccess("Réponse envoyée avec succès. Un email de notification a été envoyé à l'équipe. Merci !");
      setAnswer("");
      if (storageKey) localStorage.removeItem(storageKey);
      const startKey = `va-ee-test:start:${task?.id}`;
      localStorage.removeItem(startKey);
      setStarted(false);
      setRemaining(durationSeconds);
      // Conserver le flag autoSubmittedRef à true pour ne pas renvoyer plusieurs fois
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
          Test — Expression Écrite
        </h1>
        <p className="text-muted-foreground mt-1">Étape 3/3 — Démarrez le test pour lancer le chrono.</p>
      </div>

      {task && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{task.title || `Tâche ${task.task_number}`}</CardTitle>
            <CardDescription>
              <span className="inline-block mr-2">Limite: {wordLimit} mots</span>
              <span className="inline-block rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-xs font-semibold">
                Tâche {task.task_number}
              </span>
              <span className="inline-block ml-2 rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-xs font-semibold">
                Durée: {Math.round(durationSeconds / 60)} min
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Documents de référence (Tâche 3) */}
            {task.task_number === 3 && documents.length > 0 && (
              <div>
                <div className="text-[13px] font-semibold text-orange-700 uppercase tracking-wide mb-2">Documents de référence</div>
                <div className="grid md:grid-cols-2 gap-3">
                  {documents.map((d) => (
                    <div key={d.id} className="rounded-md border p-3 bg-gray-50">
                      <div className="text-sm font-semibold mb-1">{d.title || `Document ${d.document_number}`}</div>
                      {d.source && (
                        <div className="text-xs text-gray-500 mb-1">Source: {d.source}</div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{d.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {task.description && (
              <div>
                <div className="text-[13px] font-semibold text-orange-700 uppercase tracking-wide mb-1">Sujet</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
            {task.instructions && (
              <div>
                <div className="text-[13px] font-semibold text-orange-700 uppercase tracking-wide mb-1">Instructions</div>
                <div className="text-sm whitespace-pre-wrap rounded-md border border-dashed p-3 bg-orange-50/40">
                  {task.instructions}
                </div>
              </div>
            )}
            <div className="pt-1">
              <Button onClick={startTest} disabled={started}>
                {started ? "Test démarré" : "Lancer le test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Votre réponse</CardTitle>
          <CardDescription>
            {!started ? (
              <span>Démarrez quand vous êtes prêt.</span>
            ) : (
              <span>Temps restant: <strong className={timeOver ? "text-red-600" : ""}>{fmt(remaining)}</strong> • Mots: <strong className={overLimit ? "text-red-600" : ""}>{wordCount}</strong> / {wordLimit}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button onClick={() => router.back()} variant="secondary">Retour</Button>
              <Button onClick={() => navigator.clipboard.writeText(answer)} variant="outline" disabled={!answer}>Copier</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ee-name">Nom (optionnel)</Label>
                <Input id="ee-name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Votre nom" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ee-email">Email (optionnel)</Label>
                <Input id="ee-email" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="vous@example.com" required />
              </div>
            </div>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={!started ? "Cliquez sur 'Commencer le test' pour démarrer le chrono" : "Rédigez votre réponse ici..."}
              rows={12}
              disabled={!task || !started || timeOver}
              className={overLimit ? "border-red-600" : ""}
            />
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
            <div>
            <Button onClick={() => onSubmit()} disabled={
  sending || !task || !started || timeOver || !answer.trim() || !userName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())
}>
  {sending ? "Envoi..." : "Envoyer la réponse"}
</Button>
              {overLimit && (
                <div className="mt-2 text-sm text-orange-700">Vous avez dépassé la limite recommandée de {wordLimit} mots (actuel: {wordCount}). Votre réponse sera quand même envoyée.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Temps écoulé */}
      <AlertDialog open={timeUpOpen} onOpenChange={setTimeUpOpen}>
        <AlertDialogContent className="backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <AlertDialogHeader>
            <AlertDialogTitle>Temps écoulé ⏱️</AlertDialogTitle>
            <AlertDialogDescription>
              Le temps imparti pour cette tâche est terminé. Merci pour votre participation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setTimeUpOpen(false);
                router.push(user ? "/dashboard" : "/");
              }}
            >
              {user ? "Aller au tableau de bord" : "Retour à l'accueil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

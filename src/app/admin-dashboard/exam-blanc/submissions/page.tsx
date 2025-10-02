'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

interface Submission {
  id: string;
  user_email?: string;
  user_name?: string;
  plan_id?: string;
  plan_type?: string;
  status?: 'in_progress' | 'submitted' | 'graded';
  score?: number | null;
  submitted_at?: string | null;
}

export default function ExamBlancSubmissionsPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string>('');
  const { toast } = useToast();
  const isDeleting = Boolean(deletingId);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [order, setOrder] = useState<'recent' | 'oldest'>('recent');
  const [hasMore, setHasMore] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), order });
      const res = await fetch(`/api/exam-submissions?${params.toString()}`);
      if (!res.ok) {
        setSubs([]);
        return;
      }
      const json = await res.json();
      setSubs(json.data || []);
      setHasMore(Boolean(json?.has_more));
    } catch {
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, order]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Soumissions - Examen blanc</h1>
          <p className="text-gray-600">Liste des examens blancs soumis par les étudiants</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">Total soumissions</div>
            <div className="text-3xl font-bold">{subs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">Soumis aujourd'hui</div>
            <div className="text-3xl font-bold">{subs.filter(s => s.submitted_at && new Date(s.submitted_at).toDateString() === new Date().toDateString()).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">En attente de correction</div>
            <div className="text-3xl font-bold">{subs.filter(s => s.status === 'submitted').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Soumissions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Trier:</span>
              <div className="inline-flex rounded-lg border overflow-hidden">
                <button
                  className={`px-3 py-1 text-sm ${order==='recent' ? 'bg-orange-600 text-white' : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => setOrder('recent')}
                >Plus récents</button>
                <button
                  className={`px-3 py-1 text-sm border-l ${order==='oldest' ? 'bg-orange-600 text-white' : 'bg-white hover:bg-gray-50'}`}
                  onClick={() => setOrder('oldest')}
                >Moins récents</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={loading || page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Précédent</Button>
              <span className="text-sm text-gray-600">Page {page}</span>
              <Button variant="outline" size="sm" disabled={loading || !hasMore} onClick={() => setPage(p => p+1)}>Suivant</Button>
            </div>
          </div>
          <div className="relative overflow-x-auto">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <div className="px-4 py-2 rounded-lg border border-white/40 bg-white/80 shadow flex items-center gap-2">
                  <span className="inline-block h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-700">Chargement…</span>
                </div>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Examen</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Soumis le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Aucune soumission</TableCell></TableRow>
                ) : subs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.user_name || s.user_email || '—'}</TableCell>
                    <TableCell><Badge variant="outline">{s.plan_type || 'examen_blanc'}</Badge></TableCell>
                    <TableCell>
                      {s.status === 'graded' ? <Badge className="bg-green-600">Corrigé</Badge> : s.status === 'submitted' ? <Badge className="bg-orange-600">À corriger</Badge> : <Badge variant="secondary">En cours</Badge>}
                    </TableCell>
                    <TableCell>{typeof s.score === 'number' ? s.score : '—'}</TableCell>
                    <TableCell>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin-dashboard/exam-blanc/submissions/${s.id}`)}>Voir</Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === s.id}
                          onClick={() => { setTargetId(s.id); setConfirmOpen(true); }}
                        >Supprimer</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Glass-style confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(o) => { if (!o) { setConfirmOpen(false); setTargetId(''); } }}>
        <DialogContent className="backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-white/40 shadow-xl">
          <DialogHeader>
            <DialogTitle>Supprimer la soumission ?</DialogTitle>
            <DialogDescription>
              Cette action est définitive. La soumission et ses réponses associées seront supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (!isDeleting) { setConfirmOpen(false); setTargetId(''); } }} disabled={isDeleting}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={async () => {
                if (!targetId) return;
                setDeletingId(targetId);
                try {
                  const res = await fetch(`/api/exam-submissions/${targetId}`, { method: 'DELETE' });
                  if (res.ok) {
                    setSubs(prev => prev.filter(x => x.id !== targetId));
                    toast({ description: 'Soumission supprimée avec succès.' });
                  } else {
                    toast({ description: 'Échec de la suppression.', variant: 'destructive' });
                  }
                } catch {
                  toast({ description: 'Échec de la suppression.', variant: 'destructive' });
                } finally {
                  setDeletingId('');
                  setConfirmOpen(false);
                  setTargetId('');
                }
              }}
            >{isDeleting ? 'Suppression…' : 'Supprimer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-screen glass loading overlay when deleting */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="px-6 py-4 rounded-xl border border-white/40 bg-white/60 dark:bg-gray-900/60 shadow-2xl flex items-center gap-3">
            <span className="inline-block h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-800 dark:text-gray-100">Suppression en cours…</span>
          </div>
        </div>
      )}
    </div>
  );
}

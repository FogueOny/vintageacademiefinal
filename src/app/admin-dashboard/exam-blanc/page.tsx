'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Eye } from 'lucide-react';

export default function ExamBlancAdminPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [countCO, setCountCO] = useState(39);
  const [countCE, setCountCE] = useState(39);
  const total = useMemo(() => countCO + countCE, [countCO, countCE]);
  // Redirect to dedicated preview page with confirmation flow
  const [usedIds, setUsedIds] = useState<{ comp: Set<string>; ee: Set<string>; eo: Set<string> } | null>(null);
  // Placeholder KPI - to be replaced when availability scheduling exists
  const [availableToday, setAvailableToday] = useState<number>(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exam-plans');
      const json = await res.json();
      setPlans(json.data || []);
      // TODO: compute availableToday from scheduling when implemented
      setAvailableToday(0);
    } finally {
      setLoading(false);
    }
  };

  // Inline preview & propose flow removed from builder; handled in dedicated preview page

  useEffect(() => { load(); }, []);

  // Fetch used IDs to pre-flag items
  useEffect(() => {
    const fetchUsed = async () => {
      try {
        const res = await fetch('/api/exam-plans/used-ids');
        const json = await res.json();
        const comp = new Set<string>(json?.data?.used_comp_question_ids?.map((x: any) => String(x)) || []);
        const ee = new Set<string>(json?.data?.used_ee_task_ids?.map((x: any) => String(x)) || []);
        const eo = new Set<string>(json?.data?.used_eo_subject_ids?.map((x: any) => String(x)) || []);
        setUsedIds({ comp, ee, eo });
      } catch {}
    };
    fetchUsed();
  }, []);

  const createPlan = async (_exclude?: { comp_question_ids?: string[]; ee_task_ids?: string[]; eo_task_ids?: string[] }) => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/exam-blanc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counts: { CO: countCO, CE: countCE }, persist: false }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.error || 'Génération échouée (vérifiez la disponibilité des pools CO/CE/EE/EO)';
        setApiError(String(msg));
        return;
      }
      if (json?.plan) {
        try { sessionStorage.setItem('examPlanDraft', JSON.stringify(json.plan)); } catch {}
        router.push('/admin-dashboard/exam-blanc/preview');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const previewPlan = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exam-plans/${id}`);
      const json = await res.json();
      if (json?.data?.plan) {
        try {
          sessionStorage.setItem('examPlanDraft', JSON.stringify(json.data.plan));
        } catch {}
        router.push('/admin-dashboard/exam-blanc/preview');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const removePlan = async (id: string) => {
    if (!confirm('Supprimer ce plan ?')) return;
    await fetch(`/api/exam-plans/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Examen blanc - Administration</h1>
          <p className="text-gray-600">Vue d'ensemble, KPIs et actions rapides</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin-dashboard/exam-blanc/submissions')}>Voir les soumissions</Button>
          <Button onClick={() => document.getElementById('create-plan')?.scrollIntoView({ behavior: 'smooth' })}>
            <Plus className="w-4 h-4 mr-2" /> Nouveau plan
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">Plans enregistrés</div>
            <div className="text-3xl font-bold">{plans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">Créés aujourd'hui</div>
            <div className="text-3xl font-bold">{plans.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length}</div>
          </CardContent>
        </Card>
        {/* <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">Disponibles aujourd'hui</div>
            <div className="text-3xl font-bold">{availableToday}</div>
          </CardContent>
        </Card> */}
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-gray-600">Dernier plan</div>
            <div className="text-lg font-semibold">{plans[0]?.created_at ? new Date(plans[0].created_at).toLocaleString() : '—'}</div>
          </CardContent>
        </Card>
      </div>

      <Card id="create-plan">
        <CardHeader>
          <CardTitle>Créer un plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {apiError}
              <div className="text-xs text-red-600 mt-1">
                Astuce: si le pool est insuffisant, réduisez temporairement CO/CE à une valeur disponible, ou ajoutez des questions/tâches en base.
              </div>
            </div>
          )}
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm mb-1">CO</label>
              <Input type="number" min={0} value={countCO} onChange={e => setCountCO(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm mb-1">CE</label>
              <Input type="number" min={0} value={countCE} onChange={e => setCountCE(Number(e.target.value))} />
            </div>
            <div className="text-sm text-gray-600">Total: {total}</div>
            <Button onClick={() => createPlan()} disabled={loading || countCO !== 39 || countCE !== 39 || !usedIds}>
              <Plus className="w-4 h-4 mr-2" /> Générer (CO 39 + CE 39)
            </Button>
          </div>
          {(countCO !== 39 || countCE !== 39) && (
            <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded">Chaque section CO et CE doit être exactement 39.</div>
          )}
          {!usedIds && (
            <div className="text-xs text-gray-600">Chargement des éléments déjà utilisés…</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plans existants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Config</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">Aucun plan</TableCell></TableRow>
                ) : plans.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                    <TableCell className="max-w-md truncate">
                      counts: CO {p.config?.counts?.CO ?? '—'} / CE {p.config?.counts?.CE ?? '—'} · mode: {p.config?.mode ?? '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => previewPlan(p.id)}> <Eye className="w-4 h-4" /> </Button>
                      <Button variant="outline" size="sm" onClick={() => removePlan(p.id)} className="text-red-600"> <Trash2 className="w-4 h-4" /> </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inline preview removed: dedicated preview page handles confirmation & conflicts */}
    </div>
  );
}

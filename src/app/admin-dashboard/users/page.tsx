'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Eye, Filter, Mail, Calendar, Shield, KeyRound, Wallet, History } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string;
  is_suspended: boolean;
  test_count?: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const supabase = getSupabaseBrowser();
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  // Dialog state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Grant credits dialog state
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantAmount, setGrantAmount] = useState<string>('');
  const [grantNote, setGrantNote] = useState<string>('');
  const [grantLoading, setGrantLoading] = useState(false);

  // Credits drawer state
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState<number>(0);
  const [creditsTx, setCreditsTx] = useState<Array<{id:string;delta:number;reason:string;created_at:string;metadata?:any}>>([]);
  const [balancesCache, setBalancesCache] = useState<Record<string, number>>({});

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user' | 'premium' | string>('user');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const openView = (u: User) => {
    setSelectedUser(u);
    setViewOpen(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const openEdit = (u: User) => {
    setSelectedUser(u);
    setEditName(u.full_name || '');
    setEditRole((u.role as any) || 'user');
    setEditOpen(true);
    setActionError(null);
    setActionSuccess(null);
  };

  const submitEdit = async () => {
    if (!selectedUser) return;
    try {
      setActionError(null);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName, role: editRole })
        .eq('id', selectedUser.id);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, full_name: editName, role: editRole } : u)));
      setActionSuccess('Utilisateur mis à jour');
      setEditOpen(false);
    } catch (e: any) {
      setActionError(e.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleResetPassword = async (u: User) => {
    try {
      setResetLoading(true);
      setActionError(null);
      setActionSuccess(null);
      const redirectTo = `${window.location.origin}/auth/update-password`;
      const res = await fetch('/api/admin/generate-recovery-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, redirectTo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Impossible de générer le lien');
      const link: string | undefined = json.action_link || json?.data?.properties?.action_link;
      if (!link) throw new Error('Lien de récupération non reçu');
      // Extraire token_hash du lien généré et rediriger directement vers notre page avec ce paramètre
      try {
        const url = new URL(link);
        const tokenHash = url.searchParams.get('token_hash');
        const type = url.searchParams.get('type');
        if (tokenHash) {
          const dest = `${window.location.origin}/auth/update-password?token_hash=${encodeURIComponent(tokenHash)}${type ? `&type=${encodeURIComponent(type)}` : ''}`;
          window.open(dest, '_blank');
        } else {
          // Fallback: ouvrir le lien original (Supabase redirigera ensuite)
          window.open(link, '_blank');
        }
      } catch {
        window.open(link, '_blank');
      }
      setActionSuccess('Lien de réinitialisation généré');
    } catch (e: any) {
      setActionError(e.message || "Impossible d'envoyer l'email de réinitialisation");
    } finally {
      setResetLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && !user.is_suspended) ||
                         (filterStatus === 'suspended' && user.is_suspended);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Reset/Clamp page when filters change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredUsers.length]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Prefetch balances for visible users (small page size => acceptable)
  useEffect(() => {
    const loadBalances = async () => {
      try {
        await Promise.all(
          paginatedUsers.map(async (u) => {
            if (typeof balancesCache[u.id] === 'number') return;
            const res = await fetch(`/api/admin/credits/${encodeURIComponent(u.id)}?limit=1`);
            const json = await res.json();
            if (res.ok) {
              setBalancesCache((prev) => ({ ...prev, [u.id]: json?.balance ?? 0 }));
            }
          })
        );
      } catch {
        // silencieux
      }
    };
    loadBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startIndex, endIndex, filteredUsers.length]);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleToggleSuspend = async (id: string, currentSuspended: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: !currentSuspended, suspended_at: !currentSuspended ? new Date().toISOString() : null })
        .eq('id', id);

      if (error) throw error;
      
      setUsers(users.map(u => 
        u.id === id ? { ...u, is_suspended: !currentSuspended } : u
      ));
    } catch (error) {
      console.error('Erreur lors de la suspension:', error);
    }
  };

  const handlePromoteToAdmin = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', id);

      if (error) throw error;
      
      setUsers(users.map(u => 
        u.id === id ? { ...u, role: 'admin' } : u
      ));
    } catch (error) {
      console.error('Erreur lors de la promotion:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'user': return 'Utilisateur';
      case 'premium': return 'Premium';
      default: return role;
    }
  };

  const getStatusColor = (isSuspended: boolean) => {
    return isSuspended 
      ? 'bg-red-100 text-red-800'
      : 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-600 mt-2">Gérez tous les utilisateurs de votre plateforme</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Utilisateur
        </Button>
      </div>

      {/* Cartes de statistiques */}
      {(() => {
        const total = users.length;
        const admins = users.filter(u => u.role === 'admin').length;
        const basicUsers = users.filter(u => u.role === 'user' || u.role === 'premium').length;
        const suspended = users.filter(u => u.is_suspended).length;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Utilisateurs</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{total}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Administrateurs</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{admins}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Utilisateurs (User/Premium)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{basicUsers}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Suspendus</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-red-600">{suspended}</div></CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs (tableau) */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Crédits</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-gray-600">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-6 h-6 text-gray-400" />
                        <div className="font-medium">Aucun utilisateur trouvé</div>
                        <div className="text-sm">
                          {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                            ? 'Essayez de modifier vos filtres'
                            : 'Aucun utilisateur enregistré'}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-orange-50/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{user.full_name || 'Nom non défini'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={async () => {
                            setSelectedUser(user);
                            setCreditsOpen(true);
                            setCreditsLoading(true);
                            try {
                              const res = await fetch(`/api/admin/credits/${encodeURIComponent(user.id)}`);
                              const json = await res.json();
                              if (!res.ok) throw new Error(json?.error || 'Erreur chargement crédits');
                              setCreditsBalance(json?.balance ?? 0);
                              setCreditsTx(json?.transactions || []);
                              setBalancesCache(prev => ({ ...prev, [user.id]: json?.balance ?? 0 }));
                            } catch (e:any) {
                              setActionError(e?.message || 'Erreur chargement crédits');
                            } finally {
                              setCreditsLoading(false);
                            }
                          }}
                          title="Voir les crédits"
                        >
                          <Wallet className="w-4 h-4" /> Voir
                        </Button>
                        <div className="mt-1">
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Solde: {typeof balancesCache[user.id] === 'number' ? balancesCache[user.id] : '—'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.is_suspended)}>
                          {user.is_suspended ? 'Suspendu' : 'Actif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="outline" size="sm" title="Voir" onClick={() => openView(user)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" title="Éditer" onClick={() => openEdit(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Réinitialiser le mot de passe"
                            onClick={() => handleResetPassword(user)}
                            className="text-amber-700 hover:text-amber-800"
                            disabled={resetLoading}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteToAdmin(user.id)}
                              className="text-purple-600 hover:text-purple-700"
                              title="Promouvoir admin"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleSuspend(user.id, user.is_suspended)}
                            className={user.is_suspended ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}
                            title={user.is_suspended ? 'Réactiver' : 'Suspendre'}
                          >
                            {user.is_suspended ? 'Réactiver' : 'Suspendre'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedUser(user); setGrantAmount(''); setGrantNote(''); setGrantOpen(true); setActionError(null); setActionSuccess(null); }}
                            className="text-emerald-700 hover:text-emerald-800"
                            title="Attribuer des crédits"
                          >
                            Créditer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between py-3">
        <div className="text-sm text-gray-600">
          Affiche {filteredUsers.length === 0 ? 0 : startIndex + 1}
          {' '}–{' '}
          {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          {/* Simple numbered pages (max 5 buttons around current) */}
          {Array.from({ length: totalPages }).slice(
            Math.max(0, currentPage - 3),
            Math.max(0, currentPage - 3) + 5
          ).map((_, idx) => {
            const page = Math.max(1, currentPage - 2) + idx;
            if (page > totalPages) return null;
            return (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={page === currentPage ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                {page}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      </div>

      {/* Dialog: Voir les détails */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
            <DialogDescription>Informations de profil et activité</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Nom:</span> {selectedUser.full_name || '—'}</div>
              <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
              <div><span className="font-medium">Rôle:</span> {getRoleLabel(selectedUser.role)}</div>
              <div><span className="font-medium">Statut:</span> {selectedUser.is_suspended ? 'Suspendu' : 'Actif'}</div>
              <div><span className="font-medium">Inscription:</span> {new Date(selectedUser.created_at).toLocaleString('fr-FR')}</div>
              {selectedUser.last_sign_in_at && (
                <div><span className="font-medium">Dernière connexion:</span> {new Date(selectedUser.last_sign_in_at).toLocaleString('fr-FR')}</div>
              )}
              {typeof selectedUser.test_count !== 'undefined' && (
                <div><span className="font-medium">Tests passés:</span> {selectedUser.test_count}</div>
              )}
            </div>
          )}
          {(actionError || actionSuccess) && (
            <div className={`text-sm ${actionError ? 'text-red-600' : 'text-green-600'}`}>{actionError || actionSuccess}</div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drawer/Dialog: Crédits utilisateur */}
      <Dialog open={creditsOpen} onOpenChange={setCreditsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crédits — {selectedUser?.full_name || selectedUser?.email || 'Utilisateur'}</DialogTitle>
            <DialogDescription>Solde actuel et 10 derniers mouvements</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {creditsLoading ? (
              <div className="text-sm text-gray-600">Chargement…</div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800">Solde: {creditsBalance}</Badge>
                </div>
                <div className="border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Motif</TableHead>
                        <TableHead>Delta</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditsTx.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-sm text-gray-600">Aucun mouvement</TableCell></TableRow>
                      ) : (
                        creditsTx.map(tx => (
                          <TableRow key={tx.id}>
                            <TableCell>{new Date(tx.created_at).toLocaleString('fr-FR')}</TableCell>
                            <TableCell>{tx.reason}</TableCell>
                            <TableCell className={tx.delta >= 0 ? 'text-emerald-700' : 'text-red-600'}>{tx.delta > 0 ? `+${tx.delta}` : tx.delta}</TableCell>
                            <TableCell className="truncate max-w-[280px]">{tx?.metadata?.note || '—'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={async () => {
                if (!selectedUser) return;
                setCreditsLoading(true);
                try {
                  const res = await fetch(`/api/admin/credits/${encodeURIComponent(selectedUser.id)}`);
                  const json = await res.json();
                  if (!res.ok) throw new Error(json?.error || 'Erreur chargement crédits');
                  setCreditsBalance(json?.balance ?? 0);
                  setCreditsTx(json?.transactions || []);
                  setBalancesCache(prev => ({ ...prev, [selectedUser.id]: json?.balance ?? 0 }));
                } catch (e:any) {
                  setActionError(e?.message || 'Erreur rechargement crédits');
                } finally {
                  setCreditsLoading(false);
                }
              }}
            >Actualiser</Button>
            <Button onClick={() => setCreditsOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog: Attribuer des crédits */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer des crédits</DialogTitle>
            <DialogDescription>
              Saisissez un montant positif (ajout) ou négatif (retrait). Un journal sera créé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Montant</label>
              <Input type="number" value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} placeholder="ex: 5" />
            </div>
            <div>
              <label className="text-sm font-medium">Note (optionnel)</label>
              <Input value={grantNote} onChange={(e) => setGrantNote(e.target.value)} placeholder="raison, référence..." />
            </div>
            {(actionError || actionSuccess) && (
              <div className={`text-sm ${actionError ? 'text-red-600' : 'text-green-600'}`}>{actionError || actionSuccess}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>Annuler</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={grantLoading} onClick={async () => {
              if (!selectedUser) return;
              setActionError(null); setActionSuccess(null);
              try {
                setGrantLoading(true);
                const res = await fetch('/api/admin/credits/grant', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: selectedUser.id, amount: Number(grantAmount), note: grantNote })
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || 'Échec attribution');
                setActionSuccess(`Crédits mis à jour. Nouveau solde: ${json?.balance ?? '—'}`);
                setBalancesCache((prev) => ({ ...prev, [selectedUser.id]: json?.balance ?? 0 }));
                setGrantOpen(false);
              } catch (e: any) {
                setActionError(e?.message || 'Erreur attribution');
              } finally {
                setGrantLoading(false);
              }
            }}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Éditer l'utilisateur */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>Mettre à jour le nom et le rôle</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nom complet</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nom" />
            </div>
            <div>
              <label className="text-sm font-medium">Rôle</label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(actionError || actionSuccess) && (
              <div className={`text-sm ${actionError ? 'text-red-600' : 'text-green-600'}`}>{actionError || actionSuccess}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={submitEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

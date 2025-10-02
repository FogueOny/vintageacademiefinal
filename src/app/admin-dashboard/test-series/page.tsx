'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader as AlertHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Eye, Filter, Clock, Save, Grid, List } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Pagination } from '@/components/admin/Pagination';

interface TestSeries {
  id: string;
  name: string;
  description: string;
  module_id: string;
  time_limit: number;
  slug: string;
  is_free?: boolean;
  is_published?: boolean;
  created_at: string;
  module_name?: string;
}

interface Module {
  id: string;
  name: string;
}

export default function TestSeriesPage() {
  const router = useRouter();
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [sortKey, setSortKey] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'module_asc' | 'free_first'>('newest');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTestSeries, setEditingTestSeries] = useState<TestSeries | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSeries, setPreviewSeries] = useState<TestSeries | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module_id: '',
    time_limit: 30,
    is_free: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log("🔄 Début du chargement des séries de tests...");
    setLoading(true);
    
    try {
      const supabase = getSupabaseBrowser();
      
      // Récupérer les modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, name')
        .order('name');
      
      if (modulesError) {
        console.error("❌ Erreur lors de la récupération des modules:", modulesError);
      } else {
        setModules(modulesData || []);
      }
      
      // Récupérer les séries de tests avec les noms des modules
      const { data, error } = await supabase
        .from('test_series')
        .select(`
          *,
          modules:module_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("❌ Erreur lors de la récupération des séries de tests:", error);
      } else {
        const formattedData = data?.map((item: TestSeries & { modules?: { name?: string } }) => {
  return {
          ...item,
          module_name: item.modules?.name
          }
}) || [];
        setTestSeries(formattedData);
        console.log("✅ Séries de tests récupérées:", formattedData.length);
      }
    } catch (error) {
      console.error("❌ Erreur inattendue lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTestSeries = testSeries.filter(series => {
    const matchesSearch = series.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         series.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'all' || series.module_id === filterModule;
    return matchesSearch && matchesModule;
  });

  // Sort filtered results according to sortKey
  const sortedTestSeries = [...filteredTestSeries].sort((a, b) => {
    switch (sortKey) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'name_asc':
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      case 'name_desc':
        return b.name.localeCompare(a.name, 'fr', { sensitivity: 'base' });
      case 'module_asc':
        return (a.module_name || '').localeCompare(b.module_name || '', 'fr', { sensitivity: 'base' });
      
      case 'free_first':
        return Number(b.is_free || false) - Number(a.is_free || false) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Clamp page when filters/sort change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sortedTestSeries.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [sortedTestSeries.length]);

  // Compute page slice
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedTestSeries = sortedTestSeries.slice(startIndex, endIndex);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'time_limit' ? parseInt(value) || 0 : value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      module_id: '',
      time_limit: 30,
      is_free: false,
    });
    setEditingTestSeries(null);
  };

  const handleOpenDialog = (testSeries?: TestSeries) => {
    if (testSeries) {
      setEditingTestSeries(testSeries);
      setFormData({
        name: testSeries.name,
        description: testSeries.description || '',
        module_id: testSeries.module_id,
        // store minutes in the form, DB stores seconds
        time_limit: Math.round((testSeries.time_limit || 0) / 60),
        is_free: testSeries.is_free || false,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowser();
      // Générer le slug à partir du nom
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const testSeriesData = {
        ...formData,
        slug,
        time_limit: formData.time_limit * 60, // Convertir en secondes
        // is_published supprimé car la colonne n'existe pas dans la table
      };

      console.log('➡️ Submitting test_series payload:', testSeriesData, 'editingId:', editingTestSeries?.id);

      // Validation basique
      if (!testSeriesData.name?.trim()) {
        throw new Error('Le nom est requis');
      }
      if (!testSeriesData.module_id) {
        throw new Error('Le module est requis');
      }
      if (!Number.isFinite(testSeriesData.time_limit) || testSeriesData.time_limit <= 0) {
        throw new Error('La durée doit être un nombre de minutes valide (> 0)');
      }

      // Appel API sécurisé avec token (évite RLS 403)
      const { data: sessionResp } = await supabase.auth.getSession();
      const token = sessionResp?.session?.access_token;
      if (!token) {
        throw new Error('Session invalide');
      }

      const method = editingTestSeries ? 'PUT' : 'POST';
      const payload = editingTestSeries ? { id: editingTestSeries.id, ...testSeriesData } : testSeriesData;

      const resp = await fetch('/api/test-series', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error('API test-series error:', err);
        throw new Error(err.error || `Echec ${method === 'POST' ? 'création' : 'mise à jour'}`);
      }

      const result = await resp.json().catch(() => ({}));
      console.log(`✅ Série de tests ${editingTestSeries ? 'mise à jour' : 'créée'}`, result?.data || null);

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
      try { console.error('Erreur JSON:', JSON.stringify(error)); } catch {}
      const msg = (error as any)?.message || 'Erreur inconnue lors de la sauvegarde';
      const details = (error as any)?.details;
      alert(`Erreur de sauvegarde: ${msg}${details ? `\nDétails: ${details}` : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTestSeries = async (id: string) => {
    try {
      setDeleting(true);
      const supabase = getSupabaseBrowser();
      const { data: sessionResp } = await supabase.auth.getSession();
      const token = sessionResp?.session?.access_token;
      if (!token) throw new Error('Session invalide');

      const resp = await fetch('/api/test-series', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error('API delete test-series error:', err);
        throw new Error(err.error || 'Suppression impossible');
      }

      setTestSeries(testSeries.filter(ts => ts.id !== id));
      console.log("✅ Série de tests supprimée (API)");
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Preview helpers
  const openPreview = (series: TestSeries) => {
    setPreviewSeries(series);
    setPreviewOpen(true);
  };

  const getStatusColor = (isPublished: boolean) => {
    return isPublished 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const getFreeStatusColor = (isFree: boolean) => {
    return isFree 
      ? 'bg-green-100 text-green-800' 
      : 'bg-orange-100 text-orange-800';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Séries de Tests</h2>
            <p className="text-gray-600">Gérez vos séries de tests ({testSeries.length} séries)</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleOpenDialog()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Série
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingTestSeries ? 'Modifier la série de tests' : 'Créer une nouvelle série de tests'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTestSeries ? 'Modifiez les informations de la série de tests.' : 'Ajoutez une nouvelle série de tests à votre plateforme.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom de la série</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nom de la série"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Description de la série"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="module_id">Module</Label>
                    <Select value={formData.module_id} onValueChange={(value) => setFormData({...formData, module_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un module" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="time_limit">Durée (minutes)</Label>
                    <Input
                      id="time_limit"
                      name="time_limit"
                      type="number"
                      value={formData.time_limit}
                      onChange={handleInputChange}
                      placeholder="30"
                      min="1"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_free"
                      checked={formData.is_free}
                      onChange={(e) => setFormData({...formData, is_free: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="is_free">Test gratuit (accessible sans inscription)</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingTestSeries ? 'Mettre à jour' : 'Créer'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une série..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtre statut retiré */}

              {/* Tri */}
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Plus récent</SelectItem>
                  <SelectItem value="oldest">Plus ancien</SelectItem>
                  <SelectItem value="name_asc">Nom A–Z</SelectItem>
                  <SelectItem value="name_desc">Nom Z–A</SelectItem>
                  <SelectItem value="module_asc">Module A–Z</SelectItem>
                  
                  <SelectItem value="free_first">Gratuits d'abord</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des séries de tests */}
        {viewMode === 'cards' ? (
          <div className="grid gap-4">
            {filteredTestSeries.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <Search className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune série trouvée
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm || filterModule !== 'all'
                        ? 'Essayez de modifier vos filtres'
                        : 'Commencez par créer votre première série de tests'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              paginatedTestSeries.map((series) => (
                <Card key={series.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {series.name}
                          </h3>
                          <Badge className={getStatusColor(series.is_published || false)}>
                            {series.is_published ? 'Publié' : 'Brouillon'}
                          </Badge>
                          <Badge className={getFreeStatusColor(series.is_free || false)}>
                            {series.is_free ? 'Gratuit' : 'Payant'}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                          {series.description || 'Aucune description'}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(series.time_limit)}</span>
                          </div>
                          <span>Module: {series.module_name}</span>
                          <span>•</span>
                          <span>Créé le {new Date(series.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin-dashboard/test-series/${series.id}/edit`)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin-dashboard/test-series/${series.id}/preview`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenDialog(series)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {/* Publier action retirée */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => { setDeleteTargetId(series.id); setDeleteDialogOpen(true); }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTestSeries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          {searchTerm || filterModule !== 'all'
                            ? 'Aucune série trouvée avec ces filtres'
                            : 'Aucune série créée'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTestSeries.map((series) => (
                      <TableRow key={series.id}>
                        <TableCell className="font-medium">{series.name}</TableCell>
                        <TableCell>{series.module_name}</TableCell>
                        <TableCell>{formatTime(series.time_limit)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(series.is_published || false)}>
                            {series.is_published ? 'Publié' : 'Brouillon'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getFreeStatusColor(series.is_free || false)}>
                            {series.is_free ? 'Gratuit' : 'Payant'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(series.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" onClick={() => router.push(`/admin-dashboard/test-series/${series.id}/preview`)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenDialog(series)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => { setDeleteTargetId(series.id); setDeleteDialogOpen(true); }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={sortedTestSeries.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette série de tests ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTargetId) {
                  handleDeleteTestSeries(deleteTargetId);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Détails de la série</DialogTitle>
            <DialogDescription>
              Aperçu en lecture seule des informations de la série sélectionnée.
            </DialogDescription>
          </DialogHeader>
          {previewSeries && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">Nom</Label>
                <div className="text-gray-900 font-medium">{previewSeries.name}</div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Description</Label>
                <div className="text-gray-700 whitespace-pre-wrap">{previewSeries.description || '—'}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Durée</Label>
                  <div className="text-gray-900">{formatTime(previewSeries.time_limit)}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Type</Label>
                  <div>
                    <Badge className={getFreeStatusColor(previewSeries.is_free || false)}>
                      {previewSeries.is_free ? 'Gratuit' : 'Payant'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Créée le</Label>
                  <div className="text-gray-900">{new Date(previewSeries.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Slug</Label>
                  <div className="text-gray-900">{previewSeries.slug}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
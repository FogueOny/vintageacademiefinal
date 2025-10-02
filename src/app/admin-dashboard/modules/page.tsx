'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Eye, Filter, BookOpen, Save, Grid, List, Book, FileText, Headphones, Mic, PenTool, FileAudio, ScrollText, Bookmark } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { Pagination } from '@/components/admin/Pagination';

interface Module {
  id: string;
  name: string;
  description: string;
  type: string;
  type_module: string;
  slug: string;
  icon?: string;
  created_at: string;
}

const iconOptions = [
  { value: 'BookOpen', label: 'Livre ouvert', icon: BookOpen },
  { value: 'Book', label: 'Livre', icon: Book },
  { value: 'FileText', label: 'Document', icon: FileText },
  { value: 'Headphones', label: 'Casque audio', icon: Headphones },
  { value: 'Mic', label: 'Microphone', icon: Mic },
  { value: 'PenTool', label: 'Stylo', icon: PenTool },
  { value: 'FileAudio', label: 'Fichier audio', icon: FileAudio },
  { value: 'ScrollText', label: 'Parchemin', icon: ScrollText },
  { value: 'Bookmark', label: 'Marque-page', icon: Bookmark },
];

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'comprehension_ecrite',
    type_module: 'tcf',
    icon: 'BookOpen',
  });

  

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    console.log("🔄 Début du chargement des modules...");
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        console.error("Supabase client not available");
        return;
      }
      
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("❌ Erreur lors de la récupération des modules:", error);
      } else {
        console.log("✅ Modules récupérés:", data?.length || 0);
        setModules(data || []);
      }
    } catch (error) {
      console.error("❌ Erreur inattendue lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || module.type === filterType;
    const matchesModule = filterModule === 'all' || module.type_module === filterModule;

    return matchesSearch && matchesType && matchesModule;
  });

  // Clamp page when filters change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredModules.length / PAGE_SIZE));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredModules.length]);

  // Compute current page slice
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedModules = filteredModules.slice(startIndex, endIndex);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'comprehension_ecrite',
      type_module: 'tcf',
      icon: 'BookOpen',
    });
    setEditingModule(null);
  };

  const handleOpenDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setFormData({
        name: module.name,
        description: module.description || '',
        type: module.type,
        type_module: module.type_module,
        icon: module.icon || 'BookOpen',
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
      if (!supabase) {
        console.error("Supabase client not available");
        return;
      }
      
      // Générer le slug à partir du nom
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const moduleData = {
        ...formData,
        slug,
      };

      if (editingModule) {
        // Mise à jour
        const { error } = await supabase
          .from('modules')
          .update(moduleData)
          .eq('id', editingModule.id);

        if (error) throw error;
        console.log("✅ Module mis à jour");
      } else {
        // Création
        const { error } = await supabase
          .from('modules')
          .insert([moduleData]);

        if (error) throw error;
        console.log("✅ Module créé");
      }

      setDialogOpen(false);
      resetForm();
      fetchModules();
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) return;

    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        console.error("Supabase client not available");
        return;
      }
      
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setModules(modules.filter(m => m.id !== id));
      console.log("✅ Module supprimé");
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'comprehension_ecrite': return 'bg-blue-100 text-blue-800';
      case 'comprehension_orale': return 'bg-green-100 text-green-800';
      case 'expression_ecrite': return 'bg-purple-100 text-purple-800';
      case 'expression_orale': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comprehension_ecrite': return 'Compréhension écrite';
      case 'comprehension_orale': return 'Compréhension orale';
      case 'expression_ecrite': return 'Expression écrite';
      case 'expression_orale': return 'Expression orale';
      default: return type;
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'tcf': return 'bg-blue-100 text-blue-800';
      case 'tef': return 'bg-green-100 text-green-800';
      case 'delf': return 'bg-purple-100 text-purple-800';
      case 'dalf': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    return iconOption ? iconOption.icon : BookOpen;
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Modules</h2>
            <p className="text-gray-600">Organisez et gérez vos modules d'apprentissage ({modules.length} modules)</p>
          </div>
          <div className="flex items-center gap-3">
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
                  Nouveau Module
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingModule ? 'Modifier le module' : 'Créer un nouveau module'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingModule ? 'Modifiez les informations du module.' : 'Ajoutez un nouveau module à votre plateforme.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom du module</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nom du module"
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
                      placeholder="Description du module"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comprehension_ecrite">Compréhension écrite</SelectItem>
                        <SelectItem value="comprehension_orale">Compréhension orale</SelectItem>
                        <SelectItem value="expression_ecrite">Expression écrite</SelectItem>
                        <SelectItem value="expression_orale">Expression orale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type_module">Module d'examen</Label>
                    <Select value={formData.type_module} onValueChange={(value) => setFormData({...formData, type_module: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le module" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcf">TCF</SelectItem>
                        <SelectItem value="tef">TEF</SelectItem>
                        <SelectItem value="delf">DELF</SelectItem>
                        <SelectItem value="dalf">DALF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="icon">Icône</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({...formData, icon: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une icône" />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
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
                          {editingModule ? 'Mettre à jour' : 'Créer'}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un module..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="comprehension_ecrite">Compréhension écrite</SelectItem>
                  <SelectItem value="comprehension_orale">Compréhension orale</SelectItem>
                  <SelectItem value="expression_ecrite">Expression écrite</SelectItem>
                  <SelectItem value="expression_orale">Expression orale</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  <SelectItem value="tcf">TCF</SelectItem>
                  <SelectItem value="tef">TEF</SelectItem>
                  <SelectItem value="delf">DELF</SelectItem>
                  <SelectItem value="dalf">DALF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des modules */}
        {viewMode === 'cards' ? (
          <div className="grid gap-4">
            {filteredModules.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <BookOpen className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun module trouvé
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm || filterType !== 'all' || filterModule !== 'all'
                        ? 'Essayez de modifier vos filtres'
                        : 'Commencez par créer votre premier module'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              paginatedModules.map((module) => {
                const IconComponent = getIconComponent(module.icon || 'BookOpen');
                return (
                  <Card key={module.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <IconComponent className="w-6 h-6 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {module.name}
                            </h3>
                            <Badge className={getTypeColor(module.type)}>
                              {getTypeLabel(module.type)}
                            </Badge>
                            <Badge className={getModuleColor(module.type_module)}>
                              {module.type_module.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">
                            {module.description || 'Aucune description'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Slug: {module.slug}</span>
                            <span>•</span>
                            <span>Créé le {new Date(module.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenDialog(module)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteModule(module.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          {searchTerm || filterType !== 'all' || filterModule !== 'all'
                            ? 'Aucun module trouvé avec ces filtres'
                            : 'Aucun module créé'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedModules.map((module) => {
                      const IconComponent = getIconComponent(module.icon || 'BookOpen');
                      return (
                        <TableRow key={module.id}>
                          <TableCell>
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </TableCell>
                          <TableCell className="font-medium">{module.name}</TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(module.type)}>
                              {getTypeLabel(module.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getModuleColor(module.type_module)}>
                              {module.type_module.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{module.slug}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(module.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOpenDialog(module)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteModule(module.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredModules.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
 
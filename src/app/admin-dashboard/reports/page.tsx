'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Calendar, Users, Award, BarChart3, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState('30d');
  const [format, setFormat] = useState('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [emailReport, setEmailReport] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [generating, setGenerating] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'user-activity',
      name: 'Activité des utilisateurs',
      description: 'Rapport détaillé sur l\'activité des utilisateurs, connexions, et progression',
      icon: <Users className="w-5 h-5" />,
      category: 'Utilisateurs'
    },
    {
      id: 'test-performance',
      name: 'Performance des tests',
      description: 'Analyse des scores, taux de réussite et difficulté des questions',
      icon: <Award className="w-5 h-5" />,
      category: 'Tests'
    },
    {
      id: 'content-usage',
      name: 'Utilisation du contenu',
      description: 'Statistiques sur les modules et questions les plus utilisés',
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'Contenu'
    },
    {
      id: 'financial',
      name: 'Rapport financier',
      description: 'Données sur les abonnements, revenus et métriques financières',
      icon: <FileText className="w-5 h-5" />,
      category: 'Finance'
    },
    {
      id: 'system-health',
      name: 'Santé du système',
      description: 'Métriques techniques, performances et erreurs système',
      icon: <Calendar className="w-5 h-5" />,
      category: 'Système'
    }
  ];

  const handleGenerateReport = async () => {
    if (!selectedReport) return;

    setGenerating(true);
    try {
      // Simuler la génération du rapport
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Ici vous généreriez réellement le rapport
      console.log('Génération du rapport:', {
        report: selectedReport,
        dateRange,
        format,
        includeCharts,
        emailReport,
        emailAddress
      });
      
      // Simuler le téléchargement
      const link = document.createElement('a');
      link.href = '#';
      link.download = `rapport-${selectedReport}-${new Date().toISOString().split('T')[0]}.${format}`;
      link.click();
      
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Utilisateurs': return 'bg-blue-100 text-blue-800';
      case 'Tests': return 'bg-green-100 text-green-800';
      case 'Contenu': return 'bg-purple-100 text-purple-800';
      case 'Finance': return 'bg-orange-100 text-orange-800';
      case 'Système': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rapports</h1>
        <p className="text-gray-600 mt-2">
          Générez et exportez des rapports détaillés sur votre plateforme
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sélection du rapport */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner un rapport</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedReport === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedReport(template.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600">
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Options de génération */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Options de génération</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dateRange">Période</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                    <SelectItem value="90d">90 derniers jours</SelectItem>
                    <SelectItem value="1y">1 an</SelectItem>
                    <SelectItem value="custom">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="format">Format d'export</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                />
                <Label htmlFor="includeCharts">Inclure les graphiques</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailReport"
                  checked={emailReport}
                  onCheckedChange={(checked) => setEmailReport(checked as boolean)}
                />
                <Label htmlFor="emailReport">Envoyer par email</Label>
              </div>

              {emailReport && (
                <div>
                  <Label htmlFor="emailAddress">Adresse email</Label>
                  <Input
                    id="emailAddress"
                    type="email"
                    placeholder="votre@email.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                  />
                </div>
              )}

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleGenerateReport}
                disabled={!selectedReport || generating}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Générer le rapport
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rapports récents */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium">Rapport utilisateurs - Janvier 2024</h3>
                  <p className="text-sm text-gray-600">Généré le 15/01/2024</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium">Performance tests - Décembre 2023</h3>
                  <p className="text-sm text-gray-600">Généré le 31/12/2023</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-medium">Utilisation contenu - Novembre 2023</h3>
                  <p className="text-sm text-gray-600">Généré le 30/11/2023</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
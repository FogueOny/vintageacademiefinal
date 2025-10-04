'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Lightbulb, TrendingUp, Award, Target } from 'lucide-react';

interface AIEvaluationResultProps {
  score: number;
  details: {
    adequation: number;
    argumentation: number;
    lexique: number;
    grammaire: number;
  };
  feedback: string;
  pointsForts: string[];
  pointsAmelioration: string[];
  niveauEstime: string;
  conseilsPratiques?: string[];
}

export function AIEvaluationResult({
  score,
  details,
  feedback,
  pointsForts,
  pointsAmelioration,
  niveauEstime,
  conseilsPratiques,
}: AIEvaluationResultProps) {
  const getScoreGradient = (score: number) => {
    if (score >= 20) return 'from-emerald-500 to-green-500';
    if (score >= 15) return 'from-blue-500 to-cyan-500';
    if (score >= 10) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getNiveauStyle = (niveau: string) => {
    const styles: Record<string, { bg: string; text: string; ring: string }> = {
      'C2': { bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50', text: 'text-purple-700', ring: 'ring-purple-200' },
      'C1': { bg: 'bg-gradient-to-br from-indigo-50 to-blue-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
      'B2': { bg: 'bg-gradient-to-br from-blue-50 to-cyan-50', text: 'text-blue-700', ring: 'ring-blue-200' },
      'B1': { bg: 'bg-gradient-to-br from-green-50 to-emerald-50', text: 'text-green-700', ring: 'ring-green-200' },
      'A2': { bg: 'bg-gradient-to-br from-yellow-50 to-amber-50', text: 'text-yellow-700', ring: 'ring-yellow-200' },
      'A1': { bg: 'bg-gradient-to-br from-orange-50 to-red-50', text: 'text-orange-700', ring: 'ring-orange-200' },
    };
    return styles[niveau] || { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-200' };
  };

  const niveauStyle = getNiveauStyle(niveauEstime);
  const scorePercentage = (score / 25) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* En-tête avec score et niveau */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 border-2 border-slate-200 shadow-lg">
        {/* Décoration de fond */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl -z-0" />
        
        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Évaluation IA</h2>
              </div>
              <p className="text-sm text-slate-600">Analyse par Assistant TCF certifié</p>
            </div>
            
            <div className={`px-6 py-3 rounded-xl ring-2 ${niveauStyle.ring} ${niveauStyle.bg}`}>
              <div className="text-xs font-medium text-slate-600 mb-1">Niveau estimé</div>
              <div className={`text-3xl font-black ${niveauStyle.text}`}>{niveauEstime}</div>
            </div>
          </div>

          {/* Score principal avec barre de progression */}
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm font-medium text-slate-600 mb-1">Score global</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-black bg-gradient-to-r ${getScoreGradient(score)} bg-clip-text text-transparent`}>
                    {score}
                  </span>
                  <span className="text-3xl font-bold text-slate-400">/25</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-slate-300">{Math.round(scorePercentage)}%</div>
                <div className="text-xs text-slate-500">de réussite</div>
              </div>
            </div>
            
            {/* Barre de progression moderne */}
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getScoreGradient(score)} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
          </div>

          {/* Détails par critère - Design moderne */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Adéquation', value: details.adequation, max: 6, color: 'from-blue-500 to-cyan-500' },
              { label: 'Argumentation', value: details.argumentation, max: 6, color: 'from-green-500 to-emerald-500' },
              { label: 'Lexique', value: details.lexique, max: 6, color: 'from-purple-500 to-fuchsia-500' },
              { label: 'Grammaire', value: details.grammaire, max: 7, color: 'from-orange-500 to-amber-500' },
            ].map((critere, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 group-hover:border-slate-300 transition-all" />
                <div className="relative p-4 text-center">
                  <div className={`text-3xl font-black bg-gradient-to-r ${critere.color} bg-clip-text text-transparent mb-1`}>
                    {critere.value}
                  </div>
                  <div className="text-xs font-medium text-slate-500">/{critere.max}</div>
                  <div className="text-xs font-semibold text-slate-700 mt-2">{critere.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback général */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Analyse détaillée
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{feedback}</p>
        </CardContent>
      </Card>

      {/* Points forts - Design vert moderne */}
      {pointsForts.length > 0 && (
        <Card className="border-emerald-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-400" />
          <CardHeader className="bg-gradient-to-br from-emerald-50 to-green-50">
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <div className="p-1.5 bg-emerald-500 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              Points forts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 bg-white">
            <ul className="space-y-3">
              {pointsForts.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 group">
                  <div className="mt-0.5 p-1 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed flex-1">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Points à améliorer - Design rouge moderne avec trait barré */}
      {pointsAmelioration.length > 0 && (
        <Card className="border-red-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-400 to-rose-400" />
          <CardHeader className="bg-gradient-to-br from-red-50 to-rose-50">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <div className="p-1.5 bg-red-500 rounded-lg">
                <XCircle className="h-4 w-4 text-white" />
              </div>
              Points à améliorer
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 bg-white">
            <ul className="space-y-3">
              {pointsAmelioration.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 group">
                  <div className="mt-0.5 p-1 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed flex-1">
                    {point.includes('❌') || point.includes('✗') ? (
                      // Si le point contient déjà une marque d'erreur, l'afficher tel quel
                      <span className="relative">
                        <span className="line-through decoration-red-500 decoration-2 text-red-700">{point}</span>
                      </span>
                    ) : (
                      point
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Conseils pratiques - Design bleu moderne */}
      {conseilsPratiques && conseilsPratiques.length > 0 && (
        <Card className="border-blue-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400" />
          <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <div className="p-1.5 bg-blue-500 rounded-lg">
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
              Conseils pour progresser
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 bg-white">
            <ul className="space-y-3">
              {conseilsPratiques.map((conseil, idx) => (
                <li key={idx} className="flex items-start gap-3 group">
                  <div className="mt-0.5 p-1 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-slate-700 leading-relaxed flex-1">{conseil}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Footer moderne avec badge IA */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Évaluation IA certifiée</div>
              <div className="text-slate-400 text-xs">Assistant TCF • Modèle GPT-4o</div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
            Confidentiel
          </Badge>
        </div>
      </div>
    </div>
  );
}

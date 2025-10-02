import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ComprehensionOraleTCFPage() {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Récupérer le module
    const { data: modules } = await supabase
      .from('modules')
      .select('*')
      .eq('slug', 'comprehension-orale-tcf');

    if (!modules || modules.length === 0) {
      return (
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Module non trouvé</h1>
          <p className="text-gray-600 mb-4">Le module de compréhension orale TCF n'a pas été trouvé.</p>
          <Link href="/dashboard">
            <Button>Retour au tableau de bord</Button>
          </Link>
        </div>
      );
    }

    const module = modules[0];

    // Récupérer les séries de tests
    const { data: testSeries } = await supabase
      .from('test_series')
      .select('*')
      .eq('module_id', module.id)
      .order('name');

    const freeSeries = testSeries?.filter(ts => ts.is_free === true) || [];
    const paidSeries = testSeries?.filter(ts => ts.is_free !== true) || [];

    return (
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Tests de Compréhension Orale TCF</h1>
          <p className="text-gray-600 text-lg">{module.description}</p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total des séries</h3>
            <p className="text-2xl font-bold text-blue-600">{testSeries?.length || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Séries gratuites</h3>
            <p className="text-2xl font-bold text-green-600">{freeSeries.length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800">Séries payantes</h3>
            <p className="text-2xl font-bold text-orange-600">{paidSeries.length}</p>
          </div>
        </div>

        {/* Séries gratuites */}
        {freeSeries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                Gratuit
              </Badge>
              Séries gratuites
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {freeSeries.map((series) => (
                <div key={series.id} className="border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">{series.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{series.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Gratuit
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {Math.floor(series.time_limit / 60)} min
                    </span>
                  </div>
                  <Link href={`/comprehension-orale/${series.id}`}>
                    <Button className="w-full">Commencer le test</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Séries payantes */}
        {paidSeries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Payant
              </Badge>
              Séries payantes
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paidSeries.map((series) => (
                <div key={series.id} className="border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg mb-2">{series.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{series.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      Payant
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {Math.floor(series.time_limit / 60)} min
                    </span>
                  </div>
                  <Link href={`/comprehension-orale/${series.id}`}>
                    <Button className="w-full" variant="outline">Voir le test</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t">
          <Link href="/dashboard">
            <Button variant="outline">Retour au tableau de bord</Button>
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Erreur:', error);
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Erreur</h1>
        <p className="text-red-500 mb-4">Une erreur est survenue lors du chargement des données.</p>
        <Link href="/dashboard">
          <Button>Retour au tableau de bord</Button>
        </Link>
      </div>
    );
  }
} 
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TestSeriesOption {
  id: string;
  name: string;
  module_id: string;
  module_title?: string;
}

interface TestSeriesSelectorProps {
  testSeries: TestSeriesOption[];
  selectedSeries: string | null;
  setSelectedSeries: React.Dispatch<React.SetStateAction<string | null>>;
  className?: string;
}

export function TestSeriesSelector({ testSeries, selectedSeries, setSelectedSeries, className = "" }: TestSeriesSelectorProps) {
  // Organiser les séries de tests par module pour une meilleure lisibilité
  const seriesByModule = testSeries.reduce((acc, series) => {
    const moduleId = series.module_id;
    if (!acc[moduleId]) {
      acc[moduleId] = {
        title: series.module_title || "Module sans titre",
        series: []
      };
    }
    acc[moduleId].series.push(series);
    return acc;
  }, {} as Record<string, { title: string; series: TestSeriesOption[] }>);

  // Trier les séries dans chaque module par nom
  Object.keys(seriesByModule).forEach(moduleId => {
    seriesByModule[moduleId].series.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Trier les modules par titre
  const sortedModules = Object.entries(seriesByModule).sort(([, a], [, b]) => 
    a.title.localeCompare(b.title)
  );

  return (
    <div className={className}>
      <Select
        value={selectedSeries || ""}
        onValueChange={(value) => setSelectedSeries(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionner une série de tests" />
        </SelectTrigger>
        <SelectContent>
          {sortedModules.map(([moduleId, { title, series }]) => (
            <React.Fragment key={moduleId}>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {title}
              </div>
              {series.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

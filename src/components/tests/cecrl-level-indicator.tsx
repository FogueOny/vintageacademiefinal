"use client";

import { useMemo } from "react";

interface CECRLTableRow {
  nclc: string;
  comprehension_orale: {
    range: string;
    level: string;
  };
  comprehension_ecrite: {
    range: string;
    level: string;
  };
  expression_orale: {
    range: string;
    level: string;
  };
  expression_ecrite: {
    range: string;
    level: string;
  };
}

interface CECRLLevelIndicatorProps {
  score?: number;
  maxScore?: number;
  skill?: "comprehension_orale" | "comprehension_ecrite" | "expression_orale" | "expression_ecrite";
  level?: string; // Permet de passer directement un niveau CECRL (A1, A2, B1, B2, C1, C2)
}

export const CECRLLevelIndicator = ({ score, maxScore, skill = "comprehension_ecrite", level }: CECRLLevelIndicatorProps) => {
  // Tableau de correspondance des niveaux CECRL (placé avant tout calcul pour éviter la TDZ)
  const cecrlTable: CECRLTableRow[] = [
    {
      nclc: "10 et plus",
      comprehension_orale: { range: "549 à 699", level: "C1-C2" },
      comprehension_ecrite: { range: "549 à 699", level: "C1-C2" },
      expression_orale: { range: "16 à 20", level: "C1-C2" },
      expression_ecrite: { range: "16 à 20", level: "C1-C2" }
    },
    {
      nclc: "9",
      comprehension_orale: { range: "523 à 548", level: "C1" },
      comprehension_ecrite: { range: "524 à 548", level: "C1" },
      expression_orale: { range: "14-15", level: "C1" },
      expression_ecrite: { range: "14-15", level: "C1" }
    },
    {
      nclc: "8",
      comprehension_orale: { range: "503 à 522", level: "C1" },
      comprehension_ecrite: { range: "499 à 523", level: "B2-C1" },
      expression_orale: { range: "12-13", level: "B2" },
      expression_ecrite: { range: "12-13", level: "B2" }
    },
    {
      nclc: "7",
      comprehension_orale: { range: "458 à 502", level: "B2-C1" },
      comprehension_ecrite: { range: "453 à 498", level: "B2" },
      expression_orale: { range: "10-11", level: "B2" },
      expression_ecrite: { range: "10-11", level: "B2" }
    },
    {
      nclc: "6",
      comprehension_orale: { range: "398 à 457", level: "B1-B2" },
      comprehension_ecrite: { range: "406 à 452", level: "B2" },
      expression_orale: { range: "7-8-9", level: "B1" },
      expression_ecrite: { range: "7-8-9", level: "B1" }
    },
    {
      nclc: "5",
      comprehension_orale: { range: "369 à 397", level: "B1" },
      comprehension_ecrite: { range: "375 à 405", level: "B1-B2" },
      expression_orale: { range: "6", level: "B1" },
      expression_ecrite: { range: "6", level: "B1" }
    },
    {
      nclc: "4",
      comprehension_orale: { range: "331 à 368", level: "B1" },
      comprehension_ecrite: { range: "342 à 374", level: "B1" },
      expression_orale: { range: "4-5", level: "A2" },
      expression_ecrite: { range: "4-5", level: "A2" }
    },
    {
      nclc: "3",
      comprehension_orale: { range: "289 à 330", level: "A2" },
      comprehension_ecrite: { range: "300 à 341", level: "A2" },
      expression_orale: { range: "3", level: "A2" },
      expression_ecrite: { range: "3", level: "A2" }
    },
    {
      nclc: "2",
      comprehension_orale: { range: "249 à 288", level: "A2" },
      comprehension_ecrite: { range: "257 à 299", level: "A1-A2" },
      expression_orale: { range: "2", level: "A1" },
      expression_ecrite: { range: "2", level: "A1" }
    },
    {
      nclc: "1",
      comprehension_orale: { range: "0 à 248", level: "A1" },
      comprehension_ecrite: { range: "0 à 256", level: "A1" },
      expression_orale: { range: "1", level: "A1" },
      expression_ecrite: { range: "1", level: "A1" }
    }
  ];

  // Si un niveau est fourni directement, l'utiliser pour l'affichage
  let cecrlLevel = "A1"; // Niveau par défaut
  
  if (level) {
    cecrlLevel = level;
  } else if (score !== undefined && maxScore !== undefined) {
    // Calculer à partir du score si fourni
    cecrlLevel = calculateCECRLLevel(score, maxScore, skill);
  }
  
  // Calcul du pourcentage seulement si on a un score et maxScore
  let scorePercentage = 0;
  if (score !== undefined && maxScore !== undefined) {
    scorePercentage = Math.round((score / maxScore) * 100);
  }
  
  // Fonction pour calculer le niveau CECRL à partir d'un score
  function calculateCECRLLevel(score: number, maxScore: number, skill: "comprehension_orale" | "comprehension_ecrite" | "expression_orale" | "expression_ecrite") {
    // IMPORTANT:
    // - CO/CE (compréhensions) se notent sur une échelle 0–699 (table TCF officielle)
    // - EO/EE (expressions) se notent sur 1–20 (table NCLC)
    const scale = (skill === 'expression_orale' || skill === 'expression_ecrite') ? 20 : 699;
    const normalizedScore = Math.round((score / maxScore) * scale);
    // Pour CE/CO, utiliser des tables numériques explicites (plus robustes que le parsing de chaînes)
    if (skill === 'comprehension_orale') {
      const CO: Array<{min:number; max:number; level:string}> = [
        { min: 549, max: 699, level: 'C1-C2' },
        { min: 523, max: 548, level: 'C1' },
        { min: 503, max: 522, level: 'C1' },
        { min: 458, max: 502, level: 'B2-C1' },
        { min: 398, max: 457, level: 'B1-B2' },
        { min: 369, max: 397, level: 'B1' },
        { min: 331, max: 368, level: 'B1' },
        { min: 289, max: 330, level: 'A2' },
        { min: 249, max: 288, level: 'A2' },
        { min:   0, max: 248, level: 'A1' },
      ];
      const found = CO.find(r => normalizedScore >= r.min && normalizedScore <= r.max);
      return found?.level || 'A1';
    }
    if (skill === 'comprehension_ecrite') {
      const CE: Array<{min:number; max:number; level:string}> = [
        { min: 549, max: 699, level: 'C1-C2' },
        { min: 524, max: 548, level: 'C1' },
        { min: 499, max: 523, level: 'B2-C1' },
        { min: 453, max: 498, level: 'B2' },
        { min: 406, max: 452, level: 'B2' },
        { min: 375, max: 405, level: 'B1-B2' },
        { min: 342, max: 374, level: 'B1' },
        { min: 300, max: 341, level: 'A2' },
        { min: 257, max: 299, level: 'A1-A2' },
        { min:   0, max: 256, level: 'A1' },
      ];
      const found = CE.find(r => normalizedScore >= r.min && normalizedScore <= r.max);
      return found?.level || 'A1';
    }
    // Expressions: conservent le mapping basé sur la table textuelle (échelle 1–20)
    for (const row of cecrlTable) {
      const levelInfo = row[skill];
      const parts = levelInfo.range.split(/\s*(?:-|–|—|à)\s*/);
      const min = parseInt(parts[0].trim(), 10);
      const max = parseInt(parts[1]?.trim() || parts[0].trim(), 10);
      if (normalizedScore >= min && normalizedScore <= max) {
        return levelInfo.level;
      }
    }
    return 'A1';
  };

  // Trouver la position relative pour le marqueur d'indicateur
  const getIndicatorPosition = (level: string) => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    
    // Gérer les niveaux composites comme "B1-B2"
    if (level.includes("-")) {
      const [base, target] = level.split("-");
      const baseIndex = levels.indexOf(base);
      const targetIndex = levels.indexOf(target);
      return (baseIndex + targetIndex) / 2 / (levels.length - 1) * 100;
    }
    
    const index = levels.indexOf(level);
    return index / (levels.length - 1) * 100;
  };

  const indicatorPosition = getIndicatorPosition(cecrlLevel);

  return (
    <div className="mt-8 mb-12">
      <h3 className="text-xl font-semibold text-center mb-6">Niveau CECRL</h3>
      
      {/* Barre de niveaux CECRL */}
      <div className="relative mt-4 mb-8 mx-auto max-w-3xl">
        {/* Barre principale */}
        <div className="h-12 bg-gray-100 rounded-lg flex relative">
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((level, index, array) => (
            <div 
              key={level} 
              className={`flex-1 border-r last:border-r-0 border-gray-300 flex items-center justify-center relative ${
                cecrlLevel.includes(level) ? "bg-orange-50" : ""
              }`}
            >
              <span className="text-lg font-bold">{level}</span>
            </div>
          ))}
          
          {/* Indicateur de position */}
          <div 
            className="absolute bottom-full mb-1 transform -translate-x-1/2" 
            style={{ left: `${indicatorPosition}%` }}
          >
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-orange-500 mx-auto"></div>
          </div>
          
          {/* Bande de niveau actuel */}
          <div 
            className="absolute h-2 bottom-0 left-0 bg-orange-500 rounded-b-lg transition-all duration-500"
            style={{ width: `${indicatorPosition}%` }}
          ></div>
        </div>
      </div>
      
      {/* Tableau détaillé des correspondances */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="py-3 px-4 text-left font-semibold">NCLC</th>
              <th className="py-3 px-4 text-left font-semibold">Compréhension orale</th>
              <th className="py-3 px-4 text-left font-semibold">Compréhension écrite</th>
              <th className="py-3 px-4 text-left font-semibold">Expression orale</th>
              <th className="py-3 px-4 text-left font-semibold">Expression écrite</th>
            </tr>
          </thead>
          <tbody>
            {cecrlTable.map((row, index) => {
              const isMatchingRow = row[skill].level === cecrlLevel;
              
              return (
                <tr 
                  key={index} 
                  className={`border-b ${isMatchingRow ? 'bg-orange-50 font-medium' : 'hover:bg-gray-50'}`}
                >
                  <td className="py-3 px-4">{row.nclc}</td>
                  <td className={`py-3 px-4 ${skill === 'comprehension_orale' && isMatchingRow ? 'text-orange-600' : ''}`}>
                    {row.comprehension_orale.range} ({row.comprehension_orale.level})
                  </td>
                  <td className={`py-3 px-4 ${skill === 'comprehension_ecrite' && isMatchingRow ? 'text-orange-600' : ''}`}>
                    {row.comprehension_ecrite.range} ({row.comprehension_ecrite.level})
                  </td>
                  <td className={`py-3 px-4 ${skill === 'expression_orale' && isMatchingRow ? 'text-orange-600' : ''}`}>
                    {row.expression_orale.range} ({row.expression_orale.level})
                  </td>
                  <td className={`py-3 px-4 ${skill === 'expression_ecrite' && isMatchingRow ? 'text-orange-600' : ''}`}>
                    {row.expression_ecrite.range} ({row.expression_ecrite.level})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-center mt-6 text-lg font-medium">
        Votre score: <span className="text-orange-600">{score}</span> sur {maxScore} points ({scorePercentage}%)
        <p className="text-xl mt-2">
          Niveau CECRL: <span className="text-orange-600 font-bold">{cecrlLevel}</span>
        </p>
      </div>
    </div>
  );
};

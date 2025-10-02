"use client";

import { ModuleCard } from "@/components/dashboard/module-card";

export function ModulesGrid() {
  // Données des modules pour la grille avec TCF et TEF prioritaires
  const modules = [
    {
      title: "TCF Canada",
      description: "Test de Connaissance du Français pour le Canada",
      icon: "book",
      links: [
        { href: "/tests/tcf", label: "Passer le test TCF" },
        { href: "/tests/simulation-tcf", label: "Simulation TCF" }
      ]
    },
    {
      title: "TEF Canada",
      description: "Test d'Évaluation du Français pour le Canada",
      icon: "book",
      links: [
        { href: "/tests/tef", label: "Passer le test TEF" },
        { href: "/tests/simulation-tef", label: "Simulation TEF" }
      ]
    },
    {
      title: "Compréhension",
      description: "Modules de compréhension écrite et orale",
      icon: "default",
      links: [
        { href: "/dashboard/tests/comprehension-orale", label: "Compréhension Orale TCF" },
        { href: "/dashboard/tests/comprehension-ecrite", label: "Compréhension Écrite TCF" }
      ]
    },
    {
      title: "Expression",
      description: "Modules d'expression écrite et orale",
      icon: "speaking",
      links: [
        { href: "/tests/expression-ecrite", label: "Expression Écrite" },
        { href: "/tests/expression-orale", label: "Expression Orale" }
      ]
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((module, index) => (
        <ModuleCard
          key={index}
          title={module.title}
          description={module.description}
          links={module.links}
          icon={module.icon}
        />
      ))}
    </div>
  );
}

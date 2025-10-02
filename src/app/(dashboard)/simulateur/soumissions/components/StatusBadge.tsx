import React from "react";

export type AttemptStatus = "in_progress" | "submitted" | "graded" | "evaluating";

export function StatusBadge({ status }: { status: AttemptStatus }) {
  const map: Record<string, string> = {
    in_progress: "bg-gray-100 text-gray-700",
    submitted: "bg-orange-100 text-orange-800",
    evaluating: "bg-blue-100 text-blue-800",
    graded: "bg-emerald-100 text-emerald-700",
  };
  const label: Record<string, string> = {
    in_progress: "En cours",
    submitted: "Soumis",
    evaluating: "Évaluation IA",
    graded: "Évalué",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {label[status] || status}
    </span>
  );
}

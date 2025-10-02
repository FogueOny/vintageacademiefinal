import React from "react";
import Link from "next/link";
import { StatusBadge, AttemptStatus } from "./StatusBadge";

export function AttemptHeader(props: {
  attemptShortId: string;
  status: AttemptStatus;
  startedAtLabel: string;
  submittedAtLabel: string;
  durationMinutes: number;
  isOpen: boolean;
  onToggle: () => void;
  linkHref: string;
}) {
  const {
    attemptShortId,
    status,
    startedAtLabel,
    submittedAtLabel,
    durationMinutes,
    isOpen,
    onToggle,
    linkHref,
  } = props;

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="space-y-1">
        <div className="font-semibold">Tentative {attemptShortId}</div>
        <div className="text-xs text-gray-600">
          Démarrée: {startedAtLabel} · Soumise: {submittedAtLabel} · Durée: {Math.max(0, durationMinutes)} min
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        <button
          onClick={onToggle}
          className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50"
        >
          {isOpen ? 'Masquer' : 'Voir la soumission'}
        </button>
        <Link href={linkHref} className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50">Ouvrir</Link>
      </div>
    </div>
  );
}

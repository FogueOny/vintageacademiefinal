import React from "react";

type Evaluation = {
  task_number: number | null;
  score_20?: number | null;
  cecr_level?: string | null;
  positives?: string[] | null;
  improvements?: string[] | null;
  suggested_correction?: string | null;
};

export function AttemptDetails(props: {
  openaiHealth?: { model?: string; hasKey?: boolean } | null;
  loading: boolean;
  tasks: any[];
  answers: { task_number: number; content: string; word_count?: number }[];
  attemptId: string;
  aiTaskResults: Record<string, Evaluation>;
  aiTaskLoading: Record<string, boolean>;
  onEvalTask: (attemptId: string, taskNumber: number) => void;
}) {
  const { openaiHealth, loading, tasks, answers, attemptId, aiTaskResults, aiTaskLoading, onEvalTask } = props;

  return (
    <div className="border-t p-4">
      {openaiHealth && (
        <div className="text-[11px] text-gray-600 mb-2">
          OpenAI: {openaiHealth.model || 'gpt-4o-mini'}, {openaiHealth.hasKey ? 'clé présente' : 'clé absente'}
        </div>
      )}

      {loading && (
        <div className="text-gray-600 text-sm">Chargement…</div>
      )}

      {!loading && Array.isArray(tasks) && (
        <div className="mt-2 space-y-4">
          {tasks
            .slice()
            .sort((x: any, y: any) => (x.task_number ?? 99) - (y.task_number ?? 99))
            .map((t: any) => {
              const ans = (answers || []).find((u) => u.task_number === t.task_number);
              const key = `${attemptId}:${t.task_number}`;
              const ev = aiTaskResults[key];
              const loading = Boolean(aiTaskLoading[key]);
              return (
                <div key={t.task_number} className="rounded border bg-white p-3">
                  <div className="flex items-start justify-between">
                    <div className="font-semibold">Tâche {t.task_number}: {t.title}</div>
                    {(typeof ans?.word_count === 'number') && (
                      <div className="text-xs text-gray-500">Mots utilisateur: {ans?.word_count}</div>
                    )}
                  </div>

                  {t.instructions && (
                    <div className="mt-2 text-xs text-gray-800"><span className="font-medium">Consignes:</span> {t.instructions}</div>
                  )}
                  {t.description && (
                    <div className="mt-1 text-xs text-gray-700 whitespace-pre-line">{t.description}</div>
                  )}

                  {Array.isArray(t.documents) && t.documents.length > 0 && (
                    <div className="mt-2 text-xs">
                      <div className="font-medium mb-1">Documents</div>
                      <ul className="list-disc list-inside space-y-1">
                        {t.documents
                          .slice()
                          .sort((a: any, b: any) => (a.document_number ?? 99) - (b.document_number ?? 99))
                          .map((d: any, i: number) => (
                            <li key={d.id || `${d.document_number}-${i}`}>
                              <span className="font-medium">D{d.document_number}.</span> {d.title}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3 text-xs">
                    <div className="font-medium mb-1">Réponse de l'utilisateur</div>
                    {ans?.content ? (
                      <div className="whitespace-pre-line border rounded p-2 bg-gray-50 text-gray-800">{ans.content}</div>
                    ) : (
                      <div className="text-gray-500">Aucune réponse saisie pour cette tâche.</div>
                    )}
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={() => onEvalTask(attemptId, t.task_number)}
                      className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50"
                      disabled={loading}
                    >
                      {loading ? 'Évaluation…' : 'Évaluer avec IA (OpenAI)'}
                    </button>
                  </div>

                  {ev && (
                    <div className="mt-3 text-xs rounded border p-3 bg-white">
                      <div className="font-semibold">Résultat IA T{ev.task_number}</div>
                      {typeof ev.score_20 === 'number' && (
                        <div>Score: <span className="font-medium">{ev.score_20}/20</span></div>
                      )}
                      {ev.cecr_level && (
                        <div>Niveau CECR: <span className="font-medium">{ev.cecr_level}</span></div>
                      )}
                      {Array.isArray(ev.positives) && ev.positives.length > 0 && (
                        <div className="mt-2">
                          <div className="font-semibold mb-1">Points positifs</div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {ev.positives!.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(ev.improvements) && ev.improvements.length > 0 && (
                        <div className="mt-2">
                          <div className="font-semibold mb-1">Axes d'amélioration</div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {ev.improvements!.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                      )}
                      {ev.suggested_correction && (
                        <div className="mt-2">
                          <div className="font-semibold mb-1">Version C2 (reformulation)</div>
                          <div className="whitespace-pre-line border rounded p-2 bg-gray-50 text-gray-800">
                            {ev.suggested_correction}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

// src/components/OralExamHistory.tsx
'use client';

import { Volume2, MessageSquare, CheckCircle, AlertCircle, ThumbsDown } from 'lucide-react';

interface HistoryEntry {
  version: number;
  audioAnswerUrl?: string;
  teacherAudioUrl?: string;
  teacherComment?: string;
  reviewDecision?: 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'NEEDS_REVISION';
  isCorrect?: boolean;
  submittedAt?: string;
  reviewedAt?: string;
  status: string;
}

interface OralExamHistoryProps {
  history: HistoryEntry[];
  currentVersion?: HistoryEntry;
}

export function OralExamHistory({ history, currentVersion }: OralExamHistoryProps) {
  if (!history || history.length === 0) {
    return null;
  }

  const getStatusBadge = (entry: HistoryEntry) => {
    if (!entry.reviewDecision) {
      return (
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">Aguardando revisão</span>
        </div>
      );
    }

    switch (entry.reviewDecision) {
      case 'FULLY_ACCEPTED':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Totalmente Aceita</span>
          </div>
        );
      case 'PARTIALLY_ACCEPTED':
        return (
          <div className="flex items-center gap-2 text-orange-400">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Parcialmente Aceita</span>
          </div>
        );
      case 'NEEDS_REVISION':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <ThumbsDown size={16} />
            <span className="text-sm font-medium">Precisa Revisão</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <MessageSquare size={20} className="text-secondary" />
        Histórico de Revisões
      </h3>

      <div className="space-y-4">
        {history.map((entry, index) => (
          <div
            key={entry.version || index}
            className="p-4 bg-primary-dark rounded-lg border border-secondary/20 space-y-4"
          >
            {/* Header com versão e status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">
                Versão {entry.version || index + 1}
              </span>
              {getStatusBadge(entry)}
            </div>

            {/* Áudio do Aluno */}
            {entry.audioAnswerUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 size={16} className="text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Resposta do Aluno</span>
                  {entry.submittedAt && (
                    <span className="text-xs text-gray-500">
                      {formatDate(entry.submittedAt)}
                    </span>
                  )}
                </div>
                <audio
                  src={entry.audioAnswerUrl}
                  controls
                  className="w-full"
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                  }}
                />
              </div>
            )}

            {/* Áudio do Professor */}
            {entry.teacherAudioUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Volume2 size={16} className="text-green-400" />
                  <span className="text-sm font-medium text-green-400">Feedback do Professor</span>
                  {entry.reviewedAt && (
                    <span className="text-xs text-gray-500">
                      {formatDate(entry.reviewedAt)}
                    </span>
                  )}
                </div>
                <audio
                  src={entry.teacherAudioUrl}
                  controls
                  className="w-full"
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                  }}
                />
              </div>
            )}

            {/* Comentário do Professor (se houver) */}
            {entry.teacherComment && (
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-300">{entry.teacherComment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

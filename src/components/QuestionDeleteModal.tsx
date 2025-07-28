// /src/components/QuestionDeleteModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  Trash2,
  AlertTriangle,
  HelpCircle,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface QuestionOption {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface AnswerTranslation {
  locale: string;
  explanation: string;
}

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN';
  argumentId?: string;
  options: QuestionOption[];
  answer?: {
    id: string;
    correctOptionId?: string;
    explanation: string;
    translations: AnswerTranslation[];
  };
  createdAt: string;
  updatedAt: string;
}

interface QuestionDeleteModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionDeleted: () => void;
}

interface DeletionState {
  options: Set<string>;
  answer: boolean;
}

export default function QuestionDeleteModal({
  question,
  isOpen,
  onClose,
  onQuestionDeleted,
}: QuestionDeleteModalProps) {
  const t = useTranslations('Admin.questionDelete');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deletionState, setDeletionState] = useState<DeletionState>({
    options: new Set(),
    answer: false,
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDeletionState({
        options: new Set(),
        answer: false,
      });
    }
  }, [isOpen]);

  // Toggle option deletion
  const toggleOptionDeletion = useCallback((optionId: string) => {
    setDeletionState(prev => {
      const newOptions = new Set(prev.options);
      if (newOptions.has(optionId)) {
        newOptions.delete(optionId);
      } else {
        newOptions.add(optionId);
      }
      return { ...prev, options: newOptions };
    });
  }, []);

  // Toggle answer deletion
  const toggleAnswerDeletion = useCallback(() => {
    setDeletionState(prev => ({
      ...prev,
      answer: !prev.answer,
    }));
  }, []);

  // Check if correct option is being deleted
  const isCorrectOptionBeingDeleted = useCallback((): boolean => {
    if (!question?.answer?.correctOptionId) return false;
    return deletionState.options.has(question.answer.correctOptionId);
  }, [question, deletionState.options]);

  // Handle delete
  const handleDelete = async () => {
    if (!question) return;

    // Show confirmation
    const confirmMessage = 
      deletionState.options.size > 0 || deletionState.answer
        ? t('confirmPartialDelete')
        : t('confirmFullDelete');

    toast({
      title: t('confirmTitle'),
      description: confirmMessage,
      variant: 'destructive',
      action: (
        <button
          onClick={async () => {
          setLoading(true);

          try {
            const requestBody: Record<string, boolean | string[]> = {};

            // If nothing specific is selected, delete everything
            if (deletionState.options.size === 0 && !deletionState.answer) {
              requestBody.deleteQuestion = true;
            } else {
              // Partial deletion
              if (deletionState.options.size > 0) {
                requestBody.deleteOptions = Array.from(deletionState.options);
              }
              if (deletionState.answer) {
                requestBody.deleteAnswer = true;
              }
            }

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/questions/${question.id}/complete`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
              }
            );

            const data = await response.json();

            if (response.status === 409) {
              // Has dependencies
              toast({
                title: t('errors.hasDependencies'),
                description: data.message,
                variant: 'destructive',
              });
              return;
            }

            if (!response.ok) {
              throw new Error(data.message || 'Failed to delete');
            }

            // Show warnings if any
            if (data.warnings && data.warnings.length > 0) {
              data.warnings.forEach((warning: string) => {
                toast({
                  title: t('warning'),
                  description: warning,
                });
              });
            }

            // Success message
            if (requestBody.deleteQuestion) {
              toast({
                title: t('success.titleFull'),
                description: t('success.descriptionFull'),
                variant: 'success',
              });
            } else {
              toast({
                title: t('success.titlePartial'),
                description: t('success.descriptionPartial'),
                variant: 'success',
              });
            }

            onQuestionDeleted();
            onClose();
          } catch (error) {
            console.error('Error deleting question:', error);
            toast({
              title: t('errors.deleteTitle'),
              description: t('errors.deleteDescription'),
              variant: 'destructive',
            });
          } finally {
            setLoading(false);
          }
        }}
          className="text-sm font-medium"
        >
          {t('confirmButton')}
        </button>
      ),
    });
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen || !question) return null;

  const hasOptions = question.options.length > 0;
  const hasAnswer = !!question.answer;
  const hasDependencies = hasOptions || hasAnswer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Trash2 size={28} className="text-red-400" />
            <h2 className="text-2xl font-bold text-white">
              {t('title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Question Info */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HelpCircle size={20} className="text-secondary mt-1" />
                <div className="flex-1">
                  <h3 className="text-white font-medium mb-1">{t('questionInfo')}</h3>
                  <p className="text-gray-300">{question.text}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('type')}: {question.type === 'MULTIPLE_CHOICE' ? t('types.multipleChoice') : t('types.open')}
                  </p>
                </div>
              </div>
            </div>

            {/* Dependencies Info */}
            {hasDependencies ? (
              <>
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-yellow-400 mt-1" />
                    <div>
                      <h4 className="text-yellow-300 font-medium mb-1">
                        {t('hasDependencies')}
                      </h4>
                      <p className="text-yellow-200/80 text-sm">
                        {t('dependenciesDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Options Section */}
                {hasOptions && (
                  <div className="space-y-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <ClipboardList size={18} className="text-secondary" />
                      {t('options')} ({question.options.length})
                    </h4>
                    <div className="space-y-2">
                      {question.options.map((option, index) => {
                        const isCorrect = option.id === question.answer?.correctOptionId;
                        const isSelected = deletionState.options.has(option.id);
                        
                        return (
                          <div
                            key={option.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-red-900/20 border-red-600'
                                : 'bg-gray-900/30 border-gray-700 hover:border-gray-600'
                            }`}
                            onClick={() => toggleOptionDeletion(option.id)}
                          >
                            <button
                              type="button"
                              className={`p-2 rounded transition-colors ${
                                isSelected
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-700 text-gray-400 hover:text-white'
                              }`}
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="flex-1">
                              <p className="text-gray-300">
                                {String.fromCharCode(65 + index)}) {option.text}
                              </p>
                              {isCorrect && (
                                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                  <CheckCircle size={12} />
                                  {t('correctOption')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Answer Section */}
                {hasAnswer && (
                  <div className="space-y-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-400" />
                      {t('answer')}
                    </h4>
                    <div
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        deletionState.answer
                          ? 'bg-red-900/20 border-red-600'
                          : 'bg-gray-900/30 border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={toggleAnswerDeletion}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          className={`p-2 rounded transition-colors ${
                            deletionState.answer
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="flex-1">
                          <p className="text-gray-300 font-medium mb-2">{t('answerExplanation')}</p>
                          <p className="text-gray-400 text-sm">{question.answer!.explanation}</p>
                          {question.answer!.translations.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                              {t('availableTranslations')}: {question.answer!.translations.map(t => t.locale.toUpperCase()).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning if deleting correct option */}
                {isCorrectOptionBeingDeleted() && !deletionState.answer && (
                  <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-orange-400 mt-1" />
                      <div>
                        <p className="text-orange-300 font-medium">{t('warningCorrectOption')}</p>
                        <p className="text-orange-200/80 text-sm">{t('warningCorrectOptionDescription')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No dependencies - simple delete */
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-400 mt-1" />
                  <div>
                    <h4 className="text-red-300 font-medium mb-1">
                      {t('deleteWarning')}
                    </h4>
                    <p className="text-red-200/80 text-sm">
                      {t('deleteWarningDescription')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('deleting')}
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {hasDependencies && (deletionState.options.size > 0 || deletionState.answer) 
                  ? t('deleteSelected')
                  : t('deleteAll')
                }
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
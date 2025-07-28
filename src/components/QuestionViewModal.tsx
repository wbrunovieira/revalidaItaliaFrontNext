// /src/components/QuestionViewModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  HelpCircle,
  ClipboardList,
  BookOpen,
  Calendar,
  Clock,
  Copy,
  Check,
  CheckCircle,
  AlertCircle,
  FileText,
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

interface Argument {
  id: string;
  title: string;
  assessmentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface QuestionViewModalProps {
  question: Question | null;
  assessmentId: string | null;
  argumentData?: Argument | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuestionViewModal({
  question,
  argumentData,
  isOpen,
  onClose,
}: QuestionViewModalProps) {
  const t = useTranslations('Admin.questionView');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: t('copySuccess'),
        variant: 'success',
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: t('copyError'),
        variant: 'destructive',
      });
    }
  }, [t, toast]);

  // Get correct option text
  const getCorrectOptionText = useCallback(() => {
    if (!question?.answer?.correctOptionId || !question.options) return null;
    
    const correctOption = question.options.find(
      opt => opt.id === question.answer?.correctOptionId
    );
    
    return correctOption?.text || null;
  }, [question]);

  // Get explanation in current locale
  const getLocalizedExplanation = useCallback((targetLocale?: string) => {
    if (!question?.answer) return '';
    
    const localeToUse = targetLocale || locale;
    
    if (question.answer.translations && question.answer.translations.length > 0) {
      const translation = question.answer.translations.find(t => t.locale === localeToUse);
      if (translation) return translation.explanation;
    }
    
    return question.answer.explanation || '';
  }, [question, locale]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <HelpCircle size={28} className="text-secondary" />
            <h2 className="text-2xl font-bold text-white">
              {t('title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Question Text */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HelpCircle size={20} className="text-secondary" />
                  {t('questionText')}
                </h3>
                <button
                  onClick={() => copyToClipboard(question.text, 'question')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  title={t('copy')}
                >
                  {copiedField === 'question' ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
              <p className="text-gray-300 whitespace-pre-wrap">{question.text}</p>
            </div>

            {/* Type and Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <AlertCircle size={16} />
                  <span className="text-sm">{t('type')}</span>
                </div>
                <p className="text-white font-medium">
                  {t(`types.${question.type.toLowerCase()}`)}
                </p>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Calendar size={16} />
                  <span className="text-sm">{t('createdAt')}</span>
                </div>
                <p className="text-white">{formatDate(question.createdAt)}</p>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Clock size={16} />
                  <span className="text-sm">{t('updatedAt')}</span>
                </div>
                <p className="text-white">{formatDate(question.updatedAt)}</p>
              </div>
            </div>

            {/* Argument (if exists) */}
            {argumentData && (
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <FileText size={16} />
                  <span className="text-sm">{t('argument')}</span>
                </div>
                <p className="text-white">{argumentData.title}</p>
              </div>
            )}

            {/* Options (for multiple choice) */}
            {question.type === 'MULTIPLE_CHOICE' && question.options.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ClipboardList size={20} className="text-secondary" />
                  {t('options')}
                </h3>
                <div className="space-y-2">
                  {question.options.map((option, index) => {
                    const isCorrect = option.id === question.answer?.correctOptionId;
                    return (
                      <div
                        key={option.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border ${
                          isCorrect
                            ? 'bg-green-900/20 border-green-600'
                            : 'bg-gray-900/30 border-gray-700'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {isCorrect ? (
                            <CheckCircle size={20} className="text-green-400" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`${isCorrect ? 'text-green-300' : 'text-gray-300'}`}>
                            {String.fromCharCode(65 + index)}) {option.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Answer and Explanation */}
            {question.type === 'OPEN' ? (
              /* Open Question - No correct answer */
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <FileText size={24} className="text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">
                      {t('openQuestion.title')}
                    </h3>
                    <p className="text-blue-200/80">
                      {t('openQuestion.description')}
                    </p>
                  </div>
                </div>
              </div>
            ) : question.answer ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-400" />
                  {t('answer')}
                </h3>
                
                {/* Correct Answer for Multiple Choice */}
                {question.type === 'MULTIPLE_CHOICE' && getCorrectOptionText() && (
                  <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                    <p className="text-green-300 font-medium">
                      {t('correctAnswer')}: {getCorrectOptionText()}
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {(question.answer.explanation || (question.answer.translations && question.answer.translations.length > 0)) && (
                  <div className="space-y-4">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <BookOpen size={18} className="text-secondary" />
                      {t('explanation')}
                    </h4>
                    
                    {/* Show explanation in current locale */}
                    {getLocalizedExplanation() && (
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            {locale === 'pt' && <span>🇧🇷</span>}
                            {locale === 'it' && <span>🇮🇹</span>}
                            {locale === 'es' && <span>🇪🇸</span>}
                            <span className="text-sm text-gray-400">{t('currentLanguage')}</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(getLocalizedExplanation(), 'explanation')}
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                            title={t('copy')}
                          >
                            {copiedField === 'explanation' ? (
                              <Check size={14} className="text-green-400" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {getLocalizedExplanation()}
                        </p>
                      </div>
                    )}
                    
                    {/* Show all available translations */}
                    {question.answer.translations && question.answer.translations.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">{t('allTranslations')}:</p>
                        {question.answer.translations.map((trans) => (
                          <div key={trans.locale} className="bg-gray-900/30 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <div className="flex items-center gap-2">
                                {trans.locale === 'pt' && <span>🇧🇷</span>}
                                {trans.locale === 'it' && <span>🇮🇹</span>}
                                {trans.locale === 'es' && <span>🇪🇸</span>}
                                <span className="text-sm font-medium text-gray-400">
                                  {trans.locale.toUpperCase()}
                                </span>
                              </div>
                              <button
                                onClick={() => copyToClipboard(trans.explanation, `explanation-${trans.locale}`)}
                                className="p-1 text-gray-500 hover:text-white"
                                title={t('copy')}
                              >
                                {copiedField === `explanation-${trans.locale}` ? (
                                  <Check size={12} className="text-green-400" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">
                              {trans.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* No Answer Yet */
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle size={24} className="text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                      {t('noAnswer.title')}
                    </h3>
                    <p className="text-yellow-200/80">
                      {t('noAnswer.description')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* IDs for debugging */}
            <div className="bg-gray-900/30 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-400 mb-2">{t('technicalInfo')}</h4>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Question ID:</span>
                  <span className="text-gray-400">{question.id}</span>
                  <button
                    onClick={() => copyToClipboard(question.id, 'questionId')}
                    className="p-1 text-gray-500 hover:text-white"
                  >
                    {copiedField === 'questionId' ? (
                      <Check size={12} className="text-green-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
                {question.answer && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Answer ID:</span>
                    <span className="text-gray-400">{question.answer.id}</span>
                    <button
                      onClick={() => copyToClipboard(question.answer!.id, 'answerId')}
                      className="p-1 text-gray-500 hover:text-white"
                    >
                      {copiedField === 'answerId' ? (
                        <Check size={12} className="text-green-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
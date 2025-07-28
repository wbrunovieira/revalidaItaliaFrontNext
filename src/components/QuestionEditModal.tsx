// /src/components/QuestionEditModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  Save,
  HelpCircle,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  Languages,
  FileText,
  CircleDot,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface QuestionOption {
  id?: string;
  text: string;
  _delete?: boolean;
  isNew?: boolean;
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
  options: Array<{
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
  }>;
  answer?: {
    id: string;
    correctOptionId?: string;
    explanation: string;
    translations: AnswerTranslation[];
  };
  createdAt: string;
  updatedAt: string;
}

interface QuestionEditModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated: () => void;
}

interface FormData {
  text: string;
  options: QuestionOption[];
  answer: {
    correctOptionId: string;
    explanation: string;
    translations: {
      pt: string;
      it: string;
      es: string;
    };
  };
}

export default function QuestionEditModal({
  question,
  isOpen,
  onClose,
  onQuestionUpdated,
}: QuestionEditModalProps) {
  const t = useTranslations('Admin.questionEdit');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    text: '',
    options: [],
    answer: {
      correctOptionId: '',
      explanation: '',
      translations: {
        pt: '',
        it: '',
        es: '',
      },
    },
  });

  // Initialize form data when question changes
  useEffect(() => {
    if (question) {
      // Convert options
      const mappedOptions: QuestionOption[] = question.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        isNew: false,
      }));

      // Get translations
      const translations = {
        pt: '',
        it: '',
        es: '',
      };

      if (question.answer?.translations) {
        question.answer.translations.forEach(trans => {
          if (trans.locale === 'pt' || trans.locale === 'it' || trans.locale === 'es') {
            translations[trans.locale] = trans.explanation;
          }
        });
      }

      setFormData({
        text: question.text,
        options: mappedOptions,
        answer: {
          correctOptionId: question.answer?.correctOptionId || '',
          explanation: question.answer?.explanation || '',
          translations,
        },
      });
    }
  }, [question]);

  // Handle text change
  const handleTextChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, text: value }));
  }, []);

  // Handle option text change
  const handleOptionTextChange = useCallback((index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, text: value } : opt
      ),
    }));
  }, []);

  // Add new option
  const addOption = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isNew: true }],
    }));
  }, []);

  // Remove option
  const removeOption = useCallback((index: number) => {
    setFormData(prev => {
      const option = prev.options[index];
      if (option.id) {
        // Mark existing option for deletion
        return {
          ...prev,
          options: prev.options.map((opt, i) =>
            i === index ? { ...opt, _delete: true } : opt
          ),
        };
      } else {
        // Remove new option
        return {
          ...prev,
          options: prev.options.filter((_, i) => i !== index),
        };
      }
    });
  }, []);

  // Handle correct option change
  const handleCorrectOptionChange = useCallback((optionId: string) => {
    setFormData(prev => ({
      ...prev,
      answer: {
        ...prev.answer,
        correctOptionId: optionId,
      },
    }));
  }, []);

  // Handle explanation change
  const handleExplanationChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      answer: {
        ...prev.answer,
        explanation: value,
      },
    }));
  }, []);

  // Handle translation change
  const handleTranslationChange = useCallback((locale: 'pt' | 'it' | 'es', value: string) => {
    setFormData(prev => ({
      ...prev,
      answer: {
        ...prev.answer,
        translations: {
          ...prev.answer.translations,
          [locale]: value,
        },
      },
    }));
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    if (!formData.text.trim()) {
      toast({
        title: t('errors.textRequired'),
        variant: 'destructive',
      });
      return false;
    }

    if (question?.type === 'MULTIPLE_CHOICE') {
      // Check valid options
      const validOptions = formData.options.filter(opt => !opt._delete && opt.text.trim());
      if (validOptions.length < 2) {
        toast({
          title: t('errors.minOptions'),
          variant: 'destructive',
        });
        return false;
      }

      // Check if correct option is selected and not deleted
      if (formData.answer.correctOptionId) {
        const selectedOption = formData.options.find(opt => 
          (opt.id === formData.answer.correctOptionId || 
           (opt.isNew && opt.text === formData.answer.correctOptionId)) && 
          !opt._delete
        );
        if (!selectedOption) {
          toast({
            title: t('errors.correctOptionRequired'),
            variant: 'destructive',
          });
          return false;
        }
      }

      // Check explanation if answer exists
      if (formData.answer.correctOptionId && !formData.answer.explanation.trim()) {
        toast({
          title: t('errors.explanationRequired'),
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  }, [formData, question, t, toast]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !question) return;

    setLoading(true);

    try {
      // Prepare request body
      const requestBody: any = {
        text: formData.text.trim(),
      };

      // Add options for multiple choice
      if (question.type === 'MULTIPLE_CHOICE') {
        requestBody.options = formData.options.map(opt => {
          if (opt.isNew) {
            return { text: opt.text.trim() };
          } else {
            return {
              id: opt.id,
              text: opt.text.trim(),
              ...(opt._delete && { _delete: true }),
            };
          }
        }).filter((opt: any) => opt.text || opt._delete);

        // Add answer if provided
        if (formData.answer.correctOptionId && formData.answer.explanation.trim()) {
          const translations = [];
          
          if (formData.answer.translations.pt.trim()) {
            translations.push({ locale: 'pt', explanation: formData.answer.translations.pt.trim() });
          }
          if (formData.answer.translations.it.trim()) {
            translations.push({ locale: 'it', explanation: formData.answer.translations.it.trim() });
          }
          if (formData.answer.translations.es.trim()) {
            translations.push({ locale: 'es', explanation: formData.answer.translations.es.trim() });
          }

          requestBody.answer = {
            correctOptionId: formData.answer.correctOptionId,
            explanation: formData.answer.explanation.trim(),
            ...(translations.length > 0 && { translations }),
          };
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/questions/${question.id}/complete`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update question');
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      onQuestionUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: t('errors.updateTitle'),
        description: t('errors.updateDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
            <HelpCircle size={28} className="text-purple-400" />
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Question Type Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{t('questionType')}:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${
                question.type === 'MULTIPLE_CHOICE'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}>
                {question.type === 'MULTIPLE_CHOICE' ? (
                  <>
                    <CircleDot size={14} className="mr-1" />
                    {t('types.multipleChoice')}
                  </>
                ) : (
                  <>
                    <FileText size={14} className="mr-1" />
                    {t('types.open')}
                  </>
                )}
              </span>
              <span className="text-xs text-gray-500 italic ml-2">
                {t('typeCannotChange')}
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <FileText size={16} />
                {t('fields.text')}
                <span className="text-red-400">*</span>
              </Label>
              <textarea
                value={formData.text}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={4}
                disabled={loading}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                placeholder={t('placeholders.text')}
              />
            </div>

            {/* Options - Only for Multiple Choice */}
            {question.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <CircleDot size={16} />
                    {t('fields.options')}
                  </Label>
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={loading}
                    className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                  >
                    <Plus size={16} />
                    {t('addOption')}
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.options.map((option, index) => {
                    if (option._delete) return null;
                    
                    const optionLetter = String.fromCharCode(65 + index);
                    const isCorrect = option.id === formData.answer.correctOptionId ||
                                    (option.isNew && option.text === formData.answer.correctOptionId);
                    
                    return (
                      <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        isCorrect
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-gray-400 font-bold text-lg w-6">{optionLetter}</span>
                          <input
                            type="radio"
                            name="correctOption"
                            checked={isCorrect}
                            onChange={() => handleCorrectOptionChange(option.id || option.text)}
                            disabled={loading}
                            className="w-5 h-5 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => handleOptionTextChange(index, e.target.value)}
                            disabled={loading}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            placeholder={t('placeholders.optionText')}
                          />
                          {option.isNew && (
                            <span className="text-xs text-purple-400 mt-1">{t('newOption')}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          disabled={loading}
                          className="mt-1 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Answer Section */}
                {formData.answer.correctOptionId && (
                  <div className="space-y-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <Languages size={20} className="text-purple-400" />
                      <Label className="text-gray-300">
                        {t('fields.explanation')}
                      </Label>
                    </div>

                    {/* Main Explanation */}
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm">
                        {t('defaultExplanation')}
                      </Label>
                      <textarea
                        value={formData.answer.explanation}
                        onChange={(e) => handleExplanationChange(e.target.value)}
                        rows={3}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        placeholder={t('placeholders.explanation')}
                      />
                    </div>

                    {/* Translations */}
                    <div className="space-y-4">
                      <p className="text-sm text-gray-400">{t('fields.translations')}</p>
                      
                      {/* Portuguese */}
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm flex items-center gap-2">
                          🇧🇷 {t('languages.pt')}
                        </Label>
                        <textarea
                          value={formData.answer.translations.pt}
                          onChange={(e) => handleTranslationChange('pt', e.target.value)}
                          rows={2}
                          disabled={loading}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                          placeholder={t('placeholders.explanationPt')}
                        />
                      </div>

                      {/* Italian */}
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm flex items-center gap-2">
                          🇮🇹 {t('languages.it')}
                        </Label>
                        <textarea
                          value={formData.answer.translations.it}
                          onChange={(e) => handleTranslationChange('it', e.target.value)}
                          rows={2}
                          disabled={loading}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                          placeholder={t('placeholders.explanationIt')}
                        />
                      </div>

                      {/* Spanish */}
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm flex items-center gap-2">
                          🇪🇸 {t('languages.es')}
                        </Label>
                        <textarea
                          value={formData.answer.translations.es}
                          onChange={(e) => handleTranslationChange('es', e.target.value)}
                          rows={2}
                          disabled={loading}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                          placeholder={t('placeholders.explanationEs')}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info for Open Questions */}
            {question.type === 'OPEN' && (
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300">
                      {t('openQuestionInfo')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t('save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
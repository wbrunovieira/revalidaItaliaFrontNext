// /src/components/ViewAssessmentModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  ClipboardList,
  FileQuestion,
  FileText,
  Hash,
  Trophy,
  Shuffle,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  quizPosition: 'BEFORE_LESSON' | 'AFTER_LESSON' | null;
  passingScore?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  lessonId?: string;
  lesson?: {
    id: string;
    title: string;
    module?: {
      id: string;
      title: string;
      course?: {
        id: string;
        title: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface ViewAssessmentModalProps {
  assessmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewAssessmentModal({
  assessmentId,
  isOpen,
  onClose,
}: ViewAssessmentModalProps) {
  const t = useTranslations('Admin.viewAssessment');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  const loadAssessment = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assessments/${assessmentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load assessment');
      }

      const data = await response.json();
      setAssessment(data.assessment);
    } catch (error) {
      console.error('Error loading assessment:', error);
      toast({
        title: t('error.loadTitle'),
        description: t('error.loadDescription'),
        variant: 'destructive',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }, [assessmentId, t, toast, onClose]);

  useEffect(() => {
    if (isOpen && assessmentId) {
      loadAssessment();
    }
  }, [isOpen, assessmentId, loadAssessment]);

  // Get icon for assessment type
  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'QUIZ':
        return <ClipboardList size={24} className="text-blue-400" />;
      case 'SIMULADO':
        return <FileQuestion size={24} className="text-green-400" />;
      case 'PROVA_ABERTA':
        return <FileText size={24} className="text-purple-400" />;
      default:
        return null;
    }
  };

  // Get badge color for assessment type
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'QUIZ':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'SIMULADO':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PROVA_ABERTA':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return '';
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {assessment && getAssessmentIcon(assessment.type)}
            <h2 className="text-xl font-semibold text-white">
              {t('title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
            </div>
          ) : assessment ? (
            <div className="space-y-6">
              {/* Title and Type */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  {assessment.title}
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getTypeBadgeColor(assessment.type)}`}>
                    {t(`types.${assessment.type.toLowerCase()}`)}
                  </span>
                  {assessment.quizPosition && (
                    <span className="text-sm text-gray-400">
                      {t(`position.${assessment.quizPosition.toLowerCase()}`)}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {assessment.description && (
                <div className="space-y-2">
                  <h4 className="text-gray-300 font-semibold flex items-center gap-2">
                    <FileText size={16} />
                    {t('fields.description')}
                  </h4>
                  <p className="text-gray-400">{assessment.description}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Slug */}
                <div className="space-y-2">
                  <h4 className="text-gray-300 font-semibold flex items-center gap-2">
                    <Hash size={16} />
                    {t('fields.slug')}
                  </h4>
                  <p className="text-gray-400 font-mono bg-gray-900/50 px-3 py-2 rounded">
                    {assessment.slug}
                  </p>
                </div>

                {/* Passing Score */}
                {assessment.passingScore !== undefined && (
                  <div className="space-y-2">
                    <h4 className="text-gray-300 font-semibold flex items-center gap-2">
                      <Trophy size={16} />
                      {t('fields.passingScore')}
                    </h4>
                    <p className="text-gray-400">
                      {assessment.passingScore}%
                    </p>
                  </div>
                )}

                {/* Randomization Options */}
                <div className="space-y-3 md:col-span-2">
                  <h4 className="text-gray-300 font-semibold flex items-center gap-2">
                    <Shuffle size={16} />
                    {t('fields.randomization')}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {assessment.randomizeQuestions ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <XCircle size={16} className="text-gray-500" />
                      )}
                      <span className={assessment.randomizeQuestions ? 'text-gray-300' : 'text-gray-500'}>
                        {t('fields.randomizeQuestions')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {assessment.randomizeOptions ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <XCircle size={16} className="text-gray-500" />
                      )}
                      <span className={assessment.randomizeOptions ? 'text-gray-300' : 'text-gray-500'}>
                        {t('fields.randomizeOptions')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lesson Info */}
                {assessment.lesson && (
                  <div className="space-y-2 md:col-span-2">
                    <h4 className="text-gray-300 font-semibold flex items-center gap-2">
                      <BookOpen size={16} />
                      {t('fields.lesson')}
                    </h4>
                    <div className="bg-gray-900/50 p-4 rounded-lg space-y-1">
                      <p className="text-gray-300">{assessment.lesson.title}</p>
                      {assessment.lesson.module && (
                        <p className="text-gray-500 text-sm">
                          {t('fields.module')}: {assessment.lesson.module.title}
                        </p>
                      )}
                      {assessment.lesson.module?.course && (
                        <p className="text-gray-500 text-sm">
                          {t('fields.course')}: {assessment.lesson.module.course.title}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="space-y-3 md:col-span-2 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={16} />
                      <span className="text-sm">
                        {t('fields.createdAt')}: {formatDate(assessment.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={16} />
                      <span className="text-sm">
                        {t('fields.updatedAt')}: {formatDate(assessment.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              {t('noData')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
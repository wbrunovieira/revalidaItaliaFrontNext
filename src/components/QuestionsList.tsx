'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  ClipboardList,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Assessment {
  id: string;
  title: string;
  type: string;
  slug: string;
}

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

interface AssessmentDetailed {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
  passingScore?: number;
  timeLimitInMinutes?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  lessonId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Argument {
  id: string;
  title: string;
  lessonId?: string;
  createdAt: string;
  updatedAt: string;
}

interface DetailedResponse {
  assessment: AssessmentDetailed;
  arguments: Argument[];
  questions: Question[];
  totalQuestions: number;
  totalQuestionsWithAnswers: number;
}


export default function QuestionsList() {
  const t = useTranslations('Admin.questionsList');
  const { toast } = useToast();
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [detailedData, setDetailedData] = useState<DetailedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Load assessments
  const loadAssessments = useCallback(async () => {
    setLoadingAssessments(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assessments`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load assessments');
      }

      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast({
        title: t('error.fetchAssessmentsTitle'),
        description: t('error.fetchAssessmentsDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingAssessments(false);
    }
  }, [t, toast]);

  // Load detailed questions for selected assessment
  const loadDetailedQuestions = useCallback(async () => {
    if (!selectedAssessmentId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assessments/${selectedAssessmentId}/questions/detailed`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load detailed questions');
      }

      const data: DetailedResponse = await response.json();
      setDetailedData(data);
    } catch (error) {
      console.error('Error loading detailed questions:', error);
      toast({
        title: t('error.fetchQuestionsTitle'),
        description: t('error.fetchQuestionsDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedAssessmentId, t, toast]);

  // Load assessments when component mounts
  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  // Load detailed questions when assessment is selected
  useEffect(() => {
    if (selectedAssessmentId) {
      loadDetailedQuestions();
    }
  }, [loadDetailedQuestions, selectedAssessmentId]);

  // Handle assessment selection
  const handleAssessmentChange = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId);
    setDetailedData(null);
    setExpandedQuestions(new Set());
  };

  // Handle question expand/collapse
  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
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

  // Get question type badge
  const getQuestionTypeBadge = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'TRUE_FALSE':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'ESSAY':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      {/* Assessment Selection */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-green-400" />
            <Label className="text-white font-medium">{t('selectAssessment')}</Label>
          </div>
          
          <Select
            value={selectedAssessmentId}
            onValueChange={handleAssessmentChange}
            disabled={loadingAssessments}
          >
            <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder={t('selectAssessmentPlaceholder')} />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {assessments.map((assessment) => (
                <SelectItem
                  key={assessment.id}
                  value={assessment.id}
                  className="text-white hover:bg-gray-600"
                >
                  <div className="flex items-center gap-2">
                    <span>{assessment.title}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getQuestionTypeBadge(assessment.type)}`}>
                      {t(`assessmentTypes.${assessment.type.toLowerCase()}`)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {loadingAssessments && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
              {t('loadingAssessments')}
            </div>
          )}
        </div>
      </div>

      {/* Questions List */}
      {selectedAssessmentId && detailedData && (
        <>
          {/* Assessment Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{detailedData.assessment.title}</h3>
                <p className="text-gray-400 text-sm">
                  {t('totalQuestions')}: {detailedData.totalQuestions} | 
                  {t('withAnswers')}: {detailedData.totalQuestionsWithAnswers}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getQuestionTypeBadge(detailedData.assessment.type)}`}>
                  {t(`assessmentTypes.${detailedData.assessment.type.toLowerCase()}`)}
                </span>
                {detailedData.assessment.passingScore && (
                  <span className="text-gray-400 text-sm">
                    {t('passingScore')}: {detailedData.assessment.passingScore}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-gray-400">
            {t('showing', { count: detailedData.questions.length, total: detailedData.totalQuestions })}
          </div>

          {/* Questions Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('columns.title')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('columns.type')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('columns.createdAt')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('columns.updatedAt')}
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary"></div>
                          {t('loading')}
                        </div>
                      </td>
                    </tr>
                  ) : detailedData.questions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        {t('noQuestions')}
                      </td>
                    </tr>
                  ) : (
                    detailedData.questions.map((question) => (
                      <tr key={question.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleQuestionExpansion(question.id)}
                                className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                              >
                                {expandedQuestions.has(question.id) ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </button>
                              <HelpCircle size={16} className="text-green-400" />
                              <div className="text-white font-medium">{question.text}</div>
                            </div>
                            
                            {expandedQuestions.has(question.id) && (
                              <div className="ml-10 space-y-3">
                                {/* Options */}
                                {question.options.length > 0 && (
                                  <div className="p-3 bg-gray-900/50 rounded text-gray-300 text-sm">
                                    <div className="font-medium text-gray-200 mb-2">{t('options')}:</div>
                                    <ul className="space-y-1">
                                      {question.options.map((option, index) => (
                                        <li key={option.id} className="flex items-start gap-2">
                                          <span className={`text-xs mt-1 font-mono px-2 py-1 rounded ${
                                            question.answer?.correctOptionId === option.id
                                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                              : 'text-gray-400'
                                          }`}>
                                            {String.fromCharCode(65 + index)}
                                          </span>
                                          <span className={question.answer?.correctOptionId === option.id ? 'text-green-300 font-medium' : ''}>
                                            {option.text}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {/* Answer and Explanation */}
                                {question.answer && (
                                  <div className="p-3 bg-blue-900/20 rounded text-blue-200 text-sm border border-blue-500/30">
                                    <div className="font-medium text-blue-100 mb-2">{t('explanation')}:</div>
                                    <p>{question.answer.explanation}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getQuestionTypeBadge(question.type)}`}>
                              {t(`questionTypes.${question.type.toLowerCase()}`)}
                            </span>
                            {question.answer && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border bg-green-500/20 text-green-300 border-green-500/30">
                                {t('hasAnswer')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-500" />
                            {formatDate(question.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-500" />
                            {formatDate(question.updatedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                toast({
                                  title: t('comingSoon'),
                                  description: t('viewFeature'),
                                });
                              }}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              title={t('actions.view')}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                toast({
                                  title: t('comingSoon'),
                                  description: t('editFeature'),
                                });
                              }}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              title={t('actions.edit')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                toast({
                                  title: t('comingSoon'),
                                  description: t('deleteFeature'),
                                });
                              }}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                              title={t('actions.delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
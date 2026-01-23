// /src/components/QuestionsList.tsx
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
  ChevronLeft,
  HelpCircle,
  ClipboardList,
  Calendar,
  Clock,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import QuestionViewModal from '@/components/QuestionViewModal';
import QuestionEditModal from '@/components/QuestionEditModal';
import QuestionDeleteModal from '@/components/QuestionDeleteModal';

// Get token from cookie
function getToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
}

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

  // Pagination state for assessments
  const [assessmentsPage, setAssessmentsPage] = useState(1);
  const [assessmentsPagination, setAssessmentsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  // Type filter state
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedArgument, setSelectedArgument] = useState<Argument | null>(null);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  // Load assessments with pagination and type filter
  const loadAssessments = useCallback(async (page = 1, type = '') => {
    setLoadingAssessments(true);
    try {
      const token = getToken();

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (type) {
        params.append('type', type);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load assessments');
      }

      const data = await response.json();
      setAssessments(data.assessments || []);

      // Update pagination state
      if (data.pagination) {
        setAssessmentsPagination(data.pagination);
      }

      setAssessmentsPage(page);
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
      const token = getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments/${selectedAssessmentId}/questions/detailed`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
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

  // Load assessments when component mounts or type filter changes
  useEffect(() => {
    loadAssessments(1, typeFilter);
  }, [loadAssessments, typeFilter]);

  // Handle type filter change
  const handleTypeFilterChange = useCallback((type: string) => {
    setTypeFilter(type);
    setAssessmentsPage(1);
    setSelectedAssessmentId('');
    setDetailedData(null);
  }, []);

  // Handle pagination
  const handleAssessmentsPrevPage = useCallback(() => {
    if (assessmentsPagination.hasPrevious) {
      loadAssessments(assessmentsPage - 1, typeFilter);
    }
  }, [assessmentsPagination.hasPrevious, assessmentsPage, typeFilter, loadAssessments]);

  const handleAssessmentsNextPage = useCallback(() => {
    if (assessmentsPagination.hasNext) {
      loadAssessments(assessmentsPage + 1, typeFilter);
    }
  }, [assessmentsPagination.hasNext, assessmentsPage, typeFilter, loadAssessments]);

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

  // Handle view question
  const handleViewQuestion = useCallback((question: Question) => {
    setSelectedQuestion(question);
    
    // Find the argument if it exists
    if (question.argumentId && detailedData?.arguments) {
      const argument = detailedData.arguments.find(arg => arg.id === question.argumentId);
      setSelectedArgument(argument || null);
    } else {
      setSelectedArgument(null);
    }
    
    setViewModalOpen(true);
  }, [detailedData]);

  // Handle close view modal
  const handleCloseViewModal = useCallback(() => {
    setViewModalOpen(false);
    setSelectedQuestion(null);
    setSelectedArgument(null);
  }, []);
  
  // Handle edit question
  const handleEditQuestion = useCallback((question: Question) => {
    setEditingQuestion(question);
    setEditModalOpen(true);
  }, []);
  
  // Handle close edit modal
  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingQuestion(null);
  }, []);
  
  // Handle question updated
  const handleQuestionUpdated = useCallback(() => {
    loadDetailedQuestions();
  }, [loadDetailedQuestions]);
  
  // Handle delete question
  const handleDeleteQuestion = useCallback((question: Question) => {
    // If question has no options and no answer, delete directly with confirmation
    if (question.options.length === 0 && !question.answer) {
      toast({
        title: t('deleteConfirm.title'),
        description: t('deleteConfirm.description'),
        variant: 'destructive',
        action: (
          <button
            onClick={async () => {
              try {
                const token = getToken();
                const response = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/questions/${question.id}/complete`,
                  {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token && { 'Authorization': `Bearer ${token}` }),
                    },
                    body: JSON.stringify({ deleteQuestion: true }),
                  }
                );

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Failed to delete question');
                }

                toast({
                  title: t('deleteSuccess.title'),
                  description: t('deleteSuccess.description'),
                  variant: 'success',
                });

                loadDetailedQuestions();
              } catch (error) {
                console.error('Error deleting question:', error);
                toast({
                  title: t('deleteError.title'),
                  description: t('deleteError.description'),
                  variant: 'destructive',
                });
              }
            }}
            className="text-sm font-medium"
          >
            {t('deleteConfirm.confirm')}
          </button>
        ),
      });
    } else {
      // Has dependencies, open modal
      setDeletingQuestion(question);
      setDeleteModalOpen(true);
    }
  }, [t, toast, loadDetailedQuestions]);
  
  // Handle close delete modal
  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setDeletingQuestion(null);
  }, []);
  
  // Handle question deleted
  const handleQuestionDeleted = useCallback(() => {
    loadDetailedQuestions();
  }, [loadDetailedQuestions]);

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

          {/* Type Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm text-gray-400 mr-2">Filtrar por tipo:</span>
            <button
              type="button"
              onClick={() => handleTypeFilterChange('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === ''
                  ? 'bg-secondary text-primary'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleTypeFilterChange('SIMULADO')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === 'SIMULADO'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Simulado
            </button>
            <button
              type="button"
              onClick={() => handleTypeFilterChange('QUIZ')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === 'QUIZ'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Quiz
            </button>
            <button
              type="button"
              onClick={() => handleTypeFilterChange('PROVA_ABERTA')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === 'PROVA_ABERTA'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Prova Aberta
            </button>
            <button
              type="button"
              onClick={() => handleTypeFilterChange('ORAL_EXAM')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                typeFilter === 'ORAL_EXAM'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Prova Oral
            </button>
          </div>

          <Select
            value={selectedAssessmentId}
            onValueChange={handleAssessmentChange}
            disabled={loadingAssessments}
          >
            <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder={t('selectAssessmentPlaceholder')} />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 max-h-80">
              {assessments.length === 0 ? (
                <div className="px-4 py-3 text-gray-400 text-center">
                  {loadingAssessments ? 'Carregando...' : 'Nenhuma avaliação encontrada'}
                </div>
              ) : (
                assessments.map((assessment) => (
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
                ))
              )}

              {/* Pagination Controls inside dropdown */}
              {assessmentsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-3 mt-1 border-t border-gray-600 bg-gray-800/80 sticky bottom-0">
                  <div className="text-xs text-gray-400">
                    Pág. {assessmentsPagination.page}/{assessmentsPagination.totalPages} ({assessmentsPagination.total} total)
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAssessmentsPrevPage();
                      }}
                      disabled={!assessmentsPagination.hasPrevious || loadingAssessments}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Página anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAssessmentsNextPage();
                      }}
                      disabled={!assessmentsPagination.hasNext || loadingAssessments}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Próxima página"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </SelectContent>
          </Select>

          {loadingAssessments && (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
              {t('loadingAssessments')}
            </div>
          )}

          {/* Pagination info outside dropdown */}
          {assessmentsPagination.total > 0 && (
            <div className="text-sm text-gray-400">
              Mostrando {assessments.length} de {assessmentsPagination.total} avaliações
              {typeFilter && ` (filtrado por ${typeFilter.replace('_', ' ')})`}
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
                              onClick={() => handleViewQuestion(question)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              title={t('actions.view')}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditQuestion(question)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                              title={t('actions.edit')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question)}
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

      {/* Question View Modal */}
      {selectedQuestion && (
        <QuestionViewModal
          question={selectedQuestion}
          assessmentId={selectedAssessmentId}
          argumentData={selectedArgument}
          isOpen={viewModalOpen}
          onClose={handleCloseViewModal}
        />
      )}
      
      {/* Question Edit Modal */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          onQuestionUpdated={handleQuestionUpdated}
        />
      )}
      
      {/* Question Delete Modal */}
      {deletingQuestion && (
        <QuestionDeleteModal
          question={deletingQuestion}
          isOpen={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onQuestionDeleted={handleQuestionDeleted}
        />
      )}
    </div>
  );
}
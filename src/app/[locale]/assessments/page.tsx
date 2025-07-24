'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import NavSidebar from '@/components/NavSidebar';
import { 
  FileText, 
  ClipboardList, 
  Clock, 
  CheckCircle,
  Filter,
  Search,
  Play,
  ArrowRight
} from 'lucide-react';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON' | null;
  passingScore?: number | null;
  timeLimitInMinutes?: number | null;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  lessonId?: string | null;
  createdAt: string;
  updatedAt: string;
  // TODO: API needs to return these fields for navigation
  // courseSlug?: string;
  // moduleSlug?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function AssessmentsPage({ params }: PageProps) {
  const router = useRouter();
  const { locale } = use(params);
  const t = useTranslations('Assessments');
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState({
    total: 0,
    quiz: 0,
    simulado: 0,
    provaAberta: 0
  });

  const calculateStats = useCallback((assessments: Assessment[]) => {
    const quiz = assessments.filter(a => a.type === 'QUIZ').length;
    const simulado = assessments.filter(a => a.type === 'SIMULADO').length;
    const provaAberta = assessments.filter(a => a.type === 'PROVA_ABERTA').length;

    setStats({
      total: assessments.length,
      quiz,
      simulado,
      provaAberta
    });
  }, []);

  const fetchAssessments = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments?page=1&limit=100`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments || []);
        setFilteredAssessments(data.assessments || []);
        setPagination(data.pagination);
        calculateStats(data.assessments || []);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  }, [calculateStats]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          router.push(`/${locale}/login`);
          return;
        }

        await fetchAssessments();
      } catch (error) {
        console.error('Auth error:', error);
        router.push(`/${locale}/login`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [locale, router, fetchAssessments]);

  useEffect(() => {
    let filtered = assessments;

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(a => a.type === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAssessments(filtered);
  }, [selectedType, searchTerm, assessments]);

  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'QUIZ':
        return <Image src="/icons/quiz.svg" alt="Quiz" width={24} height={24} className="w-6 h-6" />;
      case 'SIMULADO':
        return <Image src="/icons/rating.svg" alt="Simulado" width={24} height={24} className="w-6 h-6" />;
      case 'PROVA_ABERTA':
        return <Image src="/icons/examination.svg" alt="Prova Aberta" width={24} height={24} className="w-6 h-6" />;
      default:
        return <ClipboardList size={24} />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      'QUIZ': { bg: 'bg-primary', text: 'text-accent-light', border: 'border-blue-500/30' },
      'SIMULADO': { bg: 'bg-secondary/20', text: 'text-accent-light', border: 'border-secondary/30' },
      'PROVA_ABERTA': { bg: 'bg-accent', text: 'text-primary', border: 'border-primary/40' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig['QUIZ'];

    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.bg} ${config.text} border ${config.border}`}>
        {t(`types.${type.toLowerCase()}`)}
      </span>
    );
  };

  const handleStartAssessment = (assessment: Assessment) => {
    if (assessment.lessonId) {
      // Use the simplified URL pattern
      router.push(`/${locale}/lessons/${assessment.lessonId}/assessments/${assessment.id}`);
    } else {
      // For assessments without lessonId
      console.log('Assessment without lesson:', assessment);
      alert('Esta avaliação não está vinculada a uma aula.');
    }
  };

  if (loading) {
    return (
      <NavSidebar>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
              <p className="text-gray-300">{t('loading')}</p>
            </div>
          </div>
        </div>
      </NavSidebar>
    );
  }

  return (
    <NavSidebar>
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
            <p className="text-gray-300">{t('subtitle')}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-4 border border-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{t('stats.total')}</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <FileText size={24} className="text-secondary" />
              </div>
            </div>

            <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-4 border border-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{t('types.quiz')}</p>
                  <p className="text-2xl font-bold text-white">{stats.quiz}</p>
                </div>
                <Image src="/icons/quiz.svg" alt="Quiz" width={24} height={24} className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-4 border border-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{t('types.simulado')}</p>
                  <p className="text-2xl font-bold text-white">{stats.simulado}</p>
                </div>
                <Image src="/icons/rating.svg" alt="Simulado" width={24} height={24} className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-4 border border-secondary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{t('types.prova_aberta')}</p>
                  <p className="text-2xl font-bold text-white">{stats.provaAberta}</p>
                </div>
                <Image src="/icons/examination.svg" alt="Prova Aberta" width={24} height={24} className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-primary-dark/50 border border-secondary/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 bg-primary-dark/50 border border-secondary/20 rounded-lg text-white focus:outline-none focus:border-secondary/50"
              >
                <option value="ALL">{t('filter.all')}</option>
                <option value="QUIZ">{t('filter.quiz')}</option>
                <option value="SIMULADO">{t('filter.simulado')}</option>
                <option value="PROVA_ABERTA">{t('filter.provaAberta')}</option>
              </select>
            </div>
          </div>

          {/* Assessments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="group bg-primary-dark/50 backdrop-blur-sm rounded-xl p-6 border border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getAssessmentIcon(assessment.type)}
                    {getTypeBadge(assessment.type)}
                  </div>
                  {assessment.quizPosition && (
                    <span className="text-xs text-gray-400">
                      {assessment.quizPosition === 'BEFORE_LESSON' ? 'Antes da aula' : 'Após a aula'}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-secondary transition-colors">
                  {assessment.title}
                </h3>

                {assessment.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {assessment.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <div className="flex items-center gap-4">
                    {assessment.timeLimitInMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {assessment.timeLimitInMinutes} min
                      </span>
                    )}
                    {assessment.passingScore && (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={14} />
                        {assessment.passingScore}%
                      </span>
                    )}
                  </div>
                </div>

                {assessment.lessonId && (
                  <div className="mb-4 pt-4 border-t border-secondary/20">
                    <p className="text-xs text-gray-400">{t('linkedToLesson')}</p>
                  </div>
                )}

                <div className="mt-auto">
                  <button
                    onClick={() => handleStartAssessment(assessment)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-all duration-300 font-medium group/btn"
                  >
                    <Play size={16} className="group-hover/btn:scale-110 transition-transform" />
                    {t('startAssessment')}
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredAssessments.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-300">{t('noAssessments')}</p>
            </div>
          )}
        </div>
      </div>
    </NavSidebar>
  );
}
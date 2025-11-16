// src/components/StudentQuizResults.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
// import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Trophy,
  Target,
  FileText,
  BarChart3,
  Filter,
  SortDesc,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface Answer {
  id: string;
  questionId: string;
  question: {
    id: string;
    text: string;
    type: 'MULTIPLE_CHOICE' | 'OPEN';
  };
  selectedOptionId?: string;
  textAnswer?: string;
  isCorrect?: boolean;
  teacherComment?: string;
  correctAnswer?: {
    optionId?: string;
    explanation: string;
  };
}

interface AttemptResults {
  attempt: {
    id: string;
    status: 'SUBMITTED' | 'GRADED';
    score?: number;
    startedAt: string;
    submittedAt: string;
    gradedAt?: string;
    timeLimitExpiresAt?: string;
    identityId: string;
    assessmentId: string;
    createdAt: string;
    updatedAt: string;
  };
  assessment: {
    id: string;
    title: string;
    description?: string;
    type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
    passingScore?: number;
    lesson?: {
      id: string;
      title: string;
    };
  };
  answers: Answer[];
  summary?: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers?: number;
    scorePercentage?: number;
    passed?: boolean;
  };
  results?: {
    totalQuestions: number;
    answeredQuestions: number;
    timeSpent: number;
    correctAnswers: number;
    scorePercentage: number;
    passed: boolean;
  };
}

interface GroupedAssessment {
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  lessonTitle?: string;
  attempts: AttemptResults[];
  bestScore: number;
  averageScore: number;
  totalAttempts: number;
  passedAttempts: number;
  lastAttemptDate: string;
}

interface StudentQuizResultsProps {
  attemptIds: string[];
  locale: string;
}

export default function StudentQuizResults({
  attemptIds,
  locale,
}: StudentQuizResultsProps) {
  const { toast } = useToast();

  // Temporary fallback for translations
  const t = useCallback((key: string) => {
    const translations: Record<
      string,
      Record<string, string>
    > = {
      pt: {
        title: 'Meus Resultados',
        totalAttempts: 'tentativas',
        'noResults.title': 'Nenhum resultado encontrado',
        'noResults.description':
          'Você ainda não completou nenhuma avaliação.',
        'assessmentType.QUIZ': 'Quiz',
        'assessmentType.SIMULADO': 'Simulado',
        'assessmentType.PROVA_ABERTA': 'Prova Aberta',
        'assessmentType.ORAL_EXAM': 'Exame Oral',
        passed: 'Aprovado',
        failed: 'Reprovado',
        pending: 'Pendente',
        'summary.correct': 'Acertos',
        'summary.accuracy': 'Precisão',
        'summary.duration': 'Duração',
        scoreProgress: 'Progresso da Pontuação',
        passingScore: 'Nota de Aprovação',
        viewDetails: 'Ver Detalhes',
        'error.fetchTitle': 'Erro ao carregar resultados',
        'error.fetchDescription':
          'Não foi possível carregar seus resultados. Tente novamente.',
        'status': 'Status',
        'bestScore': 'Melhor Nota',
        'averageTime': 'Tempo Médio',
        'progressToPass': 'Progresso para aprovação',
        'missingPoints': 'Faltam {points}% para {passing}%',
        'lastAttempt': 'Última tentativa',
      },
      it: {
        title: 'I Miei Risultati',
        totalAttempts: 'tentativi',
        'noResults.title': 'Nessun risultato trovato',
        'noResults.description':
          'Non hai ancora completato nessuna valutazione.',
        'assessmentType.QUIZ': 'Quiz',
        'assessmentType.SIMULADO': 'Simulazione',
        'assessmentType.PROVA_ABERTA': 'Prova Aperta',
        'assessmentType.ORAL_EXAM': 'Esame Orale',
        passed: 'Promosso',
        failed: 'Bocciato',
        pending: 'In attesa',
        'summary.correct': 'Corrette',
        'summary.accuracy': 'Precisione',
        'summary.duration': 'Durata',
        scoreProgress: 'Progresso del Punteggio',
        passingScore: 'Voto di Passaggio',
        viewDetails: 'Vedi Dettagli',
        'error.fetchTitle':
          'Errore nel caricamento dei risultati',
        'error.fetchDescription':
          'Non è stato possibile caricare i tuoi risultati. Riprova.',
        'status': 'Stato',
        'bestScore': 'Miglior Voto',
        'averageTime': 'Tempo Medio',
        'progressToPass': 'Progresso per l\'approvazione',
        'missingPoints': 'Mancano {points}% per {passing}%',
        'lastAttempt': 'Ultimo tentativo',
      },
      es: {
        title: 'Mis Resultados',
        totalAttempts: 'intentos',
        'noResults.title': 'No se encontraron resultados',
        'noResults.description':
          'Aún no has completado ninguna evaluación.',
        'assessmentType.QUIZ': 'Quiz',
        'assessmentType.SIMULADO': 'Simulacro',
        'assessmentType.PROVA_ABERTA': 'Prueba Abierta',
        'assessmentType.ORAL_EXAM': 'Examen Oral',
        passed: 'Aprobado',
        failed: 'Reprobado',
        pending: 'Pendiente',
        'summary.correct': 'Correctas',
        'summary.accuracy': 'Precisión',
        'summary.duration': 'Duración',
        scoreProgress: 'Progreso de Puntuación',
        passingScore: 'Nota de Aprobación',
        viewDetails: 'Ver Detalles',
        'error.fetchTitle': 'Error al cargar resultados',
        'error.fetchDescription':
          'No se pudieron cargar tus resultados. Intenta de nuevo.',
        'status': 'Estado',
        'bestScore': 'Mejor Nota',
        'averageTime': 'Tiempo Promedio',
        'progressToPass': 'Progreso para aprobar',
        'missingPoints': 'Faltan {points}% para {passing}%',
        'lastAttempt': 'Último intento',
      },
    };

    const currentLocale = locale || 'pt';
    return (
      translations[currentLocale]?.[key] ||
      translations.pt[key] ||
      key
    );
  }, [locale]);
  const [results, setResults] = useState<AttemptResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  // Estados para filtros
  const [groupedAssessments, setGroupedAssessments] = useState<GroupedAssessment[]>([]);
  const [filteredGroupedAssessments, setFilteredGroupedAssessments] = useState<GroupedAssessment[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [lessonFilter, setLessonFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const getLocale = () => {
    switch (locale) {
      case 'it':
        return it;
      case 'es':
        return es;
      default:
        return ptBR;
    }
  };

  const fetchAttemptResults = useCallback(
    async (attemptId: string) => {
      try {
        const token = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          throw new Error('Token not found');
        }

        const response = await fetch(
          `${apiUrl}/api/v1/attempts/${attemptId}/results`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          const error = await response.json();

          if (error.error === 'ATTEMPT_NOT_FINALIZED') {
            // Skip non-finalized attempts
            return null;
          }

          throw new Error(
            error.message || 'Failed to fetch results'
          );
        }

        const resultData = await response.json();
        return resultData;
      } catch (error) {
        console.error(
          `Error fetching results for attempt ${attemptId}:`,
          error
        );
        return null;
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    const fetchAllResults = async () => {
      if (hasFetched) return; // Evitar múltiplas chamadas

      setLoading(true);
      setHasFetched(true);

      try {
        const resultsPromises = attemptIds.map(id =>
          fetchAttemptResults(id)
        );
        const allResults = await Promise.all(
          resultsPromises
        );
        const validResults = allResults.filter(
          result => result !== null
        ) as AttemptResults[];

        // Sort by date, most recent first
        validResults.sort(
          (a, b) =>
            new Date(b.attempt.submittedAt).getTime() -
            new Date(a.attempt.submittedAt).getTime()
        );

        setResults(validResults);
      } catch (error) {
        console.error(
          'Error fetching quiz results:',
          error
        );
        toast({
          title: t('error.fetchTitle'),
          description: t('error.fetchDescription'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (attemptIds.length > 0 && !hasFetched) {
      fetchAllResults();
    } else if (attemptIds.length === 0) {
      setLoading(false);
    }
  }, [
    attemptIds,
    hasFetched,
    fetchAttemptResults,
    toast,
    t,
  ]);

  // Agrupar resultados por assessment
  useEffect(() => {
    if (results.length === 0) {
      setGroupedAssessments([]);
      return;
    }

    const grouped = new Map<string, GroupedAssessment>();

    results.forEach(result => {
      const assessmentId = result.assessment.id;

      if (!grouped.has(assessmentId)) {
        grouped.set(assessmentId, {
          assessmentId,
          assessmentTitle: result.assessment.title,
          assessmentType: result.assessment.type,
          lessonTitle: result.assessment.lesson?.title,
          attempts: [],
          bestScore: 0,
          averageScore: 0,
          totalAttempts: 0,
          passedAttempts: 0,
          lastAttemptDate: result.attempt.submittedAt,
        });
      }

      const group = grouped.get(assessmentId)!;
      group.attempts.push(result);

      // Update statistics
      const score =
        result.results?.scorePercentage ||
        result.attempt.score ||
        0;
      group.bestScore = Math.max(group.bestScore, score);
      group.totalAttempts++;

      // Check if passed based on assessment type
      let isPassed = false;
      if (result.assessment.type === 'PROVA_ABERTA') {
        // For open exams, check if it has been graded
        if (result.attempt.status === 'GRADED' && result.results?.scorePercentage !== undefined) {
          const passingScore = result.assessment.passingScore || 70;
          isPassed = result.results.scorePercentage >= passingScore;
        }
        // If not graded yet, isPassed remains false (will show as pending)
      } else {
        // For quiz and simulado, use the passed field
        isPassed = result.results?.passed || false;
      }
      
      if (isPassed) {
        group.passedAttempts++;
      }

      // Update last attempt date
      if (
        new Date(result.attempt.submittedAt) >
        new Date(group.lastAttemptDate)
      ) {
        group.lastAttemptDate = result.attempt.submittedAt;
      }
    });

    // Calculate average scores
    grouped.forEach(group => {
      const totalScore = group.attempts.reduce(
        (sum, attempt) => {
          return (
            sum +
            (attempt.results?.scorePercentage ||
              attempt.attempt.score ||
              0)
          );
        },
        0
      );
      group.averageScore =
        totalScore / group.attempts.length;
    });

    setGroupedAssessments(Array.from(grouped.values()));
  }, [results]);

  // Aplicar filtros e ordenação aos dados agrupados
  useEffect(() => {
    let filtered = [...groupedAssessments];

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(
        g => g.assessmentType === typeFilter
      );
    }

    // Filtro por aula
    if (lessonFilter !== 'all') {
      filtered = filtered.filter(g => {
        return g.attempts.some(
          a => a.assessment.lesson?.id === lessonFilter
        );
      });
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      if (statusFilter === 'passed') {
        filtered = filtered.filter(g => {
          // Deve ter pelo menos uma tentativa aprovada
          if (g.assessmentType === 'PROVA_ABERTA') {
            // Para prova aberta, verifica se tem tentativa corrigida e aprovada
            return g.attempts.some(
              attempt => attempt.attempt.status === 'GRADED' && 
              attempt.results?.scorePercentage !== undefined &&
              attempt.results.scorePercentage >= (attempt.assessment.passingScore || 70)
            );
          }
          return g.passedAttempts > 0;
        });
      } else if (statusFilter === 'failed') {
        filtered = filtered.filter(g => {
          // Deve ter sido corrigido e reprovado
          if (g.assessmentType === 'PROVA_ABERTA') {
            // Para prova aberta, verifica se tem tentativa corrigida e reprovada
            const hasGradedAttempt = g.attempts.some(
              attempt => attempt.attempt.status === 'GRADED' && 
              attempt.results?.scorePercentage !== undefined
            );
            if (!hasGradedAttempt) return false; // Se não foi corrigida, não é reprovada
            
            return !g.attempts.some(
              attempt => attempt.attempt.status === 'GRADED' && 
              attempt.results?.scorePercentage !== undefined &&
              attempt.results.scorePercentage >= (attempt.assessment.passingScore || 70)
            );
          }
          return g.passedAttempts === 0;
        });
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(g => {
          // Apenas provas abertas podem estar pendentes
          if (g.assessmentType !== 'PROVA_ABERTA') return false;
          
          // Verifica se não tem nenhuma tentativa corrigida
          return !g.attempts.some(
            attempt => attempt.attempt.status === 'GRADED' && 
            attempt.results?.scorePercentage !== undefined
          );
        });
      }
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (
            new Date(b.lastAttemptDate).getTime() -
            new Date(a.lastAttemptDate).getTime()
          );
        case 'date-asc':
          return (
            new Date(a.lastAttemptDate).getTime() -
            new Date(b.lastAttemptDate).getTime()
          );
        case 'score-desc':
          return b.bestScore - a.bestScore;
        case 'score-asc':
          return a.bestScore - b.bestScore;
        default:
          return 0;
      }
    });

    setFilteredGroupedAssessments(filtered);
  }, [
    groupedAssessments,
    typeFilter,
    lessonFilter,
    statusFilter,
    sortBy,
  ]);

  // Obter aulas únicas para o filtro
  const uniqueLessons = Array.from(
    new Map(
      results
        .filter(r => r.assessment.lesson)
        .map(r => [
          r.assessment.lesson!.id,
          r.assessment.lesson!,
        ])
    ).values()
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };


  const getAssessmentTypeIcon = (type: string) => {
    switch (type) {
      case 'QUIZ':
        return (
          <Target className="w-4 h-4 text-secondary" />
        );
      case 'SIMULADO':
        return (
          <BarChart3 className="w-4 h-4 text-secondary" />
        );
      case 'PROVA_ABERTA':
        return (
          <FileText className="w-4 h-4 text-secondary" />
        );
      default:
        return (
          <FileText className="w-4 h-4 text-secondary" />
        );
    }
  };

  const getAssessmentTypeBadge = (type: string) => {
    const colors = {
      QUIZ: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      SIMULADO:
        'bg-purple-500/20 text-purple-400 border-purple-500/30',
      PROVA_ABERTA:
        'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };
    return (
      colors[type as keyof typeof colors] ||
      'bg-gray-500/20 text-gray-400 border-gray-500/30'
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Trophy className="w-12 h-12 text-secondary mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('noResults.title')}
          </h3>
          <p className="text-white/70">
            {t('noResults.description')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {t('title')}
          </h2>
          <Badge
            variant="secondary"
            className="text-lg px-3 py-1 bg-secondary/20 text-secondary border-secondary/30"
          >
            {filteredGroupedAssessments.length} /{' '}
            {groupedAssessments.length} avaliações
          </Badge>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          {/* Filtro por tipo */}
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Todos os tipos
              </SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="SIMULADO">
                Simulado
              </SelectItem>
              <SelectItem value="PROVA_ABERTA">
                Prova Aberta
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro por aula */}
          <Select
            value={lessonFilter}
            onValueChange={setLessonFilter}
          >
            <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
              <FileText className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Aula" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Todas as aulas
              </SelectItem>
              {uniqueLessons.map(lesson => (
                <SelectItem
                  key={lesson.id}
                  value={lesson.id}
                >
                  {lesson.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por status */}
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <Trophy className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Todos os status
              </SelectItem>
              <SelectItem value="passed">
                Aprovado
              </SelectItem>
              <SelectItem value="failed">
                Reprovado
              </SelectItem>
              <SelectItem value="pending">
                Pendente
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Ordenação */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
              <SortDesc className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">
                Mais recentes
              </SelectItem>
              <SelectItem value="date-asc">
                Mais antigas
              </SelectItem>
              <SelectItem value="score-desc">
                Maior nota
              </SelectItem>
              <SelectItem value="score-asc">
                Menor nota
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredGroupedAssessments.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="w-12 h-12 text-secondary mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-white/70">
              Tente ajustar os filtros para ver mais
              resultados
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          {filteredGroupedAssessments.map((assessment, index) => {
            const dateLocale = getLocale();
            const hasPassed = assessment.passedAttempts > 0;
            const passingScore = assessment.attempts[0]?.assessment.passingScore || 70;
            const progressToPass = Math.max(0, passingScore - assessment.bestScore);
            
            // Calcular tempo médio
            const totalTime = assessment.attempts.reduce((sum, attempt) => {
              const start = new Date(attempt.attempt.startedAt);
              const end = new Date(attempt.attempt.submittedAt);
              const timeDiff = end.getTime() - start.getTime();
              return sum + timeDiff;
            }, 0);
            
            const avgTimeMs = totalTime / assessment.attempts.length;

            return (
              <motion.div
                key={assessment.assessmentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white/5 backdrop-blur-sm border-white/10 hover:border-secondary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-3">
                            {getAssessmentTypeIcon(assessment.assessmentType)}
                            <CardTitle className="text-lg text-white">
                              {assessment.assessmentTitle}
                            </CardTitle>
                            <Badge className={getAssessmentTypeBadge(assessment.assessmentType)}>
                              {t(`assessmentType.${assessment.assessmentType}`)}
                            </Badge>
                          </div>
                          {assessment.lessonTitle && (
                            <p className="text-sm text-white/60">
                              <span className="text-white/40">Aula: </span>
                              <span className="font-medium text-white/80">{assessment.lessonTitle}</span>
                            </p>
                          )}
                        </div>

                        {/* Informações úteis para o aluno */}
                        <div className="space-y-4">
                          {/* Status e Melhor Nota */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-xs text-white/60 mb-1">{t('status')}</p>
                                <Badge 
                                  variant={(() => {
                                    // Para provas abertas não corrigidas
                                    if (assessment.assessmentType === 'PROVA_ABERTA') {
                                      const hasGradedAttempt = assessment.attempts.some(
                                        attempt => attempt.attempt.status === 'GRADED' && 
                                        attempt.results?.scorePercentage !== undefined
                                      );
                                      if (!hasGradedAttempt) {
                                        return 'secondary'; // Badge amarelo para pendente
                                      }
                                    }
                                    return hasPassed ? 'default' : 'destructive';
                                  })()} 
                                  className="text-sm"
                                >
                                  {(() => {
                                    // Para provas abertas não corrigidas
                                    if (assessment.assessmentType === 'PROVA_ABERTA') {
                                      const hasGradedAttempt = assessment.attempts.some(
                                        attempt => attempt.attempt.status === 'GRADED' && 
                                        attempt.results?.scorePercentage !== undefined
                                      );
                                      if (!hasGradedAttempt) {
                                        return t('pending');
                                      }
                                    }
                                    return hasPassed ? t('passed') : t('failed');
                                  })()}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-white/60 mb-1">{t('bestScore')}</p>
                                <p className={`text-2xl font-bold ${getScoreColor(assessment.bestScore)}`}>
                                  {Math.round(assessment.bestScore)}%
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/60 mb-1">{t('averageTime')}</p>
                              <p className="text-sm font-medium text-white">
                                {(() => {
                                  const totalSeconds = Math.round(avgTimeMs / 1000);
                                  const minutes = Math.floor(totalSeconds / 60);
                                  const seconds = totalSeconds % 60;
                                  
                                  if (minutes === 0) {
                                    return `${seconds}s`;
                                  } else if (minutes < 60) {
                                    return `${minutes}min ${seconds}s`;
                                  } else {
                                    const hours = Math.floor(minutes / 60);
                                    const remainingMinutes = minutes % 60;
                                    return `${hours}h ${remainingMinutes}min`;
                                  }
                                })()}
                              </p>
                            </div>
                          </div>

                          {/* Progresso para aprovação */}
                          {(() => {
                            // Não mostrar progresso para provas abertas pendentes
                            if (assessment.assessmentType === 'PROVA_ABERTA') {
                              const hasGradedAttempt = assessment.attempts.some(
                                attempt => attempt.attempt.status === 'GRADED' && 
                                attempt.results?.scorePercentage !== undefined
                              );
                              if (!hasGradedAttempt) return null;
                            }
                            
                            if (!hasPassed) {
                              return (
                                <div className="bg-white/5 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-white/70">{t('progressToPass')}</span>
                                    <span className="text-sm font-medium text-white">
                                      {t('missingPoints').replace('{points}', progressToPass.toString()).replace('{passing}', passingScore.toString())}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={(assessment.bestScore / passingScore) * 100} 
                                    className="h-2 bg-white/10"
                                  />
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Última tentativa */}
                          <p className="text-sm text-white/60">
                            {t('lastAttempt')}: {format(new Date(assessment.lastAttemptDate), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}

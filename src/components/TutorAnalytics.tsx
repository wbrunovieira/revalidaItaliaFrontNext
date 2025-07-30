'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Brain,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  User,
  FileText,
  Filter,
  Download,
  Eye,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Assessment {
  id: string;
  title: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  lessonId?: string;
  lesson?: {
    id: string;
    title: string;
  };
}

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN';
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

interface Answer {
  id: string;
  questionId: string;
  question?: Question;
  selectedOptionId?: string;
  isCorrect?: boolean;
  attemptId: string;
  studentId: string;
}

interface AttemptWithDetails {
  id: string;
  student: Student;
  assessment: Assessment;
  status: 'SUBMITTED' | 'GRADING' | 'GRADED';
  submittedAt: string;
  startedAt: string;
  results?: {
    totalQuestions: number;
    correctAnswers: number;
    scorePercentage: number;
  };
  answers: Answer[];
}

interface TutorAnalyticsProps {
  attempts: AttemptWithDetails[];
  locale: string;
}

export default function TutorAnalytics({ attempts, locale }: TutorAnalyticsProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'students' | 'questions' | 'patterns'>('overview');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('30d');

  // Filtrar tentativas por período
  const filteredAttempts = useMemo(() => {
    if (timeFilter === 'all') return attempts;
    
    const now = new Date();
    const filterDate = new Date();
    
    if (timeFilter === '7d') {
      filterDate.setDate(now.getDate() - 7);
    } else if (timeFilter === '30d') {
      filterDate.setDate(now.getDate() - 30);
    }
    
    return attempts.filter(attempt => 
      new Date(attempt.submittedAt) >= filterDate
    );
  }, [attempts, timeFilter]);

  // Calcular métricas gerais
  const overallMetrics = useMemo(() => {
    const totalAttempts = filteredAttempts.length;
    const uniqueStudents = new Set(filteredAttempts.map(a => a.student.id)).size;
    const uniqueAssessments = new Set(filteredAttempts.map(a => a.assessment.id)).size;
    
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    console.log('TutorAnalytics - Calculating overall metrics from attempts:', totalAttempts);
    
    filteredAttempts.forEach(attempt => {
      if (attempt.results) {
        console.log('Attempt results:', {
          attemptId: attempt.id,
          correctAnswers: attempt.results.correctAnswers,
          totalQuestions: attempt.results.totalQuestions,
          scorePercentage: attempt.results.scorePercentage
        });
        totalCorrect += attempt.results.correctAnswers || 0;
        totalQuestions += attempt.results.totalQuestions || 0;
      }
    });
    
    const averageScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
    console.log('Overall metrics calculated:', {
      totalCorrect,
      totalQuestions,
      averageScore
    });
    
    return {
      totalAttempts,
      uniqueStudents,
      uniqueAssessments,
      averageScore: Math.round(averageScore),
      totalQuestions,
      totalCorrect
    };
  }, [filteredAttempts]);

  // Análise por aluno
  const studentAnalysis = useMemo(() => {
    const analysis = new Map<string, {
      student: Student;
      totalAttempts: number;
      averageScore: number;
      totalTime: number;
      strongAreas: string[];
      weakAreas: string[];
      recentTrend: 'improving' | 'declining' | 'stable';
    }>();

    filteredAttempts.forEach(attempt => {
      const studentId = attempt.student.id;
      if (!analysis.has(studentId)) {
        analysis.set(studentId, {
          student: attempt.student,
          totalAttempts: 0,
          averageScore: 0,
          totalTime: 0,
          strongAreas: [],
          weakAreas: [],
          recentTrend: 'stable'
        });
      }
      
      const studentData = analysis.get(studentId)!;
      studentData.totalAttempts++;
      
      if (attempt.results) {
        const score = attempt.results.scorePercentage;
        studentData.averageScore = 
          (studentData.averageScore * (studentData.totalAttempts - 1) + score) / 
          studentData.totalAttempts;
      }
      
      // Calcular tempo gasto
      const startTime = new Date(attempt.startedAt).getTime();
      const endTime = new Date(attempt.submittedAt).getTime();
      studentData.totalTime += (endTime - startTime);
    });

    return Array.from(analysis.values())
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [filteredAttempts]);

  // Análise por questão
  const questionAnalysis = useMemo(() => {
    console.log('TutorAnalytics - Analyzing questions from attempts:', filteredAttempts.length);
    const analysis = new Map<string, {
      questionId: string;
      questionText: string;
      totalAttempts: number;
      correctCount: number;
      errorRate: number;
      avgTimeSpent: number;
      commonWrongAnswers: Map<string, number>;
    }>();

    filteredAttempts.forEach(attempt => {
      console.log('TutorAnalytics - Processing attempt:', {
        attemptId: attempt.id,
        student: attempt.student.name,
        answersCount: attempt.answers?.length || 0,
        results: attempt.results
      });
      
      attempt.answers?.forEach(answer => {
        const questionId = answer.questionId;
        if (!questionId) return;
        
        console.log('Processing answer:', {
          questionId: answer.questionId,
          isCorrect: answer.isCorrect,
          type: typeof answer.isCorrect,
          questionText: answer.question?.text?.substring(0, 30)
        });
        
        if (!analysis.has(questionId)) {
          analysis.set(questionId, {
            questionId,
            questionText: answer.question?.text || `Questão ${questionId.substring(0, 8)}...`,
            totalAttempts: 0,
            correctCount: 0,
            errorRate: 0,
            avgTimeSpent: 0,
            commonWrongAnswers: new Map()
          });
        }
        
        const questionData = analysis.get(questionId)!;
        questionData.totalAttempts++;
        
        // Verificar se a resposta está correta
        const isCorrect = answer.isCorrect === true;
        
        console.log(`Question ${questionId} - Answer is correct: ${isCorrect}`);
        
        if (isCorrect) {
          questionData.correctCount++;
        } else if (answer.selectedOptionId) {
          // Rastrear respostas erradas comuns
          const count = questionData.commonWrongAnswers.get(answer.selectedOptionId) || 0;
          questionData.commonWrongAnswers.set(answer.selectedOptionId, count + 1);
        }
      });
    });

    // Calcular taxa de erro
    analysis.forEach(questionData => {
      if (questionData.totalAttempts > 0) {
        questionData.errorRate = 
          ((questionData.totalAttempts - questionData.correctCount) / questionData.totalAttempts) * 100;
      }
    });

    console.log('TutorAnalytics - Total questions analyzed:', analysis.size);
    
    // Log detalhado de cada questão
    analysis.forEach((q, id) => {
      console.log(`Question ${id}:`, {
        text: q.questionText.substring(0, 30),
        totalAttempts: q.totalAttempts,
        correctCount: q.correctCount,
        errorRate: q.errorRate
      });
    });
    
    return Array.from(analysis.values())
      .filter(q => q.totalAttempts > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 10); // Top 10 questões com mais erros
  }, [filteredAttempts]);

  // Identificar alunos em risco
  const studentsAtRisk = useMemo(() => {
    return studentAnalysis
      .filter(student => 
        student.averageScore < 60 || 
        student.recentTrend === 'declining'
      )
      .slice(0, 5);
  }, [studentAnalysis]);

  // Padrões de erro
  const errorPatterns = useMemo(() => {
    const patterns: Array<{
      type: string;
      description: string;
      affectedStudents: number;
      severity: 'high' | 'medium' | 'low';
    }> = [];

    // Padrão 1: Questões que muitos erram
    const highErrorQuestions = questionAnalysis.filter(q => q.errorRate > 70);
    if (highErrorQuestions.length > 0) {
      patterns.push({
        type: 'high_error_questions',
        description: `${highErrorQuestions.length} questões com taxa de erro acima de 70%`,
        affectedStudents: overallMetrics.uniqueStudents,
        severity: 'high'
      });
    }

    // Padrão 2: Alunos rushando (tempo muito baixo)
    const rushingStudents = studentAnalysis.filter(s => {
      const avgTimePerAttempt = s.totalTime / s.totalAttempts / 60000; // em minutos
      return avgTimePerAttempt < 5 && s.averageScore < 70;
    });
    if (rushingStudents.length > 0) {
      patterns.push({
        type: 'rushing_students',
        description: `${rushingStudents.length} alunos completando avaliações muito rapidamente`,
        affectedStudents: rushingStudents.length,
        severity: 'medium'
      });
    }

    return patterns;
  }, [questionAnalysis, studentAnalysis, overallMetrics]);

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={selectedView === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('overview')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Visão Geral
            </Button>
            <Button
              variant={selectedView === 'students' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('students')}
            >
              <Users className="w-4 h-4 mr-2" />
              Por Aluno
            </Button>
            <Button
              variant={selectedView === 'questions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('questions')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Por Questão
            </Button>
            <Button
              variant={selectedView === 'patterns' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('patterns')}
            >
              <Brain className="w-4 h-4 mr-2" />
              Padrões
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="all">Todo período</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Visão Geral */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                    <p className="text-2xl font-bold">{overallMetrics.averageScore}%</p>
                  </div>
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <Progress value={overallMetrics.averageScore} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                    <p className="text-2xl font-bold">{overallMetrics.uniqueStudents}</p>
                  </div>
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Tentativas</p>
                    <p className="text-2xl font-bold">{overallMetrics.totalAttempts}</p>
                  </div>
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Questões Respondidas</p>
                    <p className="text-2xl font-bold">{overallMetrics.totalQuestions}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alunos em risco */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Alunos que Precisam de Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentsAtRisk.map(student => (
                  <div key={student.student.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{student.student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Média: <span className={student.averageScore < 50 ? "text-red-400" : "text-yellow-400"}>{Math.round(student.averageScore)}%</span> • {student.totalAttempts} tentativas
                        </p>
                      </div>
                    </div>
                    <Badge variant={student.recentTrend === 'declining' ? 'destructive' : 'secondary'}>
                      {student.recentTrend === 'declining' ? 'Piorando' : 'Baixo desempenho'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Questões problemáticas */}
          <Card>
            <CardHeader>
              <CardTitle>Questões com Maior Taxa de Erro</CardTitle>
            </CardHeader>
            <CardContent>
              {questionAnalysis.length > 0 ? (
                <div className="space-y-3">
                  {questionAnalysis.slice(0, 5).map(question => (
                    <div key={question.questionId} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium flex-1 mr-4">
                          {question.questionText.substring(0, 100)}
                          {question.questionText.length > 100 ? '...' : ''}
                        </p>
                        <Badge 
                          variant={question.errorRate > 70 ? "destructive" : question.errorRate > 40 ? "secondary" : "default"}
                          className={question.errorRate > 70 ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}
                        >
                          {Math.round(question.errorRate)}% erro
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{question.totalAttempts} tentativas</span>
                        <span className="text-green-600">{question.correctCount} acertos</span>
                        <span className="text-red-600">{question.totalAttempts - question.correctCount} erros</span>
                      </div>
                      <Progress 
                        value={100 - question.errorRate} 
                        className="h-2"
                        style={{
                          '--progress-background': question.errorRate > 70 ? '#dc2626' : question.errorRate > 50 ? '#f59e0b' : '#10b981'
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="w-10 h-10 mx-auto mb-3" />
                  <p>Nenhuma questão com erros encontrada ainda.</p>
                  <p className="text-sm mt-1">As questões aparecerão aqui após os alunos responderem aos quizzes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Análise por Aluno */}
      {selectedView === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de alunos */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Alunos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {studentAnalysis.map(student => (
                  <button
                    key={student.student.id}
                    onClick={() => setSelectedStudent(student.student.id)}
                    className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                      selectedStudent === student.student.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.totalAttempts} avaliações
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Math.round(student.averageScore)}%</p>
                        <Badge 
                          variant={
                            student.recentTrend === 'improving' ? 'default' :
                            student.recentTrend === 'declining' ? 'destructive' : 
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {student.recentTrend === 'improving' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {student.recentTrend === 'declining' && <TrendingDown className="w-3 h-3 mr-1" />}
                          {student.recentTrend}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do aluno selecionado */}
          {selectedStudent && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Análise Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Detalhes do desempenho do aluno selecionado aparecerão aqui...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Análise por Questão */}
      {selectedView === 'questions' && (
        <Card>
          <CardHeader>
            <CardTitle>Análise de Questões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questionAnalysis.map(question => (
                <div key={question.questionId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="font-medium flex-1">{question.questionText}</p>
                    <Badge variant={question.errorRate > 70 ? 'destructive' : 'secondary'}>
                      {Math.round(question.errorRate)}% erro
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total de respostas</p>
                      <p className="font-medium">{question.totalAttempts}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Respostas corretas</p>
                      <p className="font-medium text-green-600">{question.correctCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Respostas erradas</p>
                      <p className="font-medium text-red-600">
                        {question.totalAttempts - question.correctCount}
                      </p>
                    </div>
                  </div>

                  {question.commonWrongAnswers.size > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Respostas erradas mais comuns:</p>
                      <div className="space-y-1">
                        {Array.from(question.commonWrongAnswers.entries())
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([optionId, count]) => (
                            <div key={optionId} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Opção {optionId}</span>
                              <span className="font-medium">{count} vezes</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Padrões e Insights */}
      {selectedView === 'patterns' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Padrões Identificados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorPatterns.map((pattern, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <div className={`p-2 rounded-full ${
                      pattern.severity === 'high' ? 'bg-red-100' :
                      pattern.severity === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        pattern.severity === 'high' ? 'text-red-600' :
                        pattern.severity === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{pattern.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Afeta {pattern.affectedStudents} aluno{pattern.affectedStudents !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={
                      pattern.severity === 'high' ? 'destructive' :
                      pattern.severity === 'medium' ? 'secondary' :
                      'default'
                    }>
                      {pattern.severity === 'high' ? 'Alta' :
                       pattern.severity === 'medium' ? 'Média' : 'Baixa'} prioridade
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questionAnalysis.some(q => q.errorRate > 70) && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">Revisar questões com alta taxa de erro</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {questionAnalysis.filter(q => q.errorRate > 70).length} questão(s) com mais de 70% de erro. 
                      Considere revisar o enunciado ou as opções de resposta para maior clareza.
                    </p>
                    <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                      {questionAnalysis.filter(q => q.errorRate > 70).slice(0, 3).map(q => (
                        <li key={q.questionId}>
                          "{q.questionText.substring(0, 40)}..." - {Math.round(q.errorRate)}% de erro
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {studentsAtRisk.length > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="font-medium text-orange-900">Acompanhamento individual necessário</p>
                    <p className="text-sm text-orange-700 mt-1">
                      {studentsAtRisk.length} aluno{studentsAtRisk.length !== 1 ? 's' : ''} 
                      {studentsAtRisk.length !== 1 ? 'estão' : 'está'} com desempenho abaixo do esperado. 
                      Considere sessões de revisão ou material de apoio adicional.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
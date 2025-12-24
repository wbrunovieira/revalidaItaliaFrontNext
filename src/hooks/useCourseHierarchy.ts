// src/hooks/useCourseHierarchy.ts
// Hook compartilhado para formulários admin que precisam de cursos → módulos → aulas
// Implementa lazy loading (carrega sob demanda) e retry automático

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// ============ Types ============

export interface Translation {
  locale: string;
  title: string;
  description: string;
}

export interface CourseItem {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}

export interface ModuleItem {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

export interface LessonItem {
  id: string;
  slug: string;
  order: number;
  imageUrl?: string;
  translations: Translation[];
  // Interactive Lessons fields
  type?: 'STANDARD' | 'ENVIRONMENT_3D';
  hasAudios?: boolean;
  hasAnimations?: boolean;
  environment3dId?: string | null;
}

interface UseCourseHierarchyOptions {
  // Se true, busca cursos automaticamente ao montar
  autoFetchCourses?: boolean;
  // Se true, busca aulas quando módulo é selecionado (alguns forms não precisam)
  fetchLessons?: boolean;
  // Callback quando ocorre erro
  onError?: (error: Error, context: string) => void;
}

interface UseCourseHierarchyReturn {
  // Dados
  courses: CourseItem[];
  modules: ModuleItem[];
  lessons: LessonItem[];

  // IDs selecionados
  selectedCourseId: string;
  selectedModuleId: string;
  selectedLessonId: string;

  // Objetos selecionados (derivados)
  selectedCourse: CourseItem | undefined;
  selectedModule: ModuleItem | undefined;
  selectedLesson: LessonItem | undefined;

  // Loading states
  loadingCourses: boolean;
  loadingModules: boolean;
  loadingLessons: boolean;

  // Error states
  errorCourses: string | null;
  errorModules: string | null;
  errorLessons: string | null;

  // Actions
  selectCourse: (courseId: string) => void;
  selectModule: (moduleId: string) => void;
  selectLesson: (lessonId: string) => void;
  refetchCourses: () => Promise<void>;
  reset: () => void;
}

// ============ Helper: Fetch com retry automático ============

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      // Erros 4xx não fazem retry (são erros de cliente)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      // Delay progressivo: 1s, 2s, 3s
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

// ============ Hook Principal ============

export function useCourseHierarchy(
  options: UseCourseHierarchyOptions = {}
): UseCourseHierarchyReturn {
  const {
    autoFetchCourses = true,
    fetchLessons = true,
    onError,
  } = options;

  const { toast } = useToast();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // ============ States ============

  // Dados
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);

  // Selecionados
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  // Loading
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(false);

  // Errors
  const [errorCourses, setErrorCourses] = useState<string | null>(null);
  const [errorModules, setErrorModules] = useState<string | null>(null);
  const [errorLessons, setErrorLessons] = useState<string | null>(null);

  // ============ Error Handler ============

  const handleError = useCallback((error: unknown, context: string) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[useCourseHierarchy] ${context}:`, error);

    if (onError && error instanceof Error) {
      onError(error, context);
    }

    return errorMessage;
  }, [onError]);

  // ============ Fetch Functions ============

  // Buscar cursos (chamado no mount ou manualmente)
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    setErrorCourses(null);

    try {
      const response = await fetchWithRetry(`${apiUrl}/api/v1/courses`);

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const data: CourseItem[] = await response.json();
      setCourses(data);
    } catch (error) {
      const errorMsg = handleError(error, 'Fetch courses');
      setErrorCourses(errorMsg);
      toast({
        title: 'Erro ao carregar cursos',
        description: 'Tente novamente em alguns segundos',
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [apiUrl, handleError, toast]);

  // Buscar módulos de um curso específico
  const fetchModulesForCourse = useCallback(async (courseId: string) => {
    if (!courseId) return;

    setLoadingModules(true);
    setErrorModules(null);
    setModules([]);

    try {
      const response = await fetchWithRetry(
        `${apiUrl}/api/v1/courses/${courseId}/modules`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.status}`);
      }

      const data: ModuleItem[] = await response.json();
      setModules(data);
    } catch (error) {
      const errorMsg = handleError(error, 'Fetch modules');
      setErrorModules(errorMsg);
      toast({
        title: 'Erro ao carregar módulos',
        description: 'Tente novamente em alguns segundos',
        variant: 'destructive',
      });
    } finally {
      setLoadingModules(false);
    }
  }, [apiUrl, handleError, toast]);

  // Buscar aulas de um módulo específico
  const fetchLessonsForModule = useCallback(async (courseId: string, moduleId: string) => {
    if (!courseId || !moduleId || !fetchLessons) return;

    setLoadingLessons(true);
    setErrorLessons(null);
    setLessons([]);

    try {
      const response = await fetchWithRetry(
        `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons?limit=100`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lessons: ${response.status}`);
      }

      const data = await response.json();
      setLessons(data.lessons || []);
    } catch (error) {
      const errorMsg = handleError(error, 'Fetch lessons');
      setErrorLessons(errorMsg);
      toast({
        title: 'Erro ao carregar aulas',
        description: 'Tente novamente em alguns segundos',
        variant: 'destructive',
      });
    } finally {
      setLoadingLessons(false);
    }
  }, [apiUrl, fetchLessons, handleError, toast]);

  // ============ Selection Handlers ============

  // Selecionar curso → busca módulos automaticamente
  const selectCourse = useCallback((courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId('');
    setSelectedLessonId('');
    setModules([]);
    setLessons([]);

    if (courseId) {
      fetchModulesForCourse(courseId);
    }
  }, [fetchModulesForCourse]);

  // Selecionar módulo → busca aulas automaticamente (se habilitado)
  const selectModule = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId('');
    setLessons([]);

    if (moduleId && selectedCourseId && fetchLessons) {
      fetchLessonsForModule(selectedCourseId, moduleId);
    }
  }, [selectedCourseId, fetchLessons, fetchLessonsForModule]);

  // Selecionar aula
  const selectLesson = useCallback((lessonId: string) => {
    setSelectedLessonId(lessonId);
  }, []);

  // Reset tudo
  const reset = useCallback(() => {
    setSelectedCourseId('');
    setSelectedModuleId('');
    setSelectedLessonId('');
    setModules([]);
    setLessons([]);
    setErrorCourses(null);
    setErrorModules(null);
    setErrorLessons(null);
  }, []);

  // ============ Effects ============

  // Buscar cursos automaticamente no mount
  useEffect(() => {
    if (autoFetchCourses) {
      fetchCourses();
    }
  }, [autoFetchCourses, fetchCourses]);

  // ============ Derived Values ============

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const selectedLesson = lessons.find(l => l.id === selectedLessonId);

  // ============ Return ============

  return {
    // Dados
    courses,
    modules,
    lessons,

    // IDs selecionados
    selectedCourseId,
    selectedModuleId,
    selectedLessonId,

    // Objetos selecionados
    selectedCourse,
    selectedModule,
    selectedLesson,

    // Loading states
    loadingCourses,
    loadingModules,
    loadingLessons,

    // Error states
    errorCourses,
    errorModules,
    errorLessons,

    // Actions
    selectCourse,
    selectModule,
    selectLesson,
    refetchCourses: fetchCourses,
    reset,
  };
}

// ============ Helper Hook: Get translation by locale ============

export function getTranslationByLocale(
  translations: Translation[] | undefined,
  locale: string
): Translation | undefined {
  if (!translations || translations.length === 0) return undefined;
  return translations.find(t => t.locale === locale) || translations[0];
}

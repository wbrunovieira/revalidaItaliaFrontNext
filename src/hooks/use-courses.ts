import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/auth-utils';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface CourseProgress {
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  moduleCount: number;
  translations?: Translation[];
  progress?: CourseProgress;
}

/**
 * Hook customizado para buscar cursos com progresso
 * Usa TanStack Query para cache automático e compartilhamento entre componentes
 */
export function useCourses() {
  const token = getCookie('token');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  return useQuery<Course[]>({
    queryKey: ['courses', 'progress'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${apiUrl}/api/v1/courses-progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      return response.json();
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados fresh
    gcTime: 10 * 60 * 1000, // 10 minutos - mantém em cache
    refetchOnMount: false, // Não refetch se já tem dados fresh
    refetchOnWindowFocus: false, // Não refetch ao focar janela
  });
}

/**
 * Hook para buscar sugestões de cursos baseado em query
 * Usa os dados cacheados do hook useCourses
 */
export function useCourseSuggestions(query: string, limit: number = 5) {
  const { data: courses = [], isLoading } = useCourses();
  
  const suggestions = query.trim() ? 
    courses
      .filter(course => {
        const searchLower = query.toLowerCase();
        
        // Buscar em todas as traduções
        const matchInTranslations = course.translations?.some(trans => 
          trans.title.toLowerCase().includes(searchLower) ||
          trans.description.toLowerCase().includes(searchLower)
        );
        
        // Buscar no slug
        const matchInSlug = course.slug.toLowerCase().includes(searchLower);
        
        return matchInTranslations || matchInSlug;
      })
      .slice(0, limit)
      .map(course => {
        // Pegar a primeira tradução disponível ou título do slug
        const title = course.translations?.[0]?.title || course.slug;
        const description = course.translations?.[0]?.description || '';
        
        return {
          id: course.id,
          slug: course.slug,
          title,
          description,
          moduleCount: course.moduleCount,
          progress: course.progress?.percentage || 0,
        };
      })
    : [];
  
  return {
    suggestions,
    isLoading,
    isEmpty: suggestions.length === 0,
  };
}
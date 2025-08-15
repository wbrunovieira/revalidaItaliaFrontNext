'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Play, 
  Clock, 
  BookOpen, 
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useLessonAccess } from '@/hooks/useLessonAccess';

interface VideoProgress {
  currentTime: number;
  duration: number;
  percentage: number;
}

interface ContinueLearningData {
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  moduleTitle: string;
  lessonImageUrl: string;
  videoProgress: VideoProgress;
  lessonUrl: string;
  lastUpdatedAt: string;
}

interface ContinueLearningResponse {
  hasProgress: boolean;
  lastAccessed?: ContinueLearningData;
}

interface ValidationResult {
  isValid: boolean;
  shouldClearLocalStorage?: boolean;
}

export default function ContinueLearning() {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContinueLearningResponse | null>(null);
  const [imageError, setImageError] = useState(false);
  const [validationAttempts, setValidationAttempts] = useState(0);
  const { getLastLessonAccess, clearLessonAccess } = useLessonAccess();

  // Valida se a lição ainda existe no backend
  const validateLessonExists = useCallback(async (lessonId: string): Promise<ValidationResult> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1] || '';
      
      if (!token) {
        console.warn('[ContinueLearning] Cannot validate lesson without token');
        return { isValid: false, shouldClearLocalStorage: false };
      }
      
      // Tenta buscar a lição para verificar se ainda existe
      const response = await fetch(`${apiUrl}/api/v1/lessons/${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 404) {
        console.log(`[ContinueLearning] Lesson ${lessonId} not found (404) - will clear localStorage`);
        return { isValid: false, shouldClearLocalStorage: true };
      }
      
      if (response.status === 403) {
        console.log(`[ContinueLearning] No access to lesson ${lessonId} (403) - will clear localStorage`);
        return { isValid: false, shouldClearLocalStorage: true };
      }
      
      if (response.ok) {
        console.log(`[ContinueLearning] Lesson ${lessonId} validated successfully`);
        return { isValid: true };
      }
      
      // Para outros erros (500, etc), não limpa o localStorage imediatamente
      console.warn(`[ContinueLearning] Could not validate lesson ${lessonId}, status: ${response.status}`);
      return { isValid: false, shouldClearLocalStorage: false };
      
    } catch (error) {
      console.error('[ContinueLearning] Error validating lesson:', error);
      // Em caso de erro de rede, não limpa o localStorage
      return { isValid: false, shouldClearLocalStorage: false };
    }
  }, []);

  const checkLocalStorageForLessonAccess = useCallback(async () => {
    console.log('[ContinueLearning] Checking localStorage for lesson access...');
    const lastAccess = getLastLessonAccess();
    
    if (lastAccess) {
      console.log('[ContinueLearning] Found lesson access in localStorage:', {
        lessonId: lastAccess.lessonId,
        lessonTitle: lastAccess.lessonTitle,
        hasVideo: lastAccess.hasVideo,
        accessedAt: lastAccess.accessedAt,
        progress: lastAccess.progress
      });
      
      // Valida se a lição ainda existe antes de usar
      const validation = await validateLessonExists(lastAccess.lessonId);
      
      if (validation.shouldClearLocalStorage) {
        console.log('[ContinueLearning] Clearing invalid lesson from localStorage');
        clearLessonAccess();
        setData({ hasProgress: false });
        return;
      }
      
      // Se não conseguiu validar mas não deve limpar (erro de rede, etc)
      // Ainda mostra a lição mas com retry logic
      if (!validation.isValid && validationAttempts < 3) {
        setValidationAttempts(prev => prev + 1);
        console.log(`[ContinueLearning] Could not validate, attempt ${validationAttempts + 1}/3`);
      }
      
      // Convert localStorage data to ContinueLearning format
      const localData: ContinueLearningResponse = {
        hasProgress: true,
        lastAccessed: {
          lessonId: lastAccess.lessonId,
          lessonTitle: lastAccess.lessonTitle,
          courseTitle: lastAccess.courseTitle,
          moduleTitle: lastAccess.moduleTitle,
          lessonImageUrl: lastAccess.lessonImageUrl || '',
          videoProgress: lastAccess.progress,
          lessonUrl: lastAccess.lessonUrl,
          lastUpdatedAt: lastAccess.accessedAt,
        },
      };
      
      // Se após 3 tentativas não conseguiu validar e não há token, limpa
      if (!validation.isValid && validationAttempts >= 2) {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
        
        if (token) {
          // Com token mas não validou após 3 tentativas - provavelmente lição deletada
          console.log('[ContinueLearning] Failed to validate after 3 attempts, clearing localStorage');
          clearLessonAccess();
          setData({ hasProgress: false });
          return;
        }
      }
      
      console.log('[ContinueLearning] Setting data from localStorage:', localData);
      setData(localData);
    } else {
      // No data from backend or localStorage
      console.log('[ContinueLearning] No data found in localStorage');
      setData({ hasProgress: false });
    }
  }, [getLastLessonAccess, clearLessonAccess, validateLessonExists, validationAttempts]);

  const fetchContinueLearning = useCallback(async () => {
    console.log('[ContinueLearning] ============ Starting fetchContinueLearning ============');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1] || '';
      
      console.log('[ContinueLearning] Token found:', !!token);
      
      if (!token) {
        console.warn('[ContinueLearning] No token found - checking localStorage');
        // Even without token, check localStorage
        await checkLocalStorageForLessonAccess();
        setLoading(false);
        return;
      }
      
      console.log('[ContinueLearning] Fetching from API:', `${apiUrl}/api/v1/users/me/continue-learning`);
      const response = await fetch(`${apiUrl}/api/v1/users/me/continue-learning`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[ContinueLearning] API Response status:', response.status);

      if (!response.ok) {
        console.warn('[ContinueLearning] API returned error status:', response.status);
        if (response.status === 404) {
          // No video progress found - check localStorage for lesson access
          console.log('[ContinueLearning] No video progress in backend (404), checking localStorage...');
          const localAccess = getLastLessonAccess();
          console.log('[ContinueLearning] Local access data:', localAccess);
          if (localAccess) {
            await checkLocalStorageForLessonAccess();
          } else {
            console.log('[ContinueLearning] No local data either - showing no progress');
            setData({ hasProgress: false });
          }
        } else {
          throw new Error(`Failed to fetch continue learning: ${response.status}`);
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      console.log('[ContinueLearning] API Response:', result);
      
      // Always check localStorage to compare timestamps
      const localAccess = getLastLessonAccess();
      
      if (result.hasProgress && localAccess) {
        // Both sources have data - compare timestamps
        const backendTime = new Date(result.lastAccessed.lastUpdatedAt).getTime();
        const localTime = new Date(localAccess.accessedAt).getTime();
        
        console.log('[ContinueLearning] Comparing timestamps:', {
          backend: {
            time: new Date(backendTime).toISOString(),
            title: result.lastAccessed.lessonTitle,
            hasVideo: true
          },
          local: {
            time: new Date(localTime).toISOString(),
            title: localAccess.lessonTitle,
            hasVideo: localAccess.hasVideo
          },
          useLocal: localTime > backendTime
        });
        
        if (localTime > backendTime) {
          // Local is more recent - use it
          console.log('[ContinueLearning] Using localStorage (more recent)');
          await checkLocalStorageForLessonAccess();
        } else {
          // Backend is more recent
          console.log('[ContinueLearning] Using backend data (more recent)');
          setData(result);
        }
      } else if (result.hasProgress) {
        // Only backend has data
        console.log('[ContinueLearning] Using backend data (no local data)');
        setData(result);
      } else if (localAccess) {
        // Only localStorage has data
        console.log('[ContinueLearning] Using localStorage (no backend data)');
        await checkLocalStorageForLessonAccess();
      } else {
        // No data from either source
        console.log('[ContinueLearning] No progress data available');
        setData({ hasProgress: false });
      }
    } catch (error) {
      console.error('[ContinueLearning] Error fetching data:', error);
      // On error, try localStorage as fallback
      await checkLocalStorageForLessonAccess();
    } finally {
      setLoading(false);
    }
  }, [getLastLessonAccess, checkLocalStorageForLessonAccess]);

  useEffect(() => {
    fetchContinueLearning();
  }, [fetchContinueLearning]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatLastUpdated = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return t('continueWatching.minutesAgo', { minutes: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return t('continueWatching.hoursAgo', { hours });
    }
    return t('continueWatching.daysAgo', { days: Math.floor(diffInMinutes / 1440) });
  };

  const handleContinue = () => {
    if (data?.lastAccessed?.lessonUrl) {
      router.push(data.lastAccessed.lessonUrl);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-primary-dark via-primary to-primary-dark rounded-2xl p-8 mb-8 flex items-center justify-center">
        <Loader2 className="animate-spin text-secondary" size={32} />
      </div>
    );
  }

  console.log('[ContinueLearning] Final render state:', {
    hasData: !!data,
    hasProgress: data?.hasProgress,
    hasLastAccessed: !!data?.lastAccessed,
    data: data
  });

  if (!data?.hasProgress || !data.lastAccessed) {
    console.log('[ContinueLearning] Not rendering - no progress or lastAccessed data');
    return null;
  }

  const { lastAccessed } = data;
  const hasVideo = lastAccessed.videoProgress.duration > 0;
  const remainingTime = hasVideo ? lastAccessed.videoProgress.duration - lastAccessed.videoProgress.currentTime : 0;
  
  // Fix image URL if it has example.com prefix
  const fixedImageUrl = lastAccessed.lessonImageUrl?.replace('https://example.com', '') || '';

  return (
    <div className="w-full bg-gradient-to-br from-primary-dark via-primary to-primary-dark rounded-2xl p-6 md:p-8 mb-8 relative overflow-visible group hover:shadow-2xl transition-all duration-500">
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Thumbnail */}
        <div className="relative w-full md:w-48 h-32 md:h-36 rounded-xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
          {!imageError && 
           fixedImageUrl && 
           (fixedImageUrl.startsWith('http') || fixedImageUrl.startsWith('/')) ? (
            <Image
              src={fixedImageUrl}
              alt={lastAccessed.lessonTitle}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
              <BookOpen className="text-white/50" size={48} />
            </div>
          )}
          
          {/* Progress Overlay - only show for videos */}
          {hasVideo && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div 
                className="h-full bg-gradient-to-r from-secondary to-accent"
                style={{ width: `${lastAccessed.videoProgress.percentage}%` }}
              />
            </div>
          )}
          
          {/* Icon Overlay - Play for video, BookOpen for other content */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              {hasVideo ? (
                <Play className="text-primary ml-1" size={24} fill="currentColor" />
              ) : (
                <BookOpen className="text-primary" size={24} />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 text-secondary mb-2 justify-center md:justify-start">
            <Sparkles size={16} />
            <span className="text-sm font-medium">{t('continueWatching.title')}</span>
          </div>
          
          <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
            {lastAccessed.lessonTitle}
          </h3>
          
          <p className="text-white/70 text-sm mb-4 flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="font-medium">{lastAccessed.courseTitle}</span>
            <span>•</span>
            <span>{lastAccessed.moduleTitle}</span>
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-white/60">
            {hasVideo && (
              <>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{t('continueWatching.timeRemaining', { time: formatTime(remainingTime) })}</span>
                </div>
                <span className="hidden md:block">•</span>
                <span>{Math.round(lastAccessed.videoProgress.percentage)}% {t('continueWatching.completed')}</span>
                <span className="hidden md:block">•</span>
              </>
            )}
            <span className="text-xs">{formatLastUpdated(lastAccessed.lastUpdatedAt)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleContinue}
          className="w-full md:w-auto px-6 py-3 bg-secondary text-primary font-semibold rounded-xl 
                     hover:bg-accent hover:shadow-lg transform hover:scale-105 transition-all duration-300 
                     flex items-center justify-center gap-2 group/btn"
        >
          <span>{t('continueWatching.continueButton')}</span>
          <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}
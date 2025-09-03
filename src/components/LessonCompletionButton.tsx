'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LessonCompletionButtonProps {
  lessonId: string;
  courseId?: string;
  moduleId?: string;
  videoProgress?: number; // 0-100
  hasVideo?: boolean;
  className?: string;
}

export default function LessonCompletionButton({
  lessonId,
  courseId,
  moduleId,
  videoProgress: initialVideoProgress = 0,
  hasVideo = false,
  className,
}: LessonCompletionButtonProps) {
  const t = useTranslations('Lesson');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(initialVideoProgress);

  // Listen for video progress updates
  useEffect(() => {
    const handleVideoProgress = (event: CustomEvent) => {
      if (event.detail.lessonId === lessonId) {
        setVideoProgress(event.detail.percentage);
      }
    };

    window.addEventListener('videoProgressUpdate', handleVideoProgress as EventListener);
    
    return () => {
      window.removeEventListener('videoProgressUpdate', handleVideoProgress as EventListener);
    };
  }, [lessonId]);

  // Define handleComplete before it's used in useEffect
  const handleComplete = useCallback(async (completed: boolean = true) => {
    setIsLoading(true);
    
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        toast({
          title: t('error'),
          description: t('notAuthenticated'),
          variant: 'destructive',
        });
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log('[LessonCompletion] Calling API:', {
        url: `${apiUrl}/api/v1/lessons/${lessonId}/complete`,
        completed,
        hasToken: !!token
      });
      
      // Prepare request body - only include completed field if false
      const requestBody = completed ? {} : { completed: false };
      
      const response = await fetch(
        `${apiUrl}/api/v1/lessons/${lessonId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('[LessonCompletion] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[LessonCompletion] Success response:', data);
        setIsCompleted(data.completed);
        
        toast({
          title: data.completed ? t('lessonCompleted') : t('lessonMarkedIncomplete'),
          description: data.completed 
            ? t('lessonCompletedDescription') 
            : t('lessonMarkedIncompleteDescription'),
        });

        // Emit custom event for other components to listen
        window.dispatchEvent(
          new CustomEvent('lessonCompletionChanged', {
            detail: {
              lessonId,
              courseId,
              moduleId,
              completed: data.completed,
              completedAt: data.completedAt,
            },
          })
        );
      } else {
        let errorMessage = 'Failed to update completion status';
        try {
          const errorData = await response.json();
          console.error('[LessonCompletion] Error response:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          console.error('[LessonCompletion] Could not parse error response');
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error updating lesson completion:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('completionError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, courseId, moduleId, t]);

  const handleToggleCompletion = () => {
    handleComplete(!isCompleted);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Completion Status Indicator */}
      {isCompleted && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-sm font-medium text-green-400">
            {t('lessonCompletedStatus')}
          </span>
        </div>
      )}

      {/* Completion Button */}
      <Button
        onClick={handleToggleCompletion}
        disabled={isLoading}
        variant={isCompleted ? 'outline' : 'default'}
        className={cn(
          'w-full transition-all duration-200 font-semibold',
          isCompleted
            ? 'bg-transparent border-gray-600 hover:bg-gray-800 text-gray-400'
            : 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white border-0 shadow-lg'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('updating')}
          </>
        ) : isCompleted ? (
          <>
            <Circle className="mr-2 h-4 w-4" />
            {t('markAsIncomplete')}
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            {t('markAsComplete')}
          </>
        )}
      </Button>

      {/* Progress Hint for Video Lessons */}
      {hasVideo && !isCompleted && videoProgress < 90 && (
        <p className="text-xs text-gray-500 text-center">
          {t('autoCompleteHint', { progress: Math.round(videoProgress) })}
        </p>
      )}
    </div>
  );
}
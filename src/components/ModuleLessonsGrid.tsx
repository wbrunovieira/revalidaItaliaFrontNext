'use client';

import { useState, useEffect } from 'react';
import LessonCard from '@/components/LessonCard';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  slug: string;
  moduleId: string;
  order: number;
  imageUrl?: string | null;
  videoId?: string;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface ModuleLessonsGridProps {
  lessons: Lesson[];
  moduleId: string;
  courseSlug: string;
  moduleSlug: string;
  locale: string;
}

export default function ModuleLessonsGrid({
  lessons,
  moduleId,
  courseSlug,
  moduleSlug,
  locale,
}: ModuleLessonsGridProps) {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          setIsLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Fetch progress for each lesson
        const progressPromises = lessons.map(lesson =>
          fetch(`${apiUrl}/api/v1/progress/lesson/${lesson.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).then(res => res.ok ? res.json() : null)
        );

        const progressResults = await Promise.all(progressPromises);
        
        const completed = new Set<string>();
        progressResults.forEach((progress, index) => {
          if (progress?.completed) {
            completed.add(lessons[index].id);
          }
        });
        
        setCompletedLessons(completed);
      } catch (error) {
        console.error('Error fetching lesson completion status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletionStatus();
  }, [lessons]);

  // Listen for completion changes
  useEffect(() => {
    const handleCompletionChange = (event: CustomEvent) => {
      if (event.detail.moduleId === moduleId) {
        if (event.detail.completed) {
          setCompletedLessons(prev => new Set(prev).add(event.detail.lessonId));
        } else {
          setCompletedLessons(prev => {
            const updated = new Set(prev);
            updated.delete(event.detail.lessonId);
            return updated;
          });
        }
      }
    };

    window.addEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);
    
    return () => {
      window.removeEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);
    };
  }, [moduleId]);

  const sortedLessons = [...lessons].sort(
    (a, b) => a.order - b.order || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedLessons.map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-700 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {sortedLessons.map((lesson, index) => (
        <LessonCard
          key={lesson.id}
          lesson={lesson}
          courseSlug={courseSlug}
          moduleSlug={moduleSlug}
          locale={locale}
          index={index}
          totalLessons={sortedLessons.length}
          isCompleted={completedLessons.has(lesson.id)}
        />
      ))}
    </div>
  );
}
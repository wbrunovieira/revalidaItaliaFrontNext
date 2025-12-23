// src/components/AnimationsSection.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Gamepad2,
  CheckCircle,
  Lock,
  MessageSquareText,
  ListChecks,
  ChevronDown,
} from 'lucide-react';
import type { Animation } from '@/hooks/queries/useLesson';

interface AnimationsSectionProps {
  animations: Animation[];
}

export default function AnimationsSection({
  animations,
}: AnimationsSectionProps) {
  const t = useTranslations('Lesson.animations');

  // Function to scroll to and open the exercises expandable
  const handleOpenExercises = useCallback((animationId?: string) => {
    // Dispatch custom event to open the expandable section
    const event = new CustomEvent('openExercisesExpandable', {
      detail: { animationId },
    });
    window.dispatchEvent(event);

    // Scroll to the exercises section
    const exercisesSection = document.getElementById('exercises-expandable');
    if (exercisesSection) {
      exercisesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Sort animations by order
  const sortedAnimations = useMemo(
    () => [...animations].sort((a, b) => a.order - b.order),
    [animations]
  );

  // Get icon based on animation type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CompleteSentence':
        return <MessageSquareText size={18} className="text-blue-400" />;
      case 'MultipleChoice':
        return <ListChecks size={18} className="text-purple-400" />;
      default:
        return <Gamepad2 size={18} className="text-secondary" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'CompleteSentence':
        return t('types.completeSentence');
      case 'MultipleChoice':
        return t('types.multipleChoice');
      default:
        return type;
    }
  };

  // Get badge color based on type
  const getTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'CompleteSentence':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'MultipleChoice':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-secondary/20 text-secondary border-secondary/30';
    }
  };

  if (!sortedAnimations.length) return null;

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <div className="p-2 bg-secondary/20 rounded-lg">
            <Gamepad2 size={20} className="text-secondary" />
          </div>
          {t('title')}
        </h4>
        <div className="h-0.5 w-16 bg-gradient-to-r from-secondary to-transparent rounded-full ml-11"></div>
        <p className="text-gray-400 text-sm mt-2 ml-11">{t('description')}</p>
      </div>

      <div className="space-y-2">
        {sortedAnimations.map(animation => {
          // Treat undefined as enabled (default behavior)
          const isDisabled = animation.enabled === false;

          return (
            <div
              key={animation.id}
              className={`rounded-lg border transition-all ${
                isDisabled
                  ? 'bg-primary/20 border-gray-700/50 opacity-60'
                  : 'bg-primary/30 border-secondary/20 hover:border-secondary/40'
              }`}
            >
              {isDisabled ? (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center">
                    <Lock size={20} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${getTypeBadgeColor(
                          animation.type
                        )}`}
                      >
                        {getTypeLabel(animation.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {t('disabled')}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {t('exercise', { number: animation.order })}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenExercises(animation.id)}
                  className="w-full flex items-center gap-3 p-4 group text-left"
                >
                  <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                    {getTypeIcon(animation.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${getTypeBadgeColor(
                          animation.type
                        )}`}
                      >
                        {getTypeLabel(animation.type)}
                      </span>
                      {animation.totalQuestions && (
                        <span className="text-xs text-gray-500">
                          {t('questions', { count: animation.totalQuestions })}
                        </span>
                      )}
                    </div>
                    <p className="text-white text-sm font-medium group-hover:text-secondary transition-colors">
                      {t('exercise', { number: animation.order })}
                    </p>
                  </div>
                  <ChevronDown
                    size={20}
                    className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <CheckCircle size={12} className="text-secondary" />
          <span>
            {sortedAnimations.filter(a => a.enabled !== false).length} {t('available')}
          </span>
        </div>
        {sortedAnimations.some(a => a.enabled === false) && (
          <div className="flex items-center gap-1">
            <Lock size={12} className="text-gray-500" />
            <span>
              {sortedAnimations.filter(a => a.enabled === false).length} {t('locked')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

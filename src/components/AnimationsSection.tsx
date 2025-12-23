// src/components/AnimationsSection.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Gamepad2,
  Lock,
  MessageSquareText,
  ListChecks,
  ChevronDown,
} from 'lucide-react';
import type { Animation, AnimationType } from '@/hooks/queries/useLesson';

interface AnimationsSectionProps {
  animations: Animation[];
}

interface TypeGroup {
  type: AnimationType;
  animations: Animation[];
  totalQuestions: number;
  availableCount: number;
  lockedCount: number;
  isLocked: boolean;
}

export default function AnimationsSection({
  animations,
}: AnimationsSectionProps) {
  const t = useTranslations('Lesson.animations');
  const tExercises = useTranslations('Lesson.exercises');

  // Function to scroll to and open the exercises expandable
  const handleOpenExercises = useCallback(() => {
    // Dispatch custom event to open the expandable section
    const event = new CustomEvent('openExercisesExpandable', {
      detail: {},
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

  // Group animations by type
  const typeGroups = useMemo((): TypeGroup[] => {
    const groups: Record<string, Animation[]> = {};

    sortedAnimations.forEach(anim => {
      if (!groups[anim.type]) {
        groups[anim.type] = [];
      }
      groups[anim.type].push(anim);
    });

    return Object.entries(groups).map(([type, anims]) => {
      const availableCount = anims.filter(a => a.enabled !== false).length;
      const lockedCount = anims.filter(a => a.enabled === false).length;
      const totalQuestions = anims.reduce((sum, a) => {
        // MultipleChoice: each animation is 1 question
        if (a.type === 'MultipleChoice') {
          return sum + 1;
        }
        // CompleteSentence: count sentences
        const content = a.content as { sentences?: unknown[] } | undefined;
        return sum + (content?.sentences?.length || 1);
      }, 0);

      return {
        type: type as AnimationType,
        animations: anims,
        totalQuestions,
        availableCount,
        lockedCount,
        isLocked: anims.every(a => a.enabled === false),
      };
    });
  }, [sortedAnimations]);

  // Get icon based on animation type
  const getTypeIcon = (type: string, size: number = 20) => {
    switch (type) {
      case 'CompleteSentence':
        return <MessageSquareText size={size} className="text-blue-400" />;
      case 'MultipleChoice':
        return <ListChecks size={size} className="text-purple-400" />;
      default:
        return <Gamepad2 size={size} className="text-secondary" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'CompleteSentence':
        return tExercises('types.completeSentence');
      case 'MultipleChoice':
        return tExercises('types.multipleChoice');
      default:
        return type;
    }
  };

  // Get card color based on type
  const getTypeCardColor = (type: string): string => {
    switch (type) {
      case 'CompleteSentence':
        return 'border-blue-500/30 hover:border-blue-500/50';
      case 'MultipleChoice':
        return 'border-purple-500/30 hover:border-purple-500/50';
      default:
        return 'border-secondary/30 hover:border-secondary/50';
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
        {typeGroups.map(group => (
          <div
            key={group.type}
            className={`rounded-lg border transition-all ${
              group.isLocked
                ? 'bg-primary/20 border-gray-700/50 opacity-60'
                : `bg-primary/30 ${getTypeCardColor(group.type)}`
            }`}
          >
            {group.isLocked ? (
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-gray-700/50 rounded-lg flex items-center justify-center">
                  <Lock size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-400 text-sm font-medium">
                    {getTypeLabel(group.type)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {group.animations.length}{' '}
                    {group.animations.length === 1
                      ? tExercises('exerciseSingular')
                      : tExercises('exercisePlural')}
                    {' • '}
                    {t('locked')}
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenExercises}
                className="w-full flex items-center gap-3 p-4 group text-left"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/15 transition-colors">
                  {getTypeIcon(group.type)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium group-hover:text-secondary transition-colors">
                    {getTypeLabel(group.type)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {group.animations.length}{' '}
                    {group.animations.length === 1
                      ? tExercises('exerciseSingular')
                      : tExercises('exercisePlural')}
                    {' • '}
                    {group.totalQuestions}{' '}
                    {group.totalQuestions === 1
                      ? tExercises('questionSingular')
                      : tExercises('questionPlural')}
                  </p>
                </div>
                <ChevronDown
                  size={20}
                  className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

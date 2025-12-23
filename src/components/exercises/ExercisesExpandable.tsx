// src/components/exercises/ExercisesExpandable.tsx
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Gamepad2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  CheckCircle,
  PlayCircle,
  MessageSquareText,
  ListChecks,
} from 'lucide-react';
import DragWordExercise from './DragWordExercise';
import type { Animation, AnimationType } from '@/hooks/queries/useLesson';

interface ExercisesExpandableProps {
  animations: Animation[];
}

type ExerciseStatus = 'locked' | 'available' | 'completed';

interface ExerciseState {
  animationId: string;
  status: ExerciseStatus;
  score?: number;
}

interface TypeGroup {
  type: AnimationType;
  animations: Animation[];
  totalQuestions: number;
  completedCount: number;
  isLocked: boolean;
  isCompleted: boolean;
}

export default function ExercisesExpandable({
  animations,
}: ExercisesExpandableProps) {
  const t = useTranslations('Lesson.exercises');

  // Expanded state
  const [isExpanded, setIsExpanded] = useState(false);

  // Active type being played
  const [activeType, setActiveType] = useState<AnimationType | null>(null);

  // Current exercise index within the active type
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Exercise states (treat enabled === false as locked, undefined = enabled)
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(() =>
    animations.map(anim => ({
      animationId: anim.id,
      status: anim.enabled === false ? 'locked' : 'available',
    }))
  );

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
      const completedCount = anims.filter(a =>
        exerciseStates.find(e => e.animationId === a.id)?.status === 'completed'
      ).length;

      const isLocked = anims.every(a =>
        exerciseStates.find(e => e.animationId === a.id)?.status === 'locked'
      );

      const totalQuestions = anims.reduce((sum, a) =>
        sum + (a.content?.sentences?.length || 1), 0
      );

      return {
        type: type as AnimationType,
        animations: anims,
        totalQuestions,
        completedCount,
        isLocked,
        isCompleted: completedCount === anims.length && anims.length > 0,
      };
    });
  }, [sortedAnimations, exerciseStates]);

  // Get animations for active type
  const activeTypeAnimations = useMemo(() => {
    if (!activeType) return [];
    return typeGroups.find(g => g.type === activeType)?.animations || [];
  }, [activeType, typeGroups]);

  // Get current animation
  const currentAnimation = useMemo(() => {
    return activeTypeAnimations[currentExerciseIndex];
  }, [activeTypeAnimations, currentExerciseIndex]);

  // Listen for custom event to open the expandable
  useEffect(() => {
    const handleOpenEvent = (event: CustomEvent<{ animationId?: string }>) => {
      setIsExpanded(true);

      // If a specific animation was requested, find its type and start
      if (event.detail?.animationId) {
        const animation = sortedAnimations.find(a => a.id === event.detail.animationId);
        const state = exerciseStates.find(e => e.animationId === event.detail.animationId);

        if (animation && state?.status !== 'locked') {
          setTimeout(() => {
            handleStartType(animation.type);
          }, 350);
        }
      }
    };

    window.addEventListener('openExercisesExpandable', handleOpenEvent as EventListener);

    return () => {
      window.removeEventListener('openExercisesExpandable', handleOpenEvent as EventListener);
    };
  }, [sortedAnimations, exerciseStates]);

  // Count totals
  const totalCompleted = exerciseStates.filter(e => e.status === 'completed').length;
  const totalAvailable = exerciseStates.filter(e => e.status === 'available').length;

  // Handle exercise completion - auto advance to next
  const handleExerciseComplete = useCallback((animationId: string, success: boolean, score: number) => {
    // Mark current as completed
    setExerciseStates(prev =>
      prev.map(e =>
        e.animationId === animationId
          ? { ...e, status: 'completed' as ExerciseStatus, score }
          : e
      )
    );

    // Check if there are more exercises of this type
    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex < activeTypeAnimations.length) {
      // Auto advance to next exercise after a brief delay
      setTimeout(() => {
        setCurrentExerciseIndex(nextIndex);
      }, 500);
    } else {
      // All exercises of this type completed - go back to list
      setTimeout(() => {
        setActiveType(null);
        setCurrentExerciseIndex(0);
      }, 500);
    }
  }, [currentExerciseIndex, activeTypeAnimations.length]);

  // Handle start type
  const handleStartType = useCallback((type: AnimationType) => {
    const group = typeGroups.find(g => g.type === type);
    if (!group || group.isLocked) return;

    // Find the first non-completed exercise
    const firstAvailableIndex = group.animations.findIndex(a => {
      const state = exerciseStates.find(e => e.animationId === a.id);
      return state?.status === 'available';
    });

    setActiveType(type);
    setCurrentExerciseIndex(firstAvailableIndex >= 0 ? firstAvailableIndex : 0);
  }, [typeGroups, exerciseStates]);

  // Get type icon
  const getTypeIcon = (type: AnimationType) => {
    switch (type) {
      case 'CompleteSentence':
        return <MessageSquareText size={24} className="text-blue-400" />;
      case 'MultipleChoice':
        return <ListChecks size={24} className="text-purple-400" />;
      default:
        return <Gamepad2 size={24} className="text-secondary" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: AnimationType): string => {
    switch (type) {
      case 'CompleteSentence':
        return t('types.completeSentence');
      case 'MultipleChoice':
        return t('types.multipleChoice');
      default:
        return type;
    }
  };

  // Get type color
  const getTypeColor = (type: AnimationType): string => {
    switch (type) {
      case 'CompleteSentence':
        return 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/50';
      case 'MultipleChoice':
        return 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50';
      default:
        return 'from-secondary/20 to-secondary/10 border-secondary/30 hover:border-secondary/50';
    }
  };

  if (!sortedAnimations.length) return null;

  return (
    <div
      id="exercises-expandable"
      className="mt-6 border border-gray-700/50 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-primary/30"
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/20 rounded-lg">
            <Gamepad2 size={24} className="text-secondary" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {t('title')}
              {totalCompleted > 0 && (
                <span className="flex items-center gap-1 text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">
                  <Sparkles size={12} />
                  {totalCompleted}/{sortedAnimations.length}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-400">{t('expandToStart')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <span className="text-secondary">{totalAvailable} {t('available')}</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={24} className="text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-gray-700/50">
              {/* Type selector - when no active type */}
              {!activeType && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-3 mt-4"
                >
                  {typeGroups.map(group => (
                    <motion.button
                      key={group.type}
                      onClick={() => handleStartType(group.type)}
                      disabled={group.isLocked}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all bg-gradient-to-r ${
                        group.isLocked
                          ? 'from-gray-800/30 to-gray-800/20 border-gray-700/50 cursor-not-allowed opacity-50'
                          : group.isCompleted
                          ? 'from-green-500/10 to-green-600/5 border-green-500/30 hover:border-green-500/50'
                          : getTypeColor(group.type)
                      }`}
                      whileHover={!group.isLocked ? { scale: 1.01 } : {}}
                      whileTap={!group.isLocked ? { scale: 0.99 } : {}}
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        group.isLocked
                          ? 'bg-gray-700/50'
                          : group.isCompleted
                          ? 'bg-green-500/20'
                          : 'bg-white/10'
                      }`}>
                        {group.isLocked ? (
                          <Lock size={24} className="text-gray-500" />
                        ) : group.isCompleted ? (
                          <CheckCircle size={24} className="text-green-400" />
                        ) : (
                          getTypeIcon(group.type)
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <p className={`text-lg font-semibold ${
                          group.isLocked
                            ? 'text-gray-500'
                            : group.isCompleted
                            ? 'text-green-400'
                            : 'text-white'
                        }`}>
                          {getTypeLabel(group.type)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {group.animations.length} {group.animations.length === 1 ? t('exerciseSingular') : t('exercisePlural')}
                          {' • '}
                          {group.totalQuestions} {group.totalQuestions === 1 ? t('questionSingular') : t('questionPlural')}
                        </p>
                        {group.isCompleted && (
                          <p className="text-xs text-green-400/70 mt-1 flex items-center gap-1">
                            <CheckCircle size={12} />
                            {t('allCompleted')}
                          </p>
                        )}
                      </div>

                      {!group.isLocked && !group.isCompleted && (
                        <div className="flex items-center gap-2">
                          <PlayCircle size={24} className="text-white/70" />
                        </div>
                      )}

                      {group.isCompleted && (
                        <div className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
                          {t('replay')}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Active exercise */}
              {activeType && currentAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-4"
                >
                  {/* Header with progress */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={() => {
                        setActiveType(null);
                        setCurrentExerciseIndex(0);
                      }}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronUp size={18} className="-rotate-90" />
                      <span>{t('backToList')}</span>
                    </button>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">
                        {currentExerciseIndex + 1} / {activeTypeAnimations.length}
                      </span>
                      <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary transition-all duration-300"
                          style={{ width: `${((currentExerciseIndex + 1) / activeTypeAnimations.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Exercise content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentAnimation.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentAnimation.content?.gameType === 'DRAG_WORD' && (
                        <DragWordExercise
                          sentences={currentAnimation.content.sentences}
                          distractors={currentAnimation.content.distractors}
                          onComplete={(success, score) =>
                            handleExerciseComplete(currentAnimation.id, success, score)
                          }
                        />
                      )}

                      {/* Placeholder for other game types */}
                      {currentAnimation.content?.gameType &&
                       currentAnimation.content.gameType !== 'DRAG_WORD' && (
                        <div className="text-center py-12 text-gray-400">
                          <Gamepad2 size={48} className="mx-auto mb-4 opacity-50" />
                          <p>{t('comingSoon')}</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

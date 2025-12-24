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
  GripHorizontal,
  ListOrdered,
  Type,
  Layers,
  CircleHelp,
} from 'lucide-react';
import DragWordExercise from './DragWordExercise';
import ReorderWordsExercise from './ReorderWordsExercise';
import TypeCompletionExercise from './TypeCompletionExercise';
import MultipleBlanksExercise from './MultipleBlanksExercise';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import type { Animation, GameType, MultipleChoiceContent } from '@/hooks/queries/useLesson';
import { useCompleteAnimation, useRecordAnimationAttempt, useAnimationsProgress } from '@/hooks/queries/useLesson';

interface ExercisesExpandableProps {
  lessonId: string;
  animations: Animation[];
}

type ExerciseStatus = 'locked' | 'available' | 'completed';

// Extended type to include MULTIPLE_CHOICE as a group type
type ExerciseGroupType = GameType | 'MULTIPLE_CHOICE';

interface ExerciseState {
  animationId: string;
  status: ExerciseStatus;
  score?: number;
}

interface ExerciseGroup {
  groupType: ExerciseGroupType;
  animations: Animation[];
  totalQuestions: number;
  completedCount: number;
  isLocked: boolean;
  isCompleted: boolean;
}

export default function ExercisesExpandable({
  lessonId,
  animations,
}: ExercisesExpandableProps) {
  const t = useTranslations('Lesson.exercises');
  const completeAnimation = useCompleteAnimation();
  const recordAttempt = useRecordAnimationAttempt();

  // Fetch progress data from API
  const { data: progressData, refetch: refetchProgress } = useAnimationsProgress({
    lessonId,
    enabled: !!lessonId,
  });

  // Check if an animation is completed (from API)
  const isAnimationCompletedFromApi = useCallback(
    (animationId: string): boolean => {
      if (!progressData?.progress) return false;
      const progress = progressData.progress.find(p => p.animationId === animationId);
      return progress?.completed ?? false;
    },
    [progressData]
  );

  // Expanded state
  const [isExpanded, setIsExpanded] = useState(false);

  // Active exercise group being played (can be a GameType or 'MULTIPLE_CHOICE')
  const [activeGroupType, setActiveGroupType] = useState<ExerciseGroupType | null>(null);

  // Current exercise index within the active game type
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Exercise states (treat enabled === false as locked, undefined = enabled)
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(() =>
    animations.map(anim => ({
      animationId: anim.id,
      status: anim.enabled === false ? 'locked' : 'available',
    }))
  );

  // Sync exercise states when animations or API progress changes
  useEffect(() => {
    setExerciseStates(prev => {
      // Create a map of existing states to preserve local completed status
      const existingStates = new Map(prev.map(e => [e.animationId, e]));

      return animations.map(anim => {
        const existing = existingStates.get(anim.id);
        const isCompletedFromApi = isAnimationCompletedFromApi(anim.id);

        // If completed from API or locally, mark as completed
        if (isCompletedFromApi || existing?.status === 'completed') {
          return {
            animationId: anim.id,
            status: 'completed' as ExerciseStatus,
            score: existing?.score,
          };
        }

        // Check if locked
        if (anim.enabled === false) {
          return {
            animationId: anim.id,
            status: 'locked' as ExerciseStatus,
          };
        }

        return {
          animationId: anim.id,
          status: 'available' as ExerciseStatus,
        };
      });
    });
  }, [animations, isAnimationCompletedFromApi]);

  // Sort animations by order
  const sortedAnimations = useMemo(
    () => [...animations].sort((a, b) => a.order - b.order),
    [animations]
  );

  // Group animations by type (CompleteSentence by gameType, MultipleChoice separately)
  const exerciseGroups = useMemo((): ExerciseGroup[] => {
    const groups: Record<string, Animation[]> = {};

    sortedAnimations.forEach(anim => {
      // MultipleChoice animations go into their own group
      if (anim.type === 'MultipleChoice') {
        if (!groups['MULTIPLE_CHOICE']) {
          groups['MULTIPLE_CHOICE'] = [];
        }
        groups['MULTIPLE_CHOICE'].push(anim);
      } else {
        // CompleteSentence animations are grouped by gameType
        const gameType = (anim.content as { gameType?: GameType })?.gameType || 'DRAG_WORD';
        if (!groups[gameType]) {
          groups[gameType] = [];
        }
        groups[gameType].push(anim);
      }
    });

    return Object.entries(groups).map(([groupType, anims]) => {
      const completedCount = anims.filter(a =>
        exerciseStates.find(e => e.animationId === a.id)?.status === 'completed'
      ).length;

      const isLocked = anims.every(a =>
        exerciseStates.find(e => e.animationId === a.id)?.status === 'locked'
      );

      // Calculate total questions based on group type
      const totalQuestions = anims.reduce((sum, a) => {
        if (groupType === 'MULTIPLE_CHOICE') {
          return sum + 1; // Each MultipleChoice animation is 1 question
        }
        const content = a.content as { sentences?: unknown[] };
        return sum + (content?.sentences?.length || 1);
      }, 0);

      return {
        groupType: groupType as ExerciseGroupType,
        animations: anims,
        totalQuestions,
        completedCount,
        isLocked,
        isCompleted: completedCount === anims.length && anims.length > 0,
      };
    });
  }, [sortedAnimations, exerciseStates]);

  // Get animations for active group
  const activeGroupAnimations = useMemo(() => {
    if (!activeGroupType) return [];
    return exerciseGroups.find(g => g.groupType === activeGroupType)?.animations || [];
  }, [activeGroupType, exerciseGroups]);

  // Get current animation
  const currentAnimation = useMemo(() => {
    return activeGroupAnimations[currentExerciseIndex];
  }, [activeGroupAnimations, currentExerciseIndex]);


  // Handle exercise completion - auto advance to next
  const handleExerciseComplete = useCallback(async (
    animationId: string,
    success: boolean,
    score: number
  ) => {
    // Mark current as completed locally
    setExerciseStates(prev =>
      prev.map(e =>
        e.animationId === animationId
          ? { ...e, status: 'completed' as ExerciseStatus, score }
          : e
      )
    );

    // Record completion to API (single call per animation)
    if (success) {
      try {
        const result = await completeAnimation.mutateAsync({
          lessonId,
          animationId,
        });

        if (result.isFirstCompletion) {
          console.log('[Exercise] First completion! 🎉', { animationId, score });
        }

        // Refetch progress to update the UI
        refetchProgress();
      } catch (error) {
        console.error('[Exercise] Failed to record completion:', error);
        // Continue with the exercise even if API fails
      }
    }

    // Check if there are more exercises in this group
    const nextIndex = currentExerciseIndex + 1;
    if (nextIndex < activeGroupAnimations.length) {
      // Auto advance to next exercise after a brief delay
      setTimeout(() => {
        setCurrentExerciseIndex(nextIndex);
      }, 500);
    } else {
      // All exercises of this group completed - go back to list
      setTimeout(() => {
        setActiveGroupType(null);
        setCurrentExerciseIndex(0);
      }, 500);
    }
  }, [currentExerciseIndex, activeGroupAnimations.length, lessonId, completeAnimation, refetchProgress]);

  // Handle individual attempt (called for each answer, correct or incorrect)
  const handleAttempt = useCallback(async (
    animationId: string,
    isCorrect: boolean
  ) => {
    try {
      await recordAttempt.mutateAsync({
        lessonId,
        animationId,
        isCorrect,
      });
      console.log('[Exercise] Attempt recorded:', { animationId, isCorrect });
    } catch (error) {
      console.error('[Exercise] Failed to record attempt:', error);
      // Continue with the exercise even if API fails
    }
  }, [lessonId, recordAttempt]);

  // Handle start exercise group
  const handleStartGroup = useCallback((groupType: ExerciseGroupType) => {
    const group = exerciseGroups.find(g => g.groupType === groupType);
    if (!group || group.isLocked) return;

    // Find the first non-completed exercise
    const firstAvailableIndex = group.animations.findIndex(a => {
      const state = exerciseStates.find(e => e.animationId === a.id);
      return state?.status === 'available';
    });

    setActiveGroupType(groupType);
    setCurrentExerciseIndex(firstAvailableIndex >= 0 ? firstAvailableIndex : 0);
  }, [exerciseGroups, exerciseStates]);

  // Listen for custom event to open the expandable
  useEffect(() => {
    const handleOpenEvent = (event: CustomEvent<{ animationId?: string }>) => {
      setIsExpanded(true);

      // If a specific animation was requested, find its group type and start
      if (event.detail?.animationId) {
        const animation = sortedAnimations.find(a => a.id === event.detail.animationId);
        const state = exerciseStates.find(e => e.animationId === event.detail.animationId);

        if (animation && state?.status !== 'locked') {
          const groupType: ExerciseGroupType = animation.type === 'MultipleChoice'
            ? 'MULTIPLE_CHOICE'
            : (animation.content as { gameType?: GameType })?.gameType || 'DRAG_WORD';

          setTimeout(() => {
            handleStartGroup(groupType);
          }, 350);
        }
      }
    };

    window.addEventListener('openExercisesExpandable', handleOpenEvent as EventListener);

    return () => {
      window.removeEventListener('openExercisesExpandable', handleOpenEvent as EventListener);
    };
  }, [sortedAnimations, exerciseStates, handleStartGroup]);

  // Get group icon - using project colors (secondary/accent)
  const getGroupIcon = (groupType: ExerciseGroupType) => {
    switch (groupType) {
      case 'DRAG_WORD':
        return <GripHorizontal size={24} className="text-secondary" />;
      case 'REORDER_WORDS':
        return <ListOrdered size={24} className="text-accent" />;
      case 'TYPE_COMPLETION':
        return <Type size={24} className="text-secondary" />;
      case 'MULTIPLE_BLANKS':
        return <Layers size={24} className="text-accent" />;
      case 'MULTIPLE_CHOICE':
        return <CircleHelp size={24} className="text-secondary" />;
      default:
        return <Gamepad2 size={24} className="text-secondary" />;
    }
  };

  // Get group label
  const getGroupLabel = (groupType: ExerciseGroupType): string => {
    switch (groupType) {
      case 'DRAG_WORD':
        return t('gameTypes.dragWord');
      case 'REORDER_WORDS':
        return t('gameTypes.reorderWords');
      case 'TYPE_COMPLETION':
        return t('gameTypes.typeCompletion');
      case 'MULTIPLE_BLANKS':
        return t('gameTypes.multipleBlanks');
      case 'MULTIPLE_CHOICE':
        return t('gameTypes.multipleChoice');
      default:
        return groupType;
    }
  };

  // Get group gradient style index (0-4) for visual variety
  const getGroupStyleIndex = (groupType: ExerciseGroupType): number => {
    switch (groupType) {
      case 'DRAG_WORD': return 0;
      case 'REORDER_WORDS': return 1;
      case 'TYPE_COMPLETION': return 2;
      case 'MULTIPLE_BLANKS': return 3;
      case 'MULTIPLE_CHOICE': return 4;
      default: return 0;
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
        className="w-full p-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Gamepad2 size={24} className="text-secondary" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {t('title')}
                {progressData && progressData.percentComplete === 100 && (
                  <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    <CheckCircle size={12} />
                    {t('allCompleted')}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-400">
                {progressData ? (
                  <span>
                    {progressData.completedAnimations} {t('of')} {progressData.totalAnimations} {t('completed')}
                  </span>
                ) : (
                  t('expandToStart')
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {progressData && progressData.totalAnimations > 0 && (
              <div className="text-right text-sm">
                <span className={`font-medium ${progressData.percentComplete === 100 ? 'text-green-400' : 'text-secondary'}`}>
                  {progressData.percentComplete}%
                </span>
              </div>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={24} className="text-gray-400" />
            </motion.div>
          </div>
        </div>

        {/* Progress bar - always visible when we have progress data */}
        {progressData && progressData.totalAnimations > 0 && (
          <div className="mt-3 mx-11">
            <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  progressData.percentComplete === 100
                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                    : 'bg-gradient-to-r from-secondary to-accent'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressData.percentComplete}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-secondary/20">
              {/* Exercise group selector - when no active group */}
              {!activeGroupType && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="grid gap-4 mt-4"
                >
                  {/* Animated intro sparkles */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="flex items-center justify-center gap-2 py-2"
                  >
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Sparkles size={20} className="text-secondary" />
                    </motion.div>
                    <span className="text-sm text-gray-400">{t('expandToStart')}</span>
                    <motion.div
                      animate={{ rotate: [0, -15, 15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    >
                      <Sparkles size={20} className="text-accent" />
                    </motion.div>
                  </motion.div>

                  {exerciseGroups.map((group, index) => {
                    const styleIndex = getGroupStyleIndex(group.groupType);
                    // Gradient variations using project colors
                    const gradientRotations = [
                      'bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10',
                      'bg-gradient-to-tr from-secondary/30 via-accent/20 to-secondary/10',
                      'bg-gradient-to-bl from-accent/30 via-primary/20 to-accent/10',
                      'bg-gradient-to-tl from-primary/25 via-accent/15 to-secondary/10',
                      'bg-gradient-to-r from-secondary/30 via-primary/20 to-accent/10',
                    ];
                    const gradient = gradientRotations[styleIndex % gradientRotations.length];

                    return (
                      <motion.button
                        key={group.groupType}
                        onClick={() => handleStartGroup(group.groupType)}
                        disabled={group.isLocked}
                        initial={{ opacity: 0, x: -30, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          delay: 0.15 + index * 0.1,
                          type: 'spring',
                          stiffness: 100,
                          damping: 15,
                        }}
                        whileHover={!group.isLocked ? {
                          scale: 1.02,
                          x: 8,
                          transition: { type: 'spring', stiffness: 400 }
                        } : {}}
                        whileTap={!group.isLocked ? { scale: 0.98 } : {}}
                        className={`relative w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all overflow-hidden ${
                          group.isLocked
                            ? 'bg-gray-800/30 border-gray-700/30 cursor-not-allowed opacity-50'
                            : group.isCompleted
                            ? 'bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-green-600/5 border-green-500/40 hover:border-green-400/60 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]'
                            : `${gradient} border-secondary/30 hover:border-secondary/60 hover:shadow-[0_0_30px_rgba(56,135,166,0.2)]`
                        }`}
                      >
                        {/* Animated shimmer effect for available exercises */}
                        {!group.isLocked && !group.isCompleted && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full"
                            animate={{ translateX: ['−100%', '200%'] }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              repeatDelay: 2,
                              ease: 'easeInOut',
                            }}
                          />
                        )}

                        {/* Icon container with glow effect */}
                        <motion.div
                          className={`relative w-16 h-16 rounded-2xl flex items-center justify-center ${
                            group.isLocked
                              ? 'bg-gray-700/50'
                              : group.isCompleted
                              ? 'bg-green-500/20'
                              : 'bg-gradient-to-br from-secondary/30 to-primary/20'
                          }`}
                          whileHover={!group.isLocked ? { rotate: [0, -5, 5, 0] } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          {/* Glow ring */}
                          {!group.isLocked && !group.isCompleted && (
                            <motion.div
                              className="absolute inset-0 rounded-2xl border-2 border-secondary/40"
                              animate={{
                                boxShadow: [
                                  '0 0 0 0 rgba(56, 135, 166, 0)',
                                  '0 0 20px 2px rgba(56, 135, 166, 0.3)',
                                  '0 0 0 0 rgba(56, 135, 166, 0)',
                                ],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          {group.isLocked ? (
                            <Lock size={28} className="text-gray-500" />
                          ) : group.isCompleted ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300 }}
                            >
                              <CheckCircle size={28} className="text-green-400" />
                            </motion.div>
                          ) : (
                            getGroupIcon(group.groupType)
                          )}
                        </motion.div>

                        <div className="flex-1 text-left z-10">
                          <p className={`text-lg font-bold ${
                            group.isLocked
                              ? 'text-gray-500'
                              : group.isCompleted
                              ? 'text-green-400'
                              : 'text-white'
                          }`}>
                            {getGroupLabel(group.groupType)}
                          </p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            {group.animations.length} {group.animations.length === 1 ? t('exerciseSingular') : t('exercisePlural')}
                            {' • '}
                            {group.totalQuestions} {group.totalQuestions === 1 ? t('questionSingular') : t('questionPlural')}
                          </p>
                          {group.isCompleted && (
                            <motion.p
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-green-400/80 mt-1.5 flex items-center gap-1"
                            >
                              <CheckCircle size={12} />
                              {t('allCompleted')}
                            </motion.p>
                          )}
                        </div>

                        {!group.isLocked && !group.isCompleted && (
                          <motion.div
                            className="flex items-center gap-2"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <PlayCircle size={28} className="text-secondary" />
                          </motion.div>
                        )}

                        {group.isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="text-xs font-medium text-green-400 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30"
                          >
                            {t('replay')}
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {/* Active exercise */}
              {activeGroupType && currentAnimation && (
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
                        setActiveGroupType(null);
                        setCurrentExerciseIndex(0);
                      }}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronUp size={18} className="-rotate-90" />
                      <span>{t('backToList')}</span>
                    </button>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">
                        {currentExerciseIndex + 1} / {activeGroupAnimations.length}
                      </span>
                      <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary transition-all duration-300"
                          style={{ width: `${((currentExerciseIndex + 1) / activeGroupAnimations.length) * 100}%` }}
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
                      {(currentAnimation.content as { gameType?: GameType })?.gameType === 'DRAG_WORD' && (
                        <DragWordExercise
                          sentences={(currentAnimation.content as { sentences: Array<{ fullSentence: string; targetWord?: string; wordPosition?: number; hint?: string }>; distractors: string[] }).sentences}
                          distractors={(currentAnimation.content as { distractors: string[] }).distractors}
                          onAttempt={(isCorrect) =>
                            handleAttempt(currentAnimation.id, isCorrect)
                          }
                          onComplete={(success, score) =>
                            handleExerciseComplete(currentAnimation.id, success, score)
                          }
                        />
                      )}

                      {(currentAnimation.content as { gameType?: GameType })?.gameType === 'REORDER_WORDS' && (
                        <ReorderWordsExercise
                          sentences={(currentAnimation.content as { sentences: Array<{ fullSentence: string; targetWord?: string; wordPosition?: number; hint?: string }> }).sentences}
                          onAttempt={(isCorrect) =>
                            handleAttempt(currentAnimation.id, isCorrect)
                          }
                          onComplete={(success, score) =>
                            handleExerciseComplete(currentAnimation.id, success, score)
                          }
                        />
                      )}

                      {(currentAnimation.content as { gameType?: GameType })?.gameType === 'TYPE_COMPLETION' && (
                        <TypeCompletionExercise
                          sentences={(currentAnimation.content as { sentences: Array<{ fullSentence: string; targetWord?: string; wordPosition?: number; hint?: string }> }).sentences}
                          onAttempt={(isCorrect) =>
                            handleAttempt(currentAnimation.id, isCorrect)
                          }
                          onComplete={(success, score) =>
                            handleExerciseComplete(currentAnimation.id, success, score)
                          }
                        />
                      )}

                      {(currentAnimation.content as { gameType?: GameType })?.gameType === 'MULTIPLE_BLANKS' && (
                        <MultipleBlanksExercise
                          sentences={(currentAnimation.content as { sentences: Array<{ fullSentence: string; targetWord?: string; targetWords?: string[]; wordPosition?: number; wordPositions?: number[]; hint?: string }> }).sentences}
                          onAttempt={(isCorrect) =>
                            handleAttempt(currentAnimation.id, isCorrect)
                          }
                          onComplete={(success, score) =>
                            handleExerciseComplete(currentAnimation.id, success, score)
                          }
                        />
                      )}

                      {/* MultipleChoice Quiz */}
                      {currentAnimation.type === 'MultipleChoice' && currentAnimation.content && (
                        <MultipleChoiceExercise
                          questions={[currentAnimation.content as MultipleChoiceContent]}
                          onAttempt={(isCorrect) =>
                            handleAttempt(currentAnimation.id, isCorrect)
                          }
                          onComplete={(success, score) =>
                            handleExerciseComplete(currentAnimation.id, success, score)
                          }
                        />
                      )}

                      {/* Placeholder for unsupported types */}
                      {currentAnimation.type === 'CompleteSentence' &&
                       currentAnimation.content &&
                       !['DRAG_WORD', 'REORDER_WORDS', 'TYPE_COMPLETION', 'MULTIPLE_BLANKS'].includes((currentAnimation.content as { gameType?: GameType })?.gameType || '') && (
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

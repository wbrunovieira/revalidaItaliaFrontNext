// src/app/[locale]/flashcards/study/page.tsx
'use client';

import {
  useState,
  useEffect,
} from 'react';
import {
  useSearchParams,
  useParams,
  useRouter,
} from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  motion,
  AnimatePresence,
  PanInfo,
} from 'framer-motion';
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Brain,
  X,
  Check,
  Shuffle,
  ArrowLeft,
  Loader2,
  Cloud,
  CloudOff,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import NavSidebar from '@/components/NavSidebar';

// Utility function to get cookie
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2)
    return parts.pop()?.split(';').shift() || null;
  return null;
};

interface FlashcardData {
  id: string;
  slug: string;
  questionText?: string;
  questionImageUrl?: string;
  questionType: 'TEXT' | 'IMAGE';
  answerText?: string;
  answerImageUrl?: string;
  answerType: 'TEXT' | 'IMAGE';
  argumentId: string;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
  userInteraction?: {
    difficultyLevel: 'EASY' | 'HARD';
    reviewedAt: string;
    daysSinceReview?: number;
  };
}

interface FlashcardsMetadata {
  totalFlashcards: number;
  completedFlashcards: number;
  availableFlashcards: number;
}

export default function FlashcardStudyPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('FlashcardStudy');
  const locale = params.locale as string;
  const lessonId = searchParams.get('lessonId');

  const [flashcards, setFlashcards] = useState<
    FlashcardData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [exitDirection, setExitDirection] = useState<
    'left' | 'right' | null
  >(null);
  const [masteredCount, setMasteredCount] = useState(0);
  const [difficultCount, setDifficultCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [metadata, setMetadata] = useState<FlashcardsMetadata | null>(null);
  const [showFlipHint, setShowFlipHint] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [queueSize, setQueueSize] = useState(0);

  // Force flush on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Force flush any pending progress only if queue has items
      if (queueSize > 0) {
        try {
          await fetch('/api/flashcards/progress', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error(
            'Error flushing progress on unload:',
            error
          );
        }
      }
    };

    // Also flush when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden && queueSize > 0) {
        handleBeforeUnload();
      }
    };

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );
    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
      // Final flush on component unmount
      if (queueSize > 0) {
        handleBeforeUnload();
      }
    };
  }, [queueSize]);

  // Auto-flush timer effect
  useEffect(() => {
    if (queueSize > 0) {
      console.log(`Setting up auto-flush timer for ${queueSize} items`);
      
      const timerId = setTimeout(async () => {
        console.log(`Auto-flush timer triggered for ${queueSize} items`);
        
        setSaveStatus('saving');
        try {
          const response = await fetch('/api/flashcards/progress', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (response.ok) {
            console.log('Auto-flush successful!');
            setSaveStatus('saved');
            setQueueSize(0);
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            setSaveStatus('error');
            console.error('Failed to auto-flush progress');
          }
        } catch (error) {
          setSaveStatus('error');
          console.error('Error auto-flushing progress:', error);
        }
      }, 10000);
      
      return () => {
        console.log('Clearing auto-flush timer');
        clearTimeout(timerId);
      };
    }
  }, [queueSize]);

  // Fetch flashcards from lesson
  useEffect(() => {
    const fetchFlashcards = async () => {
      console.log('Starting fetchFlashcards...');
      console.log('lessonId:', lessonId);

      if (!lessonId) {
        console.log('No lessonId provided');
        setError('No lesson ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = getCookie('token');
        console.log('Token exists:', !!token);

        if (!token) {
          console.log('No token, redirecting to login');
          router.push(`/${locale}/login`);
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        console.log('API_URL:', API_URL);

        // Validate if lessonId is a valid UUID
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(lessonId)) {
          console.log('Invalid UUID format:', lessonId);
          throw new Error('Invalid lesson ID format');
        }

        const url = `${API_URL}/api/v1/flashcards?lessonId=${lessonId}`;
        console.log('Fetching from URL:', url);

        // Fetch flashcards by lessonId with user interactions
        const urlWithParams = new URL(url);
        urlWithParams.searchParams.append('includeUserInteractions', 'true');
        urlWithParams.searchParams.append('randomize', 'true');
        
        console.log('Final URL with params:', urlWithParams.toString());
        
        const response = await fetch(urlWithParams.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Error response:', errorData);
          throw new Error(
            errorData.message ||
              'Failed to fetch flashcards'
          );
        }

        const data = await response.json();
        console.log('Response data:', data);

        // Extract metadata if available
        if (data.metadata) {
          console.log('Metadata:', data.metadata);
          setMetadata(data.metadata);
        }

        const flashcardsList =
          data.flashcards || data || [];
        console.log('Flashcards list:', flashcardsList);
        console.log(
          'Number of flashcards:',
          flashcardsList.length
        );

        // Remove duplicates based on ID
        const uniqueFlashcards = flashcardsList.filter((card: FlashcardData, index: number, self: FlashcardData[]) => 
          index === self.findIndex((c) => c.id === card.id)
        );
        
        console.log('Unique flashcards:', uniqueFlashcards.length);
        
        if (uniqueFlashcards.length === 0) {
          console.log('No flashcards found');
          // Don't set error, let the metadata determine what to show
          setLoading(false);
          return;
        }

        // Check if any card has userInteraction
        const cardsWithInteraction = uniqueFlashcards.filter((card: FlashcardData) => card.userInteraction);
        console.log('Cards with userInteraction:', cardsWithInteraction.length);
        
        // Shuffle flashcards
        const shuffled = [...uniqueFlashcards].sort(
          () => Math.random() - 0.5
        );
        console.log('Setting flashcards:', shuffled);
        setFlashcards(shuffled);
        
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching flashcards:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load flashcards'
        );
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [lessonId, locale, router]);

  const currentCard = flashcards[currentIndex];
  const progress =
    ((currentIndex + 1) / flashcards.length) * 100;

  const handleSwipe = async (
    direction: 'left' | 'right'
  ) => {
    const cardId = currentCard.id;
    
    if (direction === 'right') {
      console.log('Marked as MASTERED:', cardId);
      setMasteredCount(prev => prev + 1);
    } else {
      console.log('Marked as DIFFICULT:', cardId);
      setDifficultCount(prev => prev + 1);
    }

    // Send progress to API
    setSaveStatus('saving');
    try {
      const response = await fetch(
        '/api/flashcards/progress',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flashcardId: cardId,
            result:
              direction === 'right'
                ? 'mastered'
                : 'difficult',
            lessonId: lessonId,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to save progress');
        setSaveStatus('error');
      } else {
        const data = await response.json();
        console.log('Progress saved:', data);
        console.log('Backend response for progress:', {
          flashcardId: cardId,
          result: direction === 'right' ? 'mastered' : 'difficult',
          backendResponse: data
        });

        // Update queue size based on response
        if (data.status === 'flushed') {
          setQueueSize(0); // Reset if flushed
        } else if (data.queueSize !== undefined) {
          setQueueSize(data.queueSize); // Update with server queue size
        } else {
          setQueueSize(prev => prev + 1); // Fallback increment
        }

        setSaveStatus('saved');
        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);

      }
    } catch (error) {
      console.error('Error saving progress:', error);
      setSaveStatus('error');
      // Still increment queue size on error to track unsaved items
      setQueueSize(prev => prev + 1);
    }

    setExitDirection(direction);
    setIsFlipped(false);

    // Handle card transition
    setTimeout(() => {
      if (direction === 'right') {
        // For EASY cards, remove from list but stay on same index
        setFlashcards(prev => {
          const newCards = prev.filter((_, index) => index !== currentIndex);
          
          // Check if we have more cards
          if (newCards.length === 0) {
            setShowResults(true);
          } else if (currentIndex >= newCards.length) {
            // If we're at the end, go back one
            setCurrentIndex(newCards.length - 1);
          }
          // If currentIndex is still valid, keep it (next card slides in)
          
          return newCards;
        });
      } else {
        // For HARD cards, update userInteraction and move to next
        setFlashcards(prev => prev.map((card) => {
          if (card.id === cardId) {
            return {
              ...card,
              userInteraction: {
                difficultyLevel: 'HARD' as const,
                reviewedAt: new Date().toISOString(),
              }
            };
          }
          return card;
        }));
        
        if (currentIndex < flashcards.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setShowResults(true);
        }
      }
      setExitDirection(null);
    }, 300);
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // Se o card não está virado, mostra hint para virar primeiro
    if (!isFlipped) {
      setShowFlipHint(true);
      setShakeCard(true);
      setTimeout(() => {
        setShowFlipHint(false);
        setShakeCard(false);
      }, 2000);
      return;
    }

    const swipeThreshold = 100;
    const swipeVelocity = 500;

    if (
      info.offset.x > swipeThreshold ||
      info.velocity.x > swipeVelocity
    ) {
      handleSwipe('right');
    } else if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -swipeVelocity
    ) {
      handleSwipe('left');
    }
  };

  const resetStudy = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setExitDirection(null);
    setMasteredCount(0);
    setDifficultCount(0);
    setShowResults(false);
    // Reload the page to get fresh flashcards
    window.location.reload();
  };


  // Loading state
  if (loading) {
    return (
      <NavSidebar>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary flex items-center justify-center">
          <div className="text-center">
            <Loader2
              size={48}
              className="text-secondary animate-spin mx-auto mb-4"
            />
            <p className="text-gray-400">{t('loading')}</p>
          </div>
        </div>
      </NavSidebar>
    );
  }

  // Error state (only for real errors, not empty flashcards)
  if (error && flashcards.length === 0 && !loading) {
    return (
      <NavSidebar>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary flex items-center justify-center p-4">
          <div className="bg-primary-dark/90 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-red-500/20 shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <X size={40} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {t('error.title')}
            </h2>
            <p className="text-gray-400 mb-6">{t('error.description')}</p>
            <Link
              href={
                lessonId
                  ? `/${locale}/lessons/${lessonId}`
                  : `/${locale}`
              }
              className="inline-block py-3 px-6 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              {t('error.back')}
            </Link>
          </div>
        </div>
      </NavSidebar>
    );
  }

  // No flashcards or all completed
  if (flashcards.length === 0 && !loading) {
    // Use metadata to determine the state
    const allCompleted = metadata && metadata.completedFlashcards === metadata.totalFlashcards && metadata.totalFlashcards > 0;
    
    return (
      <NavSidebar>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary flex items-center justify-center p-4">
          <div className="bg-primary-dark/90 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-secondary/20 shadow-2xl text-center">
            <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {allCompleted ? (
                <CheckCircle
                  size={40}
                  className="text-secondary"
                />
              ) : (
                <CreditCard
                  size={40}
                  className="text-secondary"
                />
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {allCompleted 
                ? t('allCompleted.title') 
                : t('noFlashcards.title')}
            </h2>
            <p className="text-gray-400 mb-6">
              {allCompleted 
                ? t('allCompleted.subtitle') 
                : t('noFlashcards.subtitle')}
            </p>
            {allCompleted && metadata && (
              <div className="mb-6 text-sm text-gray-500">
                <p>{t('allCompleted.stats', { 
                  mastered: metadata.completedFlashcards, 
                  difficult: metadata.totalFlashcards - metadata.completedFlashcards 
                })}</p>
              </div>
            )}
            <Link
              href={
                lessonId
                  ? `/${locale}/lessons/${lessonId}`
                  : `/${locale}`
              }
              className="inline-block py-3 px-6 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              {t('noFlashcards.back')}
            </Link>
          </div>
        </div>
      </NavSidebar>
    );
  }

  if (showResults) {
    return (
      <NavSidebar>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary-dark/90 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-secondary/20 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain
                  size={40}
                  className="text-secondary"
                />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {t('results.title')}
              </h2>
              <p className="text-gray-400 mb-8">
                {t('results.subtitle')}
              </p>

              <div className="space-y-4 mb-8">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">
                      {t('results.mastered')}
                    </span>
                    <span className="text-2xl font-bold text-white">
                      {masteredCount}
                    </span>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400">
                      {t('results.difficult')}
                    </span>
                    <span className="text-2xl font-bold text-white">
                      {difficultCount}
                    </span>
                  </div>
                </div>

                <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">
                      {t('results.total')}
                    </span>
                    <span className="text-2xl font-bold text-white">
                      {flashcards.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={resetStudy}
                  className="w-full py-3 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  {t('results.studyAgain')}
                </button>

                <Link
                  href={
                    lessonId
                      ? `/${locale}/lessons/${lessonId}`
                      : `/${locale}/flashcards`
                  }
                  className="block w-full py-3 bg-primary/50 text-white rounded-lg font-semibold hover:bg-primary/70 transition-colors border border-secondary/20"
                >
                  {t('results.back')}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </NavSidebar>
    );
  }

  return (
    <NavSidebar>
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary overflow-hidden">
        {/* Header */}
        <div className="absolute top-24 lg:top-20 left-0 right-0 z-10 p-6 lg:pl-24">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={
                  lessonId
                    ? `/${locale}/lessons/${lessonId}`
                    : `/${locale}/flashcards`
                }
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span>{t('back')}</span>
              </Link>

              <button
                onClick={resetStudy}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Shuffle size={20} />
                <span>{t('shuffle')}</span>
              </button>
            </div>

            {/* Save status indicator */}
            <AnimatePresence>
              {saveStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor:
                      saveStatus === 'saved'
                        ? 'rgba(34, 197, 94, 0.2)'
                        : saveStatus === 'error'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(59, 130, 246, 0.2)',
                    color:
                      saveStatus === 'saved'
                        ? '#22c55e'
                        : saveStatus === 'error'
                        ? '#ef4444'
                        : '#3b82f6',
                  }}
                >
                  {saveStatus === 'saving' && (
                    <>
                      <Loader2
                        size={12}
                        className="animate-spin"
                      />
                      <span>{t('saving')}</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle size={12} />
                      <span>{t('saved')}</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <CloudOff size={12} />
                      <span>{t('saveError')}</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <div className="bg-primary/50 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-secondary to-accent-light"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-gray-400">
                {currentIndex + 1} / {flashcards.length}
              </span>
              <div className="flex items-center gap-4">
                {queueSize > 0 && (
                  <span className="text-blue-400 flex items-center gap-1 text-xs">
                    <Cloud size={14} />
                    {queueSize}
                  </span>
                )}
                <span className="text-green-400 flex items-center gap-1">
                  <Check size={16} />
                  {masteredCount}
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  <X size={16} />
                  {difficultCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex items-center justify-center min-h-screen p-4 pt-48 lg:pt-40">
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="max-w-lg mx-auto">
              {/* Swipe indicators */}
              <div className="absolute inset-0 flex items-center justify-between px-12 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity:
                      currentIndex < flashcards.length
                        ? 0.5
                        : 0,
                  }}
                  className="text-red-400 -rotate-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <X size={40} />
                    <span className="text-sm font-semibold">
                      {t('difficult')}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity:
                      currentIndex < flashcards.length
                        ? 0.5
                        : 0,
                  }}
                  className="text-green-400 rotate-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Check size={40} />
                    <span className="text-sm font-semibold">
                      {t('mastered')}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Flashcard */}
              <AnimatePresence mode="wait">
                {currentCard && (
                  <motion.div
                    key={currentCard.id}
                    className="relative w-full h-[500px] cursor-grab active:cursor-grabbing"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={
                      shakeCard
                        ? {
                            scale: 1,
                            opacity: 1,
                            x: [0, -10, 10, -10, 10, 0],
                            rotateZ: [0, -2, 2, -2, 2, 0],
                          }
                        : {
                            scale: 1,
                            opacity: 1,
                          }
                    }
                    exit={{
                      x:
                        exitDirection === 'left'
                          ? -300
                          : 300,
                      opacity: 0,
                      scale: 0.8,
                      transition: { duration: 0.3 },
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    whileDrag={{ scale: 1.05 }}
                    transition={
                      shakeCard
                        ? {
                            duration: 0.5,
                            ease: 'easeInOut',
                          }
                        : {}
                    }
                    style={{ perspective: 1000 }}
                  >
                    <motion.div
                      className="absolute inset-0 w-full h-full"
                      animate={{
                        rotateY: isFlipped ? 180 : 0,
                      }}
                      transition={{
                        duration: 0.6,
                        type: 'spring',
                        stiffness: 100,
                      }}
                      style={{
                        transformStyle: 'preserve-3d',
                      }}
                      onClick={() =>
                        setIsFlipped(!isFlipped)
                      }
                    >
                      {/* Front (Question) */}
                      <motion.div
                        className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-dark to-primary rounded-2xl shadow-2xl border border-secondary/30 p-8 flex flex-col items-center justify-center"
                        style={{
                          backfaceVisibility: 'hidden',
                        }}
                        drag={false}
                      >
                        <div className="absolute top-6 right-6 flex items-center gap-2">
                          {/* Badge for card status */}
                          {currentCard.userInteraction?.difficultyLevel === 'HARD' && (
                            <div className="bg-red-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-xs text-red-400 font-medium">
                                {t('difficult')}
                              </span>
                            </div>
                          )}
                          {!currentCard.userInteraction && (
                            <div className="bg-blue-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-xs text-blue-400 font-medium">
                                {t('new')}
                              </span>
                            </div>
                          )}
                          <div className="bg-secondary/20 rounded-full p-3">
                            <CreditCard
                              size={24}
                              className="text-secondary"
                            />
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-secondary text-sm font-semibold mb-4 uppercase tracking-wider">
                            {t('question')}
                          </p>

                          {currentCard.questionType ===
                          'TEXT' ? (
                            <p className="text-white text-xl leading-relaxed">
                              {currentCard.questionText}
                            </p>
                          ) : (
                            <div className="relative w-full h-64 rounded-lg overflow-hidden">
                              <Image
                                src={
                                  currentCard.questionImageUrl!
                                }
                                alt="Question"
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>

                        <motion.p
                          className="absolute bottom-6 text-gray-500 text-sm"
                          animate={
                            showFlipHint
                              ? {
                                  scale: [1, 1.2, 1],
                                  color: [
                                    '#9CA3AF',
                                    '#FCD34D',
                                    '#9CA3AF',
                                  ],
                                }
                              : {}
                          }
                          transition={{ duration: 0.5 }}
                        >
                          {t('tapToFlip')}
                        </motion.p>
                      </motion.div>

                      {/* Back (Answer) */}
                      <motion.div
                        className="absolute inset-0 w-full h-full bg-gradient-to-br from-secondary/20 to-accent-light/20 rounded-2xl shadow-2xl border border-secondary/30 p-8 flex flex-col items-center justify-center"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                        drag={false}
                      >
                        <div className="absolute top-6 right-6 bg-accent-light/20 rounded-full p-3">
                          <Check
                            size={24}
                            className="text-accent-light"
                          />
                        </div>

                        <div className="text-center">
                          <p className="text-accent-light text-sm font-semibold mb-4 uppercase tracking-wider">
                            {t('answer')}
                          </p>

                          {currentCard.answerType ===
                          'TEXT' ? (
                            <p className="text-white text-lg leading-relaxed">
                              {currentCard.answerText}
                            </p>
                          ) : (
                            <div className="relative w-full h-64 rounded-lg overflow-hidden">
                              <Image
                                src={
                                  currentCard.answerImageUrl!
                                }
                                alt="Answer"
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-6 flex items-center gap-6">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleSwipe('left');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <ChevronLeft size={18} />
                            {t('difficult')}
                          </button>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleSwipe('right');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            {t('mastered')}
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instructions */}
              <div className="absolute -bottom-20 left-0 right-0 text-center text-gray-500 text-sm">
                <p>{t('instructions.swipe')}</p>
                <p>{t('instructions.tap')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavSidebar>
  );
}

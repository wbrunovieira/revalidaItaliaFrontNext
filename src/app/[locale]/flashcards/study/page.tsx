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
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import NavSidebar from '@/components/NavSidebar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/auth.store';
import { SupportFloatingButton } from '@/components/SupportFloatingButton';


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
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();
  const locale = params.locale as string;
  const lessonId = searchParams.get('lessonId');
  const argumentId = searchParams.get('argumentId');

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
  const [isResetting, setIsResetting] = useState(false);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());
  const [dragX, setDragX] = useState(0);

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

  // Fetch flashcards from lesson or argument
  useEffect(() => {
    const fetchFlashcards = async () => {
      console.log('Starting fetchFlashcards...');
      console.log('lessonId:', lessonId);
      console.log('argumentId:', argumentId);

      if (!lessonId && !argumentId) {
        console.log('No lessonId or argumentId provided');
        setError('No lesson or argument ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Token exists:', !!token);

        if (!token || !isAuthenticated) {
          console.log('No token, redirecting to login');
          router.push(`/${locale}/login`);
          return;
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        console.log('API_URL:', API_URL);

        // Validate if ID is a valid UUID
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        let url: string;
        
        if (argumentId) {
          if (!uuidRegex.test(argumentId)) {
            console.log('Invalid UUID format:', argumentId);
            throw new Error('Invalid argument ID format');
          }
          url = `${API_URL}/api/v1/flashcards/by-argument/${argumentId}`;
          console.log('Fetching flashcards by argumentId from URL:', url);
        } else if (lessonId) {
          if (!uuidRegex.test(lessonId)) {
            console.log('Invalid UUID format:', lessonId);
            throw new Error('Invalid lesson ID format');
          }
          url = `${API_URL}/api/v1/flashcards?lessonId=${lessonId}`;
          console.log('Fetching flashcards by lessonId from URL:', url);
        } else {
          throw new Error('No valid ID provided');
        }

        // Fetch flashcards with user interactions
        const urlWithParams = new URL(url);
        urlWithParams.searchParams.append('includeUserInteractions', 'true');
        urlWithParams.searchParams.append('randomize', 'true');
        urlWithParams.searchParams.append('enabledStatus', 'enabled');
        
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
        setTotalFlashcards(shuffled.length);
        
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
  }, [lessonId, argumentId, locale, router, token, isAuthenticated]);

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
      setCompletedCards(prev => new Set(prev).add(cardId));
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
        // For EASY cards, check if all cards are completed
        const allCardsCompleted = completedCards.size + 1 === totalFlashcards;
        
        if (allCardsCompleted) {
          setShowResults(true);
        } else {
          // Move to next unmastered card
          let nextIndex = currentIndex;
          let found = false;
          
          // Look for next unmastered card
          for (let i = 0; i < flashcards.length; i++) {
            nextIndex = (currentIndex + i + 1) % flashcards.length;
            if (!completedCards.has(flashcards[nextIndex].id)) {
              found = true;
              break;
            }
          }
          
          if (found) {
            setCurrentIndex(nextIndex);
          } else {
            setShowResults(true);
          }
        }
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

    const swipeThreshold = 50; // Reduzido de 100
    const swipeVelocity = 200; // Reduzido de 500

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

  const resetStudy = async () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setExitDirection(null);
    setMasteredCount(0);
    setDifficultCount(0);
    setShowResults(false);
    setCompletedCards(new Set());
    
    // Re-fetch flashcards without reloading the page
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      let url: string;
      if (argumentId) {
        url = `${API_URL}/api/v1/flashcards/by-argument/${argumentId}`;
      } else if (lessonId) {
        url = `${API_URL}/api/v1/flashcards?lessonId=${lessonId}`;
      } else {
        throw new Error('No valid ID provided');
      }
      
      const urlWithParams = new URL(url);
      urlWithParams.searchParams.append('includeUserInteractions', 'true');
      urlWithParams.searchParams.append('randomize', 'true');
      urlWithParams.searchParams.append('enabledStatus', 'enabled');

      const response = await fetch(urlWithParams.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch flashcards');
      }

      const data = await response.json();

      if (data.metadata) {
        setMetadata(data.metadata);
      }

      const flashcardsList = data.flashcards || data || [];
      const uniqueFlashcards = flashcardsList.filter((card: FlashcardData, index: number, self: FlashcardData[]) =>
        index === self.findIndex((c) => c.id === card.id)
      );

      const shuffled = [...uniqueFlashcards].sort(() => Math.random() - 0.5);
      setFlashcards(shuffled);
      setTotalFlashcards(shuffled.length);
    } catch (err) {
      console.error('Error resetting flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset flashcards');
    } finally {
      setLoading(false);
    }
  };

  // Handle reset flashcards
  const handleResetFlashcards = () => {
    // Determinar o motivo do reset
    const allMastered = metadata && metadata.completedFlashcards === metadata.totalFlashcards && metadata.totalFlashcards > 0;
    const resetReason = allMastered ? 'COMPLETED' : 'MANUAL';

    toast({
      title: t('reset.title'),
      description: (
        <div className="space-y-3">
          <p className="text-sm">{t('reset.description')}</p>
          
          <div className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-300 mb-2">{t('reset.reason')}:</p>
            <p className="text-sm text-white font-medium">
              {resetReason === 'COMPLETED' ? t('reset.reasonCompleted') : t('reset.reasonManual')}
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="default"
              size="sm"
              className="bg-secondary hover:bg-secondary/90 text-primary"
              onClick={async () => {
                setIsResetting(true);
                
                try {
                  if (!token || !isAuthenticated) {
                    throw new Error('No authentication token');
                  }

                  const API_URL = process.env.NEXT_PUBLIC_API_URL;
                  const response = await fetch(
                    `${API_URL}/api/v1/flashcard-interactions/lessons/${lessonId}/reset`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ resetReason }),
                    }
                  );

                  if (!response.ok) {
                    const error = await response.json();
                    if (error.type === 'no-flashcards-to-reset') {
                      throw new Error(t('reset.error.noFlashcards'));
                    }
                    throw new Error(error.detail || t('reset.error.description'));
                  }

                  const result = await response.json();
                  
                  // Fechar o toast atual
                  toast({
                    title: t('reset.success.title'),
                    description: t('reset.success.description', { count: result.totalReset }),
                    className: 'bg-green-500/10 border-green-500/30',
                  });

                  // Recarregar flashcards após um breve delay
                  setTimeout(async () => {
                    await resetStudy();
                  }, 1500);
                  
                } catch (error) {
                  toast({
                    title: t('reset.error.title'),
                    description: error instanceof Error ? error.message : t('reset.error.description'),
                    variant: 'destructive',
                  });
                  setIsResetting(false);
                }
              }}
            >
              {isResetting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1" />
                  {t('reset.resetting')}
                </>
              ) : (
                t('reset.confirm')
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
              onClick={() => {
                // Toast será automaticamente fechado
              }}
            >
              {t('reset.cancel')}
            </Button>
          </div>
        </div>
      ),
      duration: 10000, // 10 segundos para dar tempo de ler
    });
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
        
        {/* Support Button for flashcard context while loading */}
        <SupportFloatingButton 
          context={{
            type: lessonId ? "FLASHCARD" : "GENERAL",
            title: `Flashcards - ${t('loading')}`
          }}
        />
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
            <button
              onClick={() => router.back()}
              className="inline-block py-3 px-6 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
            >
              {t('error.back')}
            </button>
          </div>
        </div>
        
        {/* Support Button for flashcard error context */}
        <SupportFloatingButton 
          context={{
            type: lessonId ? "FLASHCARD" : "GENERAL",
            title: `Flashcards - ${t('error.title')}`
          }}
        />
      </NavSidebar>
    );
  }

  // No flashcards or all completed
  if (flashcards.length === 0 && !loading) {
    // Use metadata to determine the state
    const allCompleted = (metadata && metadata.completedFlashcards === metadata.totalFlashcards && metadata.totalFlashcards > 0) || (totalFlashcards > 0 && completedCards.size === totalFlashcards);
    
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
            <div className="space-y-3">
              {allCompleted && (
                <button
                  onClick={handleResetFlashcards}
                  className="w-full py-3 px-6 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                  disabled={isResetting}
                >
                  <RefreshCw size={18} className={isResetting ? 'animate-spin' : ''} />
                  {t('reset.button')}
                </button>
              )}
              
              <button
                onClick={() => router.back()}
                className="w-full text-center py-3 px-6 bg-primary/50 text-white rounded-lg font-semibold hover:bg-primary/70 transition-colors border border-secondary/20"
              >
                {t('noFlashcards.back')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Support Button for no flashcards context */}
        <SupportFloatingButton 
          context={{
            type: lessonId ? "FLASHCARD" : "GENERAL",
            title: allCompleted ? t('allCompleted.title') : t('noFlashcards.title')
          }}
        />
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

                <button
                  onClick={() => router.back()}
                  className="w-full py-3 bg-primary/50 text-white rounded-lg font-semibold hover:bg-primary/70 transition-colors border border-secondary/20"
                >
                  {t('results.back')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </NavSidebar>
    );
  }

  return (
    <NavSidebar>
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary overflow-hidden relative">
        {/* Header */}
        <div className="absolute top-32 sm:top-28 lg:top-20 left-0 right-0 z-50 p-6 lg:pl-24">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg transition-all cursor-pointer border border-secondary/30"
              >
                <ArrowLeft size={18} />
                <span className="text-sm font-medium">{t('exit')}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetFlashcards}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all border border-secondary/30"
                  disabled={isResetting}
                >
                  <RefreshCw size={18} className={isResetting ? 'animate-spin' : ''} />
                  <span className="text-sm font-medium">{t('reset.button')}</span>
                </button>
                
                <button
                  onClick={resetStudy}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Shuffle size={20} />
                  <span>{t('shuffle')}</span>
                </button>
              </div>
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
        <div className="flex items-center justify-center min-h-screen p-4 pt-48 lg:pt-40 relative z-20">
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="max-w-lg mx-auto relative">
              {/* Swipe indicators */}
              <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-8 lg:px-0 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: dragX < -30 ? 0.8 : isFlipped && currentIndex < flashcards.length ? 0.3 : 0,
                    scale: dragX < -30 ? 1.2 : 1,
                  }}
                  className="text-red-400 -rotate-12 lg:-translate-x-20 -translate-y-24 sm:-translate-y-16 lg:translate-y-0"
                  transition={{ duration: 0.2 }}
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
                    opacity: dragX > 30 ? 0.8 : isFlipped && currentIndex < flashcards.length ? 0.3 : 0,
                    scale: dragX > 30 ? 1.2 : 1,
                  }}
                  className="text-green-400 rotate-12 lg:translate-x-20 -translate-y-24 sm:-translate-y-16 lg:translate-y-0"
                  transition={{ duration: 0.2 }}
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
                    className="relative w-full h-[500px] cursor-grab touch-pan-y z-30"
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
                            rotateZ: dragX * 0.1, // Rotação sutil baseada no drag
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
                    dragConstraints={{ left: -200, right: 200 }}
                    dragElastic={0.7}
                    onDrag={(e, info) => setDragX(info.offset.x)}
                    onDragEnd={(e, info) => {
                      setDragX(0);
                      handleDragEnd(e, info);
                    }}
                    whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
                    dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
                    transition={
                      shakeCard
                        ? {
                            duration: 0.5,
                            ease: 'easeInOut',
                          }
                        : {}
                    }
                    style={{
                      perspective: '1000px',
                      WebkitPerspective: '1000px',
                    }}
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
                        WebkitTransformStyle: 'preserve-3d',
                      }}
                      onClick={() =>
                        setIsFlipped(!isFlipped)
                      }
                    >
                      {/* Front (Question) */}
                      <motion.div
                        className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-dark to-primary rounded-2xl shadow-2xl border border-secondary/30 p-6 md:p-8 flex flex-col"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          MozBackfaceVisibility: 'hidden',
                          opacity: isFlipped ? 0 : 1,
                          pointerEvents: isFlipped ? 'none' : 'auto',
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

                        <div className="flex-1 flex flex-col items-center justify-center w-full overflow-hidden">
                          <p className="text-secondary text-sm font-semibold mb-4 uppercase tracking-wider">
                            {t('question')}
                          </p>

                          {currentCard.questionType ===
                          'TEXT' ? (
                            <p className="text-white text-xl leading-relaxed px-4">
                              {currentCard.questionText}
                            </p>
                          ) : (
                            <div className="relative w-full flex-1 max-h-[50vh] rounded-lg overflow-hidden pointer-events-none">
                              <Image
                                src={
                                  currentCard.questionImageUrl!
                                }
                                alt="Question"
                                fill
                                className="object-contain pointer-events-none select-none"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                              />
                            </div>
                          )}
                        </div>

                        <motion.p
                          className="mt-6 pb-4 text-gray-500 text-sm text-center"
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
                        className="absolute inset-0 w-full h-full bg-gradient-to-br from-secondary/20 to-accent-light/20 rounded-2xl shadow-2xl border border-secondary/30 p-6 md:p-8 flex flex-col"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          MozBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          WebkitTransform: 'rotateY(180deg)',
                          MozTransform: 'rotateY(180deg)',
                          opacity: isFlipped ? 1 : 0,
                          pointerEvents: isFlipped ? 'auto' : 'none',
                        }}
                        drag={false}
                      >
                        <div className="absolute top-6 right-6 bg-accent-light/20 rounded-full p-3">
                          <Check
                            size={24}
                            className="text-accent-light"
                          />
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center w-full overflow-hidden">
                          <p className="text-secondary text-sm font-semibold mb-4 uppercase tracking-wider">
                            {t('answer')}
                          </p>

                          {currentCard.answerType ===
                          'TEXT' ? (
                            <p className="text-white text-lg leading-relaxed px-4">
                              {currentCard.answerText}
                            </p>
                          ) : (
                            <div className="relative w-full flex-1 max-h-[50vh] rounded-lg overflow-hidden pointer-events-none">
                              <Image
                                src={
                                  currentCard.answerImageUrl!
                                }
                                alt="Answer"
                                fill
                                className="object-contain pointer-events-none select-none"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-6 pb-4 flex items-center gap-4 justify-center">
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
      
      {/* Support Floating Button with Flashcard Context */}
      {currentCard && (
        <SupportFloatingButton 
          context={{
            type: "FLASHCARD",
            id: currentCard.id,
            title: currentCard.questionText 
              ? `Flashcard: ${currentCard.questionText.substring(0, 50)}${currentCard.questionText.length > 50 ? '...' : ''}`
              : `Flashcard ${currentIndex + 1}`
          }}
        />
      )}
    </NavSidebar>
  );
}

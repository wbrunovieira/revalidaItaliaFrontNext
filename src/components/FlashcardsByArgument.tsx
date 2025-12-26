// src/components/FlashcardsByArgument.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Layers,
  ChevronRight,
  Search,
  Brain,
  AlertCircle,
  Loader2,
  BookOpen,
  TrendingUp,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/stores/auth.store';

// Types
interface Argument {
  id: string;
  title: string;
  assessmentId: string;
  createdAt: string;
  updatedAt: string;
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
}

interface ArgumentWithStats extends Argument {
  assessment?: Assessment;
  flashcardCount: number;
  completedCount: number;
  hardCount: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function FlashcardsByArgument() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('FlashcardProgress');
  const locale = params.locale as string;
  const { token, isAuthenticated } = useAuth();

  // States
  const [argumentsList, setArgumentsList] = useState<ArgumentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Fetch arguments with flashcard stats
  const fetchArguments = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      // Fetch arguments
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });

      const response = await fetch(`${API_URL}/api/v1/arguments?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch arguments');
      }

      const result = await response.json();
      
      // For each argument, fetch flashcard count
      const argumentsWithStats = await Promise.all(
        result.arguments.map(async (arg: Argument) => {
          try {
            // Fetch flashcard count for this argument (only enabled flashcards)
            const flashcardResponse = await fetch(
              `${API_URL}/api/v1/flashcards/by-argument/${arg.id}?limit=1&includeUserInteractions=true&enabledStatus=enabled`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (flashcardResponse.ok) {
              const flashcardData = await flashcardResponse.json();
              return {
                ...arg,
                flashcardCount: flashcardData.metadata?.totalFlashcards || 0,
                completedCount: flashcardData.metadata?.completedFlashcards || 0,
                hardCount: flashcardData.flashcards?.filter((f: { userInteraction?: { difficultyLevel: string } }) => 
                  f.userInteraction?.difficultyLevel === 'HARD'
                ).length || 0,
              };
            }
          } catch (err) {
            console.error(`Error fetching flashcard stats for argument ${arg.id}:`, err);
          }
          
          // Return argument without stats if fetch failed
          return {
            ...arg,
            flashcardCount: 0,
            completedCount: 0,
            hardCount: 0,
          };
        })
      );

      setArgumentsList(argumentsWithStats);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching arguments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load arguments');
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, page]);

  useEffect(() => {
    fetchArguments();
  }, [fetchArguments]);

  // Filter arguments based on search
  const filteredArguments = argumentsList.filter(arg =>
    arg.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate progress percentage
  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Get difficulty color
  const getDifficultyColor = (hardCount: number) => {
    if (hardCount === 0) return 'bg-green-500';
    if (hardCount <= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Handle card click - navigate to study page with argumentId
  const handleCardClick = (argumentId: string) => {
    router.push(`/${locale}/flashcards/study?argumentId=${argumentId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">{t('byArgument.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">{t('byArgument.error')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t('byArgument.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-primary-dark/50 border border-secondary/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary/50 transition-colors"
        />
      </div>

      {/* Arguments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredArguments.map((argument, index) => (
            <motion.div
              key={argument.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleCardClick(argument.id)}
              className="bg-primary-dark/50 backdrop-blur-lg rounded-xl p-6 border border-secondary/20 hover:border-secondary/40 cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white group-hover:text-secondary transition-colors line-clamp-2">
                    {argument.title}
                  </h3>
                  {argument.assessment && (
                    <p className="text-sm text-gray-400 mt-1">
                      {argument.assessment.title}
                    </p>
                  )}
                </div>
                <div className="ml-3">
                  <Layers className="w-6 h-6 text-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                {/* Total Flashcards */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <BookOpen size={16} />
                    <span>{t('byArgument.totalCards')}</span>
                  </div>
                  <span className="text-white font-medium">{argument.flashcardCount}</span>
                </div>

                {/* Progress Bar */}
                {argument.flashcardCount > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{t('byArgument.progress')}</span>
                      <span>{getProgressPercentage(argument.completedCount, argument.flashcardCount)}%</span>
                    </div>
                    <div className="w-full bg-primary-dark rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${getProgressPercentage(argument.completedCount, argument.flashcardCount)}%` 
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-secondary to-accent"
                      />
                    </div>
                  </div>
                )}

                {/* Difficulty Indicator */}
                {argument.hardCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Target size={16} />
                      <span>{t('byArgument.difficultCards')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{argument.hardCount}</span>
                      <div className={`w-2 h-2 rounded-full ${getDifficultyColor(argument.hardCount)}`} />
                    </div>
                  </div>
                )}

                {/* Completed Count */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <TrendingUp size={16} />
                    <span>{t('byArgument.completed')}</span>
                  </div>
                  <span className="text-green-400 font-medium">{argument.completedCount}</span>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <button className="w-full flex items-center justify-center gap-2 text-secondary group-hover:text-accent transition-colors">
                  <span className="text-sm font-medium">{t('byArgument.practiceNow')}</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredArguments.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">{t('byArgument.noArguments')}</p>
          <p className="text-gray-500 text-sm mt-2">{t('byArgument.tryAdjustingSearch')}</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 bg-primary-dark/50 rounded-lg text-gray-300 hover:bg-primary-dark/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pagination.previous')}
          </button>
          
          <span className="px-4 py-2 text-gray-300">
            {t('pagination.page', { current: page, total: pagination.totalPages })}
          </span>
          
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 bg-primary-dark/50 rounded-lg text-gray-300 hover:bg-primary-dark/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pagination.next')}
          </button>
        </div>
      )}
    </div>
  );
}
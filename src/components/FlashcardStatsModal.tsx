'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Brain, Trophy, Target, TrendingUp, Calendar, Clock, BarChart3, Loader2 } from 'lucide-react';
import { useFlashcardStats } from '@/hooks/useFlashcardStats';
import { cn } from '@/lib/utils';

interface FlashcardStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
}

export default function FlashcardStatsModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName 
}: FlashcardStatsModalProps) {
  const t = useTranslations('Tutor.flashcardStats');
  const { data, isLoading, error, refetch, getMasteryColor, getProgressPercentage } = useFlashcardStats({ 
    userId, 
    autoFetch: false 
  });

  useEffect(() => {
    if (isOpen && userId) {
      refetch();
    }
  }, [isOpen, userId, refetch]);

  if (!isOpen) return null;

  const renderMasteryBadge = (rate: number) => {
    const color = getMasteryColor(rate);
    return (
      <span className={cn('font-bold text-lg', color)}>
        {rate.toFixed(1)}%
      </span>
    );
  };

  const renderDifficultyBar = (easy: number, neutral: number, hard: number) => {
    const total = easy + neutral + hard;
    if (total === 0) return null;

    const easyPerc = (easy / total) * 100;
    const neutralPerc = (neutral / total) * 100;
    const hardPerc = (hard / total) * 100;

    return (
      <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden flex">
        {easyPerc > 0 && (
          <div 
            className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${easyPerc}%` }}
          >
            {easyPerc >= 15 && `${easy}`}
          </div>
        )}
        {neutralPerc > 0 && (
          <div 
            className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${neutralPerc}%` }}
          >
            {neutralPerc >= 15 && `${neutral}`}
          </div>
        )}
        {hardPerc > 0 && (
          <div 
            className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${hardPerc}%` }}
          >
            {hardPerc >= 15 && `${hard}`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="text-secondary" />
              {t('title')}
            </h2>
            {userName && (
              <p className="text-sm text-gray-400 mt-1">
                {t('studentName', { name: userName })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="animate-spin text-secondary" size={48} />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={refetch}
                className="mt-4 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors"
              >
                {t('retry')}
              </button>
            </div>
          ) : data ? (
            <div className="p-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Overall Progress */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">{t('overallProgress')}</span>
                    <Target className="text-secondary" size={20} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        {getProgressPercentage()}%
                      </span>
                      <span className="text-xs text-gray-500">
                        {data.summary.uniqueFlashcardsReviewed}/{data.summary.totalFlashcards}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-secondary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mastery Rate */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">{t('masteryRate')}</span>
                    <Trophy className="text-yellow-500" size={20} />
                  </div>
                  <div className="space-y-2">
                    {renderMasteryBadge(data.summary.overallMasteryRate)}
                    <div className="text-xs text-gray-500">
                      {t('totalInteractions', { count: data.summary.totalInteractions })}
                    </div>
                  </div>
                </div>

                {/* Study Streak */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">{t('studyStreak')}</span>
                    <TrendingUp className="text-green-500" size={20} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-white">
                      {data.summary.studyStreak} {t('days')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('totalResets', { count: data.summary.totalResets })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">{t('difficultyDistribution')}</h3>
                <div className="space-y-3">
                  {renderDifficultyBar(
                    data.summary.easyCount,
                    data.summary.neutralCount,
                    data.summary.hardCount
                  )}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-gray-400">{t('easy')}: {data.summary.easyCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-gray-400">{t('neutral')}: {data.summary.neutralCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-gray-400">{t('hard')}: {data.summary.hardCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Clock size={16} />
                  {t('recentActivity')}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {data.recentActivity.todayCount}
                    </div>
                    <div className="text-xs text-gray-500">{t('today')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {data.recentActivity.last7Days}
                    </div>
                    <div className="text-xs text-gray-500">{t('last7Days')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {data.recentActivity.last30Days}
                    </div>
                    <div className="text-xs text-gray-500">{t('last30Days')}</div>
                  </div>
                </div>
              </div>

              {/* Arguments Performance */}
              {data.argumentStats.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <BarChart3 size={16} />
                    {t('argumentPerformance')}
                  </h3>
                  <div className="space-y-3">
                    {data.argumentStats.map((arg) => (
                      <div key={arg.argumentId} className="border-b border-gray-800 pb-3 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{arg.argumentName}</h4>
                          {renderMasteryBadge(arg.masteryRate)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-2">
                          <div>
                            {t('reviewed')}: {arg.reviewedFlashcards}/{arg.totalFlashcards}
                          </div>
                          <div>
                            {t('progress')}: {Math.round((arg.reviewedFlashcards / arg.totalFlashcards) * 100)}%
                          </div>
                        </div>
                        {renderDifficultyBar(arg.easyCount, arg.neutralCount, arg.hardCount)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  X, Brain, Trophy, Target, TrendingUp, Calendar, Clock, BarChart3, 
  Loader2, ChevronRight, Activity, Award, Zap, Users, BookOpen,
  Timer, RefreshCw, Layers
} from 'lucide-react';
import { useFlashcardStats } from '@/hooks/useFlashcardStats';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';

interface FlashcardStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  locale?: string;
}

type TabType = 'overview' | 'timeline' | 'challenges' | 'patterns' | 'achievements';

export default function FlashcardStatsModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName,
  locale = 'pt'
}: FlashcardStatsModalProps) {
  const t = useTranslations('Tutor.flashcardStats');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [detailedView, setDetailedView] = useState(false);
  
  const { data, isLoading, error, refetch, getMasteryColor, getProgressPercentage } = useFlashcardStats({ 
    userId, 
    autoFetch: false
  });

  useEffect(() => {
    if (isOpen && userId) {
      refetch();
    }
  }, [isOpen, userId, refetch]);

  const loadDetailedAnalytics = () => {
    setDetailedView(true);
    refetch({
      detailed: true,
      include: ['timelineAnalytics', 'challengeAnalysis', 'studyPatterns', 'performanceMetrics', 'achievementSystem', 'consistencyScore'] as any
    });
  };

  const getDateLocale = () => {
    switch(locale) {
      case 'it': return it;
      case 'es': return es;
      default: return ptBR;
    }
  };

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

  const renderOverviewTab = () => (
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
                {data?.summary.uniqueFlashcardsReviewed}/{data?.summary.totalFlashcards}
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
            {renderMasteryBadge(data?.summary.overallMasteryRate || 0)}
            <div className="text-xs text-gray-500">
              {t('totalInteractions', { count: data?.summary.totalInteractions || 0 })}
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
              {data?.summary.studyStreak || 0} {t('days')}
            </div>
            <div className="text-xs text-gray-500">
              {t('totalResets', { count: data?.summary.totalResets || 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Difficulty Distribution */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">{t('difficultyDistribution')}</h3>
        <div className="space-y-3">
          {renderDifficultyBar(
            data?.summary.easyCount || 0,
            data?.summary.neutralCount || 0,
            data?.summary.hardCount || 0
          )}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-400">{t('easy')}: {data?.summary.easyCount || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-400">{t('neutral')}: {data?.summary.neutralCount || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-400">{t('hard')}: {data?.summary.hardCount || 0}</span>
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
              {data?.recentActivity.todayCount || 0}
            </div>
            <div className="text-xs text-gray-500">{t('today')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {data?.recentActivity.last7Days || 0}
            </div>
            <div className="text-xs text-gray-500">{t('last7Days')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {data?.recentActivity.last30Days || 0}
            </div>
            <div className="text-xs text-gray-500">{t('last30Days')}</div>
          </div>
        </div>
      </div>

      {/* Arguments Performance */}
      {data?.argumentStats && data.argumentStats.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <BarChart3 size={16} />
            {t('argumentPerformance')}
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
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
  );

  const renderTimelineTab = () => {
    const timeline = data?.detailed?.timelineAnalytics;
    if (!timeline) {
      return (
        <div className="p-6 text-center">
          <button
            onClick={loadDetailedAnalytics}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors"
          >
            {t('loadDetailedAnalytics')}
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">{t('studyTimeline')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">{t('firstInteraction')}</div>
              <div className="text-white">
                {timeline.firstInteraction ? format(parseISO(timeline.firstInteraction), 'PPP', { locale: getDateLocale() }) : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('lastInteraction')}</div>
              <div className="text-white">
                {timeline.lastInteraction ? format(parseISO(timeline.lastInteraction), 'PPP', { locale: getDateLocale() }) : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('totalDaysActive')}</div>
              <div className="text-white">{timeline.totalDaysActive || 0} {t('days')}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('avgSessionsPerDay')}</div>
              <div className="text-white">{timeline.averageSessionsPerDay?.toFixed(1) || '0.0'}</div>
            </div>
          </div>
        </div>

        {timeline.monthlyProgress && timeline.monthlyProgress.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('monthlyProgress')}</h3>
            <div className="space-y-3">
              {timeline.monthlyProgress.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-white">{month.month}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      {month.interactions} {t('interactions')}
                    </span>
                    <span className="text-gray-400">
                      {month.uniqueFlashcards} {t('cards')}
                    </span>
                    {renderMasteryBadge(month.masteryRate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChallengesTab = () => {
    const challenges = data?.detailed?.challengeAnalysis;
    if (!challenges) {
      return (
        <div className="p-6 text-center">
          <button
            onClick={loadDetailedAnalytics}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors"
          >
            {t('loadDetailedAnalytics')}
          </button>
        </div>
      );
    }

    // Check if there's any data to display
    const hasData = 
      (challenges.mostChallenging && challenges.mostChallenging.length > 0) ||
      (challenges.easiest && challenges.easiest.length > 0) ||
      challenges.difficultyDistribution;

    if (!hasData) {
      return (
        <div className="p-6 text-center">
          <div className="bg-gray-900 rounded-lg p-8">
            <Zap className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-400 mb-2">{t('noDataTitle')}</h3>
            <p className="text-sm text-gray-500">{t('noDataDescription')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        {/* Most Challenging */}
        {challenges.mostChallenging && challenges.mostChallenging.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('mostChallenging')}</h3>
            <div className="space-y-2">
              {challenges.mostChallenging.slice(0, 5).map((card) => (
                <div key={card.flashcardId} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-white text-sm truncate flex-1">{card.question}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-400">{(card.failureRate * 100).toFixed(0)}% {t('failRate')}</span>
                    <span className="text-gray-500">{card.attempts} {t('attempts')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Easiest */}
        {challenges.easiest && challenges.easiest.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('easiest')}</h3>
            <div className="space-y-2">
              {challenges.easiest.slice(0, 5).map((card) => (
                <div key={card.flashcardId} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-white text-sm truncate flex-1">{card.question}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">{(card.successRate * 100).toFixed(0)}% {t('successRate')}</span>
                    <span className="text-gray-500">{card.attempts} {t('attempts')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Distribution */}
        {challenges.difficultyDistribution && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('difficultyBreakdown')}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-400">{t('easy')}</span>
                <span className="text-white">{challenges.difficultyDistribution.easy}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400">{t('medium')}</span>
                <span className="text-white">{challenges.difficultyDistribution.medium}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-400">{t('hard')}</span>
                <span className="text-white">{challenges.difficultyDistribution.hard}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPatternsTab = () => {
    const patterns = data?.detailed?.studyPatterns;
    const performance = data?.detailed?.performanceMetrics;
    const consistency = data?.detailed?.consistencyScore;

    if (!patterns && !performance && !consistency) {
      return (
        <div className="p-6 text-center">
          <button
            onClick={loadDetailedAnalytics}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors"
          >
            {t('loadDetailedAnalytics')}
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        {/* Study Patterns */}
        {patterns && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('studyPatterns')}</h3>
            
            {/* Preferred Times */}
            <div className="mb-4">
              <h4 className="text-xs text-gray-500 mb-2">{t('preferredTimes')}</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-gray-800 rounded">
                  <div className="text-xs text-gray-400">{t('morning')}</div>
                  <div className="text-white font-bold">{((patterns.preferredTimes?.morning || 0) * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center p-2 bg-gray-800 rounded">
                  <div className="text-xs text-gray-400">{t('afternoon')}</div>
                  <div className="text-white font-bold">{((patterns.preferredTimes?.afternoon || 0) * 100).toFixed(0)}%</div>
                </div>
                <div className="text-center p-2 bg-gray-800 rounded">
                  <div className="text-xs text-gray-400">{t('evening')}</div>
                  <div className="text-white font-bold">{((patterns.preferredTimes?.evening || 0) * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>

            {/* Peak Hours */}
            {patterns.peakHours && patterns.peakHours.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 mb-2">{t('peakHours')}</h4>
                <div className="flex gap-2">
                  {patterns.peakHours.map((hour) => (
                    <span key={hour} className="px-2 py-1 bg-secondary/20 text-secondary rounded text-sm">
                      {hour}:00
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Metrics */}
        {performance && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('performanceMetrics')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">{t('improvementRate')}</div>
                <div className="text-white">{((performance.improvementRate || 0) * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{t('avgTimePerCard')}</div>
                <div className="text-white">{performance.averageTimePerCard?.toFixed(1) || '0.0'}s</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500">{t('accuracyTrend')}</div>
                <div className={cn(
                  "text-white font-medium",
                  performance.accuracyTrend === 'improving' && 'text-green-400',
                  performance.accuracyTrend === 'declining' && 'text-red-400'
                )}>
                  {performance.accuracyTrend ? t(`trend.${performance.accuracyTrend}`) : t('trend.stable')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consistency Score */}
        {consistency && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('consistencyScore')}</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white">{t('overallScore')}</span>
                <span className="text-2xl font-bold text-secondary">{consistency.score || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-secondary h-3 rounded-full"
                  style={{ width: `${consistency.score || 0}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-500">{t('currentStreak')}</div>
                <div className="text-white">{consistency.currentStreak || 0} {t('days')}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{t('longestStreak')}</div>
                <div className="text-white">{consistency.longestStreak || 0} {t('days')}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{t('consistency30Days')}</div>
                <div className="text-white">{((consistency.consistency30Days || 0) * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">{t('missedDays')}</div>
                <div className="text-white">{consistency.missedDays || 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAchievementsTab = () => {
    const achievements = data?.detailed?.achievementSystem;
    if (!achievements) {
      return (
        <div className="p-6 text-center">
          <button
            onClick={loadDetailedAnalytics}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors"
          >
            {t('loadDetailedAnalytics')}
          </button>
        </div>
      );
    }

    const hasAchievements = 
      (achievements.unlockedAchievements && achievements.unlockedAchievements.length > 0) ||
      (achievements.nextAchievements && achievements.nextAchievements.length > 0) ||
      achievements.totalPoints > 0;

    if (!hasAchievements) {
      return (
        <div className="p-6 text-center">
          <div className="bg-gray-900 rounded-lg p-8">
            <Award className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-400 mb-2">{t('noAchievementsTitle')}</h3>
            <p className="text-sm text-gray-500">{t('noAchievementsDescription')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        {/* Total Points */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">{t('totalPoints')}</h3>
            <div className="flex items-center gap-2">
              <Award className="text-yellow-500" size={24} />
              <span className="text-2xl font-bold text-white">{achievements.totalPoints || 0}</span>
            </div>
          </div>
        </div>

        {/* Unlocked Achievements */}
        {achievements.unlockedAchievements && achievements.unlockedAchievements.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('unlockedAchievements')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.unlockedAchievements.map((achievement) => (
                <div key={achievement.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <Trophy className="text-yellow-500 mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{achievement.name}</h4>
                      <p className="text-xs text-gray-400">{achievement.description}</p>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {format(parseISO(achievement.unlockedAt), 'PPp', { locale: getDateLocale() })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Achievements */}
        {achievements.nextAchievements && achievements.nextAchievements.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('nextAchievements')}</h3>
            <div className="space-y-3">
              {achievements.nextAchievements.map((achievement) => (
                <div key={achievement.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <Trophy className="text-gray-500 mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{achievement.name}</h4>
                      <p className="text-xs text-gray-400">{achievement.description}</p>
                      {achievement.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{t('progress')}</span>
                            <span>{(achievement.progress * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-secondary h-2 rounded-full"
                              style={{ width: `${achievement.progress * 100}%` }}
                            />
                          </div>
                          {achievement.remaining && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('remaining', { count: achievement.remaining })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'overview' as TabType, label: t('tabOverview'), icon: BarChart3 },
    { id: 'timeline' as TabType, label: t('tabTimeline'), icon: Activity },
    { id: 'challenges' as TabType, label: t('tabChallenges'), icon: Zap },
    { id: 'patterns' as TabType, label: t('tabPatterns'), icon: Layers },
    { id: 'achievements' as TabType, label: t('tabAchievements'), icon: Award },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDetailedView(!detailedView)}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm transition-colors",
                  detailedView 
                    ? "bg-secondary text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                )}
              >
                {detailedView ? t('detailedView') : t('basicView')}
              </button>
              <button
                onClick={() => {
                  setDetailedView(false);
                  setActiveTab('overview');
                  onClose();
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 -mb-px overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-gray-900 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
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
            <>
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'timeline' && renderTimelineTab()}
              {activeTab === 'challenges' && renderChallengesTab()}
              {activeTab === 'patterns' && renderPatternsTab()}
              {activeTab === 'achievements' && renderAchievementsTab()}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
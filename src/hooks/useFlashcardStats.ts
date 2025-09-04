'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCookie } from '@/lib/auth-utils';

export interface ArgumentStat {
  argumentId: string;
  argumentName: string;
  totalFlashcards: number;
  reviewedFlashcards: number;
  easyCount: number;
  hardCount: number;
  neutralCount: number;
  masteryRate: number;
}

export interface FlashcardStatsSummary {
  totalFlashcards: number;
  totalInteractions: number;
  uniqueFlashcardsReviewed: number;
  easyCount: number;
  hardCount: number;
  neutralCount: number;
  overallMasteryRate: number;
  studyStreak: number;
  totalResets: number;
}

export interface RecentActivity {
  todayCount: number;
  last7Days: number;
  last30Days: number;
}

// Detailed Analytics Interfaces
export interface TimelineAnalytics {
  firstInteraction: string;
  lastInteraction: string;
  totalDaysActive: number;
  averageSessionsPerDay: number;
  monthlyProgress: Array<{
    month: string;
    interactions: number;
    uniqueFlashcards: number;
    masteryRate: number;
  }>;
}

export interface ChallengeAnalysis {
  mostChallenging: Array<{
    flashcardId: string;
    question: string;
    failureRate: number;
    attempts: number;
  }>;
  easiest: Array<{
    flashcardId: string;
    question: string;
    successRate: number;
    attempts: number;
  }>;
  improvementNeeded: Array<{
    flashcardId: string;
    question: string;
    currentMastery: number;
  }>;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface StudyPatterns {
  preferredTimes: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  weekdayDistribution: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  peakHours: number[];
}

export interface PerformanceMetrics {
  improvementRate: number;
  averageTimePerCard: number;
  accuracyTrend: 'improving' | 'stable' | 'declining';
  performanceByWeek: Array<{
    week: string;
    masteryRate: number;
    totalReviews: number;
  }>;
}

export interface RetentionAnalysis {
  shortTermRetention: number;
  longTermRetention: number;
  forgettingCurve: Array<{
    day: number;
    retention: number;
  }>;
  optimalReviewInterval: number;
}

export interface ConsistencyScore {
  score: number;
  currentStreak: number;
  longestStreak: number;
  missedDays: number;
  consistency30Days: number;
  consistency90Days: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt?: string;
  progress?: number;
  remaining?: number;
}

export interface AchievementSystem {
  unlockedAchievements: Achievement[];
  nextAchievements: Achievement[];
  totalPoints: number;
}

export interface DetailedAnalytics {
  timelineAnalytics?: TimelineAnalytics;
  challengeAnalysis?: ChallengeAnalysis;
  studyPatterns?: StudyPatterns;
  performanceMetrics?: PerformanceMetrics;
  retentionAnalysis?: RetentionAnalysis;
  consistencyScore?: ConsistencyScore;
  achievementSystem?: AchievementSystem;
}

export interface FlashcardStatsData {
  summary: FlashcardStatsSummary;
  argumentStats: ArgumentStat[];
  recentActivity: RecentActivity;
  detailed?: DetailedAnalytics;
}

export type AnalyticsSection = 
  | 'timelineAnalytics'
  | 'challengeAnalysis' 
  | 'studyPatterns'
  | 'performanceMetrics'
  | 'retentionAnalysis'
  | 'consistencyScore'
  | 'achievementSystem';

interface UseFlashcardStatsParams {
  userId?: string;
  autoFetch?: boolean;
}

export function useFlashcardStats({ userId, autoFetch = true }: UseFlashcardStatsParams = {}) {
  const [data, setData] = useState<FlashcardStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (options?: { detailed?: boolean; include?: AnalyticsSection[] }) => {
    let url = '';
    try {
      setIsLoading(true);
      setError(null);
      
      const token = getCookie('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const params = new URLSearchParams();
      
      if (userId) {
        params.append('userId', userId);
      }
      
      if (options?.detailed) {
        params.append('detailed', 'true');
      }
      
      if (options?.include && options.include.length > 0) {
        params.append('include', options.include.join(','));
      }

      url = params.toString() 
        ? `${apiUrl}/api/v1/flashcards/stats/user?${params.toString()}`
        : `${apiUrl}/api/v1/flashcards/stats/user`;

      console.log('Fetching flashcard stats from:', url);
      console.log('With params:', { userId, ...options });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error response body:', errorBody);
        
        if (response.status === 403) {
          throw new Error('You do not have permission to view these statistics');
        }
        throw new Error(`Failed to fetch flashcard statistics: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      setData(result.data || result);
      setError(null);
    } catch (err) {
      console.error('Error fetching flashcard stats:', err);
      console.error('Full error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        url,
        token: getCookie('token') ? 'Present' : 'Missing'
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [autoFetch, fetchStats]);

  const getMasteryLevel = (rate: number): 'high' | 'medium' | 'low' => {
    if (rate > 70) return 'high';
    if (rate >= 40) return 'medium';
    return 'low';
  };

  const getMasteryColor = (rate: number): string => {
    if (rate > 70) return 'text-green-500';
    if (rate >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressPercentage = (): number => {
    if (!data?.summary) return 0;
    const { totalFlashcards, uniqueFlashcardsReviewed } = data.summary;
    if (totalFlashcards === 0) return 0;
    return Math.round((uniqueFlashcardsReviewed / totalFlashcards) * 100);
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchStats,
    getMasteryLevel,
    getMasteryColor,
    getProgressPercentage,
  };
}
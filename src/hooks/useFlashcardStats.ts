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

export interface FlashcardStatsData {
  summary: FlashcardStatsSummary;
  argumentStats: ArgumentStat[];
  recentActivity: RecentActivity;
}

interface UseFlashcardStatsParams {
  userId?: string;
  autoFetch?: boolean;
}

export function useFlashcardStats({ userId, autoFetch = true }: UseFlashcardStatsParams = {}) {
  const [data, setData] = useState<FlashcardStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
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

      const url = params.toString() 
        ? `${apiUrl}/api/v1/flashcards/stats/user?${params.toString()}`
        : `${apiUrl}/api/v1/flashcards/stats/user`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to view these statistics');
        }
        throw new Error(`Failed to fetch flashcard statistics: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result.data || result);
      setError(null);
    } catch (err) {
      console.error('Error fetching flashcard stats:', err);
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
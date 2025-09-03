import { useState, useEffect, useCallback } from 'react';
import { getCookie } from '@/lib/auth-utils';

// Interface for User Metrics
interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: {
    students: number;
    tutors: number;
    admins: number;
  };
  onlineNow: number;
  recentLogins: number;
  growthRate: number;
}

// Interface for Engagement Metrics
interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  coursesInProgress: number;
  lessonsCompletedToday: number;
  averageCourseProgress: number;
  flashcardsAnsweredToday: number;
  flashcardsAccuracyRate: number;
}

// Interface for Content Metrics
interface ContentMetrics {
  totalCourses: number;
  totalModules: number;
  totalLessons: number;
  totalVideoDuration: number;
  totalPosts: number;
  postsToday: number;
  totalComments: number;
  activeDiscussions: number;
  totalDocuments: number;
  totalFlashcards: number;
}

// Interface for Billing Metrics
interface BillingMetrics {
  activeSubscriptions: number;
  newSubscriptionsToday: number;
  churnedThisMonth: number;
  revenueToday: number;
  revenueThisMonth: number;
  averageTicketValue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    salesCount: number;
    revenue: number;
  }>;
  conversionRate: number;
}

// Interface for Support Metrics
interface SupportMetrics {
  openTickets: number;
  pendingTickets: number;
  resolvedToday: number;
  averageResponseTime: number;
  satisfactionRate: number;
}

// Interface for System Metrics
interface SystemMetrics {
  systemHealth: 'healthy' | 'warning' | 'critical';
  activeJobs: number;
  failedJobsToday: number;
  storageUsed: number;
  bandwidthUsedThisMonth: number;
  activeLiveSessions: number;
  scheduledSessions: number;
}

// Interface for Trends
interface Trend {
  metric: string;
  change: number;
  period: string;
  type: 'positive' | 'negative' | 'neutral';
}

// Interface for Alerts
interface Alert {
  type: 'warning' | 'info' | 'error';
  message: string;
  metric: string;
  timestamp: string;
}

// Interface for Top Students
interface TopStudent {
  userId: string;
  name: string;
  email: string;
  coursesCompleted: number;
  totalProgress: number;
  lastActivity: string;
}

// Interface for Top Courses
interface TopCourse {
  courseId: string;
  title: string;
  enrollments: number;
  completionRate: number;
  averageRating: number;
}

// Interface for Top Posts
interface TopPost {
  postId: string;
  title: string;
  authorName: string;
  reactions: number;
  comments: number;
  views: number;
}

// Interface for Insights
interface Insights {
  trends: Trend[];
  alerts: Alert[];
  topStudents: TopStudent[];
  topCourses: TopCourse[];
  topPosts: TopPost[];
}

// Main Dashboard Overview Response
export interface DashboardOverviewResponse {
  users: UserMetrics;
  engagement: EngagementMetrics;
  content: ContentMetrics;
  billing: BillingMetrics;
  support: SupportMetrics;
  system: SystemMetrics;
  insights: Insights;
  generatedAt: string;
}

// Query Parameters
export type PeriodType = 'today' | 'week' | 'month' | 'year' | 'all';

interface UseDashboardOverviewParams {
  period?: PeriodType;
  includeSystemMetrics?: boolean;
}

// Hook Return Type
interface UseDashboardOverviewReturn {
  data: DashboardOverviewResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardOverview({
  period = 'month',
  includeSystemMetrics = true,
}: UseDashboardOverviewParams = {}): UseDashboardOverviewReturn {
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getCookie('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('period', period);
      params.append('includeSystemMetrics', includeSystemMetrics.toString());

      const response = await fetch(
        `${apiUrl}/api/v1/admin/dashboard/overview?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login again');
        } else if (response.status === 403) {
          throw new Error('Forbidden - Admin access required');
        } else {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }
      }

      const responseData = await response.json();
      console.log('Dashboard API Response:', responseData);
      setData(responseData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, includeSystemMetrics]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
}
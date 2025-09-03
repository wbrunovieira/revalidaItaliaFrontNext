'use client';

import { useTranslations } from 'next-intl';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Activity,
  DollarSign,
  HeadphonesIcon,
  ServerIcon,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Video,
  FileText,
  Layers,
  MessageSquare,
  Trophy,
  Star,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ClipboardList,
  Target,
  Award,
} from 'lucide-react';
import { useDashboardOverview } from '@/hooks/useDashboardOverview';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}

interface SectionData {
  title: string;
  cards: StatCard[];
}

export default function DashboardStats() {
  const t = useTranslations('Admin.dashboard');
  const ts = useTranslations('Admin.dashboardSections');
  const { data, isLoading, error, refetch } = useDashboardOverview();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Format numbers with locale formatting
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentage change
  const calculateChange = (current: number, growth: number): string => {
    if (growth > 0) return `+${growth.toFixed(1)}%`;
    if (growth < 0) return `${growth.toFixed(1)}%`;
    return '0%';
  };

  // Determine change type
  const getChangeType = (value: number): 'positive' | 'negative' | 'neutral' => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-400">{ts('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="text-red-500 mt-1" size={20} />
          <div className="flex-1">
            <h3 className="text-red-400 font-semibold mb-2">{ts('error')}</h3>
            <p className="text-gray-300 text-sm">{error}</p>
            <button
              onClick={refetch}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              {ts('errorRetry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{ts('noData')}</p>
      </div>
    );
  }

  // Prepare sections data
  const sections: SectionData[] = [
    {
      title: ts('userMetrics'),
      cards: [
        {
          title: t('stats.totalUsers'),
          value: formatNumber(data.users.totalUsers),
          icon: Users,
          change: calculateChange(data.users.totalUsers, data.users.growthRate),
          changeType: getChangeType(data.users.growthRate),
          subtitle: `${data.users.activeUsers} ${ts('stats.active')}`,
        },
        {
          title: ts('stats.onlineNow'),
          value: formatNumber(data.users.onlineNow),
          icon: Activity,
          subtitle: `${data.users.recentLogins} ${ts('stats.recentLogins')}`,
        },
        {
          title: ts('stats.newUsersToday'),
          value: formatNumber(data.users.newUsersToday),
          icon: GraduationCap,
          subtitle: `${data.users.newUsersThisWeek} ${ts('stats.thisWeek')}`,
        },
        {
          title: ts('stats.userGrowth'),
          value: `${data.users.growthRate.toFixed(1)}%`,
          icon: TrendingUp,
          changeType: getChangeType(data.users.growthRate),
          subtitle: `${data.users.newUsersThisMonth} ${ts('stats.newThisMonth')}`,
        },
      ],
    },
    {
      title: ts('engagement'),
      cards: [
        {
          title: ts('stats.dailyActiveUsers'),
          value: formatNumber(data.engagement.dailyActiveUsers),
          icon: Activity,
          subtitle: `${formatNumber(data.engagement.monthlyActiveUsers)} ${ts('stats.mau')}`,
        },
        {
          title: ts('stats.coursesInProgress'),
          value: formatNumber(data.engagement.coursesInProgress),
          icon: BookOpen,
          subtitle: `${ts('stats.avgComplete')} ${data.engagement.averageCourseProgress.toFixed(0)}% ${ts('stats.complete')}`,
        },
        {
          title: ts('stats.lessonsToday'),
          value: formatNumber(data.engagement.lessonsCompletedToday),
          icon: CheckCircle,
          subtitle: `${formatNumber(data.engagement.weeklyActiveUsers)} ${ts('stats.wau')}`,
        },
        {
          title: ts('stats.flashcardsToday'),
          value: formatNumber(data.engagement.flashcardsAnsweredToday),
          icon: Layers,
          subtitle: `${data.engagement.flashcardsAccuracyRate.toFixed(0)}% ${ts('stats.accuracy')}`,
        },
      ],
    },
    {
      title: ts('content'),
      cards: [
        {
          title: t('stats.totalCourses'),
          value: formatNumber(data.content.totalCourses),
          icon: BookOpen,
          subtitle: `${data.content.totalModules} ${ts('stats.modules')}`,
        },
        {
          title: ts('stats.totalLessons'),
          value: formatNumber(data.content.totalLessons),
          icon: FileText,
          subtitle: `${data.content.totalDocuments} ${ts('stats.documents')}`,
        },
        {
          title: ts('stats.videoContent'),
          value: `${data.content.totalVideoDuration.toFixed(0)}h`,
          icon: Video,
          subtitle: ts('stats.totalDuration'),
        },
        {
          title: ts('stats.communityPosts'),
          value: formatNumber(data.content.totalPosts),
          icon: MessageSquare,
          subtitle: `${data.content.activeDiscussions} ${ts('stats.activeDiscussions')}`,
        },
      ],
    },
    {
      title: ts('billing'),
      cards: [
        {
          title: ts('stats.revenueToday'),
          value: formatCurrency(data.billing.revenueToday),
          icon: DollarSign,
          changeType: 'positive',
          subtitle: formatCurrency(data.billing.revenueThisMonth) + ' ' + ts('stats.thisMonth'),
        },
        {
          title: ts('stats.activeSubscriptions'),
          value: formatNumber(data.billing.activeSubscriptions),
          icon: Star,
          subtitle: `${data.billing.newSubscriptionsToday} ${ts('stats.newToday')}`,
        },
        {
          title: ts('stats.avgTicketValue'),
          value: formatCurrency(data.billing.averageTicketValue),
          icon: Trophy,
          subtitle: `${data.billing.conversionRate.toFixed(0)}% ${ts('stats.conversion')}`,
        },
        {
          title: ts('stats.churnRate'),
          value: data.billing.churnedThisMonth,
          icon: XCircle,
          changeType: 'negative',
          subtitle: ts('stats.canceledThisMonth'),
        },
      ],
    },
    {
      title: ts('support'),
      cards: [
        {
          title: ts('stats.openTickets'),
          value: data.support.openTickets,
          icon: HeadphonesIcon,
          subtitle: `${data.support.pendingTickets} ${ts('stats.pending')}`,
        },
        {
          title: ts('stats.responseTime'),
          value: `${data.support.averageResponseTime.toFixed(1)}h`,
          icon: Clock,
          subtitle: `${data.support.satisfactionRate.toFixed(0)}% ${ts('stats.satisfaction')}`,
        },
        {
          title: ts('stats.systemHealth'),
          value: data.system.systemHealth,
          icon: ServerIcon,
          changeType: data.system.systemHealth === 'healthy' ? 'positive' : data.system.systemHealth === 'critical' ? 'negative' : 'neutral',
          subtitle: `${data.system.activeJobs} ${ts('stats.activeJobs')}`,
        },
        {
          title: ts('stats.liveSessions'),
          value: data.system.activeLiveSessions,
          icon: Zap,
          subtitle: `${data.system.scheduledSessions} ${ts('stats.scheduled')}`,
        },
      ],
    },
  ];

  // Add Assessment section if data exists
  if (data.assessment) {
    sections.push({
      title: ts('assessments'),
      cards: [
        {
          title: ts('stats.totalAssessments'),
          value: formatNumber(data.assessment.totalAssessments),
          icon: ClipboardList,
          subtitle: `${data.assessment.assessmentsByType.quiz} ${ts('stats.quiz')}, ${data.assessment.assessmentsByType.simulado} ${ts('stats.simulado')}`,
        },
        {
          title: ts('stats.totalAttempts'),
          value: formatNumber(data.assessment.totalAttempts),
          icon: Target,
          subtitle: `${data.assessment.attemptsInProgress} ${ts('stats.inProgress')}`,
        },
        {
          title: ts('stats.completionRate'),
          value: `${data.assessment.completionRate.toFixed(1)}%`,
          icon: CheckCircle,
          changeType: data.assessment.completionRate >= 70 ? 'positive' : data.assessment.completionRate >= 50 ? 'neutral' : 'negative',
          subtitle: `${data.assessment.passingRate.toFixed(1)}% ${ts('stats.passingRate')}`,
        },
        {
          title: ts('stats.averageScore'),
          value: `${data.assessment.averageScore.toFixed(1)}%`,
          icon: Award,
          changeType: data.assessment.averageScore >= 70 ? 'positive' : data.assessment.averageScore >= 50 ? 'neutral' : 'negative',
          subtitle: `${data.assessment.pendingReviews} ${ts('stats.pendingReviews')}`,
        },
      ],
    });
  }

  return (
    <div>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">
          {t('title')}
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? ts('refreshing') : ts('refresh')}
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h4 className="text-lg font-medium text-gray-300 mb-4">
              {section.title}
            </h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {section.cards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div
                    key={index}
                    className="rounded-lg bg-gray-700/50 p-6 shadow-lg transition-all hover:bg-gray-700 border border-gray-700 hover:border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">
                          {card.title}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-white">
                          {card.value}
                        </p>
                        {card.change && (
                          <p
                            className={cn(
                              "mt-1 text-sm flex items-center gap-1",
                              card.changeType === 'positive' && "text-green-400",
                              card.changeType === 'negative' && "text-red-400",
                              card.changeType === 'neutral' && "text-gray-400"
                            )}
                          >
                            {card.changeType === 'positive' && <ArrowUpRight className="h-3 w-3" />}
                            {card.changeType === 'negative' && <ArrowDownRight className="h-3 w-3" />}
                            {card.change}
                          </p>
                        )}
                        {card.subtitle && (
                          <p className="mt-2 text-xs text-gray-500">
                            {card.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="rounded-full bg-secondary/20 p-3 ml-4">
                        <Icon
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Insights Section */}
      {data.insights && (
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-300 mb-4">{ts('insights')}</h4>
          
          {/* Alerts */}
          {data.insights.alerts && data.insights.alerts.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              {data.insights.alerts.slice(0, 4).map((alert, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg p-4 border",
                    alert.type === 'warning' && "bg-yellow-900/20 border-yellow-500/50",
                    alert.type === 'info' && "bg-blue-900/20 border-blue-500/50",
                    alert.type === 'error' && "bg-red-900/20 border-red-500/50"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <AlertCircle
                      className={cn(
                        "mt-1",
                        alert.type === 'warning' && "text-yellow-500",
                        alert.type === 'info' && "text-blue-500",
                        alert.type === 'error' && "text-red-500"
                      )}
                      size={16}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top Performers Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Top Students */}
            {data.insights.topStudents && data.insights.topStudents.length > 0 && (
              <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-700">
                <h5 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  {ts('topPerformers.topStudents')}
                </h5>
                <div className="space-y-3">
                  {data.insights.topStudents.slice(0, 3).map((student, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{student.name}</p>
                        <p className="text-xs text-gray-500">
                          {student.coursesCompleted} {ts('topPerformers.courses')} • {student.totalProgress}% {ts('topPerformers.progress')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Courses */}
            {data.insights.topCourses && data.insights.topCourses.length > 0 && (
              <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-700">
                <h5 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Top Courses
                </h5>
                <div className="space-y-3">
                  {data.insights.topCourses.slice(0, 3).map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{course.title}</p>
                        <p className="text-xs text-gray-500">
                          {course.enrollments} enrolled • {course.completionRate}% completion
                        </p>
                      </div>
                      <div className="text-xs text-yellow-500">
                        ★ {course.averageRating.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Posts */}
            {data.insights.topPosts && data.insights.topPosts.length > 0 && (
              <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-700">
                <h5 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-purple-500" />
                  {ts('topPerformers.trendingPosts')}
                </h5>
                <div className="space-y-3">
                  {data.insights.topPosts.slice(0, 3).map((post, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{post.title}</p>
                        <p className="text-xs text-gray-500">
                          {post.views} {ts('topPerformers.views')} • {post.comments} {ts('topPerformers.comments')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Assessments - Second Row */}
          {data.assessment && data.assessment.topAssessments && data.assessment.topAssessments.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {data.assessment.topAssessments.slice(0, 3).map((assessment, index) => (
                <div key={index} className="bg-gray-700/30 rounded-lg p-6 border border-gray-700">
                  <h5 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    {index === 1 && <Award className="h-4 w-4 text-gray-400" />}
                    {index === 2 && <Award className="h-4 w-4 text-orange-600" />}
                    {ts('topPerformers.topAssessment')} #{index + 1}
                  </h5>
                  <div className="space-y-2">
                    <p className="text-sm text-white font-medium truncate">{assessment.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-gray-600 rounded-full text-gray-300">
                        {assessment.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {assessment.attempts} {ts('topPerformers.attempts')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-600">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">{ts('topPerformers.completion')}</span>
                        <span className="text-white">{assessment.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-400">{ts('topPerformers.avgScore')}</span>
                        <span className={cn(
                          "font-medium",
                          assessment.averageScore >= 70 ? "text-green-400" : 
                          assessment.averageScore >= 50 ? "text-yellow-400" : "text-red-400"
                        )}>
                          {assessment.averageScore.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      {data.generatedAt && (
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            <Calendar className="inline h-3 w-3 mr-1" />
            {ts('lastUpdated')}: {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

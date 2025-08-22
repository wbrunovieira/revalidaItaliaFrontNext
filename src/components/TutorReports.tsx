'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  MessageSquare,
  FileText,
  User,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Eye,
  ChevronRight,
  ChevronLeft,
  Shield,
  MessageCircle,
  Mail,
  AlertOctagon,
  Gavel,
} from 'lucide-react';
import ReviewReportModal from './ReviewReportModal';

// Types according to API documentation
type ReportReason = 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'OFFENSIVE_LANGUAGE' | 'HARASSMENT' | 'OTHER';
type ReportType = 'POST' | 'COMMENT';
type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

interface Reporter {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
}

interface Author {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
  role: string;
}

interface PostContent {
  id: string;
  title: string | null;
  content: string;
  slug: string;
  author: Author;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  reportCount: number;
  lessonId: string | null;
}

interface CommentContent {
  id: string;
  content: string;
  postId: string;
  postTitle: string;
  parentId: string | null;
  author: Author;
  createdAt: string;
  reactionCount: number;
  reportCount: number;
}

interface Report {
  id: string;
  type: ReportType;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: Reporter;
  content: PostContent | CommentContent;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReportsResponse {
  reports: Report[];
  meta: PaginationMeta;
}

interface TutorReportsProps {
  locale: string;
}

// Helper function to check if content is PostContent
function isPostContent(content: PostContent | CommentContent): content is PostContent {
  return 'title' in content && 'slug' in content;
}

export default function TutorReports({ locale }: TutorReportsProps) {
  const { toast } = useToast();
  const t = useTranslations('Tutor.reports');
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonFilter, setReasonFilter] = useState<ReportReason | 'ALL'>('ALL');
  const [contentTypeFilter, setContentTypeFilter] = useState<'POST' | 'COMMENT' | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  const fetchReports = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      // Only add contentType if it's not 'ALL'
      if (contentTypeFilter !== 'ALL') {
        params.append('contentType', contentTypeFilter);
      }

      if (reasonFilter !== 'ALL') {
        params.append('reason', reasonFilter);
      }

      const url = `${apiUrl}/api/v1/community/reports?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        if (response.status === 403) {
          throw new Error('Forbidden');
        }
        throw new Error('Failed to fetch reports');
      }

      const data: ReportsResponse = await response.json();
      setReports(data.reports || []);
      setCurrentPage(data.meta.page);
      setTotalPages(data.meta.totalPages);
      setTotalReports(data.meta.total);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl, contentTypeFilter, reasonFilter, toast, t]);

  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage, contentTypeFilter, reasonFilter, fetchReports]);

  const getReasonIcon = (reason: ReportReason) => {
    switch (reason) {
      case 'SPAM':
        return <Mail size={16} className="text-yellow-400" />;
      case 'INAPPROPRIATE_CONTENT':
        return <AlertOctagon size={16} className="text-red-400" />;
      case 'OFFENSIVE_LANGUAGE':
        return <MessageSquare size={16} className="text-orange-400" />;
      case 'HARASSMENT':
        return <Shield size={16} className="text-red-500" />;
      default:
        return <AlertTriangle size={16} className="text-gray-400" />;
    }
  };

  const getReasonText = (reason: ReportReason) => {
    const reasonMap: Record<ReportReason, string> = {
      'INAPPROPRIATE_CONTENT': t('reasons.inappropriateContent'),
      'SPAM': t('reasons.spam'),
      'OFFENSIVE_LANGUAGE': t('reasons.offensiveLanguage'),
      'HARASSMENT': t('reasons.harassment'),
      'OTHER': t('reasons.other'),
    };
    return reasonMap[reason] || reason;
  };

  const getTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'POST':
        return <FileText size={16} />;
      case 'COMMENT':
        return <MessageCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const reporterName = report.reporter.fullName.toLowerCase();
    const authorName = report.content.author.fullName.toLowerCase();
    const content = report.content.content.toLowerCase();
    const description = (report.description || '').toLowerCase();
    
    return (
      reporterName.includes(searchLower) ||
      authorName.includes(searchLower) ||
      content.includes(searchLower) ||
      description.includes(searchLower)
    );
  });

  // Calculate stats based on filtered reports
  const stats = {
    total: totalReports,
    posts: reports.filter(r => r.type === 'POST').length,
    comments: reports.filter(r => r.type === 'COMMENT').length,
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleReviewClick = (report: Report) => {
    setSelectedReport(report);
    setReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    // Refresh the reports list after a successful review
    fetchReports(currentPage);
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-300">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-gray-400" />
            <div>
              <p className="text-2xl font-bold text-gray-300">{stats.total}</p>
              <p className="text-gray-400 text-sm">{t('stats.total')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-blue-400">{stats.posts}</p>
              <p className="text-gray-400 text-sm">{t('stats.posts')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <MessageCircle size={24} className="text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.comments}</p>
              <p className="text-gray-400 text-sm">{t('stats.comments')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value as ReportReason | 'ALL');
                setCurrentPage(1);
              }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-secondary focus:outline-none"
            >
              <option value="ALL">{t('filter.allReasons')}</option>
              <option value="INAPPROPRIATE_CONTENT">{t('reasons.inappropriateContent')}</option>
              <option value="SPAM">{t('reasons.spam')}</option>
              <option value="OFFENSIVE_LANGUAGE">{t('reasons.offensiveLanguage')}</option>
              <option value="HARASSMENT">{t('reasons.harassment')}</option>
              <option value="OTHER">{t('reasons.other')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Shield size={20} className="text-gray-400" />
            <select
              value={contentTypeFilter}
              onChange={(e) => {
                setContentTypeFilter(e.target.value as 'POST' | 'COMMENT' | 'ALL');
                setCurrentPage(1);
              }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-secondary focus:outline-none"
            >
              <option value="ALL">{t('type.all')}</option>
              <option value="POST">{t('type.post')}</option>
              <option value="COMMENT">{t('type.comment')}</option>
            </select>
          </div>

          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-secondary focus:outline-none w-64"
            />
          </div>
        </div>

        <button
          onClick={() => fetchReports(currentPage)}
          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <AlertTriangle size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              {t('noReports')}
            </h3>
            <p className="text-gray-500">{t('noReportsDescription')}</p>
          </div>
        ) : (
          filteredReports.map(report => {
            const isPost = isPostContent(report.content);
            return (
              <div key={report.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(report.type)}
                        <span className="text-sm text-gray-400">{t(`type.${report.type.toLowerCase()}`)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getReasonIcon(report.reason)}
                        <span className="text-sm font-medium text-white">{getReasonText(report.reason)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={12} />
                        {new Date(report.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Report Info */}
                    <div className="space-y-3">
                      {report.description && (
                        <div className="text-sm text-gray-300 bg-gray-700 p-3 rounded">
                          <span className="text-gray-400">{t('description')}: </span>
                          {report.description}
                        </div>
                      )}

                      <div className="bg-gray-700 p-3 rounded">
                        <p className="text-xs text-gray-400 mb-1">{t('reportedContent')}:</p>
                        {isPost && (report.content as PostContent).title && (
                          <p className="text-sm font-medium text-white mb-1">{(report.content as PostContent).title}</p>
                        )}
                        {!isPost && (
                          <p className="text-xs text-gray-400 mb-1">
                            {t('inPost')}: {(report.content as CommentContent).postTitle}
                          </p>
                        )}
                        <p className="text-sm text-gray-300 line-clamp-3">{report.content.content}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {isPost ? `${(report.content as PostContent).viewCount} views` : `${report.content.reactionCount} reactions`}
                          </span>
                          {isPost && (
                            <span className="flex items-center gap-1">
                              <MessageCircle size={12} />
                              {(report.content as PostContent).commentCount} comments
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {report.content.reportCount} reports
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400">{t('reportedBy')}:</p>
                            <p className="text-sm text-white">{report.reporter.fullName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <User size={14} className="text-red-400" />
                          <div>
                            <p className="text-xs text-gray-400">{t('author')}:</p>
                            <p className="text-sm text-white">
                              {report.content.author.fullName}
                              <span className="text-xs text-gray-400 ml-1">({report.content.author.role})</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleReviewClick(report)}
                      className="px-3 py-1 bg-secondary text-primary text-sm rounded hover:bg-secondary/90 transition-colors flex items-center gap-1 font-medium"
                    >
                      <Gavel size={14} />
                      {t('actions.review')}
                    </button>
                    <button
                      onClick={() => {
                        if (isPost) {
                          const post = report.content as PostContent;
                          window.open(`/${locale}/community/post/${post.slug}`, '_blank');
                        } else {
                          const comment = report.content as CommentContent;
                          window.open(`/${locale}/community#comment-${comment.id}`, '_blank');
                        }
                      }}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <Eye size={14} />
                      {t('actions.view')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-secondary text-primary'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Review Report Modal */}
      <ReviewReportModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        report={selectedReport}
        onReviewComplete={handleReviewComplete}
        userRole="tutor"
      />
    </div>
  );
}
// /src/components/StudentDocumentsList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  Search,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Image as ImageIcon,
  FileSpreadsheet,
  User,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  FileType,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { toast } from '@/hooks/use-toast';

import ReviewStatusPopover, { ReviewStatus } from './ReviewStatusPopover';

interface StudentDocument {
  id: string;
  studentId: string;
  studentName?: string;
  name: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  uploadedBy: string;
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
}

interface Filters {
  studentId: string;
  reviewStatus: ReviewStatus | '';
  documentType: string;
  createdFrom: string;
  createdTo: string;
  orderBy: 'createdAt' | 'name' | 'updatedAt';
  order: 'asc' | 'desc';
}

const REVIEW_STATUSES: ReviewStatus[] = [
  'PENDING_REVIEW',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'NEEDS_REPLACEMENT',
  'NEEDS_ADDITIONAL_INFO',
];

const DOCUMENT_TYPES = ['PDF', 'WORD', 'EXCEL', 'IMAGE'];

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function StudentDocumentsList() {
  const t = useTranslations('Admin.studentDocuments');
  const { token, isDocumentAnalyst, isAdmin } = useAuth();

  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<StudentDocument | null>(null);

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    studentId: '',
    reviewStatus: '',
    documentType: '',
    createdFrom: '',
    createdTo: '',
    orderBy: 'createdAt',
    order: 'desc',
  });

  // Count active filters
  const activeFilterCount = [
    filters.studentId,
    filters.reviewStatus,
    filters.documentType,
    filters.createdFrom,
    filters.createdTo,
  ].filter(Boolean).length;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon size={20} className="text-blue-400" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet size={20} className="text-green-400" />;
    }
    return <FileText size={20} className="text-secondary" />;
  };

  // Get document type badge color
  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      PDF: 'bg-red-500/20 text-red-400 border-red-500/30',
      WORD: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      EXCEL: 'bg-green-500/20 text-green-400 border-green-500/30',
      IMAGE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Get status config for filter chips
  const getStatusConfig = (status: ReviewStatus) => {
    const configs: Record<ReviewStatus, { icon: React.ReactNode; color: string; bgColor: string }> = {
      PENDING_REVIEW: {
        icon: <Clock size={12} />,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20 border-gray-500/30 hover:bg-gray-500/30',
      },
      UNDER_REVIEW: {
        icon: <Search size={12} />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30',
      },
      APPROVED: {
        icon: <CheckCircle2 size={12} />,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30',
      },
      REJECTED: {
        icon: <XCircle size={12} />,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30',
      },
      NEEDS_REPLACEMENT: {
        icon: <RefreshCw size={12} />,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30',
      },
      NEEDS_ADDITIONAL_INFO: {
        icon: <AlertTriangle size={12} />,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30',
      },
    };
    return configs[status];
  };

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        orderBy: filters.orderBy,
        order: filters.order,
      });

      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.reviewStatus) params.append('reviewStatus', filters.reviewStatus);
      if (filters.documentType) params.append('documentType', filters.documentType);
      if (filters.createdFrom) params.append('createdFrom', filters.createdFrom);
      if (filters.createdTo) params.append('createdTo', filters.createdTo);

      const response = await fetch(`${apiUrl}/api/v1/student-documents?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(t('error.unauthorized'));
        }
        throw new Error(t('error.fetchFailed'));
      }

      const data = await response.json();
      setDocuments(data.documents || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
      }));
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : t('error.fetchFailed'));
      toast({
        title: t('error.title'),
        description: err instanceof Error ? err.message : t('error.fetchFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, pagination.page, pagination.limit, filters, t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle filter change (reset to page 1)
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Toggle filter value (for chips)
  const toggleFilter = (key: 'reviewStatus' | 'documentType', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? '' : value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      studentId: '',
      reviewStatus: '',
      documentType: '',
      createdFrom: '',
      createdTo: '',
      orderBy: 'createdAt',
      order: 'desc',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      order: prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Filter documents by search query (client-side for name/description)
  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(query) ||
      doc.originalFileName.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query) ||
      doc.studentName?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Check access
  if (!isAdmin && !isDocumentAnalyst) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
        <p className="text-gray-400">{t('error.noAccess')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-sm text-gray-400">{t('description')}</p>
        </div>
        <div className="text-sm text-gray-400">
          {t('showing', { count: filteredDocuments.length, total: pagination.total })}
        </div>
      </div>

      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-secondary transition-colors"
          />
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
            showFilters || activeFilterCount > 0
              ? 'bg-secondary/20 border-secondary text-secondary'
              : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500'
          }`}
        >
          <SlidersHorizontal size={18} />
          <span>{t('filters.title')}</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-secondary text-primary rounded-full">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Expandable Filters Panel */}
      {showFilters && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* Status Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Clock size={16} />
              {t('filters.status')}
            </label>
            <div className="flex flex-wrap gap-2">
              {REVIEW_STATUSES.map(status => {
                const config = getStatusConfig(status);
                const isActive = filters.reviewStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => toggleFilter('reviewStatus', status)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      isActive
                        ? `${config.bgColor} ${config.color} ring-2 ring-offset-2 ring-offset-gray-800 ring-${config.color.replace('text-', '')}`
                        : `${config.bgColor} ${config.color} opacity-60 hover:opacity-100`
                    }`}
                  >
                    {config.icon}
                    {t(`filters.statusOptions.${status}`)}
                    {isActive && <X size={12} className="ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Type Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <FileType size={16} />
              {t('filters.documentType')}
            </label>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map(type => {
                const isActive = filters.documentType === type;
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilter('documentType', type)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      isActive
                        ? `${getDocumentTypeBadge(type)} ring-2 ring-offset-2 ring-offset-gray-800`
                        : `${getDocumentTypeBadge(type)} opacity-60 hover:opacity-100`
                    }`}
                  >
                    {type}
                    {isActive && <X size={12} className="ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range and Student ID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student ID */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <User size={16} />
                {t('filters.studentId')}
              </label>
              <input
                type="text"
                value={filters.studentId}
                onChange={e => handleFilterChange('studentId', e.target.value)}
                placeholder={t('filters.studentIdPlaceholder')}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-secondary transition-colors"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Calendar size={16} />
                {t('filters.dateFrom')}
              </label>
              <input
                type="date"
                value={filters.createdFrom}
                onChange={e => handleFilterChange('createdFrom', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-secondary transition-colors [color-scheme:dark]"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Calendar size={16} />
                {t('filters.dateTo')}
              </label>
              <input
                type="date"
                value={filters.createdTo}
                onChange={e => handleFilterChange('createdTo', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-secondary transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Sort and Clear */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-700">
            {/* Sort Controls */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{t('filters.sortBy')}</span>
              <select
                value={filters.orderBy}
                onChange={e => handleFilterChange('orderBy', e.target.value)}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-secondary transition-colors"
              >
                <option value="createdAt">{t('filters.sortOptions.createdAt')}</option>
                <option value="name">{t('filters.sortOptions.name')}</option>
                <option value="updatedAt">{t('filters.sortOptions.updatedAt')}</option>
              </select>
              <button
                onClick={toggleSortOrder}
                className="inline-flex items-center gap-1 px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm hover:bg-gray-700 transition-colors"
              >
                {filters.order === 'desc' ? (
                  <>
                    <ArrowDown size={14} />
                    {t('filters.descending')}
                  </>
                ) : (
                  <>
                    <ArrowUp size={14} />
                    {t('filters.ascending')}
                  </>
                )}
              </button>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <RotateCcw size={14} />
                {t('filters.clearAll')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Summary (when panel is closed) */}
      {!showFilters && activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-400">{t('filters.activeFilters')}:</span>
          {filters.reviewStatus && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getStatusConfig(filters.reviewStatus as ReviewStatus).bgColor} ${getStatusConfig(filters.reviewStatus as ReviewStatus).color}`}>
              {t(`filters.statusOptions.${filters.reviewStatus}`)}
              <button onClick={() => handleFilterChange('reviewStatus', '')} className="hover:opacity-70">
                <X size={12} />
              </button>
            </span>
          )}
          {filters.documentType && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getDocumentTypeBadge(filters.documentType)}`}>
              {filters.documentType}
              <button onClick={() => handleFilterChange('documentType', '')} className="hover:opacity-70">
                <X size={12} />
              </button>
            </span>
          )}
          {filters.studentId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border bg-gray-500/20 text-gray-300 border-gray-500/30">
              {t('filters.studentId')}: {filters.studentId.substring(0, 8)}...
              <button onClick={() => handleFilterChange('studentId', '')} className="hover:opacity-70">
                <X size={12} />
              </button>
            </span>
          )}
          {(filters.createdFrom || filters.createdTo) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border bg-gray-500/20 text-gray-300 border-gray-500/30">
              <Calendar size={12} />
              {filters.createdFrom || '...'} - {filters.createdTo || '...'}
              <button
                onClick={() => {
                  handleFilterChange('createdFrom', '');
                  handleFilterChange('createdTo', '');
                }}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-secondary hover:underline"
          >
            {t('filters.clearAll')}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 size={48} className="mx-auto mb-4 text-secondary animate-spin" />
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDocuments}
            className="px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Documents Table */}
      {!isLoading && !error && (
        <>
          {filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      {t('columns.document')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      {t('columns.student')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      {t('columns.type')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      {t('columns.size')}
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      <button
                        onClick={() => {
                          handleFilterChange('orderBy', 'createdAt');
                          toggleSortOrder();
                        }}
                        className="inline-flex items-center gap-1 hover:text-white transition-colors"
                      >
                        {t('columns.uploadedAt')}
                        <ArrowUpDown size={14} />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      {t('columns.status')}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      {t('columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map(doc => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      {/* Document Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-700/50 rounded-lg">
                            {getFileIcon(doc.mimeType)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate max-w-xs">
                              {doc.name}
                            </p>
                            <p className="text-sm text-gray-400 truncate max-w-xs">
                              {doc.originalFileName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Student Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <div className="min-w-0">
                            <p className="text-white text-sm truncate max-w-xs">
                              {doc.studentName || doc.studentId.substring(0, 8) + '...'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Document Type */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs rounded-full border ${getDocumentTypeBadge(doc.documentType)}`}
                        >
                          {doc.documentType}
                        </span>
                      </td>

                      {/* File Size */}
                      <td className="py-4 px-4 text-sm text-gray-400">
                        {formatFileSize(doc.fileSize)}
                      </td>

                      {/* Upload Date */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar size={14} />
                          {formatDate(doc.createdAt)}
                        </div>
                      </td>

                      {/* Review Status */}
                      <td className="py-4 px-4">
                        <ReviewStatusPopover
                          documentId={doc.id}
                          currentStatus={doc.reviewStatus || 'PENDING_REVIEW'}
                          onStatusChange={(newStatus) => {
                            setDocuments(prev =>
                              prev.map(d =>
                                d.id === doc.id
                                  ? { ...d, reviewStatus: newStatus }
                                  : d
                              )
                            );
                          }}
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewDocument(doc)}
                            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 transition-colors"
                            title={t('actions.view')}
                          >
                            <Eye size={16} className="text-white" />
                          </button>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 transition-colors"
                            title={t('actions.download')}
                          >
                            <Download size={16} className="text-white" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">{t('noDocuments')}</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages >= 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-700">
              {/* Items per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{t('pagination.itemsPerPage')}</span>
                <select
                  value={pagination.limit}
                  onChange={e => {
                    setPagination(prev => ({
                      ...prev,
                      limit: parseInt(e.target.value),
                      page: 1,
                    }));
                  }}
                  className="px-2 py-1 bg-gray-700/50 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-secondary"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page info and controls */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  {t('pagination.pageOf', { current: pagination.page, total: totalPages || 1 })}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronsLeft size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} className="text-white" />
                  </button>
                  <span className="px-4 py-2 text-white font-medium">{pagination.page}</span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages || totalPages === 0}
                    className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} className="text-white" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={pagination.page === totalPages || totalPages === 0}
                    className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronsRight size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {getFileIcon(previewDocument.mimeType)}
                <div>
                  <h3 className="text-lg font-bold text-white">{previewDocument.name}</h3>
                  <p className="text-sm text-gray-400">{previewDocument.originalFileName}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDocument(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              {/* Document Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">{t('details.student')}</p>
                  <p className="text-white">
                    {previewDocument.studentName || previewDocument.studentId}
                  </p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">{t('details.type')}</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs rounded-full border ${getDocumentTypeBadge(previewDocument.documentType)}`}
                  >
                    {previewDocument.documentType}
                  </span>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">{t('details.size')}</p>
                  <p className="text-white">{formatFileSize(previewDocument.fileSize)}</p>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">{t('details.uploadedAt')}</p>
                  <p className="text-white">{formatDate(previewDocument.createdAt)}</p>
                </div>
              </div>

              {/* Review Status Section */}
              <div className="bg-gray-700/30 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">{t('details.reviewStatus')}</p>
                <ReviewStatusPopover
                  documentId={previewDocument.id}
                  currentStatus={previewDocument.reviewStatus || 'PENDING_REVIEW'}
                  onStatusChange={(newStatus) => {
                    setPreviewDocument(prev =>
                      prev ? { ...prev, reviewStatus: newStatus } : null
                    );
                    setDocuments(prev =>
                      prev.map(d =>
                        d.id === previewDocument.id
                          ? { ...d, reviewStatus: newStatus }
                          : d
                      )
                    );
                  }}
                />
                {previewDocument.reviewedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    {t('details.reviewedAt')}: {formatDate(previewDocument.reviewedAt)}
                  </p>
                )}
              </div>

              {/* Rejection Reason */}
              {previewDocument.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-xs text-red-400 font-medium mb-1">{t('details.rejectionReason')}</p>
                  <p className="text-white text-sm">{previewDocument.rejectionReason}</p>
                </div>
              )}

              {/* Internal Notes */}
              {previewDocument.reviewNotes && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-xs text-blue-400 font-medium mb-1">{t('details.internalNotes')}</p>
                  <p className="text-white text-sm">{previewDocument.reviewNotes}</p>
                </div>
              )}

              {/* Description */}
              {previewDocument.description && (
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">{t('details.description')}</p>
                  <p className="text-white">{previewDocument.description}</p>
                </div>
              )}

              {/* Preview Area */}
              <div className="bg-black/20 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
                {previewDocument.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewDocument.fileUrl}
                    alt={previewDocument.name}
                    className="max-w-full max-h-[400px] object-contain rounded-lg"
                  />
                ) : (
                  <>
                    <FileText size={64} className="text-gray-500 mb-4" />
                    <p className="text-gray-400 mb-4">{t('previewNotAvailable')}</p>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-white/10">
              <button
                onClick={() => setPreviewDocument(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                {t('close')}
              </button>
              <a
                href={previewDocument.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
              >
                <Download size={16} />
                {t('actions.download')}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

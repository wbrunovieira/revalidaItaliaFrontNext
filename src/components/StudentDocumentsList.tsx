// /src/components/StudentDocumentsList.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Trash2,
  List,
  Users,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { toast } from '@/hooks/use-toast';

import ReviewStatusPopover, { ReviewStatus } from './ReviewStatusPopover';
import DocumentPreviewModal from './DocumentPreviewModal';

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

type ViewMode = 'list' | 'grouped';

interface StudentGroup {
  studentId: string;
  studentName: string;
  documents: StudentDocument[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    underReview: number;
    needsAction: number;
  };
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

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
      if (debouncedSearch.trim()) params.append('studentName', debouncedSearch.trim());

      const fullUrl = `${apiUrl}/api/v1/student-documents?${params}`;
      console.log('[StudentDocuments] Fetching:', fullUrl);
      console.log('[StudentDocuments] debouncedSearch:', debouncedSearch);

      const response = await fetch(fullUrl, {
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
      console.log('[StudentDocuments] Response:', { total: data.total, documentsCount: data.documents?.length });
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
  }, [token, pagination.page, pagination.limit, filters, debouncedSearch, t]);

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

  // Delete document
  const deleteDocument = useCallback(
    async (documentId: string) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const response = await fetch(`${apiUrl}/api/v1/student-documents/${documentId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(t('error.unauthorized'));
          }
          if (response.status === 403) {
            throw new Error(t('deleteConfirmation.errors.forbidden'));
          }
          if (response.status === 404) {
            throw new Error(t('deleteConfirmation.errors.notFound'));
          }
          throw new Error(t('deleteConfirmation.errors.deleteFailed'));
        }

        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));

        toast({
          title: t('deleteConfirmation.success.title'),
          description: t('deleteConfirmation.success.description'),
        });
      } catch (err) {
        console.error('Error deleting document:', err);
        toast({
          title: t('error.title'),
          description: err instanceof Error ? err.message : t('deleteConfirmation.errors.deleteFailed'),
          variant: 'destructive',
        });
      }
    },
    [token, t]
  );

  // Handle delete click - show confirmation toast
  const handleDeleteClick = useCallback(
    (doc: StudentDocument) => {
      toast({
        title: t('deleteConfirmation.title'),
        description: (
          <div className="space-y-3">
            <p className="text-sm">
              {t('deleteConfirmation.message', { documentName: doc.name })}
            </p>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  <span className="truncate">{doc.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} />
                  <span>{doc.studentName || doc.studentId.substring(0, 8) + '...'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-red-300 font-medium flex items-center gap-1">
              <AlertTriangle size={12} />
              {t('deleteConfirmation.warning')}
            </p>
          </div>
        ),
        variant: 'destructive',
        action: (
          <button
            onClick={() => deleteDocument(doc.id)}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-red-600 bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            {t('deleteConfirmation.confirm')}
          </button>
        ),
      });
    },
    [t, deleteDocument]
  );

  // Debounce search query - only trigger API call after user stops typing
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Set new timer
    searchTimerRef.current = setTimeout(() => {
      console.log('[StudentDocuments] Debounce triggered, setting debouncedSearch to:', searchQuery);
      setDebouncedSearch(searchQuery);
    }, 500);

    // Cleanup on unmount
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Group documents by student
  const groupedByStudent: StudentGroup[] = (() => {
    const groups: Record<string, StudentGroup> = {};

    documents.forEach(doc => {
      const studentId = doc.studentId;
      if (!groups[studentId]) {
        groups[studentId] = {
          studentId,
          studentName: doc.studentName || studentId.substring(0, 8) + '...',
          documents: [],
          stats: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            underReview: 0,
            needsAction: 0,
          },
        };
      }

      groups[studentId].documents.push(doc);
      groups[studentId].stats.total++;

      switch (doc.reviewStatus) {
        case 'PENDING_REVIEW':
          groups[studentId].stats.pending++;
          break;
        case 'APPROVED':
          groups[studentId].stats.approved++;
          break;
        case 'REJECTED':
          groups[studentId].stats.rejected++;
          groups[studentId].stats.needsAction++;
          break;
        case 'UNDER_REVIEW':
          groups[studentId].stats.underReview++;
          break;
        case 'NEEDS_REPLACEMENT':
        case 'NEEDS_ADDITIONAL_INFO':
          groups[studentId].stats.needsAction++;
          break;
      }
    });

    return Object.values(groups).sort((a, b) => {
      // Sort by needs action first, then by total documents
      if (a.stats.needsAction !== b.stats.needsAction) {
        return b.stats.needsAction - a.stats.needsAction;
      }
      return b.stats.total - a.stats.total;
    });
  })();

  // Toggle student expansion
  const toggleStudentExpanded = (studentId: string) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Expand/collapse all
  const expandAll = () => {
    setExpandedStudents(new Set(groupedByStudent.map(g => g.studentId)));
  };

  const collapseAll = () => {
    setExpandedStudents(new Set());
  };

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
          {t('showing', { count: documents.length, total: pagination.total })}
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

        {/* View Mode Toggle */}
        <div className="inline-flex items-center rounded-lg border border-gray-600 bg-gray-700/50 p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-secondary text-primary'
                : 'text-gray-400 hover:text-white'
            }`}
            title={t('viewMode.list')}
          >
            <List size={16} />
            <span className="hidden sm:inline">{t('viewMode.list')}</span>
          </button>
          <button
            onClick={() => setViewMode('grouped')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'grouped'
                ? 'bg-secondary text-primary'
                : 'text-gray-400 hover:text-white'
            }`}
            title={t('viewMode.grouped')}
          >
            <Users size={16} />
            <span className="hidden sm:inline">{t('viewMode.grouped')}</span>
          </button>
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

      {/* Documents View */}
      {!isLoading && !error && (
        <>
          {documents.length > 0 ? (
            <>
              {/* Grouped View */}
              {viewMode === 'grouped' && (
                <div className="space-y-4">
                  {/* Expand/Collapse All */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      {t('groupedView.studentsCount', { count: groupedByStudent.length })}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={expandAll}
                        className="text-xs text-secondary hover:underline"
                      >
                        {t('groupedView.expandAll')}
                      </button>
                      <span className="text-gray-600">|</span>
                      <button
                        onClick={collapseAll}
                        className="text-xs text-secondary hover:underline"
                      >
                        {t('groupedView.collapseAll')}
                      </button>
                    </div>
                  </div>

                  {/* Student Cards */}
                  {groupedByStudent.map(group => {
                    const isExpanded = expandedStudents.has(group.studentId);
                    return (
                      <div
                        key={group.studentId}
                        className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 overflow-hidden"
                      >
                        {/* Student Header - Clickable */}
                        <button
                          onClick={() => toggleStudentExpanded(group.studentId)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-secondary/20 rounded-full">
                              <User size={24} className="text-secondary" />
                            </div>
                            <div className="text-left">
                              <h3 className="text-lg font-semibold text-white">
                                {group.studentName}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {t('groupedView.documentsCount', { count: group.stats.total })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Status Summary */}
                            <div className="hidden sm:flex items-center gap-2">
                              {group.stats.approved > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                  <CheckCircle2 size={12} />
                                  {group.stats.approved}
                                </span>
                              )}
                              {group.stats.pending > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                  <Clock size={12} />
                                  {group.stats.pending}
                                </span>
                              )}
                              {group.stats.underReview > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  <Search size={12} />
                                  {group.stats.underReview}
                                </span>
                              )}
                              {group.stats.needsAction > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                  <AlertTriangle size={12} />
                                  {group.stats.needsAction}
                                </span>
                              )}
                            </div>

                            <ChevronDown
                              size={20}
                              className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </button>

                        {/* Expanded Documents */}
                        {isExpanded && (
                          <div className="border-t border-gray-700">
                            <div className="p-4 space-y-3">
                              {group.documents.map(doc => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="p-2 bg-gray-700/50 rounded-lg">
                                      {getFileIcon(doc.mimeType)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-white font-medium truncate">
                                        {doc.name}
                                      </p>
                                      <div className="flex items-center gap-3 text-xs text-gray-400">
                                        <span>{doc.documentType}</span>
                                        <span>{formatFileSize(doc.fileSize)}</span>
                                        <span>{formatDate(doc.createdAt)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
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

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => setPreviewDocumentId(doc.id)}
                                        className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 transition-colors"
                                        title={t('actions.view')}
                                      >
                                        <Eye size={14} className="text-white" />
                                      </button>
                                      <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 transition-colors"
                                        title={t('actions.download')}
                                      >
                                        <Download size={14} className="text-white" />
                                      </a>
                                      <button
                                        onClick={() => handleDeleteClick(doc)}
                                        className="p-2 rounded-lg bg-gray-700/50 hover:bg-red-600/80 transition-colors"
                                        title={t('actions.delete')}
                                      >
                                        <Trash2 size={14} className="text-white" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List View (Table) */}
              {viewMode === 'list' && (
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
                  {documents.map(doc => (
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
                            onClick={() => setPreviewDocumentId(doc.id)}
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
                          <button
                            onClick={() => handleDeleteClick(doc)}
                            className="p-2 rounded-lg bg-gray-700/50 hover:bg-red-600/80 transition-colors"
                            title={t('actions.delete')}
                          >
                            <Trash2 size={16} className="text-white" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              )}
            </>
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

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDocumentId}
        documentId={previewDocumentId}
        onClose={() => setPreviewDocumentId(null)}
        isAdminView={true}
      />
    </div>
  );
}

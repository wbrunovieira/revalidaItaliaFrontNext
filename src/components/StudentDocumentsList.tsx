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
  Filter,
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
  const [studentIdFilter, setStudentIdFilter] = useState('');
  const [previewDocument, setPreviewDocument] = useState<StudentDocument | null>(null);

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
      });

      if (studentIdFilter) {
        params.append('studentId', studentIdFilter);
      }

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
  }, [token, pagination.page, pagination.limit, studentIdFilter, t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Filter documents by search query
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-secondary"
          />
        </div>

        {/* Student ID Filter */}
        <div className="relative sm:w-80">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={studentIdFilter}
            onChange={e => setStudentIdFilter(e.target.value)}
            placeholder={t('filterByStudentId')}
            className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-secondary"
          />
          {studentIdFilter && (
            <button
              onClick={() => setStudentIdFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

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
                      {t('columns.uploadedAt')}
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400">
                {t('pagination.pageOf', { current: pagination.page, total: totalPages })}
              </div>
              <div className="flex items-center gap-2">
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
                <span className="px-4 py-2 text-white">{pagination.page}</span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                  className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} className="text-white" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={pagination.page === totalPages}
                  className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight size={16} className="text-white" />
                </button>
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
            <div className="p-6 space-y-4">
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

              {/* Rejection Reason - Show if document requires action */}
              {previewDocument.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-xs text-red-400 font-medium mb-1">{t('details.rejectionReason')}</p>
                  <p className="text-white text-sm">{previewDocument.rejectionReason}</p>
                </div>
              )}

              {/* Internal Notes - Only visible to admin/analyst */}
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

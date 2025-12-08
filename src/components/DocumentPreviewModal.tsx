// /src/components/DocumentPreviewModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  X,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
  MessageSquare,
  Eye,
  HardDrive,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';

interface DocumentDetails {
  id: string;
  studentId: string;
  studentName?: string; // Only for admin/analyst/tutor
  name: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  reviewStatus: string;
  reviewNotes?: string; // Only for admin/analyst
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  documentId: string | null;
  onClose: () => void;
  isAdminView?: boolean;
}

export default function DocumentPreviewModal({
  isOpen,
  documentId,
  onClose,
  isAdminView = false,
}: DocumentPreviewModalProps) {
  const t = useTranslations('documentPreview');
  const { token } = useAuth();

  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch document details
  const fetchDocument = useCallback(async () => {
    if (!documentId || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/student-documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('error.notFound'));
        }
        if (response.status === 401) {
          throw new Error(t('error.unauthorized'));
        }
        throw new Error(t('error.fetchFailed'));
      }

      const data = await response.json();
      setDocument(data);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : t('error.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [documentId, token, t]);

  // Fetch when modal opens
  useEffect(() => {
    if (isOpen && documentId) {
      fetchDocument();
    } else {
      setDocument(null);
      setError(null);
    }
  }, [isOpen, documentId, fetchDocument]);

  // Get document type badge
  const getDocumentTypeBadge = (documentType: string) => {
    switch (documentType) {
      case 'PDF':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      case 'WORD':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
      case 'EXCEL':
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
      case 'IMAGE':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
    }
  };

  // Get status style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30',
          icon: <CheckCircle2 size={16} />,
          label: t('status.approved'),
        };
      case 'REJECTED':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30',
          icon: <XCircle size={16} />,
          label: t('status.rejected'),
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          icon: <Eye size={16} />,
          label: t('status.underReview'),
        };
      case 'NEEDS_REPLACEMENT':
        return {
          bg: 'bg-orange-500/20',
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          icon: <RefreshCw size={16} />,
          label: t('status.needsReplacement'),
        };
      case 'NEEDS_ADDITIONAL_INFO':
        return {
          bg: 'bg-yellow-500/20',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          icon: <Info size={16} />,
          label: t('status.needsAdditionalInfo'),
        };
      case 'PENDING_REVIEW':
      default:
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          icon: <Clock size={16} />,
          label: t('status.pendingReview'),
        };
    }
  };

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

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Eye size={20} className="text-secondary" />
            </div>
            <h2 className="text-lg font-bold text-white">{t('title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={48} className="text-secondary animate-spin mb-4" />
              <p className="text-gray-400">{t('loading')}</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={fetchDocument}
                className="px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
              >
                {t('retry')}
              </button>
            </div>
          )}

          {/* Document Details */}
          {document && !isLoading && !error && (
            <div className="space-y-6">
              {/* Document Header */}
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-white truncate">
                    {document.name}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    {document.originalFileName}
                  </p>
                  {/* Status Badge */}
                  {(() => {
                    const statusStyle = getStatusStyle(document.reviewStatus);
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 mt-2 text-sm rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {statusStyle.icon}
                        {statusStyle.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Student Info - Only for admin/analyst */}
              {isAdminView && document.studentName && (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-secondary" />
                    <div>
                      <p className="text-xs text-gray-500">{t('student')}</p>
                      <p className="text-white font-medium">{document.studentName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {document.description && (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start gap-3">
                    <MessageSquare size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('description')}</p>
                      <p className="text-white">{document.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {document.rejectionReason && (
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-orange-400 font-medium mb-1">{t('rejectionReason')}</p>
                      <p className="text-white">{document.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Notes - Only for admin/analyst */}
              {isAdminView && (
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <Info size={18} className="text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-400 font-medium mb-1">{t('internalNotes')}</p>
                      <p className="text-white">{document.reviewNotes || t('noNotes')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* File Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Document Type */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('documentType')}</p>
                      {(() => {
                        const typeBadge = getDocumentTypeBadge(document.documentType);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-xs rounded-full border ${typeBadge.bg} ${typeBadge.text} ${typeBadge.border}`}
                          >
                            {document.documentType}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* File Size */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <HardDrive size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('fileSize')}</p>
                      <p className="text-white font-medium">{formatFileSize(document.fileSize)}</p>
                    </div>
                  </div>
                </div>

                {/* Created At */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('uploadedAt')}</p>
                      <p className="text-white font-medium">{formatDate(document.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Updated At */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('updatedAt')}</p>
                      <p className="text-white font-medium">{formatDate(document.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {document && !isLoading && !error && (
          <div className="flex items-center justify-between gap-3 p-4 border-t border-white/10 flex-shrink-0 bg-gray-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              {t('close')}
            </button>
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors"
            >
              <Download size={18} />
              {t('download')}
            </a>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, window.document.body);
}

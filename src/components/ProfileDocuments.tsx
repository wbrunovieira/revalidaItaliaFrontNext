// /src/components/ProfileDocuments.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  X,
  Check,
  AlertCircle,
  Download,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Info,
  FileType,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { toast } from '@/hooks/use-toast';
import UploadDocumentModal, { UploadedDocument } from '@/components/UploadDocumentModal';

// Tipos de documento suportados
type DocumentType = 'diploma' | 'certificate' | 'id' | 'passport' | 'transcript' | 'other' | 'PDF' | 'WORD' | 'EXCEL' | 'IMAGE';
type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'under_review' | 'needs_replacement' | 'needs_additional_info';

// API Review Status mapping
type ApiReviewStatus = 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REPLACEMENT' | 'NEEDS_ADDITIONAL_INFO';

interface UserDocument {
  id: string;
  name: string;
  fileName: string;
  originalFileName?: string;
  type: DocumentType;
  status: DocumentStatus;
  fileSize: number;
  mimeType: string;
  url: string;
  fileUrl?: string;
  description?: string;
  uploadedAt: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
}

// API response interface
interface ApiDocument {
  id: string;
  studentId: string;
  name: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  uploadedBy: string;
  reviewStatus: ApiReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileDocumentsProps {
  userId?: string;
}

// Map API status to local status (pure function - outside component)
const mapApiStatusToLocal = (apiStatus: ApiReviewStatus): DocumentStatus => {
  const statusMap: Record<ApiReviewStatus, DocumentStatus> = {
    'PENDING_REVIEW': 'pending',
    'UNDER_REVIEW': 'under_review',
    'APPROVED': 'approved',
    'REJECTED': 'rejected',
    'NEEDS_REPLACEMENT': 'needs_replacement',
    'NEEDS_ADDITIONAL_INFO': 'needs_additional_info',
  };
  return statusMap[apiStatus] || 'pending';
};

// Map API document to local format (pure function - outside component)
const mapApiDocumentToLocal = (apiDoc: ApiDocument): UserDocument => ({
  id: apiDoc.id,
  name: apiDoc.name,
  fileName: apiDoc.fileName,
  originalFileName: apiDoc.originalFileName,
  type: apiDoc.documentType as DocumentType,
  status: mapApiStatusToLocal(apiDoc.reviewStatus),
  fileSize: apiDoc.fileSize,
  mimeType: apiDoc.mimeType,
  url: apiDoc.fileUrl,
  fileUrl: apiDoc.fileUrl,
  description: apiDoc.description,
  uploadedAt: apiDoc.createdAt,
  createdAt: apiDoc.createdAt,
  reviewedAt: apiDoc.reviewedAt,
  rejectionReason: apiDoc.rejectionReason,
});

export default function ProfileDocuments({ userId }: ProfileDocumentsProps) {
  const t = useTranslations('Profile.documents');
  const { token } = useAuth();

  // Estado local
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<UserDocument | null>(null);

  // Fetch documents from API
  const fetchDocuments = useCallback(async () => {
    if (!token || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/student-documents?studentId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('error.fetchFailed'));
      }

      const data = await response.json();
      const mappedDocs = (data.documents || []).map(mapApiDocumentToLocal);
      setDocuments(mappedDocs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : t('error.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [token, userId, t]);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Obter ícone baseado no tipo MIME
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon size={20} className="text-blue-400" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet size={20} className="text-green-400" />;
    }
    return <FileText size={20} className="text-secondary" />;
  };

  // Obter estilo do status
  const getStatusStyle = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30',
          icon: <Check size={14} />,
        };
      case 'rejected':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30',
          icon: <X size={14} />,
        };
      case 'under_review':
        return {
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          icon: <Loader2 size={14} className="animate-spin" />,
        };
      case 'needs_replacement':
        return {
          bg: 'bg-orange-500/20',
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          icon: <RefreshCw size={14} />,
        };
      case 'needs_additional_info':
        return {
          bg: 'bg-yellow-500/20',
          text: 'text-yellow-400',
          border: 'border-yellow-500/30',
          icon: <Info size={14} />,
        };
      case 'pending':
      default:
        return {
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          icon: <AlertCircle size={14} />,
        };
    }
  };

  // Get document type badge with icon
  const getDocumentTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'PDF':
        return {
          icon: <FileText size={12} />,
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30',
          label: 'PDF',
        };
      case 'WORD':
        return {
          icon: <FileType size={12} />,
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          label: 'Word',
        };
      case 'EXCEL':
        return {
          icon: <FileSpreadsheet size={12} />,
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30',
          label: 'Excel',
        };
      case 'IMAGE':
        return {
          icon: <ImageIcon size={12} />,
          bg: 'bg-purple-500/20',
          text: 'text-purple-400',
          border: 'border-purple-500/30',
          label: 'Imagem',
        };
      default:
        return {
          icon: <File size={12} />,
          bg: 'bg-gray-500/20',
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          label: type,
        };
    }
  };

  // Handler for successful upload from modal
  const handleUploadSuccess = useCallback((uploadedDoc: UploadedDocument) => {
    const newDocument: UserDocument = {
      id: uploadedDoc.id,
      name: uploadedDoc.name,
      fileName: uploadedDoc.fileName,
      originalFileName: uploadedDoc.originalFileName,
      type: uploadedDoc.documentType as DocumentType,
      status: 'pending',
      fileSize: uploadedDoc.fileSize,
      mimeType: uploadedDoc.mimeType,
      url: uploadedDoc.fileUrl,
      fileUrl: uploadedDoc.fileUrl,
      description: uploadedDoc.description,
      uploadedAt: uploadedDoc.createdAt,
      createdAt: uploadedDoc.createdAt,
    };

    setDocuments(prev => [newDocument, ...prev]);
  }, []);

  // Handler para excluir documento
  const handleDelete = useCallback(async (documentId: string) => {
    if (!token) return;

    setIsDeleting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/student-documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('error.deleteFailed'));
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setShowDeleteConfirm(null);

      toast({
        title: t('success.deleteTitle'),
        description: t('success.deleteDescription'),
      });
    } catch (err) {
      console.error('Delete error:', err);
      toast({
        title: t('error.title'),
        description: err instanceof Error ? err.message : t('error.deleteFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [token, t]);

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/20 rounded-lg">
            <FileText size={24} className="text-secondary" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t('title')}
            </h2>
            <p className="text-sm text-gray-400">
              {t('description')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors"
        >
          <Upload size={18} />
          {t('uploadButton')}
        </button>
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
            className="px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Lista de Documentos */}
      {!isLoading && !error && documents.length > 0 && (
        <div className="space-y-4">
          {documents.map(doc => {
            const statusStyle = getStatusStyle(doc.status);
            const needsAction = ['rejected', 'needs_replacement', 'needs_additional_info'].includes(doc.status);

            return (
              <div
                key={doc.id}
                className={`group bg-gradient-to-br from-white/5 to-transparent rounded-lg p-4 border transition-all ${
                  needsAction
                    ? 'border-orange-500/30 hover:border-orange-500/50'
                    : 'border-white/10 hover:border-secondary/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Ícone do arquivo */}
                  <div className="p-3 bg-white/5 rounded-lg">
                    {getFileIcon(doc.mimeType)}
                  </div>

                  {/* Informações do documento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {doc.name}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">
                          {doc.fileName}
                        </p>
                      </div>

                      {/* Badge de status */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {statusStyle.icon}
                        {t(`status.${doc.status}`)}
                      </span>
                    </div>

                    {/* Metadados */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {/* Document Type Badge */}
                      {(() => {
                        const typeBadge = getDocumentTypeBadge(doc.type);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${typeBadge.bg} ${typeBadge.text} ${typeBadge.border}`}
                          >
                            {typeBadge.icon}
                            {typeBadge.label}
                          </span>
                        );
                      })()}
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>

                    {/* Rejection Reason - Show when document needs action */}
                    {needsAction && doc.rejectionReason && (
                      <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-xs font-medium text-orange-400 mb-1">{t('actionRequired')}</p>
                        <p className="text-sm text-white">{doc.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreviewDocument(doc)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      title={t('view')}
                    >
                      <Eye size={16} className="text-white" />
                    </button>
                    <a
                      href={doc.fileUrl || doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      title={t('download')}
                    >
                      <Download size={16} className="text-white" />
                    </a>
                    <button
                      onClick={() => setShowDeleteConfirm(doc.id)}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && documents.length === 0 && (
        <div className="text-center py-12">
          <File size={48} className="mx-auto mb-4 text-gray-500" />
          <p className="text-gray-400 mb-2">{t('noDocuments')}</p>
          <p className="text-sm text-gray-500">{t('noDocumentsHint')}</p>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 max-w-sm w-full border border-white/10 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {t('deleteConfirmTitle')}
                </h3>
                <p className="text-sm text-gray-400">
                  {t('deleteConfirmMessage')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                {t('confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
            {/* Header do modal */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {getFileIcon(previewDocument.mimeType)}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {previewDocument.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {previewDocument.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDocument(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Conteúdo do preview */}
            <div className="p-8 flex items-center justify-center min-h-[400px] bg-black/20">
              {previewDocument.mimeType.startsWith('image/') ? (
                <div className="text-center">
                  <ImageIcon size={64} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">{t('previewImagePlaceholder')}</p>
                </div>
              ) : (
                <div className="text-center">
                  <FileText size={64} className="mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">{t('previewNotAvailable')}</p>
                  <a
                    href={previewDocument.fileUrl || previewDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
                  >
                    <Download size={16} />
                    {t('downloadToView')}
                  </a>
                </div>
              )}
            </div>

            {/* Footer com informações */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-4">
                <span>{formatFileSize(previewDocument.fileSize)}</span>
                <span>{formatDate(previewDocument.uploadedAt)}</span>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getStatusStyle(previewDocument.status).bg} ${getStatusStyle(previewDocument.status).text} ${getStatusStyle(previewDocument.status).border}`}>
                {getStatusStyle(previewDocument.status).icon}
                {t(`status.${previewDocument.status}`)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {userId && (
        <UploadDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          studentId={userId}
        />
      )}
    </div>
  );
}

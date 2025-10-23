// /src/components/DocumentsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useDocumentStatus, getStatusMessage } from '@/hooks/queries/useDocumentStatus';
import { useDocumentAccess, useCachedDocumentUrl } from '@/hooks/queries/useDocumentAccess';
import DocumentItem from './DocumentItem';
import {
  FileText,
  Loader2,
  Shield,
  AlertCircle,
} from 'lucide-react';
import type { ProtectionLevel } from '@/hooks/queries/useDocumentStatus';

// Import PDFViewerModal only on client-side to avoid SSR issues with PDF.js
const PDFViewerModal = dynamic(() => import('./PDFViewerModal'), {
  ssr: false,
  loading: () => null,
});

interface DocumentTranslation {
  locale: string;
  title: string;
  description: string;
  url: string;
}

interface Document {
  id: string;
  filename: string;
  protectionLevel?: ProtectionLevel;
  translations: DocumentTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentsSectionProps {
  documents: Document[];
  locale: string;
  lessonId: string;
}

export default function DocumentsSection({ documents, locale, lessonId }: DocumentsSectionProps) {
  const tLesson = useTranslations('Lesson');
  const queryClient = useQueryClient();

  const [isMounted, setIsMounted] = useState(false);
  const [pdfViewerState, setPdfViewerState] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    protectionLevel: ProtectionLevel;
  }>({
    isOpen: false,
    url: '',
    title: '',
    protectionLevel: 'NONE',
  });

  const [processingDocumentId, setProcessingDocumentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentRateLimitInfo, setCurrentRateLimitInfo] = useState<{
    limit: number;
    remaining: number;
    resetAt: number;
  } | null>(null);

  // Only render modal on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hook for document status (only enabled when processing a document)
  const documentStatus = useDocumentStatus({
    lessonId,
    documentId: processingDocumentId || '',
    enabled: !!processingDocumentId,
    onStatusChange: (status) => {
      console.log('[DocumentsSection] Status changed:', status);
    },
  });

  // Hook for document access mutation
  const documentAccess = useDocumentAccess({
    onSuccess: (url, rateLimitInfo) => {
      console.log('[DocumentsSection] Access granted:', { url, rateLimitInfo });

      const document = documents.find(d => d.id === processingDocumentId);
      if (!document) return;

      const translation = document.translations.find(t => t.locale === locale) || document.translations[0];

      // Store rate limit info if available (FULL documents)
      if (rateLimitInfo) {
        setCurrentRateLimitInfo(rateLimitInfo);
      }

      setPdfViewerState({
        isOpen: true,
        url,
        title: translation?.title || document.filename,
        protectionLevel: document.protectionLevel || 'NONE',
      });

      setProcessingDocumentId(null);
      setErrorMessage(null);
    },
    onError: (error) => {
      console.error('[DocumentsSection] Access error:', error);
      setErrorMessage(error);
      setProcessingDocumentId(null);
    },
  });

  // Get cached URL for the document being processed
  const cachedUrl = useCachedDocumentUrl(lessonId, processingDocumentId || '');

  // Auto-trigger access when status becomes COMPLETED
  useEffect(() => {
    if (!processingDocumentId) return;
    if (!documentStatus.data) return;

    const { processingStatus, protectionLevel } = documentStatus.data;

    // If document is completed and we don't have a cached URL, request access
    if (processingStatus === 'COMPLETED' && !cachedUrl.hasCachedUrl) {
      console.log('[DocumentsSection] Document COMPLETED, requesting access...');

      documentAccess.accessDocument({
        lessonId,
        documentId: processingDocumentId,
        protectionLevel,
      });
    }

    // If document failed, show error
    if (processingStatus === 'FAILED') {
      setErrorMessage(documentStatus.data.processingError || 'Falha no processamento do documento');
      setProcessingDocumentId(null);
    }
  }, [documentStatus.data, processingDocumentId, cachedUrl.hasCachedUrl, lessonId, documentAccess]);

  const handleDocumentClick = async (document: Document, translation: DocumentTranslation) => {
    const protectionLevel = document.protectionLevel || 'NONE';

    console.log('[DocumentsSection] Document clicked:', {
      documentId: document.id,
      protectionLevel,
      translationUrl: translation.url,
    });

    setErrorMessage(null);

    // NONE: Use URL directly from translations, open in new tab
    if (protectionLevel === 'NONE') {
      window.open(translation.url, '_blank');
      return;
    }

    // For WATERMARK or FULL: Check if we have a cached URL using queryClient directly
    const cachedData = queryClient.getQueryData<{
      url: string;
      rateLimitInfo?: {
        limit: number;
        remaining: number;
        resetAt: number;
      };
    }>(['document-access', lessonId, document.id]);

    if (cachedData?.url) {
      console.log('[DocumentsSection] Using cached URL! ⚡');

      // Update rate limit info if available
      if (cachedData.rateLimitInfo) {
        setCurrentRateLimitInfo(cachedData.rateLimitInfo);
      }

      setPdfViewerState({
        isOpen: true,
        url: cachedData.url,
        title: translation.title || document.filename,
        protectionLevel,
      });
      return;
    }

    // No cache - need to check status and request access
    console.log('[DocumentsSection] No cache, checking status...');
    setProcessingDocumentId(document.id);
  };

  const closePdfViewer = () => {
    setPdfViewerState({
      isOpen: false,
      url: '',
      title: '',
      protectionLevel: 'NONE',
    });
  };

  if (documents.length === 0) {
    return null;
  }

  const isLoading = documentStatus.isLoading || documentAccess.isLoading || documentStatus.isPolling;
  const currentError = errorMessage || documentStatus.error || documentAccess.error;

  return (
    <>
    <div className="mt-8">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <div className="p-2 bg-secondary/20 rounded-lg">
            <FileText size={20} className="text-secondary" />
          </div>
          {tLesson('documents')}
        </h4>
        <div className="h-0.5 w-16 bg-gradient-to-r from-secondary to-transparent rounded-full ml-11"></div>
      </div>

      {/* Loading/Processing message */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-blue-400" />
          <div className="flex-1">
            <span className="text-sm text-blue-400">
              {documentStatus.isPolling
                ? `Processando documento... ${documentStatus.data ? getStatusMessage(documentStatus.data.processingStatus) : ''}`
                : documentAccess.isLoading
                ? 'Solicitando acesso ao documento...'
                : 'Verificando status do documento...'}
            </span>
            {documentStatus.isPolling && (
              <p className="text-xs text-blue-300 mt-1">
                Isso pode levar alguns minutos. Por favor, aguarde...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {currentError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-400">{currentError}</span>
        </div>
      )}

      {/* Rate limit info for FULL documents */}
      {currentRateLimitInfo && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-yellow-400" />
            <span className="text-sm text-yellow-400 font-medium">
              Limite de acessos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-400 h-full transition-all duration-300"
                style={{
                  width: `${(currentRateLimitInfo.remaining / currentRateLimitInfo.limit) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {currentRateLimitInfo.remaining}/{currentRateLimitInfo.limit}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {documents.map((document, index) => {
          const docTranslation =
            document.translations.find(t => t.locale === locale) ||
            document.translations[0];

          const isCurrentLoading = isLoading && processingDocumentId === document.id;

          return (
            <DocumentItem
              key={document.id}
              document={document}
              translation={docTranslation}
              lessonId={lessonId}
              isLoading={isCurrentLoading}
              onDocumentClick={handleDocumentClick}
              openDocumentText={tLesson('openDocument')}
              index={index}
            />
          );
        })}
      </div>
    </div>

    {/* PDF Viewer Modal */}
    {isMounted && (
      <PDFViewerModal
        isOpen={pdfViewerState.isOpen}
        onClose={closePdfViewer}
        pdfUrl={pdfViewerState.url}
        documentTitle={pdfViewerState.title}
        protectionLevel={pdfViewerState.protectionLevel}
      />
    )}
    </>
  );
}

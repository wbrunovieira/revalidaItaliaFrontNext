// /src/components/DocumentsSection.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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

  // Track which documents have already had POST /access called to prevent duplicates
  const accessRequestedRef = useRef<Set<string>>(new Set());

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
      console.log('[DocumentsSection] ✅ POST /access SUCCESS - URL received');
      console.log('[DocumentsSection] Rate limit info:', rateLimitInfo);

      const document = documents.find(d => d.id === processingDocumentId);
      if (!document) return;

      const translation = document.translations.find(t => t.locale === locale) || document.translations[0];
      const protectionLevel = document.protectionLevel || 'NONE';

      // NONE: Open in new tab (user's browser PDF reader)
      if (protectionLevel === 'NONE') {
        console.log('[DocumentsSection] 🎉 NONE document - opening in new tab with browser PDF reader');
        window.open(url, '_blank');

        // Clean up
        setProcessingDocumentId(null);
        setErrorMessage(null);
        return;
      }

      // WATERMARK/FULL: Open in internal PDFViewerModal
      console.log('[DocumentsSection] 🎉 Protected document - opening in internal PDF viewer');

      // Store rate limit info if available (FULL documents)
      if (rateLimitInfo) {
        setCurrentRateLimitInfo(rateLimitInfo);
      }

      setPdfViewerState({
        isOpen: true,
        url,
        title: translation?.title || document.filename,
        protectionLevel,
      });

      // Clean up
      setProcessingDocumentId(null);
      setErrorMessage(null);
    },
    onError: (error) => {
      console.error('[DocumentsSection] ❌ POST /access ERROR:', error);
      setErrorMessage(error);
      setProcessingDocumentId(null);

      // Remove from ref so user can retry
      const accessKey = `${lessonId}-${processingDocumentId}`;
      accessRequestedRef.current.delete(accessKey);
    },
  });

  // Get cached URL for the document being processed
  const cachedUrl = useCachedDocumentUrl(lessonId, processingDocumentId || '');

  // Auto-trigger access when status becomes COMPLETED
  useEffect(() => {
    if (!processingDocumentId) return;
    if (!documentStatus.data) return;

    const { processingStatus, protectionLevel } = documentStatus.data;

    // If document is completed and we don't have a cached URL
    if (processingStatus === 'COMPLETED' && !cachedUrl.hasCachedUrl) {
      // Check if we already requested access for this document (prevent duplicates)
      const accessKey = `${lessonId}-${processingDocumentId}`;

      if (accessRequestedRef.current.has(accessKey)) {
        console.log('[DocumentsSection] POST /access already requested for this document, skipping...');
        return;
      }

      console.log('[DocumentsSection] ✅ Document COMPLETED, calling POST /access ONE TIME...');
      console.log('[DocumentsSection] This should be the ONLY POST /access for this document!');

      // Mark as requested BEFORE calling to prevent race conditions
      accessRequestedRef.current.add(accessKey);

      // Call POST /access ONCE
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
  }, [documentStatus.data, processingDocumentId, cachedUrl.hasCachedUrl, lessonId]);

  const handleDocumentClick = async (document: Document, translation: DocumentTranslation) => {
    const protectionLevel = document.protectionLevel || 'NONE';

    console.log('========================================');
    console.log('[DocumentsSection] 📄 Document clicked');
    console.log('[DocumentsSection] documentId:', document.id);
    console.log('[DocumentsSection] protectionLevel:', protectionLevel);
    console.log('========================================');

    setErrorMessage(null);

    // NONE: Call POST /access to get CloudFront Signed URL, then open in new tab
    // User can use their browser's native PDF reader
    if (protectionLevel === 'NONE') {
      // Check cache first
      const cachedData = queryClient.getQueryData<{
        url: string;
      }>(['document-access', lessonId, document.id]);

      if (cachedData?.url) {
        console.log('[DocumentsSection] ⚡ Using cached URL for NONE document');
        window.open(cachedData.url, '_blank');
        return;
      }

      // No cache - need to get URL from POST /access
      console.log('[DocumentsSection] 🔄 NONE document - will call POST /access to get CloudFront URL');
      setProcessingDocumentId(document.id);
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
      console.log('[DocumentsSection] ⚡ Using cached URL (POST /access was already called)');

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

    // No cache - start GET /status polling
    console.log('[DocumentsSection] 🔄 No cache, starting GET /status polling...');
    console.log('[DocumentsSection] Will poll GET /status every 10 seconds until status=COMPLETED');
    console.log('[DocumentsSection] When status=COMPLETED, will call POST /access ONE TIME');
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

  // Debug logs
  console.log('[DocumentsSection] Render state:', {
    isLoading,
    processingDocumentId,
    'documentStatus.isLoading': documentStatus.isLoading,
    'documentStatus.isPolling': documentStatus.isPolling,
    'documentAccess.isLoading': documentAccess.isLoading,
    'documentStatus.data': documentStatus.data,
  });

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

      {/* Enhanced Loading/Processing message */}
      {isLoading && (
        <div className="mb-4 relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-pulse"></div>

          <div className="relative p-4">
            <div className="flex items-start gap-4">
              {/* Animated icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping"></div>
                <div className="relative w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                  {documentStatus.isPolling ? (
                    <Shield size={24} className="text-blue-400" />
                  ) : (
                    <Loader2 size={24} className="animate-spin text-blue-400" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <div className="flex items-center gap-2 mb-2">
                  <h5 className="text-base font-semibold text-blue-400">
                    {documentStatus.isPolling
                      ? 'Processando Documento Protegido'
                      : documentAccess.isLoading
                      ? 'Solicitando Acesso'
                      : 'Verificando Status'}
                  </h5>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-blue-300/90 mb-3">
                  {documentStatus.isPolling
                    ? 'Estamos aplicando proteções avançadas ao seu documento. Este processo garante a segurança e controle de acesso ao conteúdo.'
                    : documentAccess.isLoading
                    ? 'Gerando acesso seguro ao documento...'
                    : 'Verificando disponibilidade do documento...'}
                </p>

                {/* Additional info */}
                {documentStatus.isPolling && (
                  <div className="flex items-start gap-2 text-xs text-blue-300/60">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      Tempo estimado: 1-3 minutos. Você pode navegar pela página enquanto aguarda.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status badge */}
            {documentStatus.data && (
              <div className="mt-3 flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-xs font-medium text-blue-300">
                    Status: {getStatusMessage(documentStatus.data.processingStatus)}
                  </span>
                </div>
                {documentStatus.isRefetching && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-400/20 rounded-full">
                    <Loader2 size={10} className="animate-spin text-blue-400" />
                    <span className="text-xs text-blue-400/70">Atualizando...</span>
                  </div>
                )}
              </div>
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

// /src/components/DocumentsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useDocumentStatus } from '@/hooks/useDocumentStatus';
import { useDocumentAccess } from '@/hooks/useDocumentAccess';
import {
  FileText,
  File,
  Archive,
  ExternalLink,
  Presentation,
  FileImage,
  FileVideo,
  FileAudio,
  Loader2,
  Shield,
  AlertCircle,
} from 'lucide-react';
import type { ProcessingStatus, ProtectionLevel } from '@/hooks/useDocumentStatus';

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

// Function to get file icon based on filename
function getFileIcon(filename: string): React.ReactElement {
  const extension = filename?.split('.').pop()?.toLowerCase();

  // Check if it's a PDF file
  if (extension === 'pdf') {
    return (
      <Image
        src="/icons/pdf.svg"
        alt="PDF"
        width={32}
        height={32}
        className="w-8 h-8"
      />
    );
  }

  // Check if it's a Word file
  if (extension === 'doc' || extension === 'docx') {
    return (
      <Image
        src="/icons/word.svg"
        alt="Word"
        width={32}
        height={32}
        className="w-8 h-8"
      />
    );
  }

  // Check if it's an Excel file
  if (extension === 'xls' || extension === 'xlsx') {
    return (
      <Image
        src="/icons/excel.svg"
        alt="Excel"
        width={32}
        height={32}
        className="w-8 h-8"
      />
    );
  }

  // Check if it's a PowerPoint file
  if (extension === 'ppt' || extension === 'pptx') {
    return (
      <Image
        src="/icons/powerpoint.svg"
        alt="PowerPoint"
        width={32}
        height={32}
        className="w-8 h-8"
      />
    );
  }

  // Fallback to lucide icons
  switch (extension) {
    case 'ppt':
    case 'pptx':
      return <Presentation size={24} className="text-orange-400" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage size={24} className="text-blue-400" />;
    case 'mp4':
    case 'avi':
    case 'mkv':
    case 'mov':
    case 'webm':
      return <FileVideo size={24} className="text-purple-400" />;
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
    case 'aac':
      return <FileAudio size={24} className="text-yellow-400" />;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return <Archive size={24} className="text-gray-400" />;
    case 'txt':
      return <FileText size={24} className="text-gray-300" />;
    default:
      return <File size={24} className="text-gray-400" />;
  }
}


export default function DocumentsSection({ documents, locale, lessonId }: DocumentsSectionProps) {
  const tLesson = useTranslations('Lesson');

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

  const [activeDocument, setActiveDocument] = useState<{
    id: string;
    title: string;
    protectionLevel: ProtectionLevel;
  } | null>(null);

  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Hook to check document status (only when activeDocument is set and not NONE)
  const documentStatus = useDocumentStatus({
    lessonId,
    documentId: activeDocument?.id || '',
    onStatusChange: (status: ProcessingStatus) => {
      console.log('Document status changed:', status);
    },
  });

  // Hook for WATERMARK documents
  const watermarkAccess = useDocumentAccess({
    lessonId,
    documentId: activeDocument?.protectionLevel === 'WATERMARK' ? activeDocument.id : '',
    protectionLevel: 'WATERMARK',
    onSuccess: (url) => {
      setPdfViewerState({
        isOpen: true,
        url,
        title: activeDocument?.title || '',
        protectionLevel: 'WATERMARK',
      });
      setActiveDocument(null);
      setProcessingMessage(null);
      setAccessError(null);
    },
    onError: (error) => {
      setAccessError(error);
      setActiveDocument(null);
      setProcessingMessage(null);
    },
  });

  // Hook for FULL documents
  const fullAccess = useDocumentAccess({
    lessonId,
    documentId: activeDocument?.protectionLevel === 'FULL' ? activeDocument.id : '',
    protectionLevel: 'FULL',
    onSuccess: (url) => {
      setPdfViewerState({
        isOpen: true,
        url,
        title: activeDocument?.title || '',
        protectionLevel: 'FULL',
      });
      setActiveDocument(null);
      setProcessingMessage(null);
      setAccessError(null);
    },
    onError: (error) => {
      setAccessError(error);
      setActiveDocument(null);
      setProcessingMessage(null);
    },
  });

  // Only render modal on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle protected document access flow
  useEffect(() => {
    if (!activeDocument) return;
    if (activeDocument.protectionLevel === 'NONE') return;
    if (!activeDocument.id) return; // Safety check

    const handleProtectedAccess = async () => {
      try {
        console.log('[DocumentsSection] Starting protected access flow for:', activeDocument.id, activeDocument.protectionLevel);
        setAccessError(null);
        setProcessingMessage('Verificando status do documento...');

        // Step 1: Check document status
        console.log('[DocumentsSection] Step 1: Checking document status...');
        const doc = await documentStatus.checkAndWait();
        console.log('[DocumentsSection] checkAndWait returned:', doc);

        if (!doc) {
          // Failed or timeout
          console.log('[DocumentsSection] No document returned (failed or timeout)');
          setProcessingMessage(null);
          return;
        }

        // Safety check: activeDocument might have changed during async operation
        if (!activeDocument || !activeDocument.id) {
          console.log('[DocumentsSection] activeDocument became null during async operation');
          setProcessingMessage(null);
          return;
        }

        // Step 2: Document is COMPLETED, request access
        console.log('[DocumentsSection] Step 2: Document is COMPLETED, requesting access...');
        setProcessingMessage('Solicitando acesso ao documento...');

        if (activeDocument.protectionLevel === 'WATERMARK') {
          console.log('[DocumentsSection] Calling watermarkAccess.accessDocument()');
          await watermarkAccess.accessDocument();
        } else if (activeDocument.protectionLevel === 'FULL') {
          console.log('[DocumentsSection] Calling fullAccess.accessDocument()');
          await fullAccess.accessDocument();
        }

        console.log('[DocumentsSection] Access flow completed successfully');
      } catch (error) {
        console.error('[DocumentsSection] Error in protected access flow:', error);
        setProcessingMessage(null);
      }
    };

    handleProtectedAccess();
  }, [activeDocument, documentStatus, watermarkAccess, fullAccess]);

  const handleDocumentClick = (document: Document, translation: DocumentTranslation) => {
    const protectionLevel = document.protectionLevel || 'NONE';

    console.log('Document clicked:', {
      documentId: document.id,
      protectionLevel,
      translationUrl: translation.url,
    });

    // NONE: Use URL directly from translations, open in new tab
    if (protectionLevel === 'NONE') {
      window.open(translation.url, '_blank');
      return;
    }

    // WATERMARK or FULL: Start protected access flow
    setActiveDocument({
      id: document.id,
      title: translation.title || document.filename,
      protectionLevel,
    });
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

  const isLoading = documentStatus.loading || watermarkAccess.loading || fullAccess.loading || documentStatus.isPolling;
  const currentError = accessError || documentStatus.error || watermarkAccess.error || fullAccess.error;

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
              {processingMessage || tLesson('loadingDocument')}
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
      {fullAccess.rateLimitInfo && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-yellow-400" />
            <span className="text-sm text-yellow-400 font-medium">
              {tLesson('rateLimitInfo')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-400 h-full transition-all duration-300"
                style={{
                  width: `${(fullAccess.rateLimitInfo.remaining / fullAccess.rateLimitInfo.limit) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {fullAccess.rateLimitInfo.remaining}/{fullAccess.rateLimitInfo.limit}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {documents.map((document, index) => {
          const docTranslation =
            document.translations.find(t => t.locale === locale) ||
            document.translations[0];

          const isCurrentLoading = isLoading && activeDocument?.id === document.id;
          const protectionLevel = document.protectionLevel || 'NONE';

          return (
            <div
              key={document.id}
              className="group relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`relative flex items-center gap-3 p-3 bg-primary/40 rounded-lg border border-secondary/30 transition-all duration-300 overflow-hidden
                  ${isCurrentLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-primary/60 hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-x-1 hover:py-4'}`}
                onClick={() => !isCurrentLoading && handleDocumentClick(document, docTranslation)}
              >
                {/* Animated background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/10 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />

                {/* Icon with rotation animation */}
                <div className="relative flex-shrink-0 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {isCurrentLoading ? (
                    <Loader2 size={24} className="animate-spin text-secondary" />
                  ) : (
                    getFileIcon(document.filename)
                  )}
                </div>

                {/* Title with underline animation and description */}
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-white group-hover:text-secondary transition-colors duration-300 truncate">
                      {docTranslation?.title || document.filename}
                    </h5>
                    {protectionLevel === 'FULL' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 rounded text-xs text-red-400 border border-red-500/30">
                        <Shield size={10} />
                        <span>FULL</span>
                      </div>
                    )}
                    {protectionLevel === 'WATERMARK' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-400 border border-blue-500/30">
                        <Shield size={10} />
                        <span>WATERMARK</span>
                      </div>
                    )}
                  </div>
                  {/* Description that appears on hover */}
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-300 ease-out">
                    {docTranslation?.description}
                  </p>
                  <div className="absolute bottom-0 left-0 h-0.5 bg-secondary w-0 group-hover:w-full transition-all duration-300 ease-out" />
                </div>

                {/* Arrow icon with slide animation */}
                <div className="relative flex items-center gap-2">
                  <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {tLesson('openDocument')}
                  </span>
                  <ExternalLink
                    size={16}
                    className="text-gray-400 group-hover:text-secondary transform transition-all duration-300 group-hover:translate-x-1"
                  />
                </div>
              </div>
            </div>
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

// /src/components/DocumentsSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import dynamic from 'next/dynamic';
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

// Import PDFViewerModal only on client-side to avoid SSR issues with PDF.js
const PDFViewerModal = dynamic(() => import('./PDFViewerModal'), {
  ssr: false,
  loading: () => null,
});

type ProtectionLevel = 'NONE' | 'WATERMARK' | 'FULL';

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

// Function to normalize document URL by adding /api/v1/ prefix if needed
function normalizeDocumentUrl(url: string): string {
  if (!url) return url;

  // Check if URL already has /api/v1/ prefix
  if (url.includes('/api/v1/')) {
    return url;
  }

  // Check if URL is a full URL (starts with http:// or https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Replace /uploads/ with /api/v1/uploads/ in the URL path
    return url.replace('/uploads/', '/api/v1/uploads/');
  }

  // Check if URL is a relative path starting with /uploads/
  if (url.startsWith('/uploads/')) {
    return url.replace('/uploads/', '/api/v1/uploads/');
  }

  return url;
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
  if (extension === 'xls' || extension === 'xlsx' || extension === 'csv') {
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
  
  // Default icon for other file types
  switch (extension) {
    case 'ppt':
    case 'pptx':
      return <Presentation size={24} className="text-orange-400" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
      return <FileImage size={24} className="text-purple-400" />;
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'mkv':
      return <FileVideo size={24} className="text-pink-400" />;
    case 'mp3':
    case 'wav':
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

  const [activeDocument, setActiveDocument] = useState<{ id: string; title: string } | null>(null);

  // Hook for FULL protection documents
  const documentAccess = useDocumentAccess({
    lessonId,
    documentId: activeDocument?.id || '',
    onSuccess: (signedUrl) => {
      // Open signed URL in PDF viewer
      setPdfViewerState({
        isOpen: true,
        url: signedUrl,
        title: activeDocument?.title || '',
        protectionLevel: 'FULL',
      });
      setActiveDocument(null);
    },
    onError: (error) => {
      console.error('Error accessing document:', error);
      setActiveDocument(null);
    },
  });

  // Only render modal on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Trigger access when activeDocument changes
  useEffect(() => {
    if (activeDocument) {
      documentAccess.accessDocument();
    }
  }, [activeDocument]);

  const handleDocumentClick = (document: Document, translation: DocumentTranslation) => {
    const protectionLevel = document.protectionLevel || 'NONE';
    const normalizedUrl = normalizeDocumentUrl(translation.url);

    console.log('Document clicked:', {
      originalUrl: translation.url,
      normalizedUrl,
      protectionLevel
    });

    // For NONE, open in new tab (legacy behavior)
    if (protectionLevel === 'NONE') {
      window.open(normalizedUrl, '_blank');
      return;
    }

    // For WATERMARK, use custom viewer with normalized URL
    if (protectionLevel === 'WATERMARK') {
      setPdfViewerState({
        isOpen: true,
        url: normalizedUrl,
        title: translation.title || document.filename,
        protectionLevel: 'WATERMARK',
      });
      return;
    }

    // For FULL, request signed URL via hook
    if (protectionLevel === 'FULL') {
      console.log('Requesting FULL protection document:', {
        documentId: document.id,
        lessonId,
        title: translation.title || document.filename,
      });
      setActiveDocument({
        id: document.id,
        title: translation.title || document.filename,
      });
      return;
    }
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
      {/* Loading/Error overlay */}
      {documentAccess.loading && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-3">
          <Loader2 size={20} className="animate-spin text-blue-400" />
          <span className="text-sm text-blue-400">
            {tLesson('loadingDocument')}
          </span>
        </div>
      )}

      {documentAccess.error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-400">{documentAccess.error}</span>
        </div>
      )}

      {documentAccess.rateLimitInfo && (
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
                  width: `${(documentAccess.rateLimitInfo.remaining / documentAccess.rateLimitInfo.limit) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {documentAccess.rateLimitInfo.remaining}/{documentAccess.rateLimitInfo.limit}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {documents.map((document, index) => {
          const docTranslation =
            document.translations.find(t => t.locale === locale) ||
            document.translations[0];

          const isLoading = documentAccess.loading && activeDocument?.id === document.id;
          const protectionLevel = document.protectionLevel || 'NONE';

          return (
            <div
              key={document.id}
              className="group relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`relative flex items-center gap-3 p-3 bg-primary/40 rounded-lg border border-secondary/30 transition-all duration-300 overflow-hidden
                  ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:bg-primary/60 hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-x-1 hover:py-4'}`}
                onClick={() => !isLoading && handleDocumentClick(document, docTranslation)}
              >
                {/* Animated background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/10 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />

                {/* Icon with rotation animation */}
                <div className="relative flex-shrink-0 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {isLoading ? (
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

    {/* PDF Viewer Modal - Only render on client-side */}
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
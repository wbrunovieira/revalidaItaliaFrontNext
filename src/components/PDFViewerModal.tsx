// /src/components/PDFViewerModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  Shield,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

type ProtectionLevel = 'NONE' | 'WATERMARK' | 'FULL';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  documentTitle: string;
  protectionLevel?: ProtectionLevel;
}

// Declare global pdfjsLib type
declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export default function PDFViewerModal({
  isOpen,
  onClose,
  pdfUrl,
  documentTitle,
  protectionLevel = 'NONE',
}: PDFViewerModalProps) {
  const t = useTranslations('PDFViewer');

  const [pdfjs, setPdfjs] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  // Load PDF.js from CDN to avoid webpack issues
  useEffect(() => {
    const loadPdfJs = () => {
      if (window.pdfjsLib) {
        console.log('PDF.js already loaded');
        setPdfjs(window.pdfjsLib);
        return;
      }

      console.log('Loading PDF.js from CDN...');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          console.log('PDF.js loaded successfully');
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          setPdfjs(window.pdfjsLib);
        }
      };
      script.onerror = () => {
        console.error('Failed to load PDF.js from CDN');
      };
      document.body.appendChild(script);
    };

    loadPdfJs();
  }, []);

  // Load PDF when pdfjs is ready and modal opens
  useEffect(() => {
    if (!pdfjs || !isOpen || !pdfUrl) {
      console.log('PDF load skipped:', { pdfjs: !!pdfjs, isOpen, pdfUrl });
      return;
    }

    const loadPDF = async () => {
      console.log('Starting PDF load:', pdfUrl);
      setLoading(true);
      setError(null);

      try {
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdfDoc = await loadingTask.promise;
        console.log('PDF loaded successfully:', { numPages: pdfDoc.numPages });
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(t('errors.loadFailed'));
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfjs, isOpen, pdfUrl, t]);

  // Render current page
  useEffect(() => {
    if (!pdf || !canvasRef) {
      console.log('Render skipped:', { pdf: !!pdf, canvasRef: !!canvasRef });
      return;
    }

    const renderPage = async () => {
      try {
        console.log('Rendering page:', pageNumber, 'scale:', scale);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef;
        const context = canvas.getContext('2d');

        if (!context) {
          console.error('Canvas context is null');
          return;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
        console.log('Page rendered successfully');
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [pdf, pageNumber, scale, canvasRef]);

  // Navigation
  const goToPreviousPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  // Zoom
  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          goToPreviousPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose, goToPreviousPage, goToNextPage, zoomIn, zoomOut, resetZoom]);

  // Prevent context menu (right-click)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  // Block text selection for protected documents
  const selectionStyle =
    protectionLevel === 'WATERMARK' || protectionLevel === 'FULL'
      ? { userSelect: 'none' as const, WebkitUserSelect: 'none' as const }
      : {};

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPageNumber(1);
      setScale(1.0);
      setIsFullscreen(false);
      setLoading(true);
      setError(null);
      setPdf(null);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getProtectionIcon = () => {
    switch (protectionLevel) {
      case 'WATERMARK':
        return <Shield size={16} className="text-blue-400" />;
      case 'FULL':
        return <ShieldCheck size={16} className="text-green-400" />;
      default:
        return <FileText size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-gray-900 shadow-2xl flex flex-col ${
          isFullscreen
            ? 'w-full h-full'
            : 'rounded-xl w-full max-w-6xl mx-4 max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0 bg-gray-800">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getProtectionIcon()}
            <h2 className="text-lg font-bold text-white truncate">
              {documentTitle}
            </h2>
            {(protectionLevel === 'WATERMARK' || protectionLevel === 'FULL') && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400 border border-blue-500/30">
                <Shield size={12} />
                <span>{t('protected')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              title={t('close')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50 flex-shrink-0">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={t('previousPage')}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-300 min-w-[100px] text-center">
              {t('pageInfo', { current: pageNumber, total: numPages })}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={t('nextPage')}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={t('zoomOut')}
            >
              <ZoomOut size={20} />
            </button>
            <span className="text-sm text-gray-300 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={t('zoomIn')}
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={resetZoom}
              className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title={t('resetZoom')}
            >
              {t('reset')}
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div
          className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-4"
          onContextMenu={handleContextMenu}
          style={selectionStyle}
        >
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={48} className="animate-spin text-secondary" />
              <p className="text-gray-400">{t('loading')}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 max-w-md text-center">
              <FileText size={48} className="text-red-400" />
              <p className="text-red-400 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          )}

          {!loading && !error && (
            <canvas
              ref={setCanvasRef}
              className="shadow-2xl max-w-full"
              style={selectionStyle}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {t('keyboardShortcuts')}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-white rounded-lg transition-colors font-medium text-sm"
            >
              {t('backToLesson')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

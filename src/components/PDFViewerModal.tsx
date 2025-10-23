// /src/components/PDFViewerModal.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
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
interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getViewport: (params: { scale: number }) => PDFPageViewport;
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport; canvas: HTMLCanvasElement }) => { promise: Promise<void> };
}

interface PDFPageViewport {
  width: number;
  height: number;
}

interface PDFJSLib {
  getDocument: (params: { url: string; withCredentials: boolean; isEvalSupported: boolean; disableStream: boolean; disableAutoFetch: boolean }) => { promise: Promise<PDFDocumentProxy> };
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

declare global {
  interface Window {
    pdfjsLib?: PDFJSLib;
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

  const [pdfjs, setPdfjs] = useState<PDFJSLib | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderingPages = useRef<Set<number>>(new Set());
  const renderedPages = useRef<Set<string>>(new Set()); // Track by "pageNum-scale" key

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
        const loadingTask = pdfjs.getDocument({
          url: pdfUrl,
          withCredentials: false,
          isEvalSupported: false,
          disableStream: true,
          disableAutoFetch: true,
        });
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

  // Render a single page
  const renderPage = useCallback(async (pageNum: number, canvas: HTMLCanvasElement) => {
    // Skip if currently rendering
    if (!pdf || renderingPages.current.has(pageNum)) {
      console.log(`[renderPage] Skipping page ${pageNum} - already rendering or no PDF`);
      return;
    }

    // Get unique key for this render (pageNum + scale)
    const renderKey = `${pageNum}-${scale}`;

    // Check if this specific page at this scale was already rendered
    if (renderedPages.current.has(renderKey)) {
      console.log(`[renderPage] Page ${pageNum} already rendered at scale ${scale}, skipping`);
      return;
    }

    // Mark as rendering
    renderingPages.current.add(pageNum);

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      console.log(`[renderPage] Rendering page ${pageNum} with scale ${scale}, viewport: ${viewport.width}x${viewport.height}`);

      const context = canvas.getContext('2d');
      if (!context) {
        renderingPages.current.delete(pageNum);
        return;
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      console.log(`[renderPage] Canvas dimensions set to: ${canvas.width}x${canvas.height}`);

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      }).promise;

      renderedPages.current.add(renderKey);
      console.log(`[renderPage] Page ${pageNum} rendered successfully at scale ${scale}`);
      console.log(`[renderPage] Final canvas size: ${canvas.width}x${canvas.height}, style: ${canvas.style.width}x${canvas.style.height}`);
    } catch (err) {
      console.error(`[renderPage] Error rendering page ${pageNum}:`, err);
    } finally {
      // Always remove from rendering list
      renderingPages.current.delete(pageNum);
    }
  }, [pdf, scale]);

  // Intersection Observer for lazy loading pages
  useEffect(() => {
    if (!pdf || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '0');
            const canvas = entry.target as HTMLCanvasElement;
            if (pageNum > 0) {
              renderPage(pageNum, canvas);
            }

            // Update current page indicator
            if (entry.intersectionRatio > 0.5) {
              setCurrentPage(pageNum);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: [0, 0.5, 1],
      }
    );

    // Observe all canvas elements
    pageRefs.current.forEach((canvas) => {
      if (canvas) observer.observe(canvas);
    });

    return () => {
      observer.disconnect();
    };
  }, [pdf, numPages, renderPage]);

  // Reset rendering tracking when scale changes
  // The key change in the DOM will force React to recreate canvas elements
  useEffect(() => {
    console.log('[PDFViewerModal] Scale changed to:', scale);
    renderedPages.current.clear();
    renderingPages.current.clear();
    pageRefs.current.clear();
  }, [scale]);

  // Zoom
  const zoomIn = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.min(prev + 0.25, 3.0);
      console.log('[zoomIn] Changing scale from', prev, 'to', newScale);
      return newScale;
    });
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
  }, [isOpen, isFullscreen, onClose, zoomIn, zoomOut, resetZoom]);

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
      setCurrentPage(1);
      setScale(1.0);
      setIsFullscreen(false);
      setLoading(true);
      setError(null);
      setPdf(null);
      renderedPages.current.clear();
      pageRefs.current.clear();
      renderingPages.current.clear();
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
        return <Shield size={16} className="text-secondary" />;
      case 'FULL':
        return <ShieldCheck size={16} className="text-secondary" />;
      default:
        return <FileText size={16} className="text-gray-300" />;
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
        className={`relative bg-primary shadow-2xl flex flex-col ${
          isFullscreen
            ? 'w-full h-full'
            : 'rounded-xl w-full max-w-6xl mx-4 max-h-[90vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary/30 flex-shrink-0 bg-primary/90">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getProtectionIcon()}
            <h2 className="text-lg font-bold text-white truncate">
              {documentTitle}
            </h2>
            {(protectionLevel === 'WATERMARK' || protectionLevel === 'FULL') && (
              <div className="flex items-center gap-1 px-2 py-1 bg-secondary/20 rounded text-xs text-secondary border border-secondary/30">
                <Shield size={12} />
                <span>{t('protected')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-300 hover:text-white hover:bg-secondary/30 rounded-lg transition-colors"
              title={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              title={t('close')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between p-3 border-b border-secondary/30 bg-primary/50 flex-shrink-0">
          {/* Page Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">
              {t('pageInfo', { current: currentPage, total: numPages })}
            </span>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-2 text-gray-300 hover:text-white hover:bg-secondary/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
              className="p-2 text-gray-300 hover:text-white hover:bg-secondary/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title={t('zoomIn')}
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={resetZoom}
              className="px-3 py-1 text-xs text-gray-300 hover:text-white hover:bg-secondary/30 rounded-lg transition-colors"
              title={t('resetZoom')}
            >
              {t('reset')}
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-primary/30 p-4"
          onContextMenu={handleContextMenu}
          style={selectionStyle}
        >
          {loading && (
            <div className="flex flex-col items-center gap-3 justify-center h-full">
              <Loader2 size={48} className="animate-spin text-secondary" />
              <p className="text-gray-300">{t('loading')}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 max-w-md text-center mx-auto justify-center h-full">
              <FileText size={48} className="text-red-400" />
              <p className="text-red-400 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          )}

          {!loading && !error && numPages > 0 && (
            <div className="flex flex-col items-center gap-4" style={{ width: 'fit-content', margin: '0 auto' }}>
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={`page-${pageNum}-scale-${scale}`}
                  className="relative shadow-2xl bg-white"
                  style={{
                    marginBottom: pageNum < numPages ? '16px' : '0',
                    width: 'fit-content'
                  }}
                >
                  <canvas
                    ref={(el) => {
                      if (el) pageRefs.current.set(pageNum, el);
                    }}
                    data-page={pageNum}
                    style={{
                      display: 'block',
                      width: 'auto',
                      height: 'auto',
                      ...selectionStyle
                    }}
                  />
                  {/* Page number badge */}
                  <div className="absolute top-2 right-2 bg-primary/90 text-white px-2 py-1 rounded text-xs border border-secondary/30">
                    {pageNum}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-secondary/30 bg-primary/90 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
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

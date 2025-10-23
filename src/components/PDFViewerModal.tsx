// /src/components/PDFViewerModal.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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

// Animation variants for staggered fade-in
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.05 }
  },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } }
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: 0.1 }
  }
};

const controlsVariants: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: 0.15 }
  }
};

const contentVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, delay: 0.2 }
  }
};

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
  // Start at 50% zoom for all devices
  const [scale, setScale] = useState<number>(0.5);
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
    setScale(0.5);
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
      setScale(0.5);
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
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with radial gradient */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at center, rgba(12, 53, 89, 0.4) 0%, rgba(0, 0, 0, 0.85) 100%)'
            }}
            onClick={onClose}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />

          {/* Modal with gradient background */}
          <motion.div
            className={`relative shadow-2xl flex flex-col ${
              isFullscreen
                ? 'w-full h-full'
                : 'rounded-none sm:rounded-xl w-full sm:max-w-6xl sm:mx-4 max-h-screen sm:max-h-[90vh]'
            }`}
            style={{
              background: 'linear-gradient(135deg, #0C3559 0%, #08243a 50%, #051829 100%)',
              boxShadow: '0 0 60px rgba(56, 135, 166, 0.3), 0 0 120px rgba(56, 135, 166, 0.2)'
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
        {/* Header with gradient */}
        <motion.div
          className="flex items-center justify-between p-2 sm:p-4 border-b flex-shrink-0 relative overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #051829 0%, #08243a 70%, #3887A6 100%)',
            borderBottom: '1px solid rgba(56, 135, 166, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Shine effect overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%)'
            }}
          />
          <div className="relative flex items-center gap-2 sm:gap-3 flex-1 min-w-0 z-10">
            <span className="hidden sm:inline">{getProtectionIcon()}</span>
            <h2 className="text-sm sm:text-lg font-bold text-white truncate">
              {documentTitle}
            </h2>
            {(protectionLevel === 'WATERMARK' || protectionLevel === 'FULL') && (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-sm rounded text-xs text-white border border-white/20">
                <Shield size={12} />
                <span>{t('protected')}</span>
              </div>
            )}
          </div>

          <div className="relative flex items-center gap-1 sm:gap-2 z-10">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 text-white hover:text-white hover:bg-white/30 hover:scale-105 backdrop-blur-sm rounded-lg transition-all duration-200 hidden sm:block border border-white/10 hover:border-white/30 hover:shadow-lg"
              title={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-white bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 rounded-lg transition-all duration-200 shadow-lg hover:shadow-2xl hover:shadow-red-500/50 border border-red-400/30 hover:border-red-400/50"
              title={t('close')}
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </motion.div>

        {/* Controls Bar with gradient */}
        <motion.div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 p-2 sm:p-3 flex-shrink-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(12, 53, 89, 0.6) 0%, rgba(8, 36, 58, 0.8) 100%)',
            borderBottom: '1px solid rgba(56, 135, 166, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
          variants={controlsVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Page Indicator */}
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs sm:text-sm text-gray-300">
              {t('pageInfo', { current: currentPage, total: numPages })}
            </span>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 sm:p-2 text-white hover:text-white hover:bg-white/30 hover:scale-110 backdrop-blur-sm rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/30 hover:shadow-lg"
              title={t('zoomOut')}
            >
              <ZoomOut size={16} className="sm:w-5 sm:h-5" />
            </button>
            <span className="text-xs sm:text-sm text-white font-medium min-w-[50px] sm:min-w-[60px] text-center px-2 py-1 bg-white/10 backdrop-blur-sm rounded border border-white/20 transition-all duration-200">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="p-1.5 sm:p-2 text-white hover:text-white hover:bg-white/30 hover:scale-110 backdrop-blur-sm rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-white/10 hover:border-white/30 hover:shadow-lg"
              title={t('zoomIn')}
            >
              <ZoomIn size={16} className="sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 sm:px-3 py-1 text-xs text-white hover:text-white hover:bg-white/30 hover:scale-105 backdrop-blur-sm rounded-lg transition-all duration-200 border border-white/10 hover:border-white/30 hover:shadow-lg"
              title={t('resetZoom')}
            >
              {t('reset')}
            </button>
          </div>
        </motion.div>

        {/* PDF Content */}
        <motion.div
          ref={containerRef}
          className="flex-1 overflow-auto p-2 sm:p-4"
          onContextMenu={handleContextMenu}
          style={{
            background: 'radial-gradient(ellipse at top, rgba(56, 135, 166, 0.15) 0%, rgba(5, 24, 41, 0.4) 100%)',
            ...selectionStyle
          }}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
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
                className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-2xl hover:shadow-red-500/50 border border-red-400/30 hover:border-red-400/50"
              >
                {t('close')}
              </button>
            </div>
          )}

          {!loading && !error && numPages > 0 && (
            <div className="flex flex-col items-center gap-2 sm:gap-4" style={{ width: 'fit-content', margin: '0 auto' }}>
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={`page-${pageNum}-scale-${scale}`}
                  className="relative shadow-2xl bg-white"
                  style={{
                    marginBottom: pageNum < numPages ? '8px' : '0',
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
                  <div
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-semibold shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #3887A6 0%, #0C3559 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {pageNum}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer with gradient */}
        <div
          className="p-2 sm:p-3 flex-shrink-0"
          style={{
            background: 'linear-gradient(to right, #0C3559 0%, #3887A6 100%)',
            borderTop: '1px solid rgba(56, 135, 166, 0.3)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
              {t('keyboardShortcuts')}
            </p>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary hover:to-secondary/90 hover:scale-105 text-white rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm shadow-lg hover:shadow-2xl hover:shadow-secondary/50 border border-white/20 hover:border-white/40"
            >
              {t('backToLesson')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
}

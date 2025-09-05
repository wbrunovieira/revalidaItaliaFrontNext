'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Shield, FileText, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const TERMS_ACCEPTANCE_KEY = 'revalida-italia-terms-accepted';
const TERMS_VERSION = '1.0.0'; // Increment this when terms change

export default function TermsModal() {
  const t = useTranslations('TermsModal');
  const [isOpen, setIsOpen] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if terms were already accepted
    const storedAcceptance = localStorage.getItem(TERMS_ACCEPTANCE_KEY);
    if (storedAcceptance) {
      const { version, timestamp } = JSON.parse(storedAcceptance);
      if (version === TERMS_VERSION) {
        return; // Terms already accepted for current version
      }
    }
    
    // Show modal after a small delay for better UX
    const timer = setTimeout(() => {
      setIsOpen(true);
      setIsAnimating(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    if (!isAccepted) return;

    // Save acceptance to localStorage
    const acceptanceData = {
      version: TERMS_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(TERMS_ACCEPTANCE_KEY, JSON.stringify(acceptanceData));

    // Animate out
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const handleDecline = () => {
    // Redirect to homepage or show message
    window.location.href = 'https://www.revalidaitalia.com';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl",
            "transform transition-all duration-300 ease-out",
            isAnimating 
              ? "opacity-100 scale-100 translate-y-0" 
              : "opacity-0 scale-95 translate-y-4"
          )}
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#3887A6] via-[#0C3559] to-[#3887A6] p-[1px]">
            <div className="h-full w-full rounded-2xl bg-white" />
          </div>

          {/* Content */}
          <div className="relative rounded-2xl bg-white">
            {/* Header with gradient */}
            <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#0C3559] via-[#0F2940] to-[#0C3559] p-6">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" 
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.3'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              </div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 backdrop-blur rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
                    <p className="text-white/80 text-sm mt-1">{t('subtitle')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Important notice */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium">{t('importantNotice')}</p>
                  <p className="text-xs text-amber-700 mt-1">{t('mustAccept')}</p>
                </div>
              </div>

              {/* Terms summary */}
              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#3887A6]" />
                  {t('termsSummary')}
                </h3>
                
                <div className="space-y-3">
                  {['privacy', 'usage', 'intellectual', 'responsibilities'].map((key) => (
                    <div key={key} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{t(`summary.${key}`)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full terms toggle */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowFullTerms(!showFullTerms)}
                  className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg p-3 transition-colors"
                >
                  <span className="font-medium text-gray-900">{t('readFullTerms')}</span>
                  {showFullTerms ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {/* Full terms content */}
                {showFullTerms && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto custom-scrollbar">
                    <div className="prose prose-sm max-w-none text-gray-600">
                      <p className="whitespace-pre-wrap">{t('fullTermsContent')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkbox */}
              <div className="mt-6 p-4 bg-[#F2ECE9]/30 rounded-lg border border-[#3887A6]/20">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAccepted}
                    onChange={(e) => setIsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-[#3887A6] bg-white border-gray-300 rounded focus:ring-[#3887A6] focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">
                    {t('acceptanceText')}{' '}
                    <Link href="/terms" className="text-[#3887A6] hover:underline">
                      {t('termsLink')}
                    </Link>{' '}
                    {t('and')}{' '}
                    <Link href="/privacy" className="text-[#3887A6] hover:underline">
                      {t('privacyLink')}
                    </Link>
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleDecline}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('decline')}
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!isAccepted}
                  className={cn(
                    "px-6 py-2.5 rounded-lg font-medium transition-all",
                    "relative overflow-hidden",
                    isAccepted
                      ? "bg-gradient-to-r from-[#3887A6] to-[#0C3559] text-white hover:shadow-lg transform hover:scale-[1.02]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <span className="relative z-10">{t('accept')}</span>
                  {isAccepted && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
                  )}
                </button>
              </div>

              {/* Version info */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  {t('version')}: {TERMS_VERSION} • {t('lastUpdated')}: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
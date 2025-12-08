// /src/components/ReviewStatusPopover.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  Loader2,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import { toast } from '@/hooks/use-toast';

export type ReviewStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_REPLACEMENT'
  | 'NEEDS_ADDITIONAL_INFO';

interface ReviewStatusPopoverProps {
  documentId: string;
  currentStatus: ReviewStatus;
  onStatusChange?: (newStatus: ReviewStatus) => void;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  requiresReason: boolean;
}

export default function ReviewStatusPopover({
  documentId,
  currentStatus,
  onStatusChange,
}: ReviewStatusPopoverProps) {
  const t = useTranslations('Admin.studentDocuments.review');
  const { token } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReasonForm, setShowReasonForm] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });

  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const statusConfigs: Record<ReviewStatus, StatusConfig> = {
    PENDING_REVIEW: {
      label: t('status.pendingReview'),
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500/30',
      icon: <Clock size={14} />,
      requiresReason: false,
    },
    UNDER_REVIEW: {
      label: t('status.underReview'),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      icon: <Search size={14} />,
      requiresReason: false,
    },
    APPROVED: {
      label: t('status.approved'),
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: <CheckCircle2 size={14} />,
      requiresReason: false,
    },
    REJECTED: {
      label: t('status.rejected'),
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      icon: <XCircle size={14} />,
      requiresReason: true,
    },
    NEEDS_REPLACEMENT: {
      label: t('status.needsReplacement'),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
      icon: <RefreshCw size={14} />,
      requiresReason: true,
    },
    NEEDS_ADDITIONAL_INFO: {
      label: t('status.needsAdditionalInfo'),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      icon: <AlertTriangle size={14} />,
      requiresReason: true,
    },
  };

  const currentConfig = statusConfigs[currentStatus];

  // Calculate popover position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 300;

      // Position below the button, aligned to the right
      let left = rect.right - popoverWidth;
      const top = rect.bottom + 8;

      // Keep popover within viewport
      if (left < 8) left = 8;
      if (left + popoverWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoverWidth - 8;
      }

      setPopoverPosition({ top, left });
    }
  }, [isOpen]);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedStatus(null);
    setRejectionReason('');
    setReviewNotes('');
    setShowReasonForm(false);
  };

  const handleStatusSelect = (status: ReviewStatus) => {
    if (status === currentStatus) {
      handleClose();
      return;
    }

    if (statusConfigs[status].requiresReason) {
      setSelectedStatus(status);
      setShowReasonForm(true);
    } else {
      submitStatusChange(status);
    }
  };

  const submitStatusChange = async (status: ReviewStatus, reason?: string, notes?: string) => {
    if (!token) return;

    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      const body: Record<string, string> = {
        reviewStatus: status,
      };

      if (reason) {
        body.rejectionReason = reason;
      }

      if (notes) {
        body.reviewNotes = notes;
      }

      const response = await fetch(`${apiUrl}/api/v1/student-documents/${documentId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || t('error.updateFailed'));
      }

      toast({
        title: t('success.title'),
        description: t('success.statusUpdated'),
      });

      onStatusChange?.(status);
      handleClose();
    } catch (err) {
      console.error('Error updating review status:', err);
      toast({
        title: t('error.title'),
        description: err instanceof Error ? err.message : t('error.updateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitWithReason = () => {
    if (!selectedStatus) return;

    if (statusConfigs[selectedStatus].requiresReason && !rejectionReason.trim()) {
      toast({
        title: t('error.title'),
        description: t('error.reasonRequired'),
        variant: 'destructive',
      });
      return;
    }

    submitStatusChange(selectedStatus, rejectionReason.trim(), reviewNotes.trim());
  };

  return (
    <div className="relative inline-block">
      {/* Status Badge Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border
          transition-all duration-200 cursor-pointer
          hover:scale-105 hover:shadow-lg
          ${currentConfig.bgColor} ${currentConfig.color} ${currentConfig.borderColor}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          currentConfig.icon
        )}
        <span>{currentConfig.label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: popoverPosition.top,
            left: popoverPosition.left,
            zIndex: 9999,
          }}
          className="w-[300px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {!showReasonForm ? (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <h4 className="text-sm font-semibold text-white">{t('changeStatus')}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{t('selectNewStatus')}</p>
              </div>

              {/* Status Options */}
              <div className="p-2">
                {(Object.keys(statusConfigs) as ReviewStatus[]).map((status) => {
                  const config = statusConfigs[status];
                  const isSelected = status === currentStatus;

                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusSelect(status)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                        transition-all duration-150
                        ${isSelected
                          ? 'bg-white/10 ring-1 ring-white/20'
                          : 'hover:bg-white/5'
                        }
                      `}
                    >
                      <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${config.color}`}>
                          {config.label}
                        </p>
                        {config.requiresReason && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t('requiresReason')}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={16} className="text-secondary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {/* Reason Form Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {selectedStatus && (
                    <div className={`p-1 rounded ${statusConfigs[selectedStatus].bgColor}`}>
                      <span className={statusConfigs[selectedStatus].color}>
                        {statusConfigs[selectedStatus].icon}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {selectedStatus && statusConfigs[selectedStatus].label}
                    </h4>
                    <p className="text-xs text-gray-400">{t('provideReason')}</p>
                  </div>
                </div>
              </div>

              {/* Reason Form */}
              <div className="p-4 space-y-4">
                {/* Rejection Reason - Visible to student */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-white mb-2">
                    <MessageSquare size={12} />
                    {t('rejectionReason')}
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={t('rejectionReasonPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-secondary resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('visibleToStudent')}</p>
                </div>

                {/* Internal Notes - Not visible to student */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                    {t('internalNotes')}
                    <span className="text-xs text-gray-500">({t('optional')})</span>
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t('internalNotesPlaceholder')}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-secondary resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('notVisibleToStudent')}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowReasonForm(false);
                      setSelectedStatus(null);
                      setRejectionReason('');
                      setReviewNotes('');
                    }}
                    className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t('back')}
                  </button>
                  <button
                    onClick={handleSubmitWithReason}
                    disabled={isLoading || !rejectionReason.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-primary text-sm font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        {t('updating')}
                      </>
                    ) : (
                      t('confirm')
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Utility function to get status badge (for display only, no interaction)
export function getReviewStatusBadge(status: ReviewStatus, t: (key: string) => string) {
  const configs: Record<ReviewStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
    PENDING_REVIEW: {
      label: t('status.pendingReview'),
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500/30',
      icon: <Clock size={14} />,
    },
    UNDER_REVIEW: {
      label: t('status.underReview'),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      icon: <Search size={14} />,
    },
    APPROVED: {
      label: t('status.approved'),
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: <CheckCircle2 size={14} />,
    },
    REJECTED: {
      label: t('status.rejected'),
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      icon: <XCircle size={14} />,
    },
    NEEDS_REPLACEMENT: {
      label: t('status.needsReplacement'),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
      icon: <RefreshCw size={14} />,
    },
    NEEDS_ADDITIONAL_INFO: {
      label: t('status.needsAdditionalInfo'),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      icon: <AlertTriangle size={14} />,
    },
  };

  const config = configs[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${config.bgColor} ${config.color} ${config.borderColor}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

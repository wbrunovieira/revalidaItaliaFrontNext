'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Shield,
  XCircle,
  CheckCircle,
  Unlock,
  X,
  MessageSquare,
  FileText,
  User,
  Calendar,
  AlertOctagon,
  Info,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types
type ReportReason = 'INAPPROPRIATE_CONTENT' | 'SPAM' | 'OFFENSIVE_LANGUAGE' | 'HARASSMENT' | 'OTHER';
type ReportType = 'POST' | 'COMMENT';
type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
type ReviewAction = 'BLOCK' | 'DISMISS' | 'UNBLOCK';

interface Author {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
  role: string;
}

interface Reporter {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
}

interface PostContent {
  id: string;
  title: string | null;
  content: string;
  slug: string;
  author: Author;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  reportCount: number;
  lessonId: string | null;
}

interface CommentContent {
  id: string;
  content: string;
  postId: string;
  postTitle: string;
  parentId: string | null;
  author: Author;
  createdAt: string;
  reactionCount: number;
  reportCount: number;
}

interface Report {
  id: string;
  type: ReportType;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: Reporter;
  content: PostContent | CommentContent;
}

interface ReviewReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
  onReviewComplete: () => void;
  userRole?: 'tutor' | 'admin';
}

// Helper function
function isPostContent(content: PostContent | CommentContent): content is PostContent {
  return 'title' in content && 'slug' in content;
}

export default function ReviewReportModal({
  open,
  onOpenChange,
  report,
  onReviewComplete,
  userRole = 'tutor',
}: ReviewReportModalProps) {
  const t = useTranslations('Tutor.reports.reviewModal');
  const { toast } = useToast();
  
  const [selectedAction, setSelectedAction] = useState<ReviewAction | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!report) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
  const isPost = isPostContent(report.content);

  const getReasonIcon = (reason: ReportReason) => {
    switch (reason) {
      case 'SPAM':
        return <MessageSquare size={16} className="text-yellow-400" />;
      case 'INAPPROPRIATE_CONTENT':
        return <AlertOctagon size={16} className="text-red-400" />;
      case 'OFFENSIVE_LANGUAGE':
        return <MessageSquare size={16} className="text-orange-400" />;
      case 'HARASSMENT':
        return <Shield size={16} className="text-red-500" />;
      default:
        return <AlertTriangle size={16} className="text-gray-400" />;
    }
  };

  const getReasonText = (reason: ReportReason) => {
    const reasonMap: Record<ReportReason, string> = {
      'INAPPROPRIATE_CONTENT': t('reasons.inappropriateContent'),
      'SPAM': t('reasons.spam'),
      'OFFENSIVE_LANGUAGE': t('reasons.offensiveLanguage'),
      'HARASSMENT': t('reasons.harassment'),
      'OTHER': t('reasons.other'),
    };
    return reasonMap[reason] || reason;
  };

  const handleSubmit = async () => {
    if (!selectedAction) {
      toast({
        title: t('error.noActionTitle'),
        description: t('error.noActionDescription'),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`${apiUrl}/api/v1/community/reports/${report.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: selectedAction,
          reason: reason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to review report');
      }

      // Show success message based on action
      const actionMessages = {
        BLOCK: t('success.blocked'),
        DISMISS: t('success.dismissed'),
        UNBLOCK: t('success.unblocked'),
      };

      toast({
        title: t('success.title'),
        description: actionMessages[selectedAction],
        className: 'bg-green-900/20 border-green-500/30',
      });

      // Reset form
      setSelectedAction(null);
      setReason('');
      
      // Close modal and refresh list
      onOpenChange(false);
      onReviewComplete();
    } catch (error) {
      console.error('Error reviewing report:', error);
      
      // Check for specific error messages
      const errorMessage = error instanceof Error ? error.message : t('error.defaultMessage');
      
      if (errorMessage.includes('not authorized to unblock')) {
        toast({
          title: t('error.unauthorizedTitle'),
          description: t('error.unauthorizedUnblock'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('error.reviewTitle'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="text-secondary" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Details */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Info size={18} className="text-blue-400" />
              {t('reportDetails')}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {getReasonIcon(report.reason)}
                <span>{getReasonText(report.reason)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={14} />
                {new Date(report.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="text-gray-300">
                  {t('reportedBy')}: <span className="text-white">{report.reporter.fullName}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User size={14} className="text-red-400" />
                <span className="text-gray-300">
                  {t('author')}: <span className="text-white">{report.content.author.fullName}</span>
                </span>
              </div>
            </div>

            {report.description && (
              <div className="mt-3 p-3 bg-gray-700 rounded">
                <p className="text-xs text-gray-400 mb-1">{t('reportDescription')}:</p>
                <p className="text-sm">{report.description}</p>
              </div>
            )}
          </div>

          {/* Content Preview */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              {isPost ? <FileText size={18} className="text-green-400" /> : <MessageSquare size={18} className="text-green-400" />}
              {t('contentPreview')}
            </h3>

            {isPost && (report.content as PostContent).title && (
              <h4 className="font-medium text-lg">{(report.content as PostContent).title}</h4>
            )}

            {!isPost && (
              <p className="text-xs text-gray-400">
                {t('inPost')}: <span className="text-gray-300">{(report.content as CommentContent).postTitle}</span>
              </p>
            )}

            <div className="p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-300 line-clamp-4">{report.content.content}</p>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{t('totalReports')}: <span className="text-red-400 font-bold">{report.content.reportCount}</span></span>
              {isPost && (
                <>
                  <span>{(report.content as PostContent).viewCount} {t('views')}</span>
                  <span>{(report.content as PostContent).commentCount} {t('comments')}</span>
                </>
              )}
              {!isPost && (
                <span>{report.content.reactionCount} {t('reactions')}</span>
              )}
            </div>
          </div>

          {/* Review Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('selectAction')}</h3>
            
            <RadioGroup value={selectedAction || ''} onValueChange={(value) => setSelectedAction(value as ReviewAction)}>
              <div className="space-y-3">
                {/* Block Action */}
                <div className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  selectedAction === 'BLOCK' 
                    ? "bg-red-900/20 border-red-500/50" 
                    : "bg-gray-800 border-gray-700 hover:border-gray-600"
                )}>
                  <RadioGroupItem value="BLOCK" id="block" className="mt-1" />
                  <Label htmlFor="block" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={18} className="text-red-400" />
                      <span className="font-medium">{t('actions.block.title')}</span>
                    </div>
                    <p className="text-sm text-gray-400">{t('actions.block.description')}</p>
                  </Label>
                </div>

                {/* Dismiss Action */}
                <div className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  selectedAction === 'DISMISS' 
                    ? "bg-yellow-900/20 border-yellow-500/50" 
                    : "bg-gray-800 border-gray-700 hover:border-gray-600"
                )}>
                  <RadioGroupItem value="DISMISS" id="dismiss" className="mt-1" />
                  <Label htmlFor="dismiss" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle size={18} className="text-yellow-400" />
                      <span className="font-medium">{t('actions.dismiss.title')}</span>
                    </div>
                    <p className="text-sm text-gray-400">{t('actions.dismiss.description')}</p>
                  </Label>
                </div>

                {/* Unblock Action (Admin Only) */}
                {userRole === 'admin' && (
                  <div className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    selectedAction === 'UNBLOCK' 
                      ? "bg-green-900/20 border-green-500/50" 
                      : "bg-gray-800 border-gray-700 hover:border-gray-600"
                  )}>
                    <RadioGroupItem value="UNBLOCK" id="unblock" className="mt-1" />
                    <Label htmlFor="unblock" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Unlock size={18} className="text-green-400" />
                        <span className="font-medium">{t('actions.unblock.title')}</span>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Admin</span>
                      </div>
                      <p className="text-sm text-gray-400">{t('actions.unblock.description')}</p>
                    </Label>
                  </div>
                )}
              </div>
            </RadioGroup>

            {/* Reason Textarea */}
            <div className="space-y-2">
              <Label htmlFor="reason">{t('reasonLabel')}</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reasonPlaceholder')}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">{reason.length}/500</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <X size={16} className="mr-2" />
              {t('cancel')}
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!selectedAction || submitting}
              className={cn(
                "min-w-[120px]",
                selectedAction === 'BLOCK' && "bg-red-600 hover:bg-red-700",
                selectedAction === 'DISMISS' && "bg-yellow-600 hover:bg-yellow-700",
                selectedAction === 'UNBLOCK' && "bg-green-600 hover:bg-green-700",
                !selectedAction && "bg-gray-600"
              )}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('submitting')}
                </div>
              ) : (
                <>
                  {selectedAction === 'BLOCK' && <XCircle size={16} className="mr-2" />}
                  {selectedAction === 'DISMISS' && <CheckCircle size={16} className="mr-2" />}
                  {selectedAction === 'UNBLOCK' && <Unlock size={16} className="mr-2" />}
                  {t('confirm')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ReopenTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  onSuccess: () => void;
}

export function ReopenTicketModal({
  isOpen,
  onClose,
  ticketId,
  onSuccess,
}: ReopenTicketModalProps) {
  const t = useTranslations('ReopenTicket');
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const handleReopen = async () => {
    if (!ticketId || !reason.trim()) return;

    if (reason.trim().length < 10) {
      toast({
        title: t('error.reasonTooShort'),
        description: t('error.reasonTooShortDescription'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${apiUrl}/api/v1/support/tickets/${ticketId}/reopen`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: reason.trim(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to reopen ticket: ${response.status}`);
      }

      toast({
        title: t('success'),
        description: t('successDescription'),
      });

      setReason('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error reopening ticket:', error);
      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <RefreshCw size={24} className="text-orange-400" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Warning Message */}
          <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={20} className="text-orange-400 mt-0.5" />
              <div className="text-sm text-orange-200">
                <p className="font-medium mb-1">{t('warning.title')}</p>
                <p className="text-orange-300">{t('warning.description')}</p>
              </div>
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              {t('reasonLabel')}
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              className="min-h-[120px] bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-secondary"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{t('reasonHelp')}</span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isSubmitting}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleReopen}
              disabled={!reason.trim() || reason.trim().length < 10 || isSubmitting}
              className="bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('reopening')}
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  {t('reopen')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
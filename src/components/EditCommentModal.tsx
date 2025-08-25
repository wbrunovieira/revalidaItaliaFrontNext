// src/components/EditCommentModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EditCommentModalProps {
  open: boolean;
  onClose: () => void;
  comment: {
    id: string;
    content: string;
    authorId: string;
  };
  onCommentUpdated?: () => void;
}

export default function EditCommentModal({ open, onClose, comment, onCommentUpdated }: EditCommentModalProps) {
  const t = useTranslations('Community');
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setEditedContent(comment.content);
      setError(null);
    }
  }, [open, comment]);

  // Only the comment author can edit
  const canEdit = user?.id === comment.authorId;

  // Validation
  const validateContent = (): boolean => {
    if (!editedContent.trim()) {
      setError(t('editComment.errors.contentRequired'));
      return false;
    }
    
    if (editedContent.length > 10000) {
      setError(t('editComment.errors.contentTooLong'));
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateContent()) return;

    setIsSubmitting(true);

    try {
      // If no changes, just close the modal
      if (editedContent === comment.content) {
        onClose();
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/comments/${comment.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: editedContent }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error(t('editComment.errors.forbidden'));
        } else if (response.status === 400) {
          if (errorData.detail?.includes('empty')) {
            throw new Error(t('editComment.errors.contentRequired'));
          } else if (errorData.detail?.includes('10000')) {
            throw new Error(t('editComment.errors.contentTooLong'));
          }
          throw new Error(errorData.detail || t('editComment.errors.validationError'));
        } else if (response.status === 404) {
          throw new Error(t('editComment.errors.commentNotFound'));
        }
        
        throw new Error(errorData.detail || t('editComment.errors.updateFailed'));
      }

      toast({
        title: t('editComment.success.title'),
        description: t('editComment.success.description'),
      });

      onCommentUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: t('editComment.errors.title'),
        description: error instanceof Error ? error.message : t('editComment.errors.updateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if user has no edit permissions
  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-primary-dark border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('editComment.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t('editComment.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Content field */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {t('editComment.fields.content')}
            </Label>
            <Textarea
              id="content"
              value={editedContent}
              onChange={(e) => {
                setEditedContent(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t('editComment.placeholders.content')}
              className={cn(
                "w-full min-h-[150px] bg-primary/50 border-gray-600 text-white resize-none",
                error && "border-red-500"
              )}
              maxLength={10000}
            />
            <div className="flex justify-between">
              <p className="text-xs text-gray-400">
                {editedContent.length}/10000 {t('editComment.characters')}
              </p>
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
            </div>
          </div>

          {/* Info about changes */}
          {editedContent !== comment.content && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-blue-400 mt-0.5 flex-shrink-0" size={16} />
                <p className="text-sm text-blue-400">
                  {t('editComment.changesDetected')}
                </p>
              </div>
            </div>
          )}

          {/* Note about permissions */}
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <p className="text-xs text-yellow-400">
              {t('editComment.note')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-600 text-white hover:bg-primary/50"
          >
            {t('editComment.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || 
              !canEdit ||
              editedContent === comment.content ||
              !editedContent.trim()
            }
            className="bg-secondary hover:bg-secondary/80"
          >
            {isSubmitting ? t('editComment.saving') : t('editComment.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
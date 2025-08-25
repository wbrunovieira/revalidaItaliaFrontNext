// src/components/DeleteConfirmationModal.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  itemType: 'post' | 'comment';
  itemId: string;
  itemTitle?: string;
  onDeleted?: () => void;
}

export default function DeleteConfirmationModal({
  open,
  onClose,
  itemType,
  itemId,
  itemTitle,
  onDeleted,
}: DeleteConfirmationModalProps) {
  const t = useTranslations('Community');
  const { token } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const endpoint = itemType === 'post' 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${itemId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/comments/${itemId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 400) {
          // Post has dependencies (comments)
          if (errorData.detail?.includes('dependencies')) {
            throw new Error(t('deleteConfirmation.errors.hasDependencies'));
          }
          throw new Error(errorData.detail || t('deleteConfirmation.errors.badRequest'));
        } else if (response.status === 403) {
          throw new Error(t('deleteConfirmation.errors.forbidden'));
        } else if (response.status === 404) {
          throw new Error(t('deleteConfirmation.errors.notFound'));
        }
        
        throw new Error(errorData.detail || t('deleteConfirmation.errors.deleteFailed'));
      }

      toast({
        title: t('deleteConfirmation.success.title'),
        description: t(
          itemType === 'post' 
            ? 'deleteConfirmation.success.postDeleted' 
            : 'deleteConfirmation.success.commentDeleted'
        ),
      });

      onDeleted?.();
      onClose();
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
      toast({
        title: t('deleteConfirmation.errors.title'),
        description: error instanceof Error ? error.message : t('deleteConfirmation.errors.deleteFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-primary-dark border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            {t(itemType === 'post' ? 'deleteConfirmation.titlePost' : 'deleteConfirmation.titleComment')}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">
            {t(itemType === 'post' ? 'deleteConfirmation.descriptionPost' : 'deleteConfirmation.descriptionComment')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Show item preview if title is provided */}
          {itemTitle && (
            <div className="p-3 bg-primary/30 rounded-lg border border-gray-700 mb-4">
              <p className="text-sm text-gray-300 line-clamp-3">
                {itemTitle}
              </p>
            </div>
          )}

          {/* Warning message */}
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="text-sm text-red-400 font-medium">
                  {t('deleteConfirmation.warning.title')}
                </p>
                <p className="text-xs text-red-300 mt-1">
                  {t('deleteConfirmation.warning.description')}
                </p>
                {itemType === 'post' && (
                  <p className="text-xs text-red-300 mt-1">
                    {t('deleteConfirmation.warning.postNote')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="border-gray-600 text-white hover:bg-primary/50"
          >
            {t('deleteConfirmation.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('deleteConfirmation.deleting')}
              </>
            ) : (
              t('deleteConfirmation.delete')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
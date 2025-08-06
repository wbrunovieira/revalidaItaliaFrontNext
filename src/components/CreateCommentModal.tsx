'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { RoleBadge } from '@/components/ui/role-badge';
import Image from 'next/image';
import { useAuth } from '@/stores/auth.store';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  role?: 'student' | 'admin' | 'tutor';
}

interface CreateCommentModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  parentId?: string;
  parentAuthor?: Author;
  onCommentCreated: (comment: any) => void;
}

export default function CreateCommentModal({
  open,
  onClose,
  postId,
  parentId,
  parentAuthor,
  onCommentCreated,
}: CreateCommentModalProps) {
  const t = useTranslations('Community');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, isAuthenticated } = useAuth();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: t('comments.error'),
        description: t('comments.contentRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (content.length > 10000) {
      toast({
        title: t('comments.error'),
        description: t('comments.contentTooLong'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!isAuthenticated || !token) {
        toast({
          title: t('comments.error'),
          description: t('comments.unauthorized'),
          variant: 'destructive',
        });
        return;
      }

      const body: any = { content };
      if (parentId) {
        body.parentId = parentId;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create comment');
      }

      const data = await response.json();
      
      // Transform the response to match our interface
      const newComment = {
        id: data.comment.id,
        content: data.comment.content,
        author: {
          id: data.author.id,
          name: data.author.fullName,
          avatar: data.author.profileImageUrl,
        },
        createdAt: new Date(data.comment.createdAt),
        updatedAt: new Date(data.comment.updatedAt),
        reactions: {
          LOVE: 0,
          LIKE: 0,
          SURPRISE: 0,
          CLAP: 0,
          SAD: 0,
          userReactions: [],
        },
        parentId: data.comment.parentId,
      };

      onCommentCreated(newComment);
      setContent('');
      onClose();

      toast({
        title: t('comments.success'),
        description: parentId ? t('comments.replyCreated') : t('comments.commentCreated'),
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: t('comments.error'),
        description: error instanceof Error ? error.message : t('comments.createFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-primary-dark border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {parentId ? t('comments.replyToComment') : t('comments.addComment')}
          </DialogTitle>
        </DialogHeader>

        {/* If replying, show parent comment info */}
        {parentId && parentAuthor && (
          <div className="bg-primary/30 rounded-lg p-3 mb-4 border-l-2 border-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-secondary/20">
                <Image
                  src={parentAuthor.avatar || '/icons/avatar.svg'}
                  alt={parentAuthor.name}
                  width={24}
                  height={24}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-sm font-medium">{parentAuthor.name}</span>
              {parentAuthor.role && (
                <RoleBadge role={parentAuthor.role} className="scale-75" />
              )}
            </div>
            <p className="text-xs text-gray-400 italic">
              {t('comments.replyingTo')}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('comments.placeholder')}
            className="min-h-[120px] bg-primary/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-secondary"
            maxLength={10000}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {content.length}/10000
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="border-gray-600 text-gray-300 hover:bg-primary/50"
              >
                {t('comments.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="bg-secondary hover:bg-secondary/80"
              >
                {isSubmitting ? t('comments.submitting') : t('comments.submit')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
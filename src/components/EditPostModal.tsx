// src/components/EditPostModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, X, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EditPostModalProps {
  open: boolean;
  onClose: () => void;
  post: {
    id: string;
    type: 'GENERAL_TOPIC' | 'LESSON_COMMENT';
    title?: string;
    content: string;
    authorId: string;
    hashtags?: (string | { id: string; name: string; slug: string })[];
  };
  onPostUpdated?: () => void;
}

export default function EditPostModal({ open, onClose, post, onPostUpdated }: EditPostModalProps) {
  const t = useTranslations('Community');
  const tCreate = useTranslations('CreatePost');
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [editedTitle, setEditedTitle] = useState(post.title || '');
  const [editedContent, setEditedContent] = useState(post.content);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string; hashtags?: string }>({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setEditedTitle(post.title || '');
      setEditedContent(post.content);
      // Convert hashtags to slugs array
      const hashtagSlugs = post.hashtags?.map(tag => 
        typeof tag === 'string' ? tag : tag.slug
      ) || [];
      setHashtags(hashtagSlugs);
      setHashtagInput('');
      setErrors({});
    }
  }, [open, post]);

  // Determine user permissions
  const isPostOwner = user?.id === post.authorId;
  const isModeratorOrAdmin = user?.role === 'admin' || user?.role === 'tutor';
  const canEditTitle = isPostOwner || isModeratorOrAdmin;
  const canEditContent = isPostOwner;

  // Add hashtag handler
  const handleAddHashtag = () => {
    if (!hashtagInput.trim()) return;
    
    const normalizedTag = hashtagInput.toLowerCase().replace(/[^a-z0-9_]/g, '');
    
    if (normalizedTag && !hashtags.includes(normalizedTag)) {
      setHashtags([...hashtags, normalizedTag]);
      setHashtagInput('');
      setErrors({ ...errors, hashtags: undefined });
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: { title?: string; content?: string; hashtags?: string } = {};

    // Title validation for GENERAL_TOPIC posts
    if (post.type === 'GENERAL_TOPIC') {
      if (!editedTitle.trim()) {
        newErrors.title = t('editPost.errors.titleRequired');
      } else if (editedTitle.length > 200) {
        newErrors.title = t('editPost.errors.titleTooLong');
      }
    }

    // Content validation
    if (canEditContent) {
      if (!editedContent.trim()) {
        newErrors.content = t('editPost.errors.contentRequired');
      } else if (editedContent.length > 10000) {
        newErrors.content = t('editPost.errors.contentTooLong');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Prepare request body
      const requestBody: { title?: string; content?: string; hashtagSlugs?: string[] } = {};

      // Only include fields that can be edited based on permissions
      if (canEditTitle && post.type === 'GENERAL_TOPIC' && editedTitle !== post.title) {
        requestBody.title = editedTitle;
      }

      if (canEditContent && editedContent !== post.content) {
        requestBody.content = editedContent;
      }

      // Only include hashtags if they've changed (for post owner only)
      if (isPostOwner && post.type === 'GENERAL_TOPIC') {
        const originalHashtags = post.hashtags?.map(tag => 
          typeof tag === 'string' ? tag : tag.slug
        ) || [];
        
        // Check if hashtags have changed
        const hashtagsChanged = JSON.stringify(hashtags.sort()) !== JSON.stringify(originalHashtags.sort());
        
        if (hashtagsChanged) {
          requestBody.hashtagSlugs = hashtags;
        }
      }

      // If no changes, just close the modal
      if (Object.keys(requestBody).length === 0) {
        onClose();
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${post.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error(t('editPost.errors.forbidden'));
        } else if (response.status === 400) {
          if (errorData.detail?.includes('title')) {
            throw new Error(t('editPost.errors.invalidTitle'));
          } else if (errorData.detail?.includes('content')) {
            throw new Error(t('editPost.errors.invalidContent'));
          }
          throw new Error(errorData.detail || t('editPost.errors.validationError'));
        } else if (response.status === 404) {
          throw new Error(t('editPost.errors.postNotFound'));
        }
        
        throw new Error(errorData.detail || t('editPost.errors.updateFailed'));
      }

      toast({
        title: t('editPost.success.title'),
        description: t('editPost.success.description'),
      });

      onPostUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: t('editPost.errors.title'),
        description: error instanceof Error ? error.message : t('editPost.errors.updateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if user has no edit permissions
  if (!canEditTitle && !canEditContent) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-primary-dark border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('editPost.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isPostOwner 
              ? t('editPost.description.owner')
              : t('editPost.description.moderator')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title field - shown for GENERAL_TOPIC posts only */}
          {post.type === 'GENERAL_TOPIC' && (
            <div className="space-y-2">
              <Label htmlFor="title">
                {t('editPost.fields.title')}
                {!canEditTitle && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({t('editPost.readOnly')})
                  </span>
                )}
              </Label>
              <Input
                id="title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder={t('editPost.placeholders.title')}
                className={cn(
                  "w-full bg-primary/50 border-gray-600 text-white",
                  !canEditTitle && "opacity-50 cursor-not-allowed",
                  errors.title && "border-red-500"
                )}
                maxLength={200}
                disabled={!canEditTitle}
              />
              <div className="flex justify-between">
                <p className="text-xs text-gray-400">
                  {editedTitle.length}/200 {t('editPost.characters')}
                </p>
                {errors.title && (
                  <p className="text-xs text-red-400">{errors.title}</p>
                )}
              </div>
            </div>
          )}

          {/* Hashtags field - only for GENERAL_TOPIC posts and post owner */}
          {post.type === 'GENERAL_TOPIC' && isPostOwner && (
            <div className="space-y-2">
              <Label htmlFor="hashtags">
                {tCreate('hashtagsLabel')}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="hashtags"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyPress={handleHashtagKeyPress}
                  placeholder={tCreate('hashtagsPlaceholder')}
                  className="flex-1 bg-primary/50 border-gray-600 text-white"
                />
                <Button
                  type="button"
                  onClick={handleAddHashtag}
                  className="bg-secondary hover:bg-secondary/80"
                  disabled={!hashtagInput.trim()}
                >
                  {tCreate('add')}
                </Button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {hashtags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-secondary/20 text-secondary border-secondary/50 hover:bg-secondary/30"
                    >
                      <Hash size={12} className="mr-1" />
                      {tag}
                      <button
                        onClick={() => handleRemoveHashtag(tag)}
                        className="ml-2 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">
                {tCreate('hashtagsHelp')}
              </p>
            </div>
          )}

          {/* Content field */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {t('editPost.fields.content')}
              {!canEditContent && (
                <span className="ml-2 text-xs text-gray-500">
                  ({t('editPost.readOnly')})
                </span>
              )}
            </Label>
            <Textarea
              id="content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder={t('editPost.placeholders.content')}
              className={cn(
                "w-full min-h-[200px] bg-primary/50 border-gray-600 text-white resize-none",
                !canEditContent && "opacity-50 cursor-not-allowed",
                errors.content && "border-red-500"
              )}
              maxLength={10000}
              disabled={!canEditContent}
            />
            <div className="flex justify-between">
              <p className="text-xs text-gray-400">
                {editedContent.length}/10000 {t('editPost.characters')}
              </p>
              {errors.content && (
                <p className="text-xs text-red-400">{errors.content}</p>
              )}
            </div>
          </div>

          {/* Permission notice */}
          {isModeratorOrAdmin && !isPostOwner && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
                <div className="text-sm text-yellow-400">
                  <p className="font-medium mb-1">{t('editPost.moderatorNotice.title')}</p>
                  <p className="text-xs text-yellow-400/80">
                    {t('editPost.moderatorNotice.description')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info about what changed */}
          {(editedTitle !== post.title || 
            editedContent !== post.content || 
            (() => {
              if (!isPostOwner || post.type !== 'GENERAL_TOPIC') return false;
              const originalHashtags = post.hashtags?.map(tag => 
                typeof tag === 'string' ? tag : tag.slug
              ) || [];
              return JSON.stringify(hashtags.sort()) !== JSON.stringify(originalHashtags.sort());
            })()
          ) && (
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
              <p className="text-sm text-blue-400">
                {t('editPost.changesDetected')}
              </p>
              <ul className="text-xs text-blue-300 mt-1 list-disc list-inside">
                {post.type === 'GENERAL_TOPIC' && editedTitle !== post.title && canEditTitle && (
                  <li>{t('editPost.changes.title')}</li>
                )}
                {editedContent !== post.content && canEditContent && (
                  <li>{t('editPost.changes.content')}</li>
                )}
                {post.type === 'GENERAL_TOPIC' && isPostOwner && (() => {
                  const originalHashtags = post.hashtags?.map(tag => 
                    typeof tag === 'string' ? tag : tag.slug
                  ) || [];
                  return JSON.stringify(hashtags.sort()) !== JSON.stringify(originalHashtags.sort());
                })() && (
                  <li>{t('editPost.changes.hashtags')}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-600 text-white hover:bg-primary/50"
          >
            {t('editPost.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || 
              (!canEditTitle && !canEditContent) ||
              (() => {
                // Check if nothing changed
                const titleUnchanged = editedTitle === post.title;
                const contentUnchanged = editedContent === post.content;
                
                // Check hashtags changes for post owner on GENERAL_TOPIC posts
                const originalHashtags = post.hashtags?.map(tag => 
                  typeof tag === 'string' ? tag : tag.slug
                ) || [];
                const hashtagsUnchanged = 
                  !isPostOwner || 
                  post.type !== 'GENERAL_TOPIC' || 
                  JSON.stringify(hashtags.sort()) === JSON.stringify(originalHashtags.sort());
                
                return titleUnchanged && contentUnchanged && hashtagsUnchanged;
              })()
            }
            className="bg-secondary hover:bg-secondary/80"
          >
            {isSubmitting ? t('editPost.saving') : t('editPost.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
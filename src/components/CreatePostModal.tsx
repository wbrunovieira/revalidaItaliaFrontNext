'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Hash, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  type?: 'GENERAL_TOPIC' | 'LESSON_COMMENT';
  lessonId?: string;
}

export default function CreatePostModal({ open, onClose, onPostCreated, type: propType = 'GENERAL_TOPIC', lessonId }: CreatePostModalProps) {
  const t = useTranslations('CreatePost');
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use the type from props
  const type = propType;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setContent('');
      setHashtags('');
      setErrors({});
    }
  }, [open]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Content validation
    if (!content.trim()) {
      newErrors.content = t('errors.contentRequired');
    } else if (content.trim().length > 10000) {
      newErrors.content = t('errors.contentTooLong');
    }

    // Type-specific validation
    if (type === 'GENERAL_TOPIC') {
      if (!title.trim()) {
        newErrors.title = t('errors.titleRequired');
      } else if (title.trim().length < 3) {
        newErrors.title = t('errors.titleTooShort');
      } else if (title.trim().length > 200) {
        newErrors.title = t('errors.titleTooLong');
      }
    } else if (type === 'LESSON_COMMENT') {
      if (!lessonId) {
        newErrors.lessonId = t('errors.lessonRequired');
      }
    }

    // Hashtag validation
    if (hashtags.trim()) {
      const hashtagArray = hashtags.split(/[\s,]+/).filter(tag => tag.length > 0);
      const invalidTags = hashtagArray.filter(tag => !/^[a-z0-9_]+$/.test(tag));
      
      if (invalidTags.length > 0) {
        newErrors.hashtags = t('errors.invalidHashtags', { tags: invalidTags.join(', ') });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [type, title, content, lessonId, hashtags, t]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];
      
      if (!token) {
        throw new Error(t('errors.unauthorized'));
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      // Prepare hashtags
      const hashtagSlugs = hashtags
        .split(/[\s,]+/)
        .filter(tag => tag.length > 0)
        .map(tag => tag.toLowerCase().replace(/[^a-z0-9_]/g, ''));

      // Prepare request body
      const requestBody: any = {
        type,
        content: content.trim(),
      };

      if (type === 'GENERAL_TOPIC') {
        requestBody.title = title.trim();
      } else if (type === 'LESSON_COMMENT') {
        requestBody.lessonId = lessonId;
      }

      if (hashtagSlugs.length > 0) {
        requestBody.hashtagSlugs = hashtagSlugs;
      }

      console.log('Creating post with data:', requestBody);

      const response = await fetch(`${apiUrl}/api/v1/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        // Handle specific error types
        if (data.type?.includes('author-not-found')) {
          throw new Error(t('errors.authorNotFound'));
        }
        throw new Error(data.detail || t('errors.createFailed'));
      }

      toast({
        title: t('success'),
        description: type === 'GENERAL_TOPIC' ? t('successDescriptionTopic') : t('successDescriptionComment'),
      });
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('errors.createFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [type, title, content, lessonId, hashtags, validateForm, onPostCreated, onClose, t, toast]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-primary-dark border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title (only for GENERAL_TOPIC) */}
          {type === 'GENERAL_TOPIC' && (
            <div>
              <Label className="text-white mb-2">{t('titleLabel')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('titlePlaceholder')}
                className="bg-primary-dark/50 border-gray-700 text-white placeholder:text-gray-500"
                maxLength={200}
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.title}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {title.length}/200
              </p>
            </div>
          )}

          {/* Content */}
          <div>
            <Label className="text-white mb-2">{t('contentLabel')}</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('contentPlaceholder')}
              className="bg-primary-dark/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[200px]"
              maxLength={10000}
            />
            {errors.content && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.content}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {content.length}/10000
            </p>
          </div>

          {/* Hashtags */}
          <div>
            <Label className="text-white mb-2">
              <Hash size={14} className="inline mr-1" />
              {t('hashtagsLabel')}
            </Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value.toLowerCase())}
              placeholder={t('hashtagsPlaceholder')}
              className="bg-primary-dark/50 border-gray-700 text-white placeholder:text-gray-500"
            />
            {errors.hashtags && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.hashtags}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {t('hashtagsHelp')}
            </p>
            
            {/* Hashtag Preview */}
            {hashtags.trim() && (
              <div className="mt-2 flex flex-wrap gap-2">
                {hashtags.split(/[\s,]+/).filter(tag => tag.length > 0).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-white"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-secondary hover:bg-secondary/90 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {t('creating')}
              </>
            ) : (
              t('create')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
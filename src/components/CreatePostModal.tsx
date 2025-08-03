'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Hash, AlertCircle, Loader2, MessageSquare, Sparkles, Info, Image as ImageIcon, FileText, Video, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  type?: 'GENERAL_TOPIC' | 'LESSON_COMMENT';
  lessonId?: string;
}

type AttachmentType = 'images' | 'pdf' | 'video' | null;

interface Attachment {
  type: AttachmentType;
  images?: File[];
  pdf?: File;
  videoUrl?: string;
}

export default function CreatePostModal({ open, onClose, onPostCreated, type: propType = 'GENERAL_TOPIC', lessonId }: CreatePostModalProps) {
  const t = useTranslations('CreatePost');
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attachment, setAttachment] = useState<Attachment>({ type: null });
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Use the type from props
  const type = propType;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setContent('');
      setHashtags('');
      setErrors({});
      setAttachment({ type: null });
      setPreviewUrls([]);
    }
  }, [open]);

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

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

    // Attachment validation
    if (attachment.type === 'video' && attachment.videoUrl) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(attachment.videoUrl)) {
        newErrors.videoUrl = t('errors.invalidVideoUrl');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [type, title, content, lessonId, hashtags, attachment, t]);

  // Handle image selection
  const handleImageSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    ).slice(0, 6); // Max 6 images
    
    if (imageFiles.length === 0) {
      setErrors(prev => ({ ...prev, images: t('errors.invalidImageType') }));
      return;
    }
    
    // Create preview URLs
    const urls = imageFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return urls;
    });
    
    setAttachment({ type: 'images', images: imageFiles });
    setErrors(prev => {
      const { images, ...rest } = prev;
      return rest;
    });
  }, [t]);

  // Handle PDF selection
  const handlePdfSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type !== 'application/pdf') {
      setErrors(prev => ({ ...prev, pdf: t('errors.invalidPdfType') }));
      return;
    }
    
    setAttachment({ type: 'pdf', pdf: file });
    setErrors(prev => {
      const { pdf, ...rest } = prev;
      return rest;
    });
  }, [t]);

  // Handle video URL input
  const handleVideoUrl = useCallback((url: string) => {
    setAttachment({ type: 'video', videoUrl: url });
    if (!url.trim()) {
      setErrors(prev => {
        const { videoUrl, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  // Remove attachment
  const removeAttachment = useCallback(() => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setAttachment({ type: null });
    setErrors(prev => {
      const { images, pdf, videoUrl, ...rest } = prev;
      return rest;
    });
  }, [previewUrls]);

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

      // Check if we have attachments that require FormData
      const hasFileAttachment = (attachment.type === 'images' && attachment.images) || 
                               (attachment.type === 'pdf' && attachment.pdf);
      
      let response;
      
      if (hasFileAttachment) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('type', type);
        formData.append('content', content.trim());
        
        if (type === 'GENERAL_TOPIC') {
          formData.append('title', title.trim());
        } else if (type === 'LESSON_COMMENT') {
          formData.append('lessonId', lessonId!);
        }
        
        if (hashtagSlugs.length > 0) {
          formData.append('hashtagSlugs', JSON.stringify(hashtagSlugs));
        }
        
        // Add attachments
        if (attachment.type === 'images' && attachment.images) {
          attachment.images.forEach((image, index) => {
            formData.append(`images`, image);
          });
        } else if (attachment.type === 'pdf' && attachment.pdf) {
          formData.append('pdf', attachment.pdf);
        }
        
        console.log('Creating post with FormData');
        
        response = await fetch(`${apiUrl}/api/v1/community/posts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Use JSON for non-file requests
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
        
        if (attachment.type === 'video' && attachment.videoUrl) {
          requestBody.videoUrl = attachment.videoUrl;
        }

        console.log('Creating post with data:', requestBody);

        response = await fetch(`${apiUrl}/api/v1/community/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      }

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
      <DialogContent className="max-w-2xl bg-gradient-to-br from-primary via-primary-dark to-primary-dark/95 border-secondary/20 shadow-2xl">
        <DialogHeader className="relative">
          {/* Decorative elements */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-4 -left-6 w-20 h-20 bg-secondary/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-secondary/20 rounded-lg">
                <MessageSquare size={24} className="text-secondary" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                {t('title')}
              </DialogTitle>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              <Sparkles size={14} className="text-secondary" />
              {type === 'GENERAL_TOPIC' ? t('subtitleTopic') : t('subtitleComment')}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-6">
          {/* Title (only for GENERAL_TOPIC) */}
          {type === 'GENERAL_TOPIC' && (
            <div className="space-y-2">
              <Label className="text-white font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                {t('titleLabel')}
              </Label>
              <div className="relative group">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className={cn(
                    "bg-primary/50 border-gray-700 text-white placeholder:text-gray-500",
                    "focus:border-secondary focus:ring-1 focus:ring-secondary/50",
                    "transition-all duration-200",
                    errors.title && "border-red-500/50 focus:border-red-500 focus:ring-red-500/50"
                  )}
                  maxLength={200}
                />
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-secondary/0 via-secondary/10 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              <div className="flex items-center justify-between">
                {errors.title ? (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.title}
                  </p>
                ) : (
                  <div />
                )}
                <p className={cn(
                  "text-xs transition-colors",
                  title.length > 180 ? "text-orange-400" : "text-gray-500"
                )}>
                  {title.length}/200
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label className="text-white font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              {t('contentLabel')}
            </Label>
            <div className="relative group">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('contentPlaceholder')}
                className={cn(
                  "bg-primary/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[200px]",
                  "focus:border-secondary focus:ring-1 focus:ring-secondary/50",
                  "transition-all duration-200 resize-none",
                  errors.content && "border-red-500/50 focus:border-red-500 focus:ring-red-500/50"
                )}
                maxLength={10000}
              />
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            <div className="flex items-center justify-between">
              {errors.content ? (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.content}
                </p>
              ) : (
                <div />
              )}
              <p className={cn(
                "text-xs transition-colors",
                content.length > 9000 ? "text-orange-400" : "text-gray-500"
              )}>
                {content.length}/10000
              </p>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label className="text-white font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              {t('hashtagsLabel')}
              <span className="text-gray-500 font-normal text-xs">{t('optional')}</span>
            </Label>
            <div className="relative group">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value.toLowerCase())}
                placeholder={t('hashtagsPlaceholder')}
                className={cn(
                  "bg-primary/50 border-gray-700 text-white placeholder:text-gray-500 pl-10",
                  "focus:border-secondary focus:ring-1 focus:ring-secondary/50",
                  "transition-all duration-200",
                  errors.hashtags && "border-red-500/50 focus:border-red-500 focus:ring-red-500/50"
                )}
              />
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-secondary/0 via-secondary/10 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            
            {errors.hashtags ? (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.hashtags}
              </p>
            ) : (
              <p className="text-gray-500 text-xs flex items-center gap-1">
                <Info size={12} />
                {t('hashtagsHelp')}
              </p>
            )}
            
            {/* Hashtag Preview */}
            {hashtags.trim() && (
              <div className="p-3 bg-primary/30 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500 mb-2">{t('preview')}:</p>
                <div className="flex flex-wrap gap-2">
                  {hashtags.split(/[\s,]+/).filter(tag => tag.length > 0).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-gradient-to-r from-secondary/20 to-secondary/10 text-secondary border-secondary/30 hover:border-secondary/50 transition-colors"
                    >
                      <Hash size={12} className="mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-white font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              {t('attachmentsLabel')}
              <span className="text-gray-500 font-normal text-xs">{t('optional')}</span>
            </Label>
            
            {/* Attachment type selector */}
            {!attachment.type && (
              <div className="grid grid-cols-3 gap-3">
                <label className="relative group cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e.target.files)}
                    className="hidden"
                  />
                  <div className="p-4 bg-primary/50 border border-gray-700 rounded-lg text-center hover:border-secondary/50 hover:bg-primary/70 transition-all duration-200">
                    <ImageIcon size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-secondary transition-colors" />
                    <p className="text-sm text-gray-300 font-medium">{t('attachmentTypes.images')}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('attachmentLimits.images')}</p>
                  </div>
                </label>

                <label className="relative group cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handlePdfSelect(e.target.files)}
                    className="hidden"
                  />
                  <div className="p-4 bg-primary/50 border border-gray-700 rounded-lg text-center hover:border-secondary/50 hover:bg-primary/70 transition-all duration-200">
                    <FileText size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-secondary transition-colors" />
                    <p className="text-sm text-gray-300 font-medium">{t('attachmentTypes.pdf')}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('attachmentLimits.pdf')}</p>
                  </div>
                </label>

                <div 
                  onClick={() => setAttachment({ type: 'video', videoUrl: '' })}
                  className="p-4 bg-primary/50 border border-gray-700 rounded-lg text-center hover:border-secondary/50 hover:bg-primary/70 transition-all duration-200 cursor-pointer group"
                >
                  <Video size={24} className="mx-auto mb-2 text-gray-400 group-hover:text-secondary transition-colors" />
                  <p className="text-sm text-gray-300 font-medium">{t('attachmentTypes.video')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('attachmentLimits.video')}</p>
                </div>
              </div>
            )}

            {/* Image preview */}
            {attachment.type === 'images' && attachment.images && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        width={200}
                        height={150}
                        className="w-full h-24 object-cover rounded-lg border border-gray-700"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAttachment}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} className="mr-2" />
                  {t('removeAttachment')}
                </Button>
              </div>
            )}

            {/* PDF preview */}
            {attachment.type === 'pdf' && attachment.pdf && (
              <div className="space-y-3">
                <div className="p-4 bg-primary/30 rounded-lg border border-gray-700 flex items-center gap-3">
                  <FileText size={32} className="text-secondary" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{attachment.pdf.name}</p>
                    <p className="text-gray-500 text-sm">
                      {(attachment.pdf.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAttachment}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} className="mr-2" />
                  {t('removeAttachment')}
                </Button>
              </div>
            )}

            {/* Video URL input */}
            {attachment.type === 'video' && (
              <div className="space-y-3">
                <div className="relative group">
                  <Video size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input
                    value={attachment.videoUrl || ''}
                    onChange={(e) => handleVideoUrl(e.target.value)}
                    placeholder={t('videoUrlPlaceholder')}
                    className={cn(
                      "bg-primary/50 border-gray-700 text-white placeholder:text-gray-500 pl-10",
                      "focus:border-secondary focus:ring-1 focus:ring-secondary/50",
                      "transition-all duration-200",
                      errors.videoUrl && "border-red-500/50 focus:border-red-500 focus:ring-red-500/50"
                    )}
                  />
                </div>
                {errors.videoUrl && (
                  <p className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.videoUrl}
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAttachment}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} className="mr-2" />
                  {t('removeAttachment')}
                </Button>
              </div>
            )}

            {/* Error messages */}
            {errors.images && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.images}
              </p>
            )}
            {errors.pdf && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.pdf}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            {type === 'GENERAL_TOPIC' ? t('tipTopic') : t('tipComment')}
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() || (type === 'GENERAL_TOPIC' && !title.trim()))}
              className={cn(
                "bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70",
                "text-white font-semibold shadow-lg hover:shadow-secondary/25",
                "transition-all duration-200 transform hover:scale-105",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                <>
                  <MessageSquare size={16} className="mr-2" />
                  {t('create')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
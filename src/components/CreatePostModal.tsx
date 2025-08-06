// src/components/CreatePostModal.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  X,
  Hash,
  AlertCircle,
  Loader2,
  MessageSquare,
  Sparkles,
  Info,
  Image as ImageIcon,
  FileText,
  Video,
  Upload,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuth } from '@/stores/auth.store';

export interface CreatedPost {
  id: string;
  type: 'GENERAL_TOPIC' | 'LESSON_COMMENT';
  title: string;
  content: string;
  slug?: string;
  authorId: string;
  lessonId?: string | null;
  createdAt: string;
  updatedAt?: string;
  hashtags?: string[];
  attachments?: Array<{
    id: string;
    url: string;
    type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    mimeType: string;
    sizeInBytes: number;
    fileName: string;
    uploadedAt?: string;
    // Video fields at root level
    provider?: 'youtube' | 'vimeo';
    videoId?: string;
    embedUrl?: string;
    thumbnailUrl?: string;
    // Legacy nested format
    videoInfo?: {
      provider: 'youtube' | 'vimeo';
      videoId: string;
      embedUrl: string;
      thumbnailUrl: string;
    };
  }>;
  viewCount?: number;
  commentCount?: number;
  reactionCount?: number;
  isPinned?: boolean;
  mediaType?: string;
  status?: string;
  trendingScore?: number;
  reportCount?: number;
  lastActivityAt?: string;
}

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: (post: CreatedPost) => void;
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

export default function CreatePostModal({
  open,
  onClose,
  onPostCreated,
  type: propType = 'GENERAL_TOPIC',
  lessonId,
}: CreatePostModalProps) {
  const t = useTranslations('CreatePost');
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Record<string, string>
  >({});
  const [attachment, setAttachment] = useState<Attachment>({
    type: null,
  });
  const [previewUrls, setPreviewUrls] = useState<string[]>(
    []
  );
  const [uploadedUrls, setUploadedUrls] = useState<
    string[]
  >([]);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState<
    string | null
  >(null);
  const [isUploading, setIsUploading] = useState(false);

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
      setUploadedUrls([]);
      setUploadedPdfUrl(null);
      setIsUploading(false);
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

    // Content validation (updated minimum length to 10)
    if (!content.trim()) {
      newErrors.content = t('errors.contentRequired');
    } else if (content.trim().length < 10) {
      newErrors.content = t('errors.contentTooShort');
    } else if (content.trim().length > 5000) {
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
      const hashtagArray = hashtags
        .split(/[\s,]+/)
        .filter(tag => tag.length > 0);
      
      // Check max 5 hashtags
      if (hashtagArray.length > 5) {
        newErrors.hashtags = t('errors.tooManyHashtags');
      } else {
        // Check each hashtag length (2-30 chars)
        const invalidTags = hashtagArray.filter(
          tag => tag.length < 2 || tag.length > 30 || !/^[a-z0-9_]+$/.test(tag)
        );

        if (invalidTags.length > 0) {
          newErrors.hashtags = t('errors.invalidHashtags', {
            tags: invalidTags.join(', '),
          });
        }
      }
    }

    // Attachment validation
    if (attachment.type === 'video' && attachment.videoUrl) {
      // Check if it's a valid YouTube or Vimeo URL
      const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
      const vimeoPattern = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/\d+/;
      
      if (!youtubePattern.test(attachment.videoUrl) && !vimeoPattern.test(attachment.videoUrl)) {
        newErrors.videoUrl = t('errors.invalidVideoUrl');
      }
    }

    // Image validation
    if (attachment.type === 'images' && attachment.images) {
      if (attachment.images.length > 6) {
        newErrors.images = t('errors.tooManyImages');
      }
      
      // Check each image size (max 5MB)
      const oversizedImages = Array.from(attachment.images).filter(
        file => file.size > 5 * 1024 * 1024
      );
      
      if (oversizedImages.length > 0) {
        newErrors.images = t('errors.imagesTooLarge');
      }
    }

    // PDF validation  
    if (attachment.type === 'pdf' && attachment.pdf) {
      if (attachment.pdf.size > 10 * 1024 * 1024) {
        newErrors.pdf = t('errors.pdfTooLarge');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    type,
    title,
    content,
    lessonId,
    hashtags,
    attachment,
    t,
  ]);

  // Handle image selection and upload
  const handleImageSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const imageFiles = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .slice(0, 6); // Max 6 images

      if (imageFiles.length === 0) {
        setErrors(prev => ({
          ...prev,
          images: t('errors.invalidImageType'),
        }));
        return;
      }

      // Validate file sizes
      const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setErrors(prev => ({
          ...prev,
          images: t('errors.imagesTooLarge'),
        }));
        return;
      }

      setIsUploading(true);

      try {
        // Create preview URLs
        const urls = imageFiles.map(file =>
          URL.createObjectURL(file)
        );
        setPreviewUrls(prev => {
          prev.forEach(url => URL.revokeObjectURL(url));
          return urls;
        });

        // Upload all images
        const uploadPromises = imageFiles.map(
          async file => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', 'image');
            formData.append('folder', 'posts');

            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Upload failed');
            }

            const result = await response.json();
            // Transform the URL to match API expectations
            // API expects /uploads/attachments/... format
            return result.url.replace(/^\/uploads\/(images|documents)\//, '/uploads/attachments/');
          }
        );

        const uploadedImageUrls = await Promise.all(
          uploadPromises
        );
        console.log('Uploaded image URLs:', uploadedImageUrls);
        setUploadedUrls(uploadedImageUrls);

        setAttachment({
          type: 'images',
          images: imageFiles,
        });
        setErrors(prev => {
          const { images, ...rest } = prev;
          return rest;
        });

        toast({
          title: t('upload.success'),
          description: t('upload.imagesUploaded', {
            count: uploadedImageUrls.length,
          }),
        });
      } catch (error) {
        console.error('Upload error:', error);
        setErrors(prev => ({
          ...prev,
          images: t('errors.uploadFailed'),
        }));
        toast({
          title: t('error'),
          description: t('errors.uploadFailed'),
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [t, toast]
  );

  // Handle PDF selection and upload
  const handlePdfSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (file.type !== 'application/pdf') {
        setErrors(prev => ({
          ...prev,
          pdf: t('errors.invalidPdfType'),
        }));
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          pdf: t('errors.pdfTooLarge'),
        }));
        return;
      }

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'document');
        formData.append('folder', 'posts');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        // Transform the URL to match API expectations
        const transformedUrl = result.url.replace(/^\/uploads\/(images|documents)\//, '/uploads/attachments/');
        setUploadedPdfUrl(transformedUrl);

        setAttachment({ type: 'pdf', pdf: file });
        setErrors(prev => {
          const { pdf, ...rest } = prev;
          return rest;
        });

        toast({
          title: t('upload.success'),
          description: t('upload.pdfUploaded'),
        });
      } catch (error) {
        console.error('Upload error:', error);
        setErrors(prev => ({
          ...prev,
          pdf: t('errors.uploadFailed'),
        }));
        toast({
          title: t('error'),
          description: t('errors.uploadFailed'),
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [t, toast]
  );

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

  // Helper function to extract YouTube/Vimeo video ID
  const extractVideoInfo = useCallback((url: string) => {
    // YouTube patterns
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    );
    if (youtubeMatch) {
      return {
        provider: 'youtube' as const,
        videoId: youtubeMatch[1],
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`
      };
    }

    // Vimeo patterns
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return {
        provider: 'vimeo' as const,
        videoId: vimeoMatch[1],
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        thumbnailUrl: `https://vumbnail.com/${vimeoMatch[1]}.jpg`
      };
    }

    return null;
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (!token || !isAuthenticated) {
        throw new Error(t('errors.unauthorized'));
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      // Prepare hashtags (now using direct array format)
      const hashtagArray = hashtags
        .split(/[\s,]+/)
        .filter(tag => tag.length > 0)
        .map(tag =>
          tag.toLowerCase().replace(/[^a-z0-9_]/g, '')
        )
        .slice(0, 5); // Max 5 hashtags

      // Prepare request body
      const requestBody: any = {
        type,
        title: type === 'GENERAL_TOPIC' ? title.trim() : content.trim().substring(0, 200),
        content: content.trim(),
      };

      if (type === 'LESSON_COMMENT' && lessonId) {
        requestBody.lessonId = lessonId;
      }

      if (hashtagArray.length > 0) {
        requestBody.hashtags = hashtagArray;
      }

      // Prepare attachments array
      const attachments: any[] = [];

      if (attachment.type === 'images' && uploadedUrls.length > 0 && attachment.images) {
        // Add image attachments
        uploadedUrls.forEach((url, index) => {
          const file = attachment.images![index];
          if (file) {
            attachments.push({
              url: url,
              type: 'IMAGE',
              mimeType: file.type,
              sizeInBytes: file.size,
              fileName: file.name
            });
          }
        });
      } else if (attachment.type === 'pdf' && uploadedPdfUrl && attachment.pdf) {
        // Add PDF attachment
        attachments.push({
          url: uploadedPdfUrl,
          type: 'DOCUMENT',
          mimeType: 'application/pdf',
          sizeInBytes: attachment.pdf.size,
          fileName: attachment.pdf.name
        });
      } else if (attachment.type === 'video' && attachment.videoUrl) {
        // Add video attachment
        const videoInfo = extractVideoInfo(attachment.videoUrl);
        if (videoInfo) {
          const videoAttachment: any = {
            url: attachment.videoUrl,
            type: 'VIDEO',
            mimeType: 'video/external', // Using the allowed mime type from API
            sizeInBytes: 0,
            fileName: `${videoInfo.provider}-${videoInfo.videoId}.mp4`,
            provider: videoInfo.provider,
            videoId: videoInfo.videoId,
            embedUrl: videoInfo.embedUrl,
            thumbnailUrl: videoInfo.thumbnailUrl
          };
          attachments.push(videoAttachment);
        } else {
          // If we can't extract video info, still send as external video
          attachments.push({
            url: attachment.videoUrl,
            type: 'VIDEO',
            mimeType: 'video/external',
            sizeInBytes: 0,
            fileName: 'external-video.mp4'
          });
        }
      }

      if (attachments.length > 0) {
        requestBody.attachments = attachments;
      }

      console.log('Creating post with data:', requestBody);
      console.log('Attachments:', requestBody.attachments);

      const response = await fetch(
        `${apiUrl}/api/v1/community/posts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        // Log the full error for debugging
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });

        // Handle validation errors
        if (response.status === 400 && data.errors) {
          const firstError = data.errors[0];
          throw new Error(firstError.message);
        }
        
        // Handle other specific errors
        if (response.status === 404) {
          throw new Error(data.detail || t('errors.lessonNotFound'));
        }
        
        if (response.status === 422) {
          throw new Error(data.detail || t('errors.invalidAttachment'));
        }

        if (response.status === 500) {
          console.error('Server Error 500 - Check attachment format:', requestBody.attachments);
          throw new Error('Erro no servidor ao processar vídeo. Verifique o formato da URL.');
        }
        
        throw new Error(
          data.message || data.detail || t('errors.createFailed')
        );
      }

      toast({
        title: t('success'),
        description:
          type === 'GENERAL_TOPIC'
            ? t('successDescriptionTopic')
            : t('successDescriptionComment'),
      });
      
      // Extract the post from the response and include hashtags and attachments
      const createdPost: CreatedPost = {
        ...data.post,
        hashtags: data.hashtags,
        attachments: data.attachments || []
      };
      
      console.log('Post created with attachments:', data.attachments);
      
      // Pass the created post data to parent
      onPostCreated(createdPost);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: t('error'),
        description:
          error instanceof Error
            ? error.message
            : t('errors.createFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    type,
    title,
    content,
    lessonId,
    hashtags,
    attachment,
    uploadedUrls,
    uploadedPdfUrl,
    validateForm,
    extractVideoInfo,
    onPostCreated,
    onClose,
    t,
    toast,
  ]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-gradient-to-br from-primary via-primary-dark to-primary-dark/95 border-secondary/20 shadow-2xl flex flex-col">
        <DialogHeader className="relative shrink-0">
          {/* Decorative elements */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-4 -left-6 w-20 h-20 bg-secondary/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-secondary/20 rounded-lg">
                <MessageSquare
                  size={24}
                  className="text-secondary"
                />
              </div>
              <DialogTitle className="text-2xl font-bold text-white">
                {t('title')}
              </DialogTitle>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-1">
              <Sparkles
                size={14}
                className="text-secondary"
              />
              {type === 'GENERAL_TOPIC'
                ? t('subtitleTopic')
                : t('subtitleComment')}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
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
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className={cn(
                    'bg-primary/50 border-gray-700 text-white placeholder:text-gray-500',
                    'focus:border-secondary focus:ring-1 focus:ring-secondary/50',
                    'transition-all duration-200',
                    errors.title &&
                      'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
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
                <p
                  className={cn(
                    'text-xs transition-colors',
                    title.length > 180
                      ? 'text-orange-400'
                      : 'text-gray-500'
                  )}
                >
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
                onChange={e => setContent(e.target.value)}
                placeholder={t('contentPlaceholder')}
                className={cn(
                  'bg-primary/50 border-gray-700 text-white placeholder:text-gray-500 min-h-[200px]',
                  'focus:border-secondary focus:ring-1 focus:ring-secondary/50',
                  'transition-all duration-200 resize-none',
                  errors.content &&
                    'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                )}
                maxLength={5000}
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
              <p
                className={cn(
                  'text-xs transition-colors',
                  content.length > 4500
                    ? 'text-orange-400'
                    : 'text-gray-500'
                )}
              >
                {content.length}/5000
              </p>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label className="text-white font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              {t('hashtagsLabel')}
              <span className="text-gray-500 font-normal text-xs">
                {t('optional')}
              </span>
            </Label>
            <div className="relative group">
              <Hash
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <Input
                value={hashtags}
                onChange={e =>
                  setHashtags(e.target.value.toLowerCase())
                }
                placeholder={t('hashtagsPlaceholder')}
                className={cn(
                  'bg-primary/50 border-gray-700 text-white placeholder:text-gray-500 pl-10',
                  'focus:border-secondary focus:ring-1 focus:ring-secondary/50',
                  'transition-all duration-200',
                  errors.hashtags &&
                    'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
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
                <p className="text-xs text-gray-500 mb-2">
                  {t('preview')}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {hashtags
                    .split(/[\s,]+/)
                    .filter(tag => tag.length > 0)
                    .map((tag, index) => (
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
              <span className="text-gray-500 font-normal text-xs">
                {t('optional')}
              </span>
            </Label>

            {/* Attachment type selector */}
            {!attachment.type && (
              <div className="grid grid-cols-3 gap-3">
                <label
                  className={cn(
                    'relative group cursor-pointer',
                    isUploading &&
                      'cursor-not-allowed opacity-50'
                  )}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e =>
                      handleImageSelect(e.target.files)
                    }
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="p-4 bg-primary/50 border border-gray-700 rounded-lg text-center hover:border-secondary/50 hover:bg-primary/70 transition-all duration-200">
                    {isUploading ? (
                      <Loader2
                        size={24}
                        className="mx-auto mb-2 text-secondary animate-spin"
                      />
                    ) : (
                      <ImageIcon
                        size={24}
                        className="mx-auto mb-2 text-gray-400 group-hover:text-secondary transition-colors"
                      />
                    )}
                    <p className="text-sm text-gray-300 font-medium">
                      {t('attachmentTypes.images')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('attachmentLimits.images')}
                    </p>
                  </div>
                </label>

                <label className="relative group cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={e =>
                      handlePdfSelect(e.target.files)
                    }
                    className="hidden"
                  />
                  <div className="p-4 bg-primary/50 border border-gray-700 rounded-lg text-center hover:border-secondary/50 hover:bg-primary/70 transition-all duration-200">
                    <FileText
                      size={24}
                      className="mx-auto mb-2 text-gray-400 group-hover:text-secondary transition-colors"
                    />
                    <p className="text-sm text-gray-300 font-medium">
                      {t('attachmentTypes.pdf')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('attachmentLimits.pdf')}
                    </p>
                  </div>
                </label>

                <div
                  onClick={() =>
                    setAttachment({
                      type: 'video',
                      videoUrl: '',
                    })
                  }
                  className="p-4 bg-primary/50 border border-gray-700 rounded-lg text-center hover:border-secondary/50 hover:bg-primary/70 transition-all duration-200 cursor-pointer group"
                >
                  <Video
                    size={24}
                    className="mx-auto mb-2 text-gray-400 group-hover:text-secondary transition-colors"
                  />
                  <p className="text-sm text-gray-300 font-medium">
                    {t('attachmentTypes.video')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('attachmentLimits.video')}
                  </p>
                </div>
              </div>
            )}

            {/* Image preview */}
            {attachment.type === 'images' &&
              attachment.images && (
                <div className="space-y-3">
                  {/* Facebook-style image grid */}
                  {previewUrls.length === 1 && (
                    <div className="relative w-full h-64 rounded-lg overflow-hidden">
                      <Image
                        src={previewUrls[0]}
                        alt="Preview 1"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {previewUrls.length === 2 && (
                    <div className="grid grid-cols-2 gap-2">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {previewUrls.length === 3 && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative h-64 rounded-lg overflow-hidden">
                        <Image
                          src={previewUrls[0]}
                          alt="Preview 1"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-2">
                        {previewUrls.slice(1).map((url, index) => (
                          <div key={index + 1} className="relative h-[124px] rounded-lg overflow-hidden">
                            <Image
                              src={url}
                              alt={`Preview ${index + 2}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewUrls.length === 4 && (
                    <div className="grid grid-cols-2 gap-2">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {previewUrls.length === 5 && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        {previewUrls.slice(0, 2).map((url, index) => (
                          <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-rows-3 gap-2">
                        {previewUrls.slice(2, 5).map((url, index) => (
                          <div key={index + 2} className="relative h-[5.33rem] rounded-lg overflow-hidden">
                            <Image
                              src={url}
                              alt={`Preview ${index + 3}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewUrls.length >= 6 && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        {previewUrls.slice(0, 4).map((url, index) => (
                          <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {previewUrls.slice(4, 6).map((url, index) => (
                          <div key={index + 4} className="relative h-32 rounded-lg overflow-hidden">
                            <Image
                              src={url}
                              alt={`Preview ${index + 5}`}
                              fill
                              className="object-cover"
                            />
                            {index === 1 && previewUrls.length > 6 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <p className="text-white text-2xl font-bold">
                                  +{previewUrls.length - 6}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      {previewUrls.length} {previewUrls.length === 1 ? t('image') : t('images')} {t('selected')}
                    </p>
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
                </div>
              )}

            {/* PDF preview */}
            {attachment.type === 'pdf' &&
              attachment.pdf && (
                <div className="space-y-3">
                  <div className="p-4 bg-primary/30 rounded-lg border border-gray-700 flex items-center gap-3">
                    <FileText
                      size={32}
                      className="text-secondary"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {attachment.pdf.name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {(
                          attachment.pdf.size /
                          1024 /
                          1024
                        ).toFixed(2)}{' '}
                        MB
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
                  <Video
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <Input
                    value={attachment.videoUrl || ''}
                    onChange={e =>
                      handleVideoUrl(e.target.value)
                    }
                    placeholder={t('videoUrlPlaceholder')}
                    className={cn(
                      'bg-primary/50 border-gray-700 text-white placeholder:text-gray-500 pl-10',
                      'focus:border-secondary focus:ring-1 focus:ring-secondary/50',
                      'transition-all duration-200',
                      errors.videoUrl &&
                        'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
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
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700 shrink-0">
          <p className="text-xs text-gray-500">
            {type === 'GENERAL_TOPIC'
              ? t('tipTopic')
              : t('tipComment')}
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
              disabled={
                isSubmitting ||
                !content.trim() ||
                (type === 'GENERAL_TOPIC' && !title.trim())
              }
              className={cn(
                'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70',
                'text-white font-semibold shadow-lg hover:shadow-secondary/25',
                'transition-all duration-200 transform hover:scale-105',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={16}
                    className="mr-2 animate-spin"
                  />
                  {t('creating')}
                </>
              ) : (
                <>
                  <MessageSquare
                    size={16}
                    className="mr-2"
                  />
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

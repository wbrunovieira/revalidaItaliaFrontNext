// src/components/AttachmentsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Image as ImageIcon, 
  FileText, 
  Video,
  Hash,
  Upload,
  Link
} from 'lucide-react';
import Image from 'next/image';

export interface AttachmentData {
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  file?: File;
  videoUrl?: string;
  videoInfo?: {
    provider: 'youtube' | 'vimeo';
    videoId: string;
    embedUrl: string;
    thumbnailUrl: string;
  };
  previewUrl?: string;
}

interface AttachmentsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (hashtags: string[], attachments: AttachmentData[]) => void;
  initialHashtags?: string[];
  initialAttachments?: AttachmentData[];
}

type AttachmentType = 'images' | 'pdf' | 'video' | null;

export default function AttachmentsModal({
  open,
  onClose,
  onConfirm,
  initialHashtags = [],
  initialAttachments = []
}: AttachmentsModalProps) {
  const t = useTranslations('CreatePost');
  const [hashtags, setHashtags] = useState(initialHashtags.join(' '));
  const [attachmentType, setAttachmentType] = useState<AttachmentType>(null);
  const [attachments, setAttachments] = useState<AttachmentData[]>(initialAttachments);
  const [videoUrl, setVideoUrl] = useState('');

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setHashtags(initialHashtags.join(' '));
      setAttachmentType(null);
      setAttachments(initialAttachments);
      setVideoUrl('');
    }
  }, [open, initialHashtags, initialAttachments]);

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      attachments.forEach(att => {
        if (att.previewUrl && att.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });
    };
  }, [attachments]);

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newAttachments: AttachmentData[] = Array.from(files).slice(0, 6 - attachments.filter(a => a.type === 'IMAGE').length).map(file => ({
      type: 'IMAGE' as const,
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    setAttachmentType(null);
  };

  const handlePdfSelect = (file: File | null) => {
    if (!file) return;
    
    setAttachments(prev => [...prev, {
      type: 'DOCUMENT' as const,
      file
    }]);
    setAttachmentType(null);
  };

  const extractVideoInfo = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);

    if (youtubeMatch) {
      return {
        provider: 'youtube' as const,
        videoId: youtubeMatch[1],
        embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`
      };
    }

    if (vimeoMatch) {
      return {
        provider: 'vimeo' as const,
        videoId: vimeoMatch[1],
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        thumbnailUrl: `https://vumbnail.com/${vimeoMatch[1]}.jpg`
      };
    }

    return null;
  };

  const handleVideoAdd = () => {
    const videoInfo = extractVideoInfo(videoUrl);
    if (videoInfo) {
      setAttachments(prev => [...prev, {
        type: 'VIDEO' as const,
        videoUrl,
        videoInfo
      }]);
      setVideoUrl('');
      setAttachmentType(null);
    }
  };

  const removeAttachment = (index: number) => {
    const attachment = attachments[index];
    if (attachment.previewUrl && attachment.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    // Parse hashtags
    const hashtagArray = hashtags
      .split(/\s+/)
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.slice(1))
      .filter(tag => tag.length > 0);

    onConfirm(hashtagArray, attachments);
    onClose();
  };

  const imageCount = attachments.filter(a => a.type === 'IMAGE').length;
  const hasPdf = attachments.some(a => a.type === 'DOCUMENT');
  const hasVideo = attachments.some(a => a.type === 'VIDEO');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t('attachments')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Hashtags */}
          <div>
            <Label>{t('hashtagsLabel')}</Label>
            <Input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder={t('hashtagsPlaceholder')}
              className="bg-gray-800 border-gray-700 text-white mt-2"
            />
            <p className="text-xs text-gray-400 mt-1">
              {t('hashtagsHelper')}
            </p>
          </div>

          {/* Attachments */}
          <div>
            <Label className="mb-3 block">{t('attachmentsLabel')}</Label>
            
            {/* Attachment type selector */}
            {!attachmentType && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setAttachmentType('images')}
                  disabled={imageCount >= 6}
                  className={`p-4 border-2 border-gray-700 rounded-lg transition-colors text-center ${
                    imageCount >= 6 ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary'
                  }`}
                >
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-secondary" />
                  <p className="text-sm">{t('attachmentTypes.images')}</p>
                  {imageCount > 0 && <p className="text-xs text-gray-400 mt-1">{imageCount}/6</p>}
                </button>
                <button
                  onClick={() => setAttachmentType('pdf')}
                  disabled={hasPdf}
                  className={`p-4 border-2 border-gray-700 rounded-lg transition-colors text-center ${
                    hasPdf ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary'
                  }`}
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 text-secondary" />
                  <p className="text-sm">{t('attachmentTypes.pdf')}</p>
                </button>
                <button
                  onClick={() => setAttachmentType('video')}
                  disabled={hasVideo}
                  className={`p-4 border-2 border-gray-700 rounded-lg transition-colors text-center ${
                    hasVideo ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary'
                  }`}
                >
                  <Video className="w-8 h-8 mx-auto mb-2 text-secondary" />
                  <p className="text-sm">{t('attachmentTypes.video')}</p>
                </button>
              </div>
            )}

            {/* Image upload */}
            {attachmentType === 'images' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    {t('attachmentLimits.images')}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachmentType(null)}
                  >
                    <X size={16} />
                  </Button>
                </div>
                
                <label className="w-full p-8 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors">
                  <Upload size={32} className="text-gray-500 mb-2" />
                  <span className="text-sm text-gray-400">{t('selectImages')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageSelect(e.target.files)}
                  />
                </label>
              </div>
            )}

            {/* PDF upload */}
            {attachmentType === 'pdf' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    {t('attachmentLimits.pdf')}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachmentType(null)}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <label className="w-full p-8 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors">
                  <FileText size={32} className="text-gray-500 mb-2" />
                  <span className="text-sm text-gray-400">{t('selectPdf')}</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handlePdfSelect(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}

            {/* Video URL */}
            {attachmentType === 'video' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">{t('videoUrlLabel')}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachmentType(null)}
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={t('videoUrlPlaceholder')}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Button
                    onClick={handleVideoAdd}
                    disabled={!extractVideoInfo(videoUrl)}
                  >
                    <Link size={16} className="mr-2" />
                    {t('add')}
                  </Button>
                </div>
              </div>
            )}

            {/* Selected attachments */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">{t('selected')}:</p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="relative group">
                      {attachment.type === 'IMAGE' && attachment.previewUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-700">
                          <Image
                            src={attachment.previewUrl}
                            alt="Preview"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {attachment.type === 'DOCUMENT' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
                          <FileText size={20} className="text-red-400" />
                          <span className="text-sm truncate max-w-[150px]">
                            {attachment.file?.name}
                          </span>
                        </div>
                      )}
                      
                      {attachment.type === 'VIDEO' && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
                          <Video size={20} className="text-green-400" />
                          <span className="text-sm">
                            {attachment.videoInfo?.provider === 'youtube' ? 'YouTube' : 'Vimeo'}
                          </span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => removeAttachment(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {t('confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
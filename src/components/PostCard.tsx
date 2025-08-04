// src/components/PostCard.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  Eye,
  Calendar,
  User,
  Hash,
  BookOpen,
  Layers,
  GraduationCap,
  Play,
  FileText,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Flag,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import ReactionsButton, {
  ReactionType,
} from '@/components/ReactionsButton';
import { cn } from '@/lib/utils';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  country?: string;
  profession?: string;
}

interface Attachment {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  mimeType: string;
  sizeInBytes: number;
  fileName: string;
  uploadedAt?: string;
  // Video-specific fields at root level
  provider?: 'youtube' | 'vimeo';
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  // Legacy support for nested videoInfo
  videoInfo?: {
    provider: 'youtube' | 'vimeo';
    videoId: string;
    embedUrl: string;
    thumbnailUrl: string;
  };
}

interface Post {
  id: string;
  type: 'GENERAL_TOPIC' | 'LESSON_COMMENT';
  title: string;
  content: string;
  slug?: string;
  author: Author;
  authorId?: string;
  lessonId?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  viewCount?: number;
  replyCount?: number;
  reactions?: {
    LOVE: number;
    LIKE: number;
    SURPRISE: number;
    CLAP: number;
    SAD: number;
    userReactions: ReactionType[];
  };
  hashtags?: string[];
  attachments?: Attachment[];
  course?: {
    id: string;
    title: string;
  };
  module?: {
    id: string;
    title: string;
  };
  lesson?: {
    id: string;
    title: string;
  };
  isPinned?: boolean;
  replies?: Post[];
}

interface PostCardProps {
  post: Post;
  onReaction?: (
    postId: string,
    reaction: ReactionType | null
  ) => void;
  onClick?: () => void;
  compactVideo?: boolean;
  compactImages?: boolean;
}

export default function PostCard({
  post,
  onReaction,
  onClick,
  compactVideo = false,
  compactImages = false,
}: PostCardProps) {
  const t = useTranslations('Community');
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const formatDate = useCallback(
    (date: Date | string) => {
      const dateObj =
        typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - dateObj.getTime()) /
          (1000 * 60 * 60)
      );

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(
          (now.getTime() - dateObj.getTime()) / (1000 * 60)
        );
        return t('timeAgo', { time: `${diffInMinutes} min` });
      }
      if (diffInHours < 24)
        return t('timeAgo', { time: `${diffInHours}h` });
      if (diffInHours < 48) return t('yesterday');
      return dateObj.toLocaleDateString();
    },
    [t]
  );

  // Helper to fix attachment URLs
  const fixAttachmentUrl = (url: string, type: 'IMAGE' | 'VIDEO' | 'DOCUMENT') => {
    // If the URL contains /uploads/attachments/, replace it with the correct path
    if (type === 'IMAGE') {
      return url.replace('/uploads/attachments/', '/uploads/images/');
    } else if (type === 'DOCUMENT') {
      return url.replace('/uploads/attachments/', '/uploads/documents/');
    }
    return url;
  };

  // Filter attachments by type
  const imageAttachments =
    post.attachments?.filter(a => a.type === 'IMAGE') || [];
  const videoAttachment = post.attachments?.find(
    a => a.type === 'VIDEO'
  );
  const documentAttachment = post.attachments?.find(
    a => a.type === 'DOCUMENT'
  );

  // Render image gallery
  const renderImageGallery = () => {
    if (imageAttachments.length === 0) return null;

    if (imageAttachments.length === 1) {
      return (
        <div 
          className={`relative rounded-lg overflow-hidden mb-4 bg-black/5 cursor-pointer ${
            compactImages ? 'w-full max-w-2xl' : 'w-full'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImage(fixAttachmentUrl(imageAttachments[0].url, 'IMAGE'));
            setSelectedImageIndex(0);
          }}
        >
          <Image
            src={fixAttachmentUrl(imageAttachments[0].url, 'IMAGE')}
            alt={imageAttachments[0].fileName}
            width={800}
            height={600}
            className={`w-full h-auto ${
              compactImages ? 'max-h-[400px]' : 'max-h-[600px]'
            } object-contain`}
          />
        </div>
      );
    }

    if (imageAttachments.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {imageAttachments.map((img, idx) => (
            <div
              key={img.id}
              className="relative h-[300px] rounded-lg overflow-hidden cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(fixAttachmentUrl(img.url, 'IMAGE'));
                setSelectedImageIndex(idx);
              }}
            >
              <Image
                src={fixAttachmentUrl(img.url, 'IMAGE')}
                alt={img.fileName}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      );
    }

    if (imageAttachments.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div 
            className="relative h-[400px] rounded-lg overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(fixAttachmentUrl(imageAttachments[0].url, 'IMAGE'));
              setSelectedImageIndex(0);
            }}
          >
            <Image
              src={fixAttachmentUrl(imageAttachments[0].url, 'IMAGE')}
              alt={imageAttachments[0].fileName}
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-2">
            {imageAttachments.slice(1).map((img, index) => (
              <div
                key={img.id}
                className="relative h-[196px] rounded-lg overflow-hidden cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(fixAttachmentUrl(img.url, 'IMAGE'));
                  setSelectedImageIndex(index + 1);
                }}
              >
                <Image
                  src={fixAttachmentUrl(img.url, 'IMAGE')}
                  alt={img.fileName}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (imageAttachments.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {imageAttachments.map((img, idx) => (
            <div
              key={img.id}
              className="relative h-[200px] rounded-lg overflow-hidden cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(fixAttachmentUrl(img.url, 'IMAGE'));
                setSelectedImageIndex(idx);
              }}
            >
              <Image
                src={fixAttachmentUrl(img.url, 'IMAGE')}
                alt={img.fileName}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      );
    }

    if (imageAttachments.length === 5) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="space-y-2">
            {imageAttachments.slice(0, 2).map((img, index) => (
              <div
                key={img.id}
                className="relative h-[199px] rounded-lg overflow-hidden cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(fixAttachmentUrl(img.url, 'IMAGE'));
                  setSelectedImageIndex(index);
                }}
              >
                <Image
                  src={fixAttachmentUrl(img.url, 'IMAGE')}
                  alt={img.fileName}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-rows-3 gap-2">
            {imageAttachments.slice(2, 5).map((img, index) => (
              <div
                key={img.id}
                className="relative h-[130px] rounded-lg overflow-hidden cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(fixAttachmentUrl(img.url, 'IMAGE'));
                  setSelectedImageIndex(index + 2);
                }}
              >
                <Image
                  src={fixAttachmentUrl(img.url, 'IMAGE')}
                  alt={img.fileName}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 6 or more images
    return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="col-span-2 grid grid-cols-2 gap-2">
          {imageAttachments.slice(0, 4).map((img, idx) => (
            <div
              key={img.id}
              className="relative h-[200px] rounded-lg overflow-hidden cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(fixAttachmentUrl(img.url, 'IMAGE'));
                setSelectedImageIndex(idx);
              }}
            >
              <Image
                src={fixAttachmentUrl(img.url, 'IMAGE')}
                alt={img.fileName}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {imageAttachments.slice(4, 6).map((img, index) => (
            <div
              key={img.id}
              className="relative h-[200px] rounded-lg overflow-hidden cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(fixAttachmentUrl(img.url, 'IMAGE'));
                setSelectedImageIndex(index + 4);
              }}
            >
              <Image
                src={fixAttachmentUrl(img.url, 'IMAGE')}
                alt={img.fileName}
                fill
                className="object-cover"
              />
              {index === 1 && imageAttachments.length > 6 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                  <p className="text-white text-3xl font-bold">
                    +{imageAttachments.length - 6}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render video embed
  const renderVideoEmbed = () => {
    if (!videoAttachment) return null;

    // Check for video info at root level first, then nested
    const embedUrl = videoAttachment.embedUrl || videoAttachment.videoInfo?.embedUrl;
    
    if (embedUrl) {
      if (compactVideo) {
        return (
          <div className="relative w-full max-w-2xl h-64 mb-4">
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      
      return (
        <div className="relative w-full h-0 pb-[56.25%] mb-4">
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Fallback for non-embedded videos
    return (
      <a
        href={videoAttachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 bg-primary/30 rounded-lg border border-gray-700 hover:bg-primary/50 transition-colors mb-4"
        onClick={e => e.stopPropagation()}
      >
        <Play size={24} className="text-secondary" />
        <div className="flex-1">
          <p className="text-white font-medium">
            {videoAttachment.fileName}
          </p>
          <p className="text-gray-500 text-sm">
            Clique para assistir
          </p>
        </div>
        <ExternalLink size={16} className="text-gray-400" />
      </a>
    );
  };

  // Render PDF attachment
  const renderPdfAttachment = () => {
    if (!documentAttachment) return null;

    return (
      <a
        href={fixAttachmentUrl(documentAttachment.url, 'DOCUMENT')}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-4 bg-primary/30 rounded-lg border border-gray-700 hover:bg-primary/50 transition-colors mb-4"
        onClick={e => e.stopPropagation()}
      >
        <Image
          src="/icons/pdf.svg"
          alt="PDF"
          width={32}
          height={32}
          className="text-red-500"
        />
        <div className="flex-1">
          <p className="text-white font-medium">
            {documentAttachment.fileName}
          </p>
          <p className="text-gray-500 text-sm">
            {(
              documentAttachment.sizeInBytes /
              1024 /
              1024
            ).toFixed(2)}{' '}
            MB
          </p>
        </div>
        <ExternalLink size={16} className="text-gray-400" />
      </a>
    );
  };

  return (
    <>
    <Card
      className={cn(
        'group relative p-6 bg-primary-dark/50 border-gray-700',
        'hover:bg-primary-dark/70 hover:shadow-xl hover:shadow-secondary/10',
        'transition-all duration-300',
        onClick && 'cursor-pointer',
        post.isPinned &&
          'border-secondary ring-2 ring-secondary/20'
      )}
      onClick={onClick}
    >
      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-lg" />

      <div className="relative">
        {/* Post Header */}
        <div className="flex items-center gap-2 mb-2">
          {post.isPinned && (
            <Badge
              variant="secondary"
              className="bg-secondary/20 text-secondary border-secondary/30"
            >
              {t('pinned')}
            </Badge>
          )}
          <h3 className="text-xl font-semibold text-white group-hover:text-secondary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-secondary/20">
            <Image
              src={
                post.author.avatar || '/icons/avatar.svg'
              }
              alt={post.author.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {post.author.name}
              </span>
              {post.author.profession && (
                <>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-500 text-sm">
                    {post.author.profession}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              <span>
                {isHydrated
                  ? formatDate(post.createdAt)
                  : ''}
              </span>
              {post.author.city && post.author.country && (
                <>
                  <span>·</span>
                  <span>
                    {post.author.city},{' '}
                    {post.author.country}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-300 mb-4 whitespace-pre-wrap">
          {post.content}
        </p>

        {/* Attachments */}
        {renderImageGallery()}
        {renderVideoEmbed()}
        {renderPdfAttachment()}

        {/* Course/Module/Lesson Info */}
        {(post.course || post.module || post.lesson) && (
          <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
            {post.course && (
              <div className="flex items-center gap-1">
                <BookOpen
                  size={14}
                  className="text-secondary"
                />
                <span>{post.course.title}</span>
              </div>
            )}
            {post.module && (
              <div className="flex items-center gap-1">
                <Layers
                  size={14}
                  className="text-secondary"
                />
                <span>{post.module.title}</span>
              </div>
            )}
            {post.lesson && (
              <div className="flex items-center gap-1">
                <GraduationCap
                  size={14}
                  className="text-secondary"
                />
                <span>{post.lesson.title}</span>
              </div>
            )}
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.hashtags.map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs border-gray-600 text-gray-400 hover:border-secondary hover:text-secondary transition-colors"
              >
                <Hash size={10} className="mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-800">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            {post.viewCount !== undefined && (
              <div className="flex items-center gap-1">
                <Eye size={16} className="text-gray-600" />
                <span>{post.viewCount}</span>
              </div>
            )}
            {post.replyCount !== undefined && (
              <div className="flex items-center gap-1">
                <MessageSquare
                  size={16}
                  className="text-gray-600"
                />
                <span>{post.replyCount}</span>
              </div>
            )}
          </div>

          {/* Actions and Reactions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            {/* Reply Button */}
              {/* Reply Button */}
              <button
                className="text-gray-500 hover:text-secondary text-sm px-3 py-1 rounded-md hover:bg-primary/30 transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Reply to:', post.id);
                }}
              >
                <MessageSquare size={14} />
                Responder
              </button>
              
              {/* Report Button */}
              <button
                className="text-gray-500 hover:text-red-400 text-sm px-3 py-1 rounded-md hover:bg-red-400/10 transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Report post:', post.id);
                }}
              >
                <Flag size={14} />
                Denunciar
              </button>
            </div>

            {/* Reactions */}
            {post.reactions && onReaction && (
              <div className="relative ml-auto">
                <ReactionsButton
                reactions={[
                  {
                    type: 'LOVE' as ReactionType,
                    emoji: '❤️',
                    count: post.reactions.LOVE,
                    hasReacted: post.reactions.userReactions.includes('LOVE'),
                  },
                  {
                    type: 'LIKE' as ReactionType,
                    emoji: '👍',
                    count: post.reactions.LIKE,
                    hasReacted: post.reactions.userReactions.includes('LIKE'),
                  },
                  {
                    type: 'SURPRISE' as ReactionType,
                    emoji: '😮',
                    count: post.reactions.SURPRISE,
                    hasReacted: post.reactions.userReactions.includes('SURPRISE'),
                  },
                  {
                    type: 'CLAP' as ReactionType,
                    emoji: '👏',
                    count: post.reactions.CLAP,
                    hasReacted: post.reactions.userReactions.includes('CLAP'),
                  },
                  {
                    type: 'SAD' as ReactionType,
                    emoji: '😢',
                    count: post.reactions.SAD,
                    hasReacted: post.reactions.userReactions.includes('SAD'),
                  },
                ]}
                onReact={(type: ReactionType) =>
                  onReaction(post.id, type)
                }
              />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>

    {/* Replies */}
    {post.replies && post.replies.length > 0 && (
      <div className="ml-8 mt-4 space-y-3 border-l-2 border-gray-700 pl-4">
        {post.replies.map((reply) => (
          <PostCard
            key={reply.id}
            post={reply}
            onReaction={onReaction}
            onClick={onClick}
            compactVideo={compactVideo}
            compactImages={compactImages}
          />
        ))}
      </div>
    )}

    {/* Image Viewer Modal */}
    {selectedImage && (
      <div 
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={() => setSelectedImage(null)}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImage(null);
          }}
        >
          <X size={24} />
        </Button>

        {/* Navigation buttons */}
        {imageAttachments.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : imageAttachments.length - 1;
                setSelectedImageIndex(newIndex);
                setSelectedImage(fixAttachmentUrl(imageAttachments[newIndex].url, 'IMAGE'));
              }}
            >
              <ChevronLeft size={24} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = selectedImageIndex < imageAttachments.length - 1 ? selectedImageIndex + 1 : 0;
                setSelectedImageIndex(newIndex);
                setSelectedImage(fixAttachmentUrl(imageAttachments[newIndex].url, 'IMAGE'));
              }}
            >
              <ChevronRight size={24} />
            </Button>
          </>
        )}

        {/* Image */}
        <div className="relative max-w-[90vw] max-h-[90vh]">
          <Image
            src={selectedImage}
            alt={`Image ${selectedImageIndex + 1}`}
            width={1200}
            height={800}
            className="w-auto h-auto max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Image counter */}
        {imageAttachments.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full">
            {selectedImageIndex + 1} / {imageAttachments.length}
          </div>
        )}
      </div>
    )}
    </>
  );
}

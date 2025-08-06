'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  Calendar,
  Flag,
} from 'lucide-react';
import Image from 'next/image';
import ReactionsButton, {
  ReactionType,
} from '@/components/ReactionsButton';
import { RoleBadge } from '@/components/ui/role-badge';
import { cn } from '@/lib/utils';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  country?: string;
  profession?: string;
  role?: 'student' | 'admin' | 'tutor';
}

interface Reply {
  id: string;
  content: string;
  author: Author;
  createdAt: string | Date;
  updatedAt?: string | Date;
  reactions?: {
    LOVE: number;
    LIKE: number;
    SURPRISE: number;
    CLAP: number;
    SAD: number;
    userReactions: ReactionType[];
  };
  attachments?: Array<{
    id: string;
    url: string;
    type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    fileName: string;
  }>;
}

interface ReplyCardProps {
  reply: Reply;
  onReaction?: (replyId: string, reaction: ReactionType | null) => void;
  onReply?: (replyId: string, author: Author) => void;
  depth?: number;
  canReply?: boolean;
}

export default function ReplyCard({
  reply,
  onReaction,
  onReply,
  depth = 0,
  canReply = true,
}: ReplyCardProps) {
  const t = useTranslations('Community');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const formatDate = useCallback(
    (date: Date | string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)
      );

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(
          (now.getTime() - dateObj.getTime()) / (1000 * 60)
        );
        return t('timeAgo', { time: `${diffInMinutes} min` });
      }
      if (diffInHours < 24) return t('timeAgo', { time: `${diffInHours}h` });
      if (diffInHours < 48) return t('yesterday');
      return dateObj.toLocaleDateString();
    },
    [t]
  );

  return (
    <div className="relative">
      {/* Connection Line */}
      <div className="absolute -left-12 md:-left-20 top-0 bottom-0 w-px bg-gradient-to-b from-secondary/30 via-secondary/20 to-transparent">
        <div className="absolute top-5 -left-1.5 w-3 h-3 bg-secondary/30 rounded-full border-2 border-primary-dark" />
      </div>
      
      {/* Reply Card */}
      <div
        className={cn(
          'group relative rounded-lg p-2.5 overflow-hidden',
          'bg-gradient-to-br from-primary-dark/30 via-primary-dark/20 to-secondary/10',
          'hover:from-primary-dark/40 hover:via-primary-dark/30 hover:to-secondary/20',
          'transition-all duration-300',
          'border-l-2 border-secondary/30',
          depth > 0 && 'ml-6 mt-2'
        )}
      >
      {/* Gradient Accent Effect */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-secondary/15 to-transparent rounded-tl-full pointer-events-none" />
      
      {/* Content Container */}
      <div className="relative z-10">
        {/* Reply Header - More Compact */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar - Smaller */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
            <Image
              src={reply.author.avatar || '/icons/avatar.svg'}
              alt={reply.author.name}
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>

          {/* Author Info - Inline */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white text-sm">
                {reply.author.name}
              </span>
              {reply.author.role && (
                <RoleBadge role={reply.author.role} className="scale-90" />
              )}
              <span className="text-gray-500 text-xs">·</span>
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Calendar size={10} />
                {isHydrated ? formatDate(reply.createdAt) : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Content - No title for replies */}
        <div className="text-gray-300 text-sm mb-3">
          {reply.content}
        </div>

        {/* Attachments - Compact */}
        {reply.attachments && reply.attachments.length > 0 && (
          <div className="mb-3">
            {reply.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-secondary hover:text-secondary/80 transition-colors"
              >
                {attachment.type === 'IMAGE' && '🖼️'}
                {attachment.type === 'VIDEO' && '🎥'}
                {attachment.type === 'DOCUMENT' && '📄'}
                {attachment.fileName}
              </a>
            ))}
          </div>
        )}

        {/* Footer with Actions and Reactions */}
        <div className="pt-3 border-t border-gray-800">
          <div className="flex items-center justify-between">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {canReply && (
                <button
                  className="text-gray-500 hover:text-secondary text-xs px-2 py-1 rounded-md hover:bg-primary/30 transition-colors flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onReply) {
                      onReply(reply.id, reply.author);
                    }
                  }}
                >
                  <MessageSquare size={12} />
                  <span className="hidden sm:inline">Responder</span>
                </button>
              )}
              <button
                className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Report reply:', reply.id);
                }}
              >
                <Flag size={12} />
                <span className="hidden sm:inline">Denunciar</span>
              </button>
            </div>

            {/* Reactions - Compact */}
            {reply.reactions && onReaction && (
              <div className="relative ml-auto">
                <ReactionsButton
              reactions={[
                {
                  type: 'LOVE' as ReactionType,
                  emoji: '❤️',
                  count: reply.reactions.LOVE,
                  hasReacted: reply.reactions.userReactions.includes('LOVE'),
                },
                {
                  type: 'LIKE' as ReactionType,
                  emoji: '👍',
                  count: reply.reactions.LIKE,
                  hasReacted: reply.reactions.userReactions.includes('LIKE'),
                },
                {
                  type: 'SURPRISE' as ReactionType,
                  emoji: '😮',
                  count: reply.reactions.SURPRISE,
                  hasReacted: reply.reactions.userReactions.includes('SURPRISE'),
                },
                {
                  type: 'CLAP' as ReactionType,
                  emoji: '👏',
                  count: reply.reactions.CLAP,
                  hasReacted: reply.reactions.userReactions.includes('CLAP'),
                },
                {
                  type: 'SAD' as ReactionType,
                  emoji: '😢',
                  count: reply.reactions.SAD,
                  hasReacted: reply.reactions.userReactions.includes('SAD'),
                },
              ]}
                  postId={reply.id}
                  onReact={(type: ReactionType) => onReaction(reply.id, type)}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
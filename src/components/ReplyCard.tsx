'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  Calendar,
  Flag,
  Ban,
  Pencil,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import ReactionsButton, {
  ReactionType,
} from '@/components/ReactionsButton';
import { RoleBadge } from '@/components/ui/role-badge';
import { cn } from '@/lib/utils';
import { ModerationControls } from '@/components/ui/moderation-controls';
import { useAuth } from '@/stores/auth.store';
import ReportModal from '@/components/ReportModal';
import EditCommentModal from '@/components/EditCommentModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  profileImageUrl?: string;
  city?: string;
  country?: string;
  profession?: string;
  specialization?: string;
  bio?: string;
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
  replies?: Reply[]; // Add support for nested replies
  // Moderation fields
  isBlocked?: boolean;
  blockedReason?: string;
}

interface ReplyCardProps {
  reply: Reply;
  onReaction?: (replyId: string, reaction: ReactionType | null) => void;
  onReply?: (replyId: string, author: Author) => void;
  onUpdate?: () => void;
  depth?: number;
  canReply?: boolean;
}

export default function ReplyCard({
  reply,
  onReaction,
  onReply,
  onUpdate,
  depth = 0,
  canReply = true,
}: ReplyCardProps) {
  const t = useTranslations('Community');
  const { user } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // REGRA DE VISIBILIDADE: Students não veem comentários bloqueados
  if (reply.isBlocked && user?.role === 'student') {
    return null; // Não renderiza nada para students
  }

  return (
    <div className="relative">
      {/* Connection Line */}
      <div className="absolute -left-12 md:-left-20 top-0 bottom-0 w-px bg-gradient-to-b from-secondary/30 via-secondary/20 to-transparent">
        <div className="absolute top-5 -left-1.5 w-3 h-3 bg-secondary/30 rounded-full border-2 border-primary-dark" />
      </div>
      
      {/* Reply Card */}
      <div
        className={cn(
          'group relative rounded-lg p-2.5',
          'bg-gradient-to-br from-primary-dark/30 via-primary-dark/20 to-secondary/10',
          'hover:from-primary-dark/40 hover:via-primary-dark/30 hover:to-secondary/20',
          'transition-all duration-300',
          'border-l-2 border-secondary/30',
          depth > 0 && 'ml-6 mt-2',
          // Admin/Tutor veem com opacidade reduzida
          reply.isBlocked && (user?.role === 'admin' || user?.role === 'tutor') && 
            'opacity-50 bg-red-50/5'
        )}
      >
      {/* Gradient Accent Effect */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-secondary/15 to-transparent rounded-tl-full pointer-events-none" />
      
      {/* Content Container */}
      <div className="relative z-10">
        {/* Indicador de bloqueio apenas para admin/tutor */}
        {reply.isBlocked && (user?.role === 'admin' || user?.role === 'tutor') && (
          <div className="bg-red-900/20 text-red-400 p-2 rounded mb-2 border border-red-800/30">
            <div className="flex items-start gap-1.5">
              <Ban size={12} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-medium">Comentário bloqueado</div>
                {reply.blockedReason && (
                  <div className="text-xs text-red-300/80 mt-0.5">
                    {reply.blockedReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reply Header - More Compact */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1">
          {/* Avatar - Smaller with tooltip */}
          <div className="relative group overflow-visible">
            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
              <Image
                src={reply.author.profileImageUrl || reply.author.avatar || '/icons/avatar.svg'}
                alt={reply.author.name}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            </div>
            
            {/* Tooltip with bio and specialization - positioned to the left */}
            {(reply.author.bio || reply.author.specialization) && (
              <div className="absolute right-full mr-2 top-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none" style={{ zIndex: 999999 }}>
                <div className="bg-gray-900 text-white p-3 rounded-lg shadow-2xl max-w-xs min-w-[200px] border border-gray-700">
                  <div className="font-semibold text-white mb-1">
                    {reply.author.name}
                  </div>
                  {reply.author.specialization && (
                    <div className="text-xs text-secondary mb-2">
                      {reply.author.specialization}
                    </div>
                  )}
                  {reply.author.bio && (
                    <div className="text-sm text-gray-300">
                      {reply.author.bio}
                    </div>
                  )}
                  <div className="absolute -right-1 top-3 w-2 h-2 bg-gray-900 rotate-45 border-r border-t border-gray-700"></div>
                </div>
              </div>
            )}
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
              {(reply.author.profession || reply.author.specialization) && (
                <>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-400 text-xs">
                    {[reply.author.profession, reply.author.specialization]
                      .filter(Boolean)
                      .join(' - ')}
                  </span>
                </>
              )}
              {(reply.author.city || reply.author.country) && (
                <>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-400 text-xs">
                    {[reply.author.city, reply.author.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </>
              )}
              <span className="text-gray-500 text-xs">·</span>
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Calendar size={10} />
                {isHydrated ? formatDate(reply.createdAt) : ''}
              </span>
            </div>
          </div>
          </div>

          {/* Controles de Moderação - APENAS BLOQUEIO para comentários */}
          <div onClick={(e) => e.stopPropagation()}>
            <ModerationControls
              item={{
                id: reply.id,
                content: reply.content,
                isBlocked: reply.isBlocked
              }}
              type="comment" // Não terá botão de editar por ser comment
              size="xs"
              onUpdate={() => {
                console.log('♻️ Atualizando comentário após bloqueio/desbloqueio:', reply.id);
                onUpdate?.();
              }}
            />
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
              {/* Edit Button - only for comment author */}
              {user?.id === reply.author.id && (
                <button
                  className="text-gray-500 hover:text-blue-400 text-xs px-2 py-1 rounded-md hover:bg-blue-400/10 transition-colors flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEditModal(true);
                  }}
                >
                  <Pencil size={12} />
                  <span className="hidden sm:inline">{t('editAction')}</span>
                </button>
              )}
              
              {/* Delete Button - for comment author or admin */}
              {(user?.id === reply.author.id || user?.role === 'admin') && (
                <button
                  className="text-gray-500 hover:text-red-500 text-xs px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 size={12} />
                  <span className="hidden sm:inline">{t('deleteAction')}</span>
                </button>
              )}
              
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
                  <span className="hidden sm:inline">{t('replyAction')}</span>
                </button>
              )}
              <button
                className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReportModal(true);
                }}
              >
                <Flag size={12} />
                <span className="hidden sm:inline">{t('reportAction')}</span>
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
                  onReact={(type) => onReaction(reply.id, type)}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
    {/* Nested Replies */}
    {reply.replies && reply.replies.length > 0 && (
      <div className="ml-8 mt-2 space-y-2">
        {reply.replies.map((nestedReply) => {
          // Aplicar mesma regra de visibilidade
          if (nestedReply.isBlocked && user?.role === 'student') {
            return null;
          }

          return (
            <ReplyCard
              key={nestedReply.id}
              reply={nestedReply}
              onReaction={onReaction}
              onReply={onReply}
              onUpdate={onUpdate}
              depth={(depth || 0) + 1}
              canReply={false} // Don't allow replies beyond second level (as per API spec)
            />
          );
        })}
      </div>
    )}

    {/* Report Modal */}
    <ReportModal
      isOpen={showReportModal}
      onClose={() => setShowReportModal(false)}
      itemId={reply.id}
      itemType="comment"
      itemTitle={reply.content.substring(0, 100)}
      onSuccess={() => {
        console.log('✅ Comment reported successfully');
        setShowReportModal(false);
      }}
    />

    {/* Edit Comment Modal */}
    <EditCommentModal
      open={showEditModal}
      onClose={() => setShowEditModal(false)}
      comment={{
        id: reply.id,
        content: reply.content,
        authorId: reply.author.id,
      }}
      onCommentUpdated={() => {
        onUpdate?.();
      }}
    />

    {/* Delete Confirmation Modal */}
    <DeleteConfirmationModal
      open={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      itemType="comment"
      itemId={reply.id}
      itemTitle={reply.content.substring(0, 100)}
      onDeleted={() => {
        onUpdate?.();
      }}
    />
    </div>
  );
}
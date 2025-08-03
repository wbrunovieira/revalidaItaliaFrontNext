//src/components/LessonComments.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Send, Reply, MoreVertical, Flag, User, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import ReactionsButton, { ReactionType } from './ReactionsButton';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  country?: string;
  profession?: string;
}

interface CommentReactions {
  heart: number;
  thumbsUp: number;
  surprised: number;
  clap: number;
  sad: number;
  userReactions: ReactionType[];
}

interface Comment {
  id: string;
  content: string;
  author: Author;
  createdAt: Date;
  updatedAt: Date;
  reactions: CommentReactions;
  parentId?: string;
  replies?: Comment[];
  lessonId: string;
  courseId?: string;
  moduleId?: string;
}

// Mock data
const mockComments: Comment[] = [
  {
    id: '1',
    content: 'Excelente aula! A explicação sobre o sistema cardiovascular ficou muito clara. Alguém tem alguma dica para memorizar os nomes das artérias?',
    author: {
      id: '1',
      name: 'Maria Silva',
      avatar: undefined,
      city: 'Roma',
      country: 'Itália',
      profession: 'Médica'
    },
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
    reactions: {
      heart: 3,
      thumbsUp: 2,
      surprised: 0,
      clap: 0,
      sad: 0,
      userReactions: []
    },
    lessonId: 'current',
    replies: [
      {
        id: '1-1',
        content: 'Eu uso mnemônicos! Por exemplo, para as artérias do pescoço, criei uma frase que me ajuda muito. Posso compartilhar se quiser!',
        author: {
          id: '2',
          name: 'Giovanni Rossi',
          avatar: undefined,
          city: 'Milão',
          country: 'Itália',
          profession: 'Estudante de Medicina'
        },
        createdAt: new Date('2024-01-15T11:30:00'),
        updatedAt: new Date('2024-01-15T11:30:00'),
        reactions: {
          heart: 1,
          thumbsUp: 1,
          surprised: 0,
          clap: 0,
          sad: 0,
          userReactions: ['thumbsUp']
        },
        parentId: '1',
        lessonId: 'current'
      }
    ]
  },
  {
    id: '2',
    content: 'Alguém mais teve dificuldade com a parte sobre o ciclo cardíaco? Acho que vou assistir novamente.',
    author: {
      id: '3',
      name: 'Lucia Bianchi',
      avatar: undefined,
      city: 'Nápoles',
      country: 'Itália',
      profession: 'Cardiologista'
    },
    createdAt: new Date('2024-01-14T15:30:00'),
    updatedAt: new Date('2024-01-14T15:30:00'),
    reactions: {
      heart: 2,
      thumbsUp: 1,
      surprised: 0,
      clap: 0,
      sad: 0,
      userReactions: []
    },
    lessonId: 'current'
  }
];

interface LessonCommentsProps {
  lessonId: string;
  courseId: string;
  moduleId: string;
  locale: string;
}

export default function LessonComments({ lessonId, courseId, moduleId, locale }: LessonCommentsProps) {
  const t = useTranslations('LessonComments');
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [replyAttachedFiles, setReplyAttachedFiles] = useState<{ [key: string]: File[] }>({});

  // Get locale for date formatting
  const dateLocale = locale === 'pt' ? ptBR : locale === 'it' ? it : es;

  // Format date
  const formatDate = useCallback((date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: dateLocale 
    });
  }, [dateLocale]);

  // Handle file attachment
  const handleFileAttachment = useCallback((files: FileList | null, isReply: boolean = false, replyId?: string) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    
    if (isReply && replyId) {
      setReplyAttachedFiles(prev => ({
        ...prev,
        [replyId]: [...(prev[replyId] || []), ...newFiles]
      }));
    } else {
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  // Remove attached file
  const removeFile = useCallback((index: number, isReply: boolean = false, replyId?: string) => {
    if (isReply && replyId) {
      setReplyAttachedFiles(prev => ({
        ...prev,
        [replyId]: prev[replyId].filter((_, i) => i !== index)
      }));
    } else {
      setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    }
  }, []);

  // Handle reaction
  const handleReaction = useCallback((commentId: string, reactionType: ReactionType) => {
    setComments(prevComments => {
      const updateComment = (comment: Comment): Comment => {
        if (comment.id === commentId) {
          const userReactions = [...comment.reactions.userReactions];
          const hasReaction = userReactions.includes(reactionType);
          
          if (hasReaction) {
            // Remove reaction
            const index = userReactions.indexOf(reactionType);
            userReactions.splice(index, 1);
          } else {
            // Add reaction
            userReactions.push(reactionType);
          }
          
          return {
            ...comment,
            reactions: {
              ...comment.reactions,
              [reactionType]: hasReaction 
                ? comment.reactions[reactionType] - 1 
                : comment.reactions[reactionType] + 1,
              userReactions
            }
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(updateComment)
          };
        }
        return comment;
      };
      
      return prevComments.map(updateComment);
    });
  }, []);

  // Handle submit new comment
  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    
    // Mock API call
    setTimeout(() => {
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        content: newComment,
        author: {
          id: 'current-user',
          name: 'Current User',
          avatar: undefined,
          city: 'São Paulo',
          country: 'Brasil',
          profession: 'Médico'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        reactions: {
          heart: 0,
          thumbsUp: 0,
          surprised: 0,
          clap: 0,
          sad: 0,
          userReactions: []
        },
        lessonId: lessonId,
        courseId: courseId,
        moduleId: moduleId
      };

      setComments([newCommentObj, ...comments]);
      setNewComment('');
      setAttachedFiles([]);
      setIsLoading(false);
    }, 500);
  }, [newComment, comments, lessonId, courseId, moduleId]);

  // Handle submit reply
  const handleSubmitReply = useCallback(async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsLoading(true);
    
    // Mock API call
    setTimeout(() => {
      const newReply: Comment = {
        id: Date.now().toString(),
        content: replyContent,
        author: {
          id: 'current-user',
          name: 'Current User',
          avatar: undefined,
          city: 'São Paulo',
          country: 'Brasil',
          profession: 'Médico'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        reactions: {
          heart: 0,
          thumbsUp: 0,
          surprised: 0,
          clap: 0,
          sad: 0,
          userReactions: []
        },
        parentId: parentId,
        lessonId: lessonId
      };

      setComments(prevComments => {
        const addReply = (comment: Comment): Comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(addReply)
            };
          }
          return comment;
        };
        
        return prevComments.map(addReply);
      });

      setReplyContent('');
      setReplyingTo(null);
      setReplyAttachedFiles(prev => {
        const newState = { ...prev };
        delete newState[parentId];
        return newState;
      });
      setIsLoading(false);
    }, 500);
  }, [replyContent, lessonId]);

  return (
    <div className="w-full bg-primary-dark/50 border-t border-gray-700">
      <div className="lg:flex">
        <div className="flex-1 lg:ml-4 p-6">
          <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <MessageSquare size={24} className="text-secondary" />
            {t('title')}
          </h3>
          <p className="text-gray-400 text-sm">
            {t('description')}
          </p>
        </div>

            {/* New Comment Form */}
            <div className="mb-8">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
              <Image
                src="/icons/avatar.svg"
                alt="Your avatar"
                width={40}
                height={40}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1">
              <div className="relative">
                <Textarea
                  placeholder={t('placeholder')}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-primary-dark/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-secondary focus:ring-secondary min-h-[100px] pr-12"
                />
                <input
                  type="file"
                  id="comment-file-input"
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileAttachment(e.target.files)}
                />
                <label
                  htmlFor="comment-file-input"
                  className="absolute bottom-2 right-2 p-2 text-gray-500 hover:text-secondary hover:bg-primary-dark/50 rounded-lg cursor-pointer transition-all duration-200"
                  title={t('attachFile')}
                >
                  <Paperclip size={18} />
                </label>
              </div>
              
              {/* Attached files preview */}
              {attachedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-400 bg-primary-dark/30 rounded px-2 py-1">
                      <Paperclip size={12} />
                      <span className="flex-1 truncate">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {attachedFiles.length > 0 && t('filesAttached', { count: attachedFiles.length })}
                </span>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isLoading}
                  className="bg-secondary hover:bg-secondary/90 text-white font-semibold"
                >
                  <Send size={16} className="mr-2" />
                  {t('submit')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="bg-primary-dark/30 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                {/* Comment Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
                    <Image
                      src={comment.author.avatar || '/icons/avatar.svg'}
                      alt={comment.author.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white hover:text-secondary cursor-pointer transition-colors">
                          {comment.author.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {comment.author.profession} • {comment.author.city}, {comment.author.country}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-700 rounded">
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment Content */}
                <div className="ml-13">
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    {comment.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <ReactionsButton
                      reactions={[
                        { type: 'heart', emoji: '❤️', count: comment.reactions.heart, hasReacted: comment.reactions.userReactions.includes('heart') },
                        { type: 'thumbsUp', emoji: '👍', count: comment.reactions.thumbsUp, hasReacted: comment.reactions.userReactions.includes('thumbsUp') },
                        { type: 'surprised', emoji: '😮', count: comment.reactions.surprised, hasReacted: comment.reactions.userReactions.includes('surprised') },
                        { type: 'clap', emoji: '👏', count: comment.reactions.clap, hasReacted: comment.reactions.userReactions.includes('clap') },
                        { type: 'sad', emoji: '😢', count: comment.reactions.sad, hasReacted: comment.reactions.userReactions.includes('sad') }
                      ]}
                      onReact={(type) => handleReaction(comment.id, type)}
                      size="sm"
                    />
                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-secondary transition-colors"
                    >
                      <Reply size={16} />
                      <span>{t('reply')}</span>
                    </button>
                    <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-400 transition-colors">
                      <Flag size={16} />
                      <span>{t('report')}</span>
                    </button>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
                          <Image
                            src="/icons/avatar.svg"
                            alt="Your avatar"
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <Textarea
                              placeholder={t('replyPlaceholder')}
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="bg-primary-dark/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-secondary focus:ring-secondary min-h-[80px] text-sm pr-10"
                            />
                            <input
                              type="file"
                              id={`reply-file-input-${comment.id}`}
                              className="hidden"
                              multiple
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={(e) => handleFileAttachment(e.target.files, true, comment.id)}
                            />
                            <label
                              htmlFor={`reply-file-input-${comment.id}`}
                              className="absolute bottom-2 right-2 p-1.5 text-gray-500 hover:text-secondary hover:bg-primary-dark/50 rounded cursor-pointer transition-all duration-200"
                              title={t('attachFile')}
                            >
                              <Paperclip size={14} />
                            </label>
                          </div>
                          
                          {/* Attached files preview for reply */}
                          {replyAttachedFiles[comment.id]?.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {replyAttachedFiles[comment.id].map((file, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs text-gray-400 bg-primary-dark/30 rounded px-2 py-1">
                                  <Paperclip size={10} />
                                  <span className="flex-1 truncate">{file.name}</span>
                                  <button
                                    onClick={() => removeFile(index, true, comment.id)}
                                    className="text-gray-500 hover:text-red-400 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-2 flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                              className="text-gray-400 hover:text-white"
                            >
                              {t('cancel')}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!replyContent.trim() || isLoading}
                              className="bg-secondary hover:bg-secondary/90 text-white"
                            >
                              {t('submitReply')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3 border-l-2 border-gray-700 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="group/reply">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary/20 flex-shrink-0">
                              <Image
                                src={reply.author.avatar || '/icons/avatar.svg'}
                                alt={reply.author.name}
                                width={32}
                                height={32}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-medium text-white text-sm hover:text-secondary cursor-pointer transition-colors">
                                  {reply.author.name}
                                </h5>
                                <span className="text-xs text-gray-500">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                {reply.content}
                              </p>
                              <div className="flex items-center gap-3">
                                <ReactionsButton
                                  reactions={[
                                    { type: 'heart', emoji: '❤️', count: reply.reactions.heart, hasReacted: reply.reactions.userReactions.includes('heart') },
                                    { type: 'thumbsUp', emoji: '👍', count: reply.reactions.thumbsUp, hasReacted: reply.reactions.userReactions.includes('thumbsUp') },
                                    { type: 'surprised', emoji: '😮', count: reply.reactions.surprised, hasReacted: reply.reactions.userReactions.includes('surprised') },
                                    { type: 'clap', emoji: '👏', count: reply.reactions.clap, hasReacted: reply.reactions.userReactions.includes('clap') },
                                    { type: 'sad', emoji: '😢', count: reply.reactions.sad, hasReacted: reply.reactions.userReactions.includes('sad') }
                                  ]}
                                  onReact={(type) => handleReaction(reply.id, type)}
                                  size="sm"
                                />
                                <button
                                  onClick={() => setReplyingTo(reply.id)}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-secondary transition-colors"
                                >
                                  <Reply size={14} />
                                  <span>{t('reply')}</span>
                                </button>
                                <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors">
                                  <Flag size={14} />
                                  <span>{t('report')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {comments.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">{t('noComments')}</h3>
            <p className="text-gray-400">{t('beFirst')}</p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
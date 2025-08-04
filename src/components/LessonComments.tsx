//src/components/LessonComments.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Plus, Send, Paperclip, X, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { ReactionType } from './ReactionsButton';
import { useToast } from '@/hooks/use-toast';
import AttachmentsModal, { AttachmentData } from '@/components/AttachmentsModal';
import PostCard from '@/components/PostCard';

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

interface Attachment {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  mimeType: string;
  sizeInBytes: number;
  fileName: string;
  uploadedAt?: string;
  provider?: 'youtube' | 'vimeo';
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

interface Comment {
  id: string;
  type: 'LESSON_COMMENT';
  title: string;
  content: string;
  slug?: string;
  author: Author;
  authorId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  reactions: CommentReactions;
  parentId?: string;
  replies?: Comment[];
  lessonId: string;
  courseId?: string;
  moduleId?: string;
  viewCount?: number;
  replyCount?: number;
  attachments?: Attachment[];
  hashtags?: string[];
}

// Mock data
const mockComments: Comment[] = [
  {
    id: '1',
    type: 'LESSON_COMMENT',
    title: '',
    content: 'Excelente aula! A explicação sobre o sistema cardiovascular ficou muito clara. Alguém tem alguma dica para memorizar os nomes das artérias?',
    author: {
      id: '1',
      name: 'Maria Silva',
      avatar: undefined,
      city: 'Roma',
      country: 'Itália',
      profession: 'Médica'
    },
    authorId: '1',
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
    replyCount: 1,
    viewCount: 25,
    attachments: []
  },
  {
    id: '2',
    type: 'LESSON_COMMENT',
    title: '',
    content: 'Alguém mais teve dificuldade com a parte sobre o ciclo cardíaco? Acho que vou assistir novamente.',
    author: {
      id: '3',
      name: 'Lucia Bianchi',
      avatar: undefined,
      city: 'Nápoles',
      country: 'Itália',
      profession: 'Cardiologista'
    },
    authorId: '3',
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
    lessonId: 'current',
    viewCount: 15,
    replyCount: 0,
    attachments: []
  }
];

interface LessonCommentsProps {
  lessonId: string;
  courseId: string;
  moduleId: string;
  locale: string;
  lessonTitle?: string;
}

export default function LessonComments({ lessonId, courseId, moduleId }: LessonCommentsProps) {
  const t = useTranslations('LessonComments');
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [currentUser, setCurrentUser] = useState<Author | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<AttachmentData[]>([]);

  // Decode JWT to get user ID
  const decodeJWT = useCallback((token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }, []);

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) return;

        const decodedToken = decodeJWT(token);
        const userId = decodedToken?.sub;

        if (!userId) {
          console.error('User ID not found in token');
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const userData = data.user;
          
          // Try to fetch address data if available
          let addressData = null;
          try {
            const addressResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/addresses?userId=${userData.id}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (addressResponse.ok) {
              const addresses = await addressResponse.json();
              if (addresses.length > 0) {
                addressData = addresses[0]; // Use first address
              }
            }
          } catch (error) {
            console.log('Could not fetch address data:', error);
          }
          
          // Set user data with available fields
          setCurrentUser({
            id: userData.id,
            name: userData.name,
            avatar: userData.profileImageUrl,
            city: addressData?.city || userData.city,
            country: addressData?.country || userData.country,
            profession: userData.profession
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [decodeJWT]);

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
        return comment;
      };
      
      return prevComments.map(updateComment);
    });
  }, []);

  // Handle submit simple comment (text only)
  const handleSubmitSimpleComment = useCallback(async () => {
    if (!newComment.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];
      
      if (!token) {
        throw new Error(t('errors.unauthorized'));
      }

      // Upload attachments first
      // Using a simpler type for API payload (without id)
      const uploadedAttachments: Array<{
        url: string;
        type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
        mimeType: string;
        sizeInBytes: number;
        fileName: string;
      }> = [];
      
      for (const attachment of selectedAttachments) {
        if (attachment.type === 'IMAGE' && attachment.file) {
          const formData = new FormData();
          formData.append('file', attachment.file);
          formData.append('category', 'image');
          formData.append('folder', 'posts');

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const result = await uploadResponse.json();
            uploadedAttachments.push({
              url: result.url.replace(/^\/uploads\/(images|documents)\//, '/uploads/attachments/'),
              type: 'IMAGE',
              mimeType: attachment.file.type,
              sizeInBytes: attachment.file.size,
              fileName: attachment.file.name
            });
          }
        } else if (attachment.type === 'DOCUMENT' && attachment.file) {
          const formData = new FormData();
          formData.append('file', attachment.file);
          formData.append('category', 'document');
          formData.append('folder', 'posts');

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const result = await uploadResponse.json();
            uploadedAttachments.push({
              url: result.url.replace(/^\/uploads\/(images|documents)\//, '/uploads/attachments/'),
              type: 'DOCUMENT',
              mimeType: attachment.file.type,
              sizeInBytes: attachment.file.size,
              fileName: attachment.file.name
            });
          }
        } else if (attachment.type === 'VIDEO' && attachment.videoUrl && attachment.videoInfo) {
          uploadedAttachments.push({
            url: attachment.videoUrl,
            type: 'VIDEO',
            mimeType: 'video/external',
            sizeInBytes: 0,
            fileName: `${attachment.videoInfo.provider}-${attachment.videoInfo.videoId}.mp4`
          });
        }
      }

      const requestBody: any = {
        type: 'LESSON_COMMENT',
        content: newComment.trim(),
        lessonId: lessonId,
      };

      // Only add hashtags if there are any
      if (selectedHashtags.length > 0) {
        requestBody.hashtags = selectedHashtags;
      }

      // Only add attachments if there are any uploaded
      if (uploadedAttachments.length > 0) {
        requestBody.attachments = uploadedAttachments;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.detail || t('errors.createFailed'));
      }

      const newCommentObj: Comment = {
        id: data.post.id,
        type: 'LESSON_COMMENT',
        title: '',
        content: data.post.content,
        slug: data.post.slug,
        author: currentUser || {
          id: data.post.authorId,
          name: 'Usuário',
          avatar: undefined
        },
        authorId: data.post.authorId,
        createdAt: new Date(data.post.createdAt),
        updatedAt: new Date(data.post.updatedAt || data.post.createdAt),
        reactions: data.post.reactions || {
          heart: 0,
          thumbsUp: 0,
          surprised: 0,
          clap: 0,
          sad: 0,
          userReactions: []
        },
        lessonId: lessonId,
        courseId: courseId,
        moduleId: moduleId,
        viewCount: data.post.viewCount || 0,
        replyCount: 0,
        attachments: data.attachments || [], // Using data.attachments like CreatePostModal
        hashtags: data.hashtags || [] // Using data.hashtags like CreatePostModal
      };

      setComments([newCommentObj, ...comments]);
      setNewComment('');
      setSelectedHashtags([]);
      setSelectedAttachments([]);
      
      toast({
        title: t('success'),
        description: t('successDescription'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('errors.createFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [newComment, comments, lessonId, courseId, moduleId, currentUser, t, toast, isLoading, selectedHashtags, selectedAttachments]);

  // Handle attachments modal confirmation
  const handleAttachmentsConfirm = useCallback((hashtags: string[], attachments: AttachmentData[]) => {
    console.log('Attachments from modal:', attachments);
    setSelectedHashtags(hashtags);
    setSelectedAttachments(attachments);
    setIsCreateModalOpen(false);
  }, []);

  return (
    <div className="w-full bg-primary-dark/50 border-t border-gray-700">
      <div className="lg:flex">
        <div className="flex-1 lg:ml-4 p-6">
          <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <MessageSquare size={24} className="text-secondary" />
                  {t('title')}
                </h3>
                <p className="text-gray-400 text-sm">
                  {t('description')}
                </p>
              </div>
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
                  <Textarea
                    placeholder={t('placeholder')}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-primary-dark/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-secondary focus:ring-secondary min-h-[100px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitSimpleComment();
                      }
                    }}
                  />
                  
                  {/* Attachments preview */}
                  {selectedAttachments.length > 0 && (
                    <div className="mt-3 mb-3">
                      <div className="flex flex-wrap gap-2">
                        {selectedAttachments.map((attachment, index) => {
                          // Image attachments
                          if (attachment.type === 'IMAGE' && attachment.previewUrl) {
                            return (
                              <div key={index} className="relative group">
                                <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-700">
                                  <Image
                                    src={attachment.previewUrl}
                                    alt={attachment.file?.name || 'Image'}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  onClick={() => setSelectedAttachments(prev => prev.filter((_, i) => i !== index))}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} className="text-white" />
                                </button>
                              </div>
                            );
                          }
                          
                          // PDF attachments
                          if (attachment.type === 'DOCUMENT' && attachment.file) {
                            return (
                              <div key={index} className="relative group">
                                <div className="flex items-center gap-2 px-3 py-2 bg-primary-dark/50 rounded-lg border border-gray-700">
                                  <FileText size={20} className="text-red-400" />
                                  <span className="text-sm text-gray-300 max-w-[150px] truncate">
                                    {attachment.file.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setSelectedAttachments(prev => prev.filter((_, i) => i !== index))}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} className="text-white" />
                                </button>
                              </div>
                            );
                          }
                          
                          // Video attachments
                          if (attachment.type === 'VIDEO' && attachment.videoInfo) {
                            return (
                              <div key={index} className="relative group">
                                <div className="flex items-center gap-2 px-3 py-2 bg-primary-dark/50 rounded-lg border border-gray-700">
                                  <Video size={20} className="text-green-400" />
                                  <span className="text-sm text-gray-300">
                                    {attachment.videoInfo.provider === 'youtube' ? 'YouTube' : 'Vimeo'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setSelectedAttachments(prev => prev.filter((_, i) => i !== index))}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} className="text-white" />
                                </button>
                              </div>
                            );
                          }
                          
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-gray-500 hover:text-secondary"
                      >
                        <Paperclip size={16} className="mr-2" />
                        {t('addAttachment')}
                      </Button>
                      {selectedHashtags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {selectedHashtags.map((tag) => (
                            <span key={tag} className="text-xs text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleSubmitSimpleComment}
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
                <PostCard
                  key={comment.id}
                  post={comment}
                  onReaction={(postId, reaction) => {
                    if (reaction) {
                      handleReaction(postId, reaction);
                    }
                  }}
                />
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

      {/* Attachments Modal */}
      <AttachmentsModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleAttachmentsConfirm}
        initialHashtags={selectedHashtags}
        initialAttachments={selectedAttachments}
      />
    </div>
  );
}
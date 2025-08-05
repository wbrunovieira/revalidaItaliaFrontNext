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
import CreateCommentModal from '@/components/CreateCommentModal';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  city?: string;
  country?: string;
  profession?: string;
}

interface CommentReactions {
  LOVE: number;
  LIKE: number;
  SURPRISE: number;
  CLAP: number;
  SAD: number;
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<Author | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [selectedAttachments, setSelectedAttachments] = useState<AttachmentData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [replyingToPost, setReplyingToPost] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: Author } | null>(null);

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
                  'Authorization': `Bearer ${token}`,
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

  // Fetch comments from API
  const fetchComments = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setIsLoadingComments(true);
      }
      setError(null);

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        setError('Unauthorized');
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        lessonId: lessonId,
        type: 'LESSON_COMMENT'
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();

      // Transform API response to match our Comment interface
      const transformedComments: Comment[] = await Promise.all(
        data.posts.map(async (post: any) => {
          // Fetch comments for each post
          let replies = [];
          try {
            const commentsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${post.id}/comments`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            
            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              // Transform comments to match our interface
              replies = commentsData.comments.filter((c: any) => c.isTopLevelComment).map((comment: any) => ({
                id: comment.id,
                content: comment.content,
                author: {
                  id: comment.author.id,
                  name: comment.author.fullName,
                  avatar: comment.author.profileImageUrl,
                  role: comment.author.role
                },
                createdAt: new Date(comment.createdAt),
                updatedAt: new Date(comment.updatedAt),
                reactions: {
                  LOVE: comment.reactions?.heart || 0,
                  LIKE: comment.reactions?.thumbsUp || 0,
                  SURPRISE: comment.reactions?.surprised || 0,
                  CLAP: comment.reactions?.clap || 0,
                  SAD: comment.reactions?.sad || 0,
                  userReactions: comment.reactions?.userReactions || []
                },
                parentId: comment.parentId,
                replies: comment.replies?.map((reply: any) => ({
                  id: reply.id,
                  content: reply.content,
                  author: {
                    id: reply.author.id,
                    name: reply.author.fullName,
                    avatar: reply.author.profileImageUrl,
                    role: reply.author.role
                  },
                  createdAt: new Date(reply.createdAt),
                  updatedAt: new Date(reply.updatedAt),
                  reactions: {
                    LOVE: reply.reactions?.heart || 0,
                    LIKE: reply.reactions?.thumbsUp || 0,
                    SURPRISE: reply.reactions?.surprised || 0,
                    CLAP: reply.reactions?.clap || 0,
                    SAD: reply.reactions?.sad || 0,
                    userReactions: reply.reactions?.userReactions || []
                  },
                  parentId: reply.parentId
                }))
              }));
            }
          } catch (error) {
            console.error('Error fetching comments for post:', post.id, error);
          }

          return {
            id: post.id,
            type: 'LESSON_COMMENT',
            title: post.title || '',
            content: post.content,
            slug: post.slug,
            author: post.author || {
              id: post.authorId,
              name: 'Unknown User',
              avatar: undefined,
              city: '',
              country: '',
              profession: ''
            },
            authorId: post.authorId,
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt),
            reactions: {
              LOVE: post.reactions?.LOVE || post.reactions?.heart || 0,
              LIKE: post.reactions?.LIKE || post.reactions?.thumbsUp || 0,
              SURPRISE: post.reactions?.SURPRISE || post.reactions?.surprised || 0,
              CLAP: post.reactions?.CLAP || post.reactions?.clap || 0,
              SAD: post.reactions?.SAD || post.reactions?.sad || 0,
              userReactions: post.reactions?.userReactions || []
            },
            lessonId: lessonId,
            courseId: courseId,
            moduleId: moduleId,
            viewCount: post.viewCount || 0,
            replyCount: replies.length,
            attachments: post.attachments || [],
            hashtags: post.hashtags || [],
            replies: replies
          };
        })
      );

      if (append) {
        setComments(prev => [...prev, ...transformedComments]);
      } else {
        console.log('Setting comments with replies:', transformedComments);
        setComments(transformedComments);
      }
      
      setCurrentPage(data.pagination.page);
      setHasMore(data.pagination.hasNext);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(error instanceof Error ? error.message : 'Failed to load comments');
      // Use mock data as fallback if not appending
      if (!append) {
        setComments(mockComments);
      }
    } finally {
      setIsLoadingComments(false);
    }
  }, [lessonId, courseId, moduleId]);

  // Fetch comments on component mount
  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  // Handle reaction
  const handleReaction = useCallback(async (commentId: string, reactionType: ReactionType | null) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        console.error('No authentication token found');
        return;
      }

      // Find the current reaction to remove
      const comment = comments.find(c => c.id === commentId);
      if (!comment) return;

      const currentReaction = comment.reactions.userReactions[0]; // User can only have one reaction
      
      // If trying to add the same reaction that already exists, remove it
      if (reactionType === currentReaction) {
        reactionType = null;
      }

      console.log('Sending reaction request:', { commentId, reactionType, currentReaction });

      // Make API call
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${commentId}/reactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: reactionType || currentReaction, // Send current reaction if removing
          }),
        }
      );

      const data = await response.json();
      console.log('Reaction API response:', data);

      if (!response.ok) {
        console.error('Failed to update reaction:', data);
        return;
      }

      // Update local state optimistically
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            const newReactions = { ...comment.reactions };
            
            // Remove old reaction count
            if (currentReaction) {
              newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
            }
            
            // Add new reaction count
            if (reactionType) {
              newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
              newReactions.userReactions = [reactionType];
            } else {
              newReactions.userReactions = [];
            }

            return {
              ...comment,
              reactions: newReactions,
            };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  }, [comments]);

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
          LOVE: 0,
          LIKE: 0,
          SURPRISE: 0,
          CLAP: 0,
          SAD: 0,
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

      // Refresh comments from API to get the new comment with all data
      fetchComments(1);
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

  // Handle comment creation from modal
  const handleCommentCreated = useCallback((newComment: any) => {
    console.log('Comment created:', newComment);
    
    // Add the comment directly to the post's replies
    if (replyingToPost) {
      setComments(prevComments =>
        prevComments.map(post => {
          if (post.id === replyingToPost) {
            return {
              ...post,
              replies: [...(post.replies || []), {
                id: newComment.id,
                content: newComment.content,
                author: newComment.author,
                createdAt: newComment.createdAt,
                updatedAt: newComment.updatedAt,
                reactions: newComment.reactions,
                parentId: newComment.parentId
              }],
              replyCount: (post.replyCount || 0) + 1
            };
          }
          return post;
        })
      );
    }
  }, [replyingToPost]);

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

            {/* Loading State */}
            {isLoadingComments && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoadingComments && (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">{error}</p>
                <Button 
                  onClick={() => fetchComments(currentPage)}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-primary/50"
                >
                  {t('retry')}
                </Button>
              </div>
            )}

            {/* Comments List */}
            {!isLoadingComments && !error && (
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
                    onReply={(postId) => {
                      console.log('Reply button clicked for post:', postId);
                      setReplyingToPost(postId);
                      setReplyingTo(null);
                      setIsCommentModalOpen(true);
                    }}
                    compactVideo={true}
                    compactImages={true}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {!isLoadingComments && !error && hasMore && comments.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => fetchComments(currentPage + 1, true)}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-primary/50"
                >
                  {t('loadMore')}
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingComments && !error && comments.length === 0 && (
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

      {/* Comment Modal */}
      {replyingToPost && (
        <CreateCommentModal
          open={isCommentModalOpen}
          onClose={() => {
            setIsCommentModalOpen(false);
            setReplyingToPost(null);
            setReplyingTo(null);
          }}
          postId={replyingToPost}
          parentId={replyingTo?.id}
          parentAuthor={replyingTo?.author}
          onCommentCreated={handleCommentCreated}
        />
      )}
    </div>
  );
}
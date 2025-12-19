//src/components/LessonComments.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Send, Paperclip, X, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { ReactionType } from './ReactionsButton';
import { useToast } from '@/hooks/use-toast';
import AttachmentsModal, { AttachmentData } from '@/components/AttachmentsModal';
import PostCard from '@/components/PostCard';
import CreateCommentModal from '@/components/CreateCommentModal';
import { useAuth } from '@/stores/auth.store';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  profileImageUrl?: string;
  city?: string;
  country?: string;
  profession?: string;
  role?: 'student' | 'admin' | 'tutor' | 'document_analyst';
}

interface ReactionCounts {
  heart?: number;
  thumbsUp?: number;
  surprised?: number;
  clap?: number;
  sad?: number;
  LOVE?: number;
  LIKE?: number;
  SURPRISE?: number;
  CLAP?: number;
  SAD?: number;
  userReactions?: ReactionType[];
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
  isPinned?: boolean;
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
      LOVE: 3,
      LIKE: 2,
      SURPRISE: 0,
      CLAP: 0,
      SAD: 0,
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
      LOVE: 2,
      LIKE: 1,
      SURPRISE: 0,
      CLAP: 0,
      SAD: 0,
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

  // Get auth data from Auth Store
  const { token, user, isAuthenticated } = useAuth();

  // Set current user from Auth Store
  useEffect(() => {
    if (user) {
      setCurrentUser({
        id: user.id,
        name: user.name,
        avatar: user.profileImageUrl,
        city: undefined, // Address data not available in Auth Store
        country: undefined,
        profession: undefined
      });
    }
  }, [user]);

  // Fetch comments from API
  const fetchComments = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) {
        setIsLoadingComments(true);
      }
      setError(null);

      if (!token || !isAuthenticated) {
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
        data.posts.map(async (post: Record<string, unknown>) => {
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
              replies = commentsData.comments.filter((c: Record<string, unknown>) => c.isTopLevelComment).map((comment: Record<string, unknown>) => ({
                id: comment.id,
                content: comment.content,
                author: {
                  id: (comment.author as Record<string, unknown>).id,
                  name: (comment.author as Record<string, unknown>).fullName,
                  avatar: (comment.author as Record<string, unknown>).profileImageUrl,
                  profileImageUrl: (comment.author as Record<string, unknown>).profileImageUrl,
                  role: (comment.author as Record<string, unknown>).role
                },
                createdAt: new Date(comment.createdAt as string),
                updatedAt: new Date(comment.updatedAt as string),
                reactions: {
                  LOVE: (comment.reactions as ReactionCounts)?.heart || 0,
                  LIKE: (comment.reactions as ReactionCounts)?.thumbsUp || 0,
                  SURPRISE: (comment.reactions as ReactionCounts)?.surprised || 0,
                  CLAP: (comment.reactions as ReactionCounts)?.clap || 0,
                  SAD: (comment.reactions as ReactionCounts)?.sad || 0,
                  userReactions: (comment.reactions as ReactionCounts)?.userReactions || []
                },
                parentId: comment.parentId,
                replies: (comment.replies as Record<string, unknown>[] | undefined)?.map((reply: Record<string, unknown>) => ({
                  id: reply.id,
                  content: reply.content,
                  author: {
                    id: (reply.author as Record<string, unknown>).id,
                    name: (reply.author as Record<string, unknown>).fullName,
                    avatar: (reply.author as Record<string, unknown>).profileImageUrl,
                    profileImageUrl: (reply.author as Record<string, unknown>).profileImageUrl,
                    role: (reply.author as Record<string, unknown>).role
                  },
                  createdAt: new Date(reply.createdAt as string),
                  updatedAt: new Date(reply.updatedAt as string),
                  reactions: {
                    LOVE: (reply.reactions as ReactionCounts)?.heart || 0,
                    LIKE: (reply.reactions as ReactionCounts)?.thumbsUp || 0,
                    SURPRISE: (reply.reactions as ReactionCounts)?.surprised || 0,
                    CLAP: (reply.reactions as ReactionCounts)?.clap || 0,
                    SAD: (reply.reactions as ReactionCounts)?.sad || 0,
                    userReactions: (reply.reactions as ReactionCounts)?.userReactions || []
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
            title: (post.title as string) || '',
            content: post.content as string,
            slug: post.slug as string | undefined,
            author: (post.author as Author) || {
              id: post.authorId as string,
              name: 'Unknown User',
              avatar: undefined,
              city: '',
              country: '',
              profession: ''
            },
            authorId: post.authorId as string,
            createdAt: new Date(post.createdAt as string),
            updatedAt: new Date(post.updatedAt as string),
            reactions: {
              LOVE: (post.reactions as ReactionCounts)?.LOVE || (post.reactions as ReactionCounts)?.heart || 0,
              LIKE: (post.reactions as ReactionCounts)?.LIKE || (post.reactions as ReactionCounts)?.thumbsUp || 0,
              SURPRISE: (post.reactions as ReactionCounts)?.SURPRISE || (post.reactions as ReactionCounts)?.surprised || 0,
              CLAP: (post.reactions as ReactionCounts)?.CLAP || (post.reactions as ReactionCounts)?.clap || 0,
              SAD: (post.reactions as ReactionCounts)?.SAD || (post.reactions as ReactionCounts)?.sad || 0,
              userReactions: (post.reactions as ReactionCounts)?.userReactions || []
            },
            lessonId: lessonId,
            courseId: courseId,
            moduleId: moduleId,
            viewCount: (post.viewCount as number) || 0,
            replyCount: replies.length,
            attachments: (post.attachments as Attachment[]) || [],
            hashtags: (post.hashtags as string[]) || [],
            replies: replies,
            isPinned: (post.isPinned as boolean) || false
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
  }, [lessonId, courseId, moduleId, token, isAuthenticated]);

  // Fetch comments on component mount
  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  // Handle post reaction (lesson posts)
  const handleReaction = useCallback(async (commentId: string, reactionType: ReactionType | null) => {
    try {
      if (!token || !isAuthenticated) {
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
  }, [comments, token, isAuthenticated]);

  // Handle comment reaction
  const handleCommentReaction = useCallback(async (commentId: string, reactionType: ReactionType | null) => {
    try {
      if (!token || !isAuthenticated) {
        console.error('No authentication token found');
        return;
      }

      // Find the comment in all posts
      let currentReaction: ReactionType | null = null;
      let foundInPost: Comment | null = null;
      
      for (const post of comments) {
        if (post.replies) {
          const reply = post.replies.find(r => r.id === commentId);
          if (reply) {
            currentReaction = reply.reactions.userReactions[0] || null;
            foundInPost = post;
            break;
          }
          // Check nested replies
          for (const reply of post.replies) {
            if (reply.replies) {
              const nestedReply = reply.replies.find(r => r.id === commentId);
              if (nestedReply) {
                currentReaction = nestedReply.reactions.userReactions[0] || null;
                foundInPost = post;
                break;
              }
            }
          }
          if (foundInPost) break;
        }
      }

      if (!foundInPost) {
        console.error('Comment not found');
        return;
      }
      
      // If trying to add the same reaction that already exists, skip
      if (reactionType === currentReaction) {
        return;
      }

      // Make API call using the new endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/comments/${commentId}/reactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reactionType: reactionType, // API expects reactionType field
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to update comment reaction:', data);
        return;
      }

      // Update local state optimistically
      setComments(prevComments =>
        prevComments.map(post => {
          if (post.id !== foundInPost.id) return post;
          
          // Update the replies
          const updatedReplies = post.replies?.map(reply => {
            if (reply.id === commentId) {
              const newReactions = { ...reply.reactions };
              
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
                ...reply,
                reactions: newReactions,
              };
            }
            
            // Check nested replies
            if (reply.replies) {
              const updatedNestedReplies = reply.replies.map(nestedReply => {
                if (nestedReply.id === commentId) {
                  const newReactions = { ...nestedReply.reactions };
                  
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
                    ...nestedReply,
                    reactions: newReactions,
                  };
                }
                return nestedReply;
              });
              
              return {
                ...reply,
                replies: updatedNestedReplies,
              };
            }
            
            return reply;
          });

          return {
            ...post,
            replies: updatedReplies,
          };
        })
      );
    } catch (error) {
      console.error('Error updating comment reaction:', error);
    }
  }, [comments, token, isAuthenticated]);

  // Handle submit simple comment (text only)
  const handleSubmitSimpleComment = useCallback(async () => {
    if (!newComment.trim() || isLoading) return;

    setIsLoading(true);
    try {
      if (!token || !isAuthenticated) {
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

      const requestBody: {
        type: string;
        content: string;
        lessonId: string;
        hashtags?: string[];
        attachments?: Array<{
          url: string;
          type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
          mimeType: string;
          sizeInBytes: number;
          fileName: string;
        }>;
      } = {
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
      
      // Use newCommentObj if needed
      console.log('Created comment:', newCommentObj);
      
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
  }, [newComment, lessonId, courseId, moduleId, currentUser, t, toast, isLoading, selectedHashtags, selectedAttachments, fetchComments, isAuthenticated, token]);

  // Handle attachments modal confirmation
  const handleAttachmentsConfirm = useCallback((hashtags: string[], attachments: AttachmentData[]) => {
    console.log('Attachments from modal:', attachments);
    setSelectedHashtags(hashtags);
    setSelectedAttachments(attachments);
    setIsCreateModalOpen(false);
  }, []);

  // Handle reply to comment
  const handleReplyToComment = useCallback((commentId: string, author: Author) => {
    // Find the post that contains this comment
    const post = comments.find(c => 
      c.id === commentId || c.replies?.some(r => r.id === commentId)
    );
    
    if (post) {
      setReplyingToPost(post.id);
      setReplyingTo({ id: commentId, author });
      setIsCommentModalOpen(true);
    }
  }, [comments]);

  // Handle comment creation from modal
  const handleCommentCreated = useCallback((newComment: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    reactions: {
      LOVE: number;
      LIKE: number;
      SURPRISE: number;
      CLAP: number;
      SAD: number;
      userReactions: string[];
    };
    parentId?: string;
  }) => {
    console.log('Comment created:', newComment);
    
    // Add the comment to the appropriate location
    if (replyingToPost) {
      setComments(prevComments =>
        prevComments.map(post => {
          if (post.id === replyingToPost) {
            // Check if this is a reply to a comment or a top-level comment
            if (newComment.parentId && replyingTo) {
              // This is a reply to an existing comment
              const updatedReplies = post.replies?.map(reply => {
                if (reply.id === newComment.parentId) {
                  // Add the new reply to this comment's replies
                  return {
                    ...reply,
                    replies: [...(reply.replies || []), {
                      id: newComment.id,
                      type: 'LESSON_COMMENT' as const,
                      title: '',
                      content: newComment.content,
                      author: newComment.author as Author,
                      createdAt: newComment.createdAt,
                      updatedAt: newComment.updatedAt,
                      reactions: {
                        ...newComment.reactions,
                        userReactions: newComment.reactions.userReactions as ReactionType[]
                      },
                      parentId: newComment.parentId,
                      lessonId: post.lessonId,
                      courseId: post.courseId,
                      moduleId: post.moduleId,
                      viewCount: 0,
                      replyCount: 0,
                      attachments: [],
                      hashtags: []
                    }],
                    replyCount: (reply.replyCount || 0) + 1
                  };
                }
                return reply;
              }) || [];
              
              return {
                ...post,
                replies: updatedReplies,
                replyCount: (post.replyCount || 0) + 1
              };
            } else {
              // This is a top-level comment on the post
              return {
                ...post,
                replies: [...(post.replies || []), {
                  id: newComment.id,
                  type: 'LESSON_COMMENT' as const,
                  title: '',
                  content: newComment.content,
                  author: newComment.author as Author,
                  createdAt: newComment.createdAt,
                  updatedAt: newComment.updatedAt,
                  reactions: {
                    ...newComment.reactions,
                    userReactions: newComment.reactions.userReactions as ReactionType[]
                  },
                  parentId: newComment.parentId,
                  lessonId: post.lessonId,
                  courseId: post.courseId,
                  moduleId: post.moduleId,
                  viewCount: 0,
                  replyCount: 0,
                  attachments: [],
                  hashtags: [],
                  replies: []
                }],
                replyCount: (post.replyCount || 0) + 1
              };
            }
          }
          return post;
        })
      );
    }
  }, [replyingToPost, replyingTo]);

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
                    onCommentReaction={(commentId, reaction) => {
                      if (reaction) {
                        handleCommentReaction(commentId, reaction);
                      }
                    }}
                    onReply={(postId) => {
                      console.log('Reply button clicked for post:', postId);
                      setReplyingToPost(postId);
                      setReplyingTo(null);
                      setIsCommentModalOpen(true);
                    }}
                    onReplyToComment={handleReplyToComment}
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
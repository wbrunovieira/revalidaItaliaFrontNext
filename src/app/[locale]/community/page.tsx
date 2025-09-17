// src/app/[locale]/community/page.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import NavSidebar from '@/components/NavSidebar';
import { ReactionType } from '@/components/ReactionsButton';
import CreatePostModal from '@/components/CreatePostModal';
import CreateCommentModal from '@/components/CreateCommentModal';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/stores/auth.store';

// API response types
interface CommentData {
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
}

interface CommunityPost {
  id: string;
  title?: string;
  content: string;
  author?: {
    id: string;
    name: string;
    fullName: string;
    profileImageUrl?: string;
    avatar?: string;
    city?: string;
    country?: string;
    profession?: string;
    specialization?: string;
    bio?: string;
    role: 'student' | 'admin' | 'tutor';
  };
  authorId: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  reactions?: {
    LOVE?: number;
    LIKE?: number;
    SURPRISE?: number;
    CLAP?: number;
    SAD?: number;
    heart?: number;
    thumbsUp?: number;
    surprised?: number;
    clap?: number;
    sad?: number;
    userReactions?: ReactionType[];
  };
  hashtags?: string[];
  course?: { id: string; title: string; };
  module?: { id: string; title: string; };
  lesson?: { id: string; title: string; };
  isPinned?: boolean;
  isBlocked?: boolean; // Campo para indicar se o post está bloqueado
  blockedAt?: string | null; // Data do bloqueio
  blockedReason?: string; // Razão do bloqueio (apenas para admin/tutor)
  attachments?: Array<{
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
  }>;
  mediaType?: string;
}

interface CommunityComment {
  id: string;
  content: string;
  author: {
    id: string;
    fullName: string;
    profileImageUrl?: string;
    role: 'student' | 'admin' | 'tutor';
    city?: string;
    country?: string;
    profession?: string;
    specialization?: string;
    bio?: string;
  };
  createdAt: string;
  updatedAt: string;
  isTopLevelComment: boolean;
  isBlocked?: boolean; // Campo para indicar se o comentário está bloqueado
  blockedReason?: string; // Razão do bloqueio (apenas para admin/tutor)
  reactions?: {
    heart?: number;
    thumbsUp?: number;
    surprised?: number;
    clap?: number;
    sad?: number;
    userReactions?: ReactionType[];
  };
  parentId?: string;
  replies?: CommunityComment[];
}

interface CommentResponse {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    fullName: string;
    avatar?: string;
    profileImageUrl?: string;
    role: 'student' | 'admin' | 'tutor';
    city?: string;
    country?: string;
    profession?: string;
    specialization?: string;
    bio?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  reactions?: {
    LOVE: number;
    LIKE: number;
    SURPRISE: number;
    CLAP: number;
    SAD: number;
    userReactions: ReactionType[];
  };
  parentId?: string;
}

// Mock data types
interface Author {
  id: string;
  name: string;
  avatar?: string;
  profileImageUrl?: string;
  city?: string;
  country?: string;
  profession?: string;
  role?: 'student' | 'admin' | 'tutor';
}

interface Reply {
  id: string;
  content: string;
  author: Author;
  createdAt: Date;
  updatedAt: Date;
  reactions: {
    LOVE: number;
    LIKE: number;
    SURPRISE: number;
    CLAP: number;
    SAD: number;
    userReactions: ReactionType[];
  };
  parentId?: string;
  replies?: Reply[];
  isBlocked?: boolean; // Moderation field
  blockedReason?: string; // Razão do bloqueio
}

interface Topic {
  id: string;
  title: string;
  content: string;
  author: Author;
  authorId?: string; // Adicionar authorId para verificação de permissões
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  replyCount: number;
  reactions: {
    LOVE: number;
    LIKE: number;
    SURPRISE: number;
    CLAP: number;
    SAD: number;
    userReactions: ReactionType[];
  };
  tags: string[];
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
  attachments?: Array<{
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
    videoInfo?: {
      provider: 'youtube' | 'vimeo';
      videoId: string;
      embedUrl: string;
      thumbnailUrl: string;
    };
  }>;
  mediaType?: string;
  replies?: Reply[];
  // Moderation fields
  isBlocked?: boolean;
  blockedAt?: Date | string | null;
  blockedReason?: string;
  wasTitleEdited?: boolean;
  titleEditedBy?: string;
  titleEditedAt?: Date;
}

// Mock data
const mockTopics: Topic[] = [
  {
    id: '1',
    title:
      'Como me preparar para a prova de Medicina Interna?',
    content:
      'Olá pessoal! Estou começando a estudar para a prova de Medicina Interna e gostaria de dicas de quem já passou...',
    author: {
      id: '1',
      name: 'Maria Silva',
      avatar: undefined,
      city: 'Roma',
      country: 'Itália',
      profession: 'Médica',
    },
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
    viewCount: 245,
    replyCount: 12,
    reactions: {
      LOVE: 8,
      LIKE: 15,
      SURPRISE: 2,
      CLAP: 5,
      SAD: 0,
      userReactions: [],
    },
    tags: ['medicina-interna', 'estudos', 'prova'],
    course: {
      id: '1',
      title: 'Medicina Interna',
    },
    module: {
      id: '1',
      title: 'Fundamentos',
    },
    lesson: {
      id: '2',
      title: 'Sistema Cardiovascular',
    },
    isPinned: true,
  },
  {
    id: '2',
    title: 'Experiência com o processo de documentação',
    content:
      'Compartilho aqui minha experiência com a documentação necessária para o processo de revalidação...',
    author: {
      id: '2',
      name: 'Giovanni Rossi',
      avatar: undefined,
      city: 'Milão',
      country: 'Itália',
      profession: 'Cirurgião',
    },
    createdAt: new Date('2024-01-14T15:30:00'),
    updatedAt: new Date('2024-01-14T15:30:00'),
    viewCount: 189,
    replyCount: 8,
    reactions: {
      LOVE: 12,
      LIKE: 20,
      SURPRISE: 3,
      CLAP: 8,
      SAD: 1,
      userReactions: ['LIKE'] as ReactionType[],
    },
    tags: ['documentação', 'burocracia', 'dicas'],
    lesson: {
      id: '1',
      title: 'Processo de Equivalência',
    },
  },
  {
    id: '3',
    title: 'Dúvida sobre equivalência de especialização',
    content:
      'Alguém sabe como funciona a equivalência de especialização em Cardiologia? Preciso fazer nova residência?',
    author: {
      id: '3',
      name: 'Lucia Bianchi',
      avatar: undefined,
      city: 'Nápoles',
      country: 'Itália',
      profession: 'Cardiologista',
    },
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-14T11:20:00'),
    viewCount: 156,
    replyCount: 5,
    reactions: {
      LOVE: 3,
      LIKE: 7,
      SURPRISE: 1,
      CLAP: 2,
      SAD: 0,
      userReactions: [],
    },
    tags: ['especialização', 'cardiologia', 'equivalência'],
    lesson: {
      id: '1',
      title: 'Processo de Equivalência',
    },
  },
];


export default function CommunityPage() {
  const t = useTranslations('Community');
  const { token, user, isAuthenticated } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('recent');
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentingOnPost, setCommentingOnPost] = useState<string | null>(null);
  const [replyingToComment, setReplyingToComment] = useState<{id: string; author: Author} | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Get user data from Auth Store

  // Ensure component is hydrated before rendering dynamic content
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Set current user from Auth Store
  useEffect(() => {
    if (user) {
      setCurrentUser({
        id: user.id,
        name: user.name,
        avatar: user.profileImageUrl,
        city: '', // Address data not available in Auth Store
        country: '',
        profession: '',
        role: user.role
      });
    }
  }, [user]);


  // Fetch posts from API
  const fetchPosts = useCallback(async (page = 1, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
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
      });

      // Add search parameter
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      
      // Transform API response to match our Topic interface
      const transformedPosts: Topic[] = await Promise.all(
        data.posts.map(async (post: CommunityPost) => {
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
              replies = commentsData.comments.filter((c: CommunityComment) => c.isTopLevelComment).map((comment: CommunityComment) => ({
                id: comment.id,
                content: comment.content,
                author: {
                  id: comment.author.id,
                  name: comment.author.fullName,
                  avatar: comment.author.profileImageUrl,
                  profileImageUrl: comment.author.profileImageUrl,
                  city: comment.author.city || '',
                  country: comment.author.country || '',
                  profession: comment.author.profession || '',
                  specialization: comment.author.specialization || '',
                  bio: comment.author.bio || '',
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
                isBlocked: comment.isBlocked || false, // Mapeando campo isBlocked do comentário
                blockedReason: comment.blockedReason, // Razão do bloqueio
                replies: comment.replies?.map((reply: CommunityComment) => ({
                  id: reply.id,
                  content: reply.content,
                  author: {
                    id: reply.author.id,
                    name: reply.author.fullName,
                    avatar: reply.author.profileImageUrl,
                    profileImageUrl: reply.author.profileImageUrl,
                    city: reply.author.city || '',
                    country: reply.author.country || '',
                    profession: reply.author.profession || '',
                    specialization: reply.author.specialization || '',
                    bio: reply.author.bio || '',
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
                  parentId: reply.parentId,
                  isBlocked: reply.isBlocked || false, // Mapeando campo isBlocked das respostas
                  blockedReason: reply.blockedReason // Razão do bloqueio
                }))
              }));
            }
          } catch (error) {
            console.error('Error fetching comments for post:', post.id, error);
          }

          return {
            id: post.id,
            title: post.title || '',
            content: post.content,
            authorId: post.authorId, // IMPORTANTE: Adicionar authorId para comparação de permissões
            author: post.author ? {
              id: post.author.id,
              name: post.author.name,
              avatar: post.author.profileImageUrl || post.author.avatar,
              profileImageUrl: post.author.profileImageUrl,
              city: post.author.city || '',
              country: post.author.country || '',
              profession: post.author.profession || '',
              specialization: post.author.specialization || '', // ADICIONADO
              bio: post.author.bio || '', // ADICIONADO
              role: post.author.role as 'student' | 'admin' | 'tutor' | undefined
            } : {
              id: post.authorId,
              name: 'Unknown User',
              avatar: undefined,
              profileImageUrl: undefined,
              city: '',
              country: '',
              profession: '',
              specialization: '', // ADICIONADO
              bio: '', // ADICIONADO
              role: undefined
            },
            createdAt: new Date(post.createdAt),
            updatedAt: new Date(post.updatedAt),
            viewCount: post.viewCount || 0,
            replyCount: replies.length,
            reactions: {
              LOVE: post.reactions?.LOVE || post.reactions?.heart || 0,
              LIKE: post.reactions?.LIKE || post.reactions?.thumbsUp || 0,
              SURPRISE: post.reactions?.SURPRISE || post.reactions?.surprised || 0,
              CLAP: post.reactions?.CLAP || post.reactions?.clap || 0,
              SAD: post.reactions?.SAD || post.reactions?.sad || 0,
              userReactions: post.reactions?.userReactions || []
            },
            tags: post.hashtags || [],
            course: post.course,
            module: post.module,
            lesson: post.lesson,
            isPinned: post.isPinned || false,
            isBlocked: post.isBlocked || false, // Mapeando campo isBlocked
            blockedAt: post.blockedAt || null, // Data do bloqueio
            blockedReason: post.blockedReason, // Razão do bloqueio
            attachments: post.attachments || [],
            mediaType: post.mediaType,
            replies: replies
          };
        })
      );

      // Sort posts: pinned first (newest pinned first), then unpinned (newest first)
      const sortedPosts = transformedPosts.sort((a, b) => {
        // If both are pinned or both are not pinned, sort by date
        if (a.isPinned === b.isPinned) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Pinned posts come first
        return a.isPinned ? -1 : 1;
      });

      if (append) {
        // When appending, we need to re-sort the entire list to maintain pinned posts at top
        setTopics(prev => {
          const combined = [...prev, ...sortedPosts];
          return combined.sort((a, b) => {
            if (a.isPinned === b.isPinned) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return a.isPinned ? -1 : 1;
          });
        });
      } else {
        setTopics(sortedPosts);
      }
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setHasMore(data.pagination.hasNext);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to load posts');
      // Use mock data as fallback if not appending
      if (!append) {
        setTopics(mockTopics);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, isAuthenticated, token]);

  // Fetch posts on component mount and when filters change
  useEffect(() => {
    if (isHydrated) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchPosts(1);
    }
  }, [isHydrated, fetchPosts]);


  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchPosts(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentElement = observerTarget.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [currentPage, hasMore, isLoadingMore, isLoading, fetchPosts]);

  // Handle reply to post
  const handleReplyToPost = useCallback((postId: string) => {
    setCommentingOnPost(postId);
    setReplyingToComment(null);
    setShowCommentModal(true);
  }, []);

  // Handle reply to comment
  const handleReplyToComment = useCallback((commentId: string, author: Author) => {
    // Find the post that contains this comment
    const post = topics.find(t => 
      t.replies?.some((r: Reply) => r.id === commentId)
    );
    if (post) {
      setCommentingOnPost(post.id);
      setReplyingToComment({ id: commentId, author });
      setShowCommentModal(true);
    }
  }, [topics]);

  // Handle comment created  
  const handleCommentCreated = useCallback((comment: CommentResponse | CommentData) => {
    // Add the comment immediately to the UI
    setTopics(prevTopics =>
      prevTopics.map(topic => {
        if (topic.id === commentingOnPost) {
          // Transform the comment to match our interface
          const newReply = {
            id: comment.id,
            content: comment.content,
            author: {
              id: comment.author.id,
              name: comment.author.name || ('fullName' in comment.author ? comment.author.fullName : ''),
              avatar: comment.author.avatar || ('profileImageUrl' in comment.author ? comment.author.profileImageUrl : undefined),
              profileImageUrl: ('profileImageUrl' in comment.author ? comment.author.profileImageUrl : undefined),
              city: ('city' in comment.author ? comment.author.city : ''),
              country: ('country' in comment.author ? comment.author.country : ''),
              profession: ('profession' in comment.author ? comment.author.profession : ''),
              specialization: ('specialization' in comment.author ? comment.author.specialization : ''),
              bio: ('bio' in comment.author ? comment.author.bio : ''),
              role: ('role' in comment.author ? comment.author.role : undefined)
            },
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            reactions: {
              LOVE: comment.reactions?.LOVE || 0,
              LIKE: comment.reactions?.LIKE || 0,
              SURPRISE: comment.reactions?.SURPRISE || 0,
              CLAP: comment.reactions?.CLAP || 0,
              SAD: comment.reactions?.SAD || 0,
              userReactions: (comment.reactions?.userReactions as ReactionType[]) || []
            },
            parentId: comment.parentId,
            replies: [] // Initialize empty replies array for new comment
          };
          
          // Check if this is a reply to a comment or a top-level comment
          if (comment.parentId && replyingToComment) {
            // This is a reply to an existing comment
            const updatedReplies = topic.replies?.map(reply => {
              if (reply.id === comment.parentId) {
                // Add the new reply to this comment's replies
                return {
                  ...reply,
                  replies: [...(reply.replies || []), newReply]
                };
              }
              return reply;
            }) || [];
            
            return {
              ...topic,
              replyCount: (topic.replyCount || 0) + 1,
              replies: updatedReplies
            };
          } else {
            // This is a top-level comment on the post
            return {
              ...topic,
              replyCount: (topic.replyCount || 0) + 1,
              replies: [...(topic.replies || []), newReply]
            };
          }
        }
        return topic;
      })
    );
  }, [commentingOnPost, replyingToComment]);

  // Handle post reaction
  const handleReaction = useCallback(
    async (topicId: string, reactionType: ReactionType | null) => {
      console.log('🎯 [handleReaction] Called with:', { topicId, reactionType });
      
      try {
        if (!token || !isAuthenticated) {
          console.error('No authentication token found');
          return;
        }

        // If reactionType is null, we're removing the reaction
        // Find the current reaction to remove
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;

        const currentReaction = topic.reactions.userReactions[0]; // User can only have one reaction
        
        // Determine final action
        let actionType: 'add' | 'remove' | 'change' = 'add';
        let reactionToSend = reactionType;
        
        if (reactionType === null) {
          // Explicitly removing reaction
          actionType = 'remove';
          reactionToSend = currentReaction; // Send current reaction to remove
        } else if (reactionType === currentReaction) {
          // Clicking same reaction = remove it
          actionType = 'remove';
          reactionToSend = currentReaction;
          reactionType = null; // Clear for UI update
        } else if (currentReaction && reactionType) {
          // Changing from one reaction to another
          actionType = 'change';
        }

        console.log(`[Reactions] ${actionType} reaction:`, {
          postId: topicId,
          current: currentReaction,
          new: reactionType,
          sending: reactionToSend,
          action: actionType
        });

        // Make API call based on action type
        let response;
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${topicId}/reactions`;
        
        if (actionType === 'remove') {
          // DELETE endpoint for removing reaction - no body needed
          console.log(`[Reactions] Calling DELETE ${apiUrl}`);
          response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log(`[Reactions] DELETE response status: ${response.status}`);
        } else {
          // POST endpoint for adding or changing reaction
          const body = { type: reactionToSend };
          console.log(`[Reactions] Calling POST ${apiUrl} with body:`, body);
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          });
          console.log(`[Reactions] POST response status: ${response.status}`);
        }

        if (!response.ok) {
          const errorData = await response.json();
          
          // Handle specific error cases
          if (response.status === 404) {
            if (errorData.type?.includes('reaction-not-found')) {
              console.warn('Reaction not found - user had not reacted to this post');
              // Still update UI to ensure consistency
            } else if (errorData.type?.includes('post-not-found')) {
              console.error('Post not found:', topicId);
              return;
            }
          } else {
            console.error('Failed to update reaction:', errorData);
            return;
          }
        } else {
          // Success response
          const data = await response.json();
          console.log(`[Reactions] ${actionType} successful:`, data);
        }

        // Update local state optimistically
        setTopics(prevTopics =>
          prevTopics.map(topic => {
            if (topic.id === topicId) {
              const newReactions = { ...topic.reactions };
              
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
                ...topic,
                reactions: newReactions,
              };
            }
            return topic;
          })
        );
      } catch (error) {
        console.error('Error updating reaction:', error);
      }
    },
    [topics, isAuthenticated, token]
  );

  // Handle comment reaction
  const handleCommentReaction = useCallback(
    async (commentId: string, reactionType: ReactionType | null) => {
      try {
        if (!token || !isAuthenticated) {
          console.error('No authentication token found');
          return;
        }

        // Find the comment in all topics
        let currentReaction: ReactionType | null = null;
        let foundInTopic: Topic | null = null;
        
        for (const topic of topics) {
          if (topic.replies) {
            const comment = topic.replies.find(r => r.id === commentId);
            if (comment) {
              currentReaction = comment.reactions.userReactions[0] || null;
              foundInTopic = topic;
              break;
            }
            // Check nested replies
            for (const reply of topic.replies) {
              if (reply.replies) {
                const nestedReply = reply.replies.find(r => r.id === commentId);
                if (nestedReply) {
                  currentReaction = nestedReply.reactions.userReactions[0] || null;
                  foundInTopic = topic;
                  break;
                }
              }
            }
            if (foundInTopic) break;
          }
        }

        if (!foundInTopic) {
          console.error('Comment not found');
          return;
        }
        
        // Determine final action
        let actionType: 'add' | 'remove' | 'change' = 'add';
        let reactionToSend = reactionType;
        
        if (reactionType === null) {
          // Explicitly removing reaction
          actionType = 'remove';
          reactionToSend = currentReaction;
        } else if (reactionType === currentReaction) {
          // Clicking same reaction = remove it
          actionType = 'remove';
          reactionToSend = currentReaction;
          reactionType = null; // Clear for UI update
        } else if (currentReaction && reactionType) {
          // Changing from one reaction to another
          actionType = 'change';
        }

        console.log(`[Reactions] ${actionType} comment reaction:`, {
          commentId,
          current: currentReaction,
          new: reactionType,
          sending: reactionToSend,
          action: actionType
        });

        // Make API call based on action type
        let response;
        
        if (actionType === 'remove') {
          // DELETE endpoint for removing reaction - no body needed
          response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/comments/${commentId}/reactions`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } else {
          // POST endpoint for adding or changing reaction
          response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/comments/${commentId}/reactions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                reactionType: reactionToSend, // API expects reactionType field
              }),
            }
          );
        }

        if (!response.ok) {
          const errorData = await response.json();
          
          // Handle specific error cases
          if (response.status === 404) {
            if (errorData.type?.includes('reaction-not-found')) {
              console.warn('Reaction not found - user had not reacted to this comment');
              // Still update UI to ensure consistency
            } else if (errorData.type?.includes('comment-not-found')) {
              console.error('Comment not found:', commentId);
              return;
            }
          } else {
            console.error('Failed to update comment reaction:', errorData);
            return;
          }
        } else {
          // Success response
          const data = await response.json();
          console.log(`[Reactions] Comment ${actionType} successful:`, data);
        }

        // Update local state optimistically
        setTopics(prevTopics =>
          prevTopics.map(topic => {
            if (topic.id !== foundInTopic.id) return topic;
            
            // Update the replies
            const updatedReplies = topic.replies?.map(reply => {
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
              ...topic,
              replies: updatedReplies,
            };
          })
        );
      } catch (error) {
        console.error('Error updating comment reaction:', error);
      }
    },
    [topics, isAuthenticated, token]
  );


  // Sort topics based on selected tab (API already returns sorted by recent)
  const sortedTopics = selectedTab === 'popular' 
    ? [...topics].sort((a, b) => {
        const bTotal =
          b.viewCount +
          b.replyCount +
          b.reactions.LOVE +
          b.reactions.LIKE +
          b.reactions.SURPRISE +
          b.reactions.CLAP +
          b.reactions.SAD;
        const aTotal =
          a.viewCount +
          a.replyCount +
          a.reactions.LOVE +
          a.reactions.LIKE +
          a.reactions.SURPRISE +
          a.reactions.CLAP +
          a.reactions.SAD;
        return bTotal - aTotal;
      })
    : topics;

  return (
    <NavSidebar>
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary">
        <div className="container mx-auto px-4 pt-28 sm:pt-24 lg:pt-12 pb-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-400">
              {t('description')}
            </p>
          </div>

          {/* Create Post Button - Prominent Position (mantém no topo também) */}
          <div className="mb-8 flex justify-center">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-secondary hover:bg-secondary/80 text-white font-bold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <Plus size={24} className="mr-3" />
              {t('createTopic')}
            </Button>
          </div>

          {/* Floating Create Post Button - Fixed Position */}
          <Button
            onClick={() => setShowCreateModal(true)}
            className="fixed top-52 sm:top-40 lg:top-32 right-8 z-50 bg-secondary hover:bg-secondary/90 text-white rounded-full p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 group"
            title={t('createTopic')}
          >
            <Plus size={36} className="transition-transform duration-300 group-hover:rotate-90" />
            <span className="sr-only">{t('createTopic')}</span>
            
            {/* Tooltip on hover */}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              {t('createTopic')}
            </span>
          </Button>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={e =>
                  setSearchQuery(e.target.value)
                }
                className="pl-10 bg-primary-dark/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-secondary focus:ring-secondary"
              />
            </div>
          </div>


          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="mb-6"
          >
            <TabsList className="bg-primary-dark/50 border-gray-700">
              <TabsTrigger
                value="recent"
                className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-primary"
              >
                {t('tabs.recent')}
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-primary"
              >
                {t('tabs.popular')}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value={selectedTab}
              className="mt-6"
            >
              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button 
                    onClick={() => fetchPosts(currentPage)}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-primary/50"
                  >
                    {t('retry')}
                  </Button>
                </div>
              )}

              {/* Topics List */}
              {!isLoading && !error && (
                <div className="space-y-4">
                  {sortedTopics.map(topic => (
                  <PostCard
                    key={topic.id}
                    post={{
                      ...topic,
                      type: 'GENERAL_TOPIC',
                      hashtags: topic.tags,
                      attachments: topic.attachments || [],
                      replies: topic.replies // Mantém os comentários do post
                    }}
                    onReaction={(postId, reaction) => {
                      // Permite null para remover reação
                      handleReaction(postId, reaction);
                    }}
                    onCommentReaction={(commentId, reaction) => {
                      // Permite null para remover reação
                      handleCommentReaction(commentId, reaction);
                    }}
                    onReply={handleReplyToPost}
                    onReplyToComment={(commentId: string, author: Author) => handleReplyToComment(commentId, author)}
                    onUpdate={() => {
                      console.log('♻️ Refreshing posts after moderation');
                      fetchPosts(currentPage);
                    }}
                    onClick={() => console.log('Post clicked:', topic.id)}
                    compactVideo={true}
                    compactImages={true}
                  />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && sortedTopics.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare
                    size={48}
                    className="mx-auto text-gray-600 mb-4"
                  />
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    {t('noTopics')}
                  </h3>
                  <p className="text-gray-400">
                    {t('noTopicsDescription')}
                  </p>
                </div>
              )}

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
                  <span className="ml-3 text-gray-400">{t('loadingMore')}</span>
                </div>
              )}

              {/* Intersection Observer Target */}
              <div ref={observerTarget} className="h-1" />
            </TabsContent>
          </Tabs>

        </div>
      </div>

      {/* Create Comment Modal */}
      <CreateCommentModal
        open={showCommentModal}
        onClose={() => {
          setShowCommentModal(false);
          setCommentingOnPost(null);
          setReplyingToComment(null);
        }}
        postId={commentingOnPost || ''}
        parentId={replyingToComment?.id}
        parentAuthor={replyingToComment?.author}
        onCommentCreated={handleCommentCreated}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={createdPost => {
          // Transform the API response to match our Topic interface
          const newPost: Topic = {
            id: createdPost.id,
            title: createdPost.title,
            content: createdPost.content,
            authorId: createdPost.authorId || user?.id, // Adicionar authorId
            author: currentUser || {
              id: createdPost.authorId || 'current-user',
              name: 'Usuário',
              avatar: undefined,
              city: 'São Paulo',
              country: 'Brasil',
              profession: 'Médico',
            },
            createdAt: new Date(createdPost.createdAt),
            updatedAt: new Date(createdPost.createdAt),
            viewCount: createdPost.viewCount || 0,
            replyCount: createdPost.commentCount || 0,
            reactions: {
              LOVE: 0,
              LIKE: 0,
              SURPRISE: 0,
              CLAP: 0,
              SAD: 0,
              userReactions: [],
            },
            tags: createdPost.hashtags || [],
            isPinned: createdPost.isPinned || false,
            // Add attachments support
            attachments: createdPost.attachments,
            mediaType: createdPost.mediaType,
          };

          // Add the new post to the top of the list
          setTopics(prev => [newPost, ...prev]);
          console.log(
            'Post created successfully with attachments:',
            createdPost
          );
        }}
      />
    </NavSidebar>
  );
}

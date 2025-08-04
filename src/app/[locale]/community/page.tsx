// src/app/[locale]/community/page.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Plus,
  MessageSquare,
  Eye,
  Calendar,
  User,
  Filter,
  Hash,
  BookOpen,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import NavSidebar from '@/components/NavSidebar';
import ReactionsButton, {
  ReactionType,
} from '@/components/ReactionsButton';
import CreatePostModal from '@/components/CreatePostModal';
import PostCard from '@/components/PostCard';

// Mock data types
interface Author {
  id: string;
  name: string;
  avatar?: string;
  city: string;
  country: string;
  profession: string;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  author: Author;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  replyCount: number;
  reactions: {
    heart: number;
    thumbsUp: number;
    surprised: number;
    clap: number;
    sad: number;
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
    videoInfo?: {
      provider: 'youtube' | 'vimeo';
      videoId: string;
      embedUrl: string;
      thumbnailUrl: string;
    };
  }>;
  mediaType?: string;
}

// Mock lessons data
const mockLessons = [
  {
    id: '1',
    title: 'Processo de Equivalência',
    courseId: '1',
  },
  {
    id: '2',
    title: 'Sistema Cardiovascular',
    courseId: '1',
  },
  { id: '3', title: 'Sistema Respiratório', courseId: '1' },
  { id: '4', title: 'Anatomia Básica', courseId: '2' },
  { id: '5', title: 'Técnicas Cirúrgicas', courseId: '2' },
];

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
      heart: 8,
      thumbsUp: 15,
      surprised: 2,
      clap: 5,
      sad: 0,
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
      heart: 12,
      thumbsUp: 20,
      surprised: 3,
      clap: 8,
      sad: 1,
      userReactions: ['thumbsUp'] as ReactionType[],
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
      heart: 3,
      thumbsUp: 7,
      surprised: 1,
      clap: 2,
      sad: 0,
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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] =
    useState('all');
  const [selectedCourse, setSelectedCourse] =
    useState('all');
  const [selectedLesson, setSelectedLesson] =
    useState('all');
  const [selectedTab, setSelectedTab] = useState('recent');
  const [showCreateModal, setShowCreateModal] =
    useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  // Ensure component is hydrated before rendering dynamic content
  useEffect(() => {
    setIsHydrated(true);
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

  // Fetch posts from API
  const fetchPosts = useCallback(async (page = 1, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
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
      });

      // Add search parameter
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      // Add course filter
      if (selectedCourse !== 'all') {
        params.append('courseId', selectedCourse);
      }

      // Add lesson filter
      if (selectedLesson !== 'all') {
        params.append('lessonId', selectedLesson);
      }

      // Add type filter based on selectedFilter
      if (selectedFilter === 'lesson-comments') {
        params.append('type', 'LESSON_COMMENT');
      } else if (selectedFilter === 'general-topics') {
        params.append('type', 'GENERAL_TOPIC');
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
      const transformedPosts: Topic[] = data.posts.map((post: any) => ({
        id: post.id,
        title: post.title || '',
        content: post.content,
        author: post.author || {
          id: post.authorId,
          name: 'Unknown User',
          avatar: undefined,
          city: '',
          country: '',
          profession: ''
        },
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        viewCount: post.viewCount || 0,
        replyCount: post.replyCount || 0,
        reactions: {
          heart: post.reactions?.heart || 0,
          thumbsUp: post.reactions?.thumbsUp || 0,
          surprised: post.reactions?.surprised || 0,
          clap: post.reactions?.clap || 0,
          sad: post.reactions?.sad || 0,
          userReactions: post.reactions?.userReactions || []
        },
        tags: post.hashtags || [],
        course: post.course,
        module: post.module,
        lesson: post.lesson,
        isPinned: post.isPinned || false,
        attachments: post.attachments || [],
        mediaType: post.mediaType
      }));

      if (append) {
        setTopics(prev => [...prev, ...transformedPosts]);
      } else {
        setTopics(transformedPosts);
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
  }, [searchQuery, selectedCourse, selectedLesson, selectedFilter]);

  // Fetch posts on component mount and when filters change
  useEffect(() => {
    if (isHydrated) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchPosts(1);
    }
  }, [isHydrated, searchQuery, selectedCourse, selectedLesson, selectedFilter]);

  // Get filtered lessons based on selected course
  const filteredLessons =
    selectedCourse === 'all'
      ? mockLessons
      : mockLessons.filter(
          lesson => lesson.courseId === selectedCourse
        );

  // Reset lesson filter when course changes
  useEffect(() => {
    setSelectedLesson('all');
  }, [selectedCourse]);

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

  // Handle reaction
  const handleReaction = useCallback(
    (topicId: string, reactionType: ReactionType) => {
      setTopics(prevTopics =>
        prevTopics.map(topic => {
          if (topic.id === topicId) {
            const userReactions = [
              ...topic.reactions.userReactions,
            ];
            const hasReaction =
              userReactions.includes(reactionType);

            if (hasReaction) {
              // Remove reaction
              const index =
                userReactions.indexOf(reactionType);
              userReactions.splice(index, 1);
            } else {
              // Add reaction
              userReactions.push(reactionType);
            }

            return {
              ...topic,
              reactions: {
                ...topic.reactions,
                [reactionType]: hasReaction
                  ? topic.reactions[reactionType] - 1
                  : topic.reactions[reactionType] + 1,
                userReactions,
              },
            };
          }
          return topic;
        })
      );
    },
    []
  );

  // Format date - consistent between server and client
  const formatDate = useCallback(
    (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (hours < 1) return t('justNow');
      if (hours < 24) return t('hoursAgo', { hours });
      if (days < 7) return t('daysAgo', { days });

      // Use a consistent date format to avoid hydration mismatch
      const day = date
        .getDate()
        .toString()
        .padStart(2, '0');
      const month = (date.getMonth() + 1)
        .toString()
        .padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
    [t]
  );

  // Sort topics based on selected tab (API already returns sorted by recent)
  const sortedTopics = selectedTab === 'popular' 
    ? [...topics].sort((a, b) => {
        const bTotal =
          b.viewCount +
          b.replyCount +
          b.reactions.heart +
          b.reactions.thumbsUp +
          b.reactions.surprised +
          b.reactions.clap +
          b.reactions.sad;
        const aTotal =
          a.viewCount +
          a.replyCount +
          a.reactions.heart +
          a.reactions.thumbsUp +
          a.reactions.surprised +
          a.reactions.clap +
          a.reactions.sad;
        return bTotal - aTotal;
      })
    : topics;

  return (
    <NavSidebar>
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-400">
              {t('description')}
            </p>
          </div>

          {/* Create Post Button - Prominent Position */}
          <div className="mb-8 flex justify-center">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-secondary hover:bg-secondary/80 text-white font-bold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <Plus size={24} className="mr-3" />
              {t('createTopic')}
            </Button>
          </div>

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

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select
              value={selectedFilter}
              onValueChange={setSelectedFilter}
            >
              <SelectTrigger className="w-[180px] bg-primary-dark/50 border-gray-700 text-white hover:bg-primary-dark/70 focus:ring-secondary">
                <Filter
                  size={16}
                  className="mr-2 text-gray-400"
                />
                <SelectValue placeholder={t('filterBy')} />
              </SelectTrigger>
              <SelectContent className="bg-primary-dark border-gray-700">
                <SelectItem
                  value="all"
                  className="text-white hover:bg-primary/50"
                >
                  {t('filters.all')}
                </SelectItem>
                <SelectItem
                  value="pinned"
                  className="text-white hover:bg-primary/50"
                >
                  {t('filters.pinned')}
                </SelectItem>
                <SelectItem
                  value="my-posts"
                  className="text-white hover:bg-primary/50"
                >
                  {t('filters.myPosts')}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
            >
              <SelectTrigger className="w-[200px] bg-primary-dark/50 border-gray-700 text-white hover:bg-primary-dark/70 focus:ring-secondary">
                <BookOpen
                  size={16}
                  className="mr-2 text-gray-400"
                />
                <SelectValue
                  placeholder={t('filterByCourse')}
                />
              </SelectTrigger>
              <SelectContent className="bg-primary-dark border-gray-700">
                <SelectItem
                  value="all"
                  className="text-white hover:bg-primary/50"
                >
                  {t('allCourses')}
                </SelectItem>
                <SelectItem
                  value="1"
                  className="text-white hover:bg-primary/50"
                >
                  Medicina Interna
                </SelectItem>
                <SelectItem
                  value="2"
                  className="text-white hover:bg-primary/50"
                >
                  Cirurgia Geral
                </SelectItem>
                <SelectItem
                  value="3"
                  className="text-white hover:bg-primary/50"
                >
                  Pediatria
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedLesson}
              onValueChange={setSelectedLesson}
            >
              <SelectTrigger className="w-[250px] bg-primary-dark/50 border-gray-700 text-white hover:bg-primary-dark/70 focus:ring-secondary">
                <GraduationCap
                  size={16}
                  className="mr-2 text-gray-400"
                />
                <SelectValue
                  placeholder={t('filterByLesson')}
                />
              </SelectTrigger>
              <SelectContent className="bg-primary-dark border-gray-700 max-h-[300px]">
                <SelectItem
                  value="all"
                  className="text-white hover:bg-primary/50"
                >
                  {t('allLessons')}
                </SelectItem>
                {filteredLessons.map(lesson => (
                  <SelectItem
                    key={lesson.id}
                    value={lesson.id}
                    className="text-white hover:bg-primary/50"
                  >
                    {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      attachments: topic.attachments || []
                    }}
                    onReaction={(postId, reaction) => {
                      if (reaction) {
                        handleReaction(postId, reaction);
                      }
                    }}
                    onClick={() => console.log('Post clicked:', topic.id)}
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
              heart: 0,
              thumbsUp: 0,
              surprised: 0,
              clap: 0,
              sad: 0,
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

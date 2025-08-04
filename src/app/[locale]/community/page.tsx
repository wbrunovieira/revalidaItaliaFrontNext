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
  role?: 'student' | 'admin' | 'tutor';
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

// Mock topics with attachments and replies for reference
const mockTopicsWithAttachments: Topic[] = [
  {
    id: 'mock-1',
    title: '📸 Post com 1 Imagem - Layout Simples',
    content: 'Este é um exemplo de post com uma única imagem. A imagem aparece em tamanho grande, ocupando toda a largura disponível.',
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
    viewCount: 45,
    replyCount: 3,
    reactions: {
      LOVE: 5,
      LIKE: 8,
      SURPRISE: 0,
      CLAP: 2,
      SAD: 0,
      userReactions: [],
    },
    tags: ['exemplo', 'imagem'],
    isPinned: false,
    attachments: [
      {
        id: '1',
        url: 'https://picsum.photos/800/600',
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeInBytes: 1048576,
        fileName: 'exemplo1.jpg'
      }
    ]
  },
  {
    id: 'mock-2',
    title: '🖼️ Post com 3 Imagens - Layout Especial',
    content: 'Exemplo com 3 imagens: uma grande à esquerda e duas menores à direita, criando um layout assimétrico interessante.',
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
    viewCount: 89,
    replyCount: 5,
    reactions: {
      LOVE: 12,
      LIKE: 20,
      SURPRISE: 3,
      CLAP: 8,
      SAD: 0,
      userReactions: ['LIKE'] as ReactionType[],
    },
    tags: ['galeria', 'multiplas-imagens'],
    attachments: [
      {
        id: '1',
        url: 'https://picsum.photos/600/800',
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeInBytes: 1048576,
        fileName: 'exemplo1.jpg'
      },
      {
        id: '2',
        url: 'https://picsum.photos/601/400',
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeInBytes: 1048576,
        fileName: 'exemplo2.jpg'
      },
      {
        id: '3',
        url: 'https://picsum.photos/602/400',
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeInBytes: 1048576,
        fileName: 'exemplo3.jpg'
      }
    ]
  },
  {
    id: 'mock-3',
    title: '📄 Post com PDF Anexado',
    content: 'Este post contém um documento PDF anexado. Clique no anexo para visualizar ou baixar o documento.',
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
    viewCount: 67,
    replyCount: 2,
    reactions: {
      LOVE: 3,
      LIKE: 7,
      SURPRISE: 1,
      CLAP: 2,
      SAD: 0,
      userReactions: [],
    },
    tags: ['documento', 'pdf', 'material'],
    attachments: [
      {
        id: '1',
        url: '/sample.pdf',
        type: 'DOCUMENT',
        mimeType: 'application/pdf',
        sizeInBytes: 2097152,
        fileName: 'Guia_Revalidacao_2024.pdf'
      }
    ]
  },
  {
    id: 'mock-4',
    title: '🎥 Post com Vídeo do YouTube',
    content: 'Compartilhando este vídeo excelente sobre anatomia cardiovascular. O vídeo é incorporado diretamente no post.',
    author: {
      id: '4',
      name: 'Paulo Santos',
      avatar: undefined,
      city: 'São Paulo',
      country: 'Brasil',
      profession: 'Professor',
    },
    createdAt: new Date('2024-01-12T14:00:00'),
    updatedAt: new Date('2024-01-12T14:00:00'),
    viewCount: 234,
    replyCount: 15,
    reactions: {
      LOVE: 18,
      LIKE: 45,
      SURPRISE: 5,
      CLAP: 22,
      SAD: 0,
      userReactions: ['LOVE', 'LIKE'] as ReactionType[],
    },
    tags: ['video', 'anatomia', 'youtube'],
    attachments: [
      {
        id: '1',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        type: 'VIDEO',
        mimeType: 'video/external',
        sizeInBytes: 0,
        fileName: 'Anatomia Cardiovascular',
        provider: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
      }
    ]
  },
  {
    id: 'mock-5',
    title: '🎯 Post com 6 Imagens - Grid Completo',
    content: 'Exemplo máximo: 6 imagens organizadas em um grid 3x2, com indicador de "+N" se houver mais imagens.',
    author: {
      id: '5',
      name: 'Ana Costa',
      avatar: undefined,
      city: 'Lisboa',
      country: 'Portugal',
      profession: 'Pediatra',
    },
    createdAt: new Date('2024-01-11T08:30:00'),
    updatedAt: new Date('2024-01-11T08:30:00'),
    viewCount: 156,
    replyCount: 9,
    reactions: {
      LOVE: 25,
      LIKE: 38,
      SURPRISE: 7,
      CLAP: 15,
      SAD: 0,
      userReactions: ['CLAP'] as ReactionType[],
    },
    tags: ['galeria-completa', 'multiplas-fotos'],
    attachments: Array.from({ length: 6 }, (_, i) => ({
      id: `${i + 1}`,
      url: `https://picsum.photos/400/300?random=${i}`,
      type: 'IMAGE' as const,
      mimeType: 'image/jpeg',
      sizeInBytes: 524288,
      fileName: `foto${i + 1}.jpg`
    }))
  },
  {
    id: 'mock-6',
    title: '💬 Post com Respostas - Discussão Completa',
    content: 'Este é um exemplo de post com várias respostas, mostrando os botões de Responder e Denunciar. As respostas ficam aninhadas abaixo do post principal.',
    author: {
      id: '6',
      name: 'Roberto Ferrari',
      avatar: undefined,
      city: 'Veneza',
      country: 'Itália',
      profession: 'Neurologista',
    },
    createdAt: new Date('2024-01-10T16:45:00'),
    updatedAt: new Date('2024-01-10T16:45:00'),
    viewCount: 312,
    replyCount: 4,
    reactions: {
      LOVE: 15,
      LIKE: 28,
      SURPRISE: 3,
      CLAP: 10,
      SAD: 0,
      userReactions: [],
    },
    tags: ['discussao', 'duvida', 'neurologia'],
    replies: [
      {
        id: 'reply-1',
        type: 'GENERAL_TOPIC',
        title: '',
        content: 'Excelente pergunta! Eu passei por essa situação recentemente. O processo todo levou cerca de 6 meses, mas pode variar dependendo da documentação.',
        author: {
          id: '7',
          name: 'Carla Mendes',
          avatar: undefined,
          city: 'Florença',
          country: 'Itália',
          profession: 'Médica Geral',
        },
        authorId: '7',
        createdAt: new Date('2024-01-10T17:30:00'),
        updatedAt: new Date('2024-01-10T17:30:00'),
        reactions: {
          LOVE: 8,
          LIKE: 12,
          SURPRISE: 0,
          CLAP: 5,
          SAD: 0,
          userReactions: ['LIKE'] as ReactionType[],
        },
        parentId: 'mock-6',
        lessonId: '',
        viewCount: 45,
        replyCount: 0,
        hashtags: []
      },
      {
        id: 'reply-2',
        type: 'GENERAL_TOPIC',
        title: '',
        content: 'Concordo com a Carla. No meu caso demorou 8 meses porque tive que traduzir muitos documentos. Recomendo começar pelas traduções o quanto antes!',
        author: {
          id: '8',
          name: 'Marco Giuliani',
          avatar: undefined,
          city: 'Turim',
          country: 'Itália',
          profession: 'Ortopedista',
        },
        authorId: '8',
        createdAt: new Date('2024-01-10T18:15:00'),
        updatedAt: new Date('2024-01-10T18:15:00'),
        reactions: {
          LOVE: 5,
          LIKE: 9,
          SURPRISE: 1,
          CLAP: 3,
          SAD: 0,
          userReactions: [],
        },
        parentId: 'mock-6',
        lessonId: '',
        viewCount: 32,
        replyCount: 0,
        hashtags: []
      },
      {
        id: 'reply-3',
        type: 'GENERAL_TOPIC',
        title: '',
        content: 'Obrigado pelas respostas! Vocês fizeram a tradução juramentada aqui na Itália ou no Brasil? E quanto custou aproximadamente?',
        author: {
          id: '6',
          name: 'Roberto Ferrari',
          avatar: undefined,
          city: 'Veneza',
          country: 'Itália',
          profession: 'Neurologista',
        },
        authorId: '6',
        createdAt: new Date('2024-01-10T19:00:00'),
        updatedAt: new Date('2024-01-10T19:00:00'),
        reactions: {
          LOVE: 2,
          LIKE: 4,
          SURPRISE: 0,
          CLAP: 1,
          SAD: 0,
          userReactions: [],
        },
        parentId: 'mock-6',
        lessonId: '',
        viewCount: 28,
        replyCount: 0,
        hashtags: []
      },
      {
        id: 'reply-4',
        type: 'GENERAL_TOPIC',
        title: '',
        content: 'Eu fiz no consulado brasileiro aqui em Roma. Custou cerca de €50 por documento. Vale a pena ligar antes para confirmar os valores atualizados.',
        author: {
          id: '7',
          name: 'Carla Mendes',
          avatar: undefined,
          city: 'Florença',
          country: 'Itália',
          profession: 'Médica Geral',
        },
        authorId: '7',
        createdAt: new Date('2024-01-10T19:30:00'),
        updatedAt: new Date('2024-01-10T19:30:00'),
        reactions: {
          LOVE: 10,
          LIKE: 18,
          SURPRISE: 0,
          CLAP: 8,
          SAD: 0,
          userReactions: ['LOVE', 'LIKE'] as ReactionType[],
        },
        parentId: 'mock-6',
        lessonId: '',
        viewCount: 52,
        replyCount: 0,
        hashtags: [],
        attachments: [
          {
            id: '1',
            url: 'https://picsum.photos/600/400?random=reply',
            type: 'IMAGE',
            mimeType: 'image/jpeg',
            sizeInBytes: 204800,
            fileName: 'consulado_romano.jpg'
          }
        ]
      }
    ]
  }
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
  const [userRolesMap, setUserRolesMap] = useState<Record<string, 'student' | 'admin' | 'tutor'>>({});

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
        const userRole = decodedToken?.role;

        if (!userId) {
          console.error('User ID not found in token');
          return;
        }
        
        // Store current user's role from JWT
        if (userRole) {
          setUserRolesMap(prev => ({ ...prev, [userId]: userRole }));
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
            profession: userData.profession,
            role: userData.role as 'student' | 'admin' | 'tutor'
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [decodeJWT]);

  // Fetch user roles for authors in posts
  const fetchUserRoles = useCallback(async (userIds: string[]) => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (!token) return;

    const uniqueIds = [...new Set(userIds)].filter(id => !userRolesMap[id]);
    if (uniqueIds.length === 0) return;

    try {
      // Fetch user details for each unique user ID
      const rolePromises = uniqueIds.map(async (userId) => {
        try {
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
            return { userId, role: data.user.role };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(rolePromises);
      const newRoles: Record<string, 'student' | 'admin' | 'tutor'> = {};
      
      results.forEach(result => {
        if (result) {
          newRoles[result.userId] = result.role;
        }
      });

      setUserRolesMap(prev => ({ ...prev, ...newRoles }));
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  }, [userRolesMap]);

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
        author: post.author ? {
          id: post.author.id,
          name: post.author.name,
          avatar: post.author.profileImageUrl,
          city: post.author.city || '',
          country: post.author.country || '',
          profession: post.author.profession || '',
          role: userRolesMap[post.author.id] || undefined
        } : {
          id: post.authorId,
          name: 'Unknown User',
          avatar: undefined,
          city: '',
          country: '',
          profession: '',
          role: undefined
        },
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        viewCount: post.viewCount || 0,
        replyCount: post.replyCount || 0,
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
      
      // Fetch roles for all authors in the posts
      const authorIds = transformedPosts
        .map(post => post.author.id)
        .filter(id => id && id !== 'Unknown User');
      
      if (authorIds.length > 0) {
        fetchUserRoles(authorIds);
      }
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
    async (topicId: string, reactionType: ReactionType | null) => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          console.error('No authentication token found');
          return;
        }

        // If reactionType is null, we're removing the reaction
        // Find the current reaction to remove
        const topic = topics.find(t => t.id === topicId);
        if (!topic) return;

        const currentReaction = topic.reactions.userReactions[0]; // User can only have one reaction
        
        // If trying to add the same reaction that already exists, remove it
        if (reactionType === currentReaction) {
          reactionType = null;
        }

        console.log('Sending reaction request:', { topicId, reactionType, currentReaction });

        // Make API call
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${topicId}/reactions`,
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
    [topics]
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

          {/* Mock Posts Section - For Reference */}
          <div className="mt-16 p-6 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-2">
              📋 Modelos de Referência (Exemplos de Posts)
            </h2>
            <p className="text-gray-400 mb-6">
              Abaixo estão exemplos de todos os tipos de posts possíveis com diferentes layouts de anexos
            </p>
            <div className="space-y-4">
              {mockTopicsWithAttachments.map(topic => (
                <PostCard
                  key={topic.id}
                  post={{
                    ...topic,
                    type: 'GENERAL_TOPIC',
                    hashtags: topic.tags,
                    attachments: topic.attachments || []
                  }}
                  onReaction={(postId, reaction) => {
                    console.log('Mock post reaction:', postId, reaction);
                  }}
                  onClick={() => console.log('Mock post clicked:', topic.id)}
                  compactVideo={true}
                  compactImages={true}
                />
              ))}
            </div>
          </div>
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

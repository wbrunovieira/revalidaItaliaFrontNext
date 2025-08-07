// src/app/[locale]/community/page.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Plus,
  MessageSquare,
  Filter,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  };
  createdAt: string;
  updatedAt: string;
  isTopLevelComment: boolean;
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
  wasTitleEdited?: boolean;
  titleEditedBy?: string;
  titleEditedAt?: Date;
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

// Mock topics with attachments, moderation examples and replies for reference
const mockTopicsWithAttachments: Topic[] = [
  // EXEMPLO DE POST BLOQUEADO
  {
    id: 'mock-blocked',
    title: '🚫 POST BLOQUEADO - Visível apenas para Admin/Tutor',
    content: 'Este é um exemplo de post que foi bloqueado por violar as regras da comunidade. Apenas moderadores (Admin/Tutor) podem ver este conteúdo com 50% de opacidade. Usuários comuns (Students) não conseguem ver este post.',
    author: {
      id: '999',
      name: 'Usuário Problemático',
      avatar: undefined,
      city: 'Roma',
      country: 'Itália',
      profession: 'Médico',
      role: 'student' as const,
    },
    createdAt: new Date('2024-01-10T10:00:00'),
    updatedAt: new Date('2024-01-10T10:00:00'),
    viewCount: 0,
    replyCount: 0,
    reactions: {
      LOVE: 0,
      LIKE: 0,
      SURPRISE: 0,
      CLAP: 0,
      SAD: 0,
      userReactions: [],
    },
    tags: ['bloqueado', 'exemplo'],
    isPinned: false,
    isBlocked: true, // POST BLOQUEADO
    replies: [
      {
        id: 'reply-blocked',
        content: 'Este comentário também está bloqueado e só é visível para moderadores.',
        author: {
          id: '998',
          name: 'Outro Usuário',
          avatar: undefined,
          role: 'student' as const,
        },
        createdAt: new Date('2024-01-10T11:00:00'),
        updatedAt: new Date('2024-01-10T11:00:00'),
        reactions: {
          LOVE: 0,
          LIKE: 0,
          SURPRISE: 0,
          CLAP: 0,
          SAD: 0,
          userReactions: [],
        },
        isBlocked: true, // COMENTÁRIO BLOQUEADO
      }
    ]
  },
  
  // EXEMPLO DE POST COM TÍTULO EDITADO
  {
    id: 'mock-edited',
    title: 'Dúvidas sobre o Processo de Revalidação [Título Corrigido]',
    content: 'Este post teve seu título editado por um moderador para torná-lo mais claro e profissional. O conteúdo original permanece inalterado. Moderadores podem apenas editar títulos, nunca o conteúdo do post.',
    author: {
      id: '997',
      name: 'João Santos',
      avatar: undefined,
      city: 'Milão',
      country: 'Itália',
      profession: 'Enfermeiro',
      role: 'student' as const,
    },
    createdAt: new Date('2024-01-12T10:00:00'),
    updatedAt: new Date('2024-01-12T10:00:00'),
    viewCount: 123,
    replyCount: 5,
    reactions: {
      LOVE: 3,
      LIKE: 7,
      SURPRISE: 1,
      CLAP: 2,
      SAD: 0,
      userReactions: [],
    },
    tags: ['editado', 'exemplo'],
    isPinned: false,
    wasTitleEdited: true, // TÍTULO FOI EDITADO
    titleEditedBy: 'admin-1',
    titleEditedAt: new Date('2024-01-12T15:00:00'),
    replies: [
      {
        id: 'reply-normal',
        content: 'Ótima pergunta! O título ficou muito mais claro após a edição.',
        author: {
          id: '996',
          name: 'Ana Costa',
          avatar: undefined,
          role: 'tutor' as const,
        },
        createdAt: new Date('2024-01-12T11:00:00'),
        updatedAt: new Date('2024-01-12T11:00:00'),
        reactions: {
          LOVE: 1,
          LIKE: 2,
          SURPRISE: 0,
          CLAP: 1,
          SAD: 0,
          userReactions: [],
        },
      }
    ]
  },
  
  // EXEMPLO COM COMENTÁRIO BLOQUEADO MAS POST NORMAL
  {
    id: 'mock-mixed',
    title: 'Post Normal com Comentário Bloqueado',
    content: 'Este é um post normal que todos podem ver, mas um dos comentários foi bloqueado por conteúdo inadequado.',
    author: {
      id: '995',
      name: 'Pedro Lima',
      avatar: undefined,
      city: 'Nápoles',
      country: 'Itália',
      profession: 'Fisioterapeuta',
      role: 'student' as const,
    },
    createdAt: new Date('2024-01-13T10:00:00'),
    updatedAt: new Date('2024-01-13T10:00:00'),
    viewCount: 89,
    replyCount: 3,
    reactions: {
      LOVE: 4,
      LIKE: 6,
      SURPRISE: 0,
      CLAP: 3,
      SAD: 0,
      userReactions: [],
    },
    tags: ['exemplo', 'moderação'],
    isPinned: false,
    replies: [
      {
        id: 'reply-ok-1',
        content: 'Comentário normal que todos podem ver.',
        author: {
          id: '994',
          name: 'Carlos Mendes',
          avatar: undefined,
          role: 'student' as const,
        },
        createdAt: new Date('2024-01-13T11:00:00'),
        updatedAt: new Date('2024-01-13T11:00:00'),
        reactions: {
          LOVE: 1,
          LIKE: 1,
          SURPRISE: 0,
          CLAP: 0,
          SAD: 0,
          userReactions: [],
        },
      },
      {
        id: 'reply-blocked-2',
        content: 'Este comentário foi bloqueado por linguagem inadequada. Apenas moderadores podem vê-lo.',
        author: {
          id: '993',
          name: 'Usuário Bloqueado',
          avatar: undefined,
          role: 'student' as const,
        },
        createdAt: new Date('2024-01-13T12:00:00'),
        updatedAt: new Date('2024-01-13T12:00:00'),
        reactions: {
          LOVE: 0,
          LIKE: 0,
          SURPRISE: 0,
          CLAP: 0,
          SAD: 0,
          userReactions: [],
        },
        isBlocked: true, // COMENTÁRIO BLOQUEADO
        replies: [
          {
            id: 'nested-blocked',
            content: 'Resposta também bloqueada automaticamente.',
            author: {
              id: '992',
              name: 'Outro User',
              avatar: undefined,
              role: 'student' as const,
            },
            createdAt: new Date('2024-01-13T13:00:00'),
            updatedAt: new Date('2024-01-13T13:00:00'),
            reactions: {
              LOVE: 0,
              LIKE: 0,
              SURPRISE: 0,
              CLAP: 0,
              SAD: 0,
              userReactions: [],
            },
            isBlocked: true, // RESPOSTA ANINHADA BLOQUEADA
          }
        ]
      },
      {
        id: 'reply-ok-2',
        content: 'Outro comentário normal visível para todos.',
        author: {
          id: '991',
          name: 'Lucia Ferreira',
          avatar: undefined,
          role: 'admin' as const,
        },
        createdAt: new Date('2024-01-13T14:00:00'),
        updatedAt: new Date('2024-01-13T14:00:00'),
        reactions: {
          LOVE: 2,
          LIKE: 3,
          SURPRISE: 0,
          CLAP: 1,
          SAD: 0,
          userReactions: [],
        },
      }
    ]
  },

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
        url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop',
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
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=800',
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeInBytes: 1048576,
        fileName: 'exemplo1.jpg'
      },
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?w=600&h=400',
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        sizeInBytes: 1048576,
        fileName: 'exemplo2.jpg'
      },
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=600&h=400',
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
      url: `https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=400&h=300?random=${i}`,
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
        content: 'Excelente pergunta! Eu passei por essa situação recentemente. O processo todo levou cerca de 6 meses, mas pode variar dependendo da documentação.',
        author: {
          id: '7',
          name: 'Carla Mendes',
          avatar: undefined,
          city: 'Florença',
          country: 'Itália',
          profession: 'Médica Geral',
        },
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
        parentId: 'mock-6'
      },
      {
        id: 'reply-2',
        content: 'Concordo com a Carla. No meu caso demorou 8 meses porque tive que traduzir muitos documentos. Recomendo começar pelas traduções o quanto antes!',
        author: {
          id: '8',
          name: 'Marco Giuliani',
          avatar: undefined,
          city: 'Turim',
          country: 'Itália',
          profession: 'Ortopedista',
        },
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
        parentId: 'mock-6'
      },
      {
        id: 'reply-3',
        content: 'Obrigado pelas respostas! Vocês fizeram a tradução juramentada aqui na Itália ou no Brasil? E quanto custou aproximadamente?',
        author: {
          id: '6',
          name: 'Roberto Ferrari',
          avatar: undefined,
          city: 'Veneza',
          country: 'Itália',
          profession: 'Neurologista',
        },
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
        parentId: 'mock-6'
      },
      {
        id: 'reply-4',
        content: 'Eu fiz no consulado brasileiro aqui em Roma. Custou cerca de €50 por documento. Vale a pena ligar antes para confirmar os valores atualizados.',
        author: {
          id: '7',
          name: 'Carla Mendes',
          avatar: undefined,
          city: 'Florença',
          country: 'Itália',
          profession: 'Médica Geral',
        },
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
        parentId: 'mock-6'
      }
    ]
  }
];

export default function CommunityPage() {
  const t = useTranslations('Community');
  const { token, user, isAuthenticated } = useAuth();
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
                replies: comment.replies?.map((reply: CommunityComment) => ({
                  id: reply.id,
                  content: reply.content,
                  author: {
                    id: reply.author.id,
                    name: reply.author.fullName,
                    avatar: reply.author.profileImageUrl,
                    profileImageUrl: reply.author.profileImageUrl,
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
            title: post.title || '',
            content: post.content,
            author: post.author ? {
              id: post.author.id,
              name: post.author.name,
              avatar: post.author.profileImageUrl || post.author.avatar,
              profileImageUrl: post.author.profileImageUrl,
              city: post.author.city || '',
              country: post.author.country || '',
              profession: post.author.profession || '',
              role: post.author.role as 'student' | 'admin' | 'tutor' | undefined
            } : {
              id: post.authorId,
              name: 'Unknown User',
              avatar: undefined,
              profileImageUrl: undefined,
              city: '',
              country: '',
              profession: '',
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
            attachments: post.attachments || [],
            mediaType: post.mediaType,
            replies: replies
          };
        })
      );

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
  }, [searchQuery, selectedCourse, selectedLesson, selectedFilter, isAuthenticated, token]);

  // Fetch posts on component mount and when filters change
  useEffect(() => {
    if (isHydrated) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchPosts(1);
    }
  }, [isHydrated, fetchPosts]);

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
              city: '',
              country: '',
              profession: '',
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
        
        if (actionType === 'remove') {
          // DELETE endpoint for removing reaction - no body needed
          response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${topicId}/reactions`,
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
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/community/posts/${topicId}/reactions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                type: reactionToSend,
              }),
            }
          );
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
                      attachments: topic.attachments || [],
                      replies: topic.replies // Mantém os comentários do post
                    }}
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

          {/* Mock Posts Section - For Reference */}
          <div className="mt-16 p-6 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-2">
              🛡️ Exemplos de Moderação e Layouts
            </h2>
            <p className="text-gray-400 mb-4">
              Demonstração de funcionalidades de moderação (visíveis apenas para Admin/Tutor):
            </p>
            <ul className="text-sm text-gray-400 mb-6 space-y-1 list-disc list-inside">
              <li className="text-red-400">🚫 Posts/Comentários bloqueados - Aparecem com 50% opacidade para moderadores, invisíveis para students</li>
              <li className="text-yellow-400">✏️ Títulos editados - Indicador &quot;(título editado por moderador)&quot; visível para todos</li>
              <li className="text-green-400">🔧 Controles de moderação - Botões de editar/bloquear visíveis apenas para Admin/Tutor</li>
              <li className="text-blue-400">📎 Diferentes layouts de anexos - Imagens, vídeos e documentos</li>
            </ul>
            <div className="space-y-4">
              {mockTopicsWithAttachments.map(topic => (
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
                    console.log('Mock post reaction:', postId, reaction);
                  }}
                  onCommentReaction={(commentId, reaction) => {
                    console.log('Mock comment reaction:', commentId, reaction);
                  }}
                  onUpdate={() => {
                    console.log('♻️ Mock post update');
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

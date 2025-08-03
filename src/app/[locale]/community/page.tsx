'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Plus, MessageSquare, Heart, ThumbsUp, Eye, Calendar, User, Filter, Hash, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NavSidebar from '@/components/NavSidebar';

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
}

// Mock data
const mockTopics: Topic[] = [
  {
    id: '1',
    title: 'Como me preparar para a prova de Medicina Interna?',
    content: 'Olá pessoal! Estou começando a estudar para a prova de Medicina Interna e gostaria de dicas de quem já passou...',
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
    viewCount: 245,
    replyCount: 12,
    reactions: {
      heart: 8,
      thumbsUp: 15
    },
    tags: ['medicina-interna', 'estudos', 'prova'],
    course: {
      id: '1',
      title: 'Medicina Interna'
    },
    module: {
      id: '1',
      title: 'Fundamentos'
    },
    isPinned: true
  },
  {
    id: '2',
    title: 'Experiência com o processo de documentação',
    content: 'Compartilho aqui minha experiência com a documentação necessária para o processo de revalidação...',
    author: {
      id: '2',
      name: 'Giovanni Rossi',
      avatar: undefined,
      city: 'Milão',
      country: 'Itália',
      profession: 'Cirurgião'
    },
    createdAt: new Date('2024-01-14T15:30:00'),
    updatedAt: new Date('2024-01-14T15:30:00'),
    viewCount: 189,
    replyCount: 8,
    reactions: {
      heart: 12,
      thumbsUp: 20
    },
    tags: ['documentação', 'burocracia', 'dicas'],
  },
  {
    id: '3',
    title: 'Dúvida sobre equivalência de especialização',
    content: 'Alguém sabe como funciona a equivalência de especialização em Cardiologia? Preciso fazer nova residência?',
    author: {
      id: '3',
      name: 'Lucia Bianchi',
      avatar: undefined,
      city: 'Nápoles',
      country: 'Itália',
      profession: 'Cardiologista'
    },
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-14T11:20:00'),
    viewCount: 156,
    replyCount: 5,
    reactions: {
      heart: 3,
      thumbsUp: 7
    },
    tags: ['especialização', 'cardiologia', 'equivalência'],
    lesson: {
      id: '1',
      title: 'Processo de Equivalência'
    }
  }
];

export default function CommunityPage() {
  const t = useTranslations('Community');
  const [topics, setTopics] = useState<Topic[]>(mockTopics);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedTab, setSelectedTab] = useState('recent');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Ensure component is hydrated before rendering dynamic content
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Format date - consistent between server and client
  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return t('justNow');
    if (hours < 24) return t('hoursAgo', { hours });
    if (days < 7) return t('daysAgo', { days });
    
    // Use a consistent date format to avoid hydration mismatch
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, [t]);

  // Filter topics based on search and filters
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'pinned' && topic.isPinned) ||
                         (selectedFilter === 'my-posts' && topic.author.id === '1'); // Mock user ID

    const matchesCourse = selectedCourse === 'all' || topic.course?.id === selectedCourse;

    return matchesSearch && matchesFilter && matchesCourse;
  });

  // Sort topics based on selected tab
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    if (selectedTab === 'recent') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else if (selectedTab === 'popular') {
      return (b.viewCount + b.replyCount + b.reactions.heart + b.reactions.thumbsUp) - 
             (a.viewCount + a.replyCount + a.reactions.heart + a.reactions.thumbsUp);
    } else if (selectedTab === 'unanswered') {
      return a.replyCount - b.replyCount;
    }
    return 0;
  });

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

          {/* Search and Create */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-primary-dark/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-secondary focus:ring-secondary"
              />
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus size={20} className="mr-2" />
              {t('createTopic')}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[180px] bg-primary-dark/50 border-gray-700 text-white hover:bg-primary-dark/70 focus:ring-secondary">
                <Filter size={16} className="mr-2 text-gray-400" />
                <SelectValue placeholder={t('filterBy')} />
              </SelectTrigger>
              <SelectContent className="bg-primary-dark border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-primary/50">{t('filters.all')}</SelectItem>
                <SelectItem value="pinned" className="text-white hover:bg-primary/50">{t('filters.pinned')}</SelectItem>
                <SelectItem value="my-posts" className="text-white hover:bg-primary/50">{t('filters.myPosts')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[200px] bg-primary-dark/50 border-gray-700 text-white hover:bg-primary-dark/70 focus:ring-secondary">
                <BookOpen size={16} className="mr-2 text-gray-400" />
                <SelectValue placeholder={t('filterByCourse')} />
              </SelectTrigger>
              <SelectContent className="bg-primary-dark border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-primary/50">{t('allCourses')}</SelectItem>
                <SelectItem value="1" className="text-white hover:bg-primary/50">Medicina Interna</SelectItem>
                <SelectItem value="2" className="text-white hover:bg-primary/50">Cirurgia Geral</SelectItem>
                <SelectItem value="3" className="text-white hover:bg-primary/50">Pediatria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
            <TabsList className="bg-primary-dark/50 border-gray-700">
              <TabsTrigger value="recent" className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-primary">{t('tabs.recent')}</TabsTrigger>
              <TabsTrigger value="popular" className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-primary">{t('tabs.popular')}</TabsTrigger>
              <TabsTrigger value="unanswered" className="text-gray-400 data-[state=active]:text-white data-[state=active]:bg-primary">{t('tabs.unanswered')}</TabsTrigger>
            </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {/* Topics List */}
          <div className="space-y-4">
            {sortedTopics.map((topic) => (
              <Card key={topic.id} className={`group relative p-6 bg-primary-dark/50 border-gray-700 hover:bg-primary-dark/70 hover:shadow-xl hover:shadow-secondary/10 transition-all duration-300 cursor-pointer overflow-hidden ${topic.isPinned ? 'border-secondary ring-2 ring-secondary/20' : ''}`}>
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    {/* Topic Header */}
                    <div className="flex items-center gap-2 mb-2">
                      {topic.isPinned && (
                        <Badge variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">
                          {t('pinned')}
                        </Badge>
                      )}
                      <h3 className="text-xl font-semibold text-white group-hover:text-secondary transition-colors">
                        {topic.title}
                      </h3>
                    </div>

                    {/* Content Preview */}
                    <p className="text-gray-400 mb-4 line-clamp-2">
                      {topic.content}
                    </p>

                    {/* Course/Module/Lesson Info */}
                    {(topic.course || topic.module || topic.lesson) && (
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                        {topic.course && (
                          <div className="flex items-center gap-1">
                            <BookOpen size={14} className="text-secondary" />
                            <span>{topic.course.title}</span>
                          </div>
                        )}
                        {topic.module && (
                          <div className="flex items-center gap-1">
                            <Layers size={14} className="text-secondary" />
                            <span>{topic.module.title}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {topic.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-400 hover:border-secondary hover:text-secondary transition-colors">
                          <Hash size={10} className="mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      {/* Author Info */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary/20">
                          <Image
                            src={topic.author.avatar || '/icons/avatar.svg'}
                            alt={topic.author.name}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-white">{topic.author.name}</span>
                          <span className="text-gray-500">·</span>
                          <span className="text-gray-500">{isHydrated ? formatDate(topic.createdAt) : ''}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye size={16} className="text-gray-600" />
                          <span>{topic.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare size={16} className="text-gray-600" />
                          <span>{topic.replyCount}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-1 hover:text-red-400 transition-colors group">
                            <Heart size={16} className={`${topic.reactions.heart > 0 ? 'fill-current text-red-400' : 'text-gray-600'} group-hover:text-red-400`} />
                            <span>{topic.reactions.heart}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-blue-400 transition-colors group">
                            <ThumbsUp size={16} className={`${topic.reactions.thumbsUp > 0 ? 'fill-current text-blue-400' : 'text-gray-600'} group-hover:text-blue-400`} />
                            <span>{topic.reactions.thumbsUp}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {sortedTopics.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">{t('noTopics')}</h3>
              <p className="text-gray-400">{t('noTopicsDescription')}</p>
            </div>
          )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </NavSidebar>
  );
}
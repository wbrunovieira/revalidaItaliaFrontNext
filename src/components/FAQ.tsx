'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, Search, Compass, PlayCircle, FileText, MessageSquare, Users, User, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQProps {
  locale: string;
}

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags?: string[];
}

export default function FAQ({ locale }: FAQProps) {
  const t = useTranslations('FAQ');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // FAQ data - in production this would come from an API
  const faqData: FAQItem[] = [
    // Navegação e Interface
    {
      id: '1',
      category: 'navigation',
      question: t('questions.howToNavigate'),
      answer: t('answers.howToNavigate'),
      tags: ['navegação', 'menu', 'sidebar'],
    },
    {
      id: '2',
      category: 'navigation',
      question: t('questions.whereIsMyProgress'),
      answer: t('answers.whereIsMyProgress'),
      tags: ['progresso', 'acompanhamento', 'status'],
    },
    {
      id: '3',
      category: 'navigation',
      question: t('questions.howToFindCourse'),
      answer: t('answers.howToFindCourse'),
      tags: ['buscar', 'encontrar', 'curso'],
    },
    {
      id: '4',
      category: 'navigation',
      question: t('questions.darkMode'),
      answer: t('answers.darkMode'),
      tags: ['tema', 'escuro', 'claro'],
    },
    
    // Vídeos e Aulas
    {
      id: '5',
      category: 'videos',
      question: t('questions.videoNotPlaying'),
      answer: t('answers.videoNotPlaying'),
      tags: ['vídeo', 'reprodução', 'erro'],
    },
    {
      id: '6',
      category: 'videos',
      question: t('questions.downloadVideos'),
      answer: t('answers.downloadVideos'),
      tags: ['download', 'offline', 'baixar'],
    },
    {
      id: '7',
      category: 'videos',
      question: t('questions.videoSpeed'),
      answer: t('answers.videoSpeed'),
      tags: ['velocidade', 'reprodução', 'controles'],
    },
    {
      id: '8',
      category: 'videos',
      question: t('questions.subtitles'),
      answer: t('answers.subtitles'),
      tags: ['legendas', 'idioma', 'tradução'],
    },
    
    // Avaliações e Simulados
    {
      id: '9',
      category: 'assessments',
      question: t('questions.howToStartAssessment'),
      answer: t('answers.howToStartAssessment'),
      tags: ['avaliação', 'iniciar', 'teste'],
    },
    {
      id: '10',
      category: 'assessments',
      question: t('questions.assessmentTimeLimit'),
      answer: t('answers.assessmentTimeLimit'),
      tags: ['tempo', 'cronômetro', 'limite'],
    },
    {
      id: '11',
      category: 'assessments',
      question: t('questions.reviewAnswers'),
      answer: t('answers.reviewAnswers'),
      tags: ['revisar', 'gabarito', 'respostas'],
    },
    {
      id: '12',
      category: 'assessments',
      question: t('questions.retakeAssessment'),
      answer: t('answers.retakeAssessment'),
      tags: ['refazer', 'tentar', 'novamente'],
    },
    
    // Suporte e Tickets
    {
      id: '13',
      category: 'support',
      question: t('questions.howToCreateTicket'),
      answer: t('answers.howToCreateTicket'),
      tags: ['ticket', 'dúvida', 'criar'],
    },
    {
      id: '14',
      category: 'support',
      question: t('questions.ticketResponseTime'),
      answer: t('answers.ticketResponseTime'),
      tags: ['resposta', 'tempo', 'tutor'],
    },
    {
      id: '15',
      category: 'support',
      question: t('questions.attachFiles'),
      answer: t('answers.attachFiles'),
      tags: ['anexar', 'arquivo', 'imagem'],
    },
    {
      id: '16',
      category: 'support',
      question: t('questions.reopenTicket'),
      answer: t('answers.reopenTicket'),
      tags: ['reabrir', 'ticket', 'dúvida'],
    },
    
    // Comunidade
    {
      id: '17',
      category: 'community',
      question: t('questions.howToPost'),
      answer: t('answers.howToPost'),
      tags: ['postar', 'comunidade', 'publicar'],
    },
    {
      id: '18',
      category: 'community',
      question: t('questions.reportContent'),
      answer: t('answers.reportContent'),
      tags: ['denunciar', 'reportar', 'inadequado'],
    },
    {
      id: '19',
      category: 'community',
      question: t('questions.editPost'),
      answer: t('answers.editPost'),
      tags: ['editar', 'alterar', 'post'],
    },
    {
      id: '20',
      category: 'community',
      question: t('questions.privateMessages'),
      answer: t('answers.privateMessages'),
      tags: ['mensagem', 'privada', 'chat'],
    },
    
    // Perfil e Configurações
    {
      id: '21',
      category: 'profile',
      question: t('questions.updateProfile'),
      answer: t('answers.updateProfile'),
      tags: ['perfil', 'atualizar', 'foto'],
    },
    {
      id: '22',
      category: 'profile',
      question: t('questions.changePassword'),
      answer: t('answers.changePassword'),
      tags: ['senha', 'alterar', 'segurança'],
    },
    {
      id: '23',
      category: 'profile',
      question: t('questions.notifications'),
      answer: t('answers.notifications'),
      tags: ['notificações', 'alertas', 'email'],
    },
    {
      id: '24',
      category: 'profile',
      question: t('questions.deleteAccount'),
      answer: t('answers.deleteAccount'),
      tags: ['deletar', 'conta', 'cancelar'],
    },
  ];

  const categories = [
    { id: 'all', label: t('categories.all'), icon: <HelpCircle size={20} /> },
    { id: 'navigation', label: t('categories.navigation'), icon: <Compass size={20} /> },
    { id: 'videos', label: t('categories.videos'), icon: <PlayCircle size={20} /> },
    { id: 'assessments', label: t('categories.assessments'), icon: <FileText size={20} /> },
    { id: 'support', label: t('categories.support'), icon: <MessageSquare size={20} /> },
    { id: 'community', label: t('categories.community'), icon: <Users size={20} /> },
    { id: 'profile', label: t('categories.profile'), icon: <User size={20} /> },
  ];

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Prevent hydration issues by only rendering interactive content on client
  if (!mounted) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <motion.div 
              className="h-10 bg-white/5 rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="h-10 w-32 bg-white/10 rounded-lg"
            >
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            </motion.div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <motion.div 
                    className="h-6 bg-white/5 rounded"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                suppressHydrationWarning
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Filters */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {categories.map((category, index) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              selectedCategory === category.id
                ? "bg-secondary text-primary font-medium shadow-lg"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {category.icon}
            <span>{category.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="text-center py-12">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2 text-white">{t('noResults')}</h3>
                <p className="text-gray-400">{t('noResultsDescription')}</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredFAQs.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <Card
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all cursor-pointer overflow-hidden"
                  onClick={() => toggleExpanded(item.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <motion.div
                            animate={{ rotate: expandedItems.has(item.id) ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className={cn(
                              "h-5 w-5 transition-colors",
                              expandedItems.has(item.id) ? "text-secondary" : "text-gray-400"
                            )} />
                          </motion.div>
                          <h3 className="text-lg font-semibold text-white">
                            {item.question}
                          </h3>
                        </div>
                        
                        <AnimatePresence>
                          {expandedItems.has(item.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ 
                                opacity: 1, 
                                height: "auto",
                                transition: {
                                  height: { duration: 0.3, ease: "easeOut" },
                                  opacity: { duration: 0.2, delay: 0.1 }
                                }
                              }}
                              exit={{ 
                                opacity: 0, 
                                height: 0,
                                transition: {
                                  height: { duration: 0.2, ease: "easeIn" },
                                  opacity: { duration: 0.1 }
                                }
                              }}
                              className="ml-8 overflow-hidden"
                            >
                              <div className="pt-4">
                                <motion.p 
                                  initial={{ y: -10 }}
                                  animate={{ y: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="text-gray-300 whitespace-pre-line"
                                >
                                  {item.answer}
                                </motion.p>
                                
                                {item.tags && item.tags.length > 0 && (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                    className="flex flex-wrap gap-2 mt-4"
                                  >
                                    {item.tags.map((tag, tagIndex) => (
                                      <motion.div
                                        key={tag}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2, delay: 0.3 + tagIndex * 0.05 }}
                                      >
                                        <Badge
                                          variant="secondary"
                                          className="bg-secondary/20 text-secondary border-secondary/30"
                                        >
                                          {tag}
                                        </Badge>
                                      </motion.div>
                                    ))}
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Contact Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-secondary/20 to-secondary/10 border-secondary/30">
          <CardContent className="p-6 text-center">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <MessageSquare className="h-12 w-12 text-secondary mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {t('stillNeedHelp')}
            </h3>
            <p className="text-gray-300 mb-4">
              {t('contactSupport')}
            </p>
            <motion.a
              href={`/${locale}/my-tickets`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageSquare size={20} />
              {t('openTicket')}
            </motion.a>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
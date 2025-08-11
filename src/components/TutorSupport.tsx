'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { RespondSupportTicketModal } from './RespondSupportTicketModal';
import {
  HelpCircle,
  MessageSquare,
  FileText,
  User,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Eye,
  ChevronRight,
  ChevronLeft,
  Clock,
  AlertCircle,
  Paperclip,
  Tag,
} from 'lucide-react';

// Types for Support Tickets
type ContextType = 'LESSON' | 'ASSESSMENT' | 'FLASHCARD' | 'GENERAL';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

interface Student {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
}

interface Attachment {
  url: string;
  fileName: string;
  mimeType: string;
  sizeInBytes: number;
  type: 'IMAGE' | 'DOCUMENT' | 'OTHER';
}

interface Answer {
  id: string;
  content: string;
  createdAt: string;
  tutor: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  attachments: Attachment[];
}

interface SupportTicket {
  id: string;
  contextType: ContextType;
  contextId: string | null;
  contextTitle: string;
  content: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  student: Student;
  attachments: Attachment[];
  answers: Answer[];
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface TicketListItem {
  id: string;
  contextType: ContextType;
  contextId: string | null;
  contextTitle: string;
  status: 'OPEN';
  student: {
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  };
  messageCount: number;
  lastMessageAt: string | null;
  hasAttachments: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TicketsResponse {
  tickets: TicketListItem[];
  meta: PaginationMeta;
}

interface TutorSupportProps {
  locale: string;
}

export default function TutorSupport({ locale }: TutorSupportProps) {
  const { toast } = useToast();
  const t = useTranslations('Admin.support');
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [contextFilter, setContextFilter] = useState<ContextType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketListItem | null>(null);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
      });

      const response = await fetch(
        `${apiUrl}/api/v1/support/tickets/pending?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      console.log('Support tickets response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch support tickets: ${response.status}`);
      }

      const data: TicketsResponse = await response.json();
      console.log('Support tickets data:', data);
      
      setTickets(data.tickets || []);
      setMeta(data.meta || {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0
      });
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      
      // Set empty data to show the empty state instead of error
      setTickets([]);
      setMeta({
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0
      });
      
      // Only show toast for network errors, not 404s
      if (error instanceof Error && !error.message.includes('404')) {
        toast({
          title: t('error.fetchTitle'),
          description: t('error.fetchDescription'),
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, page, perPage, t, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const getStatusColor = (status: string) => {
    // All tickets from this endpoint are OPEN
    return 'text-blue-400 bg-blue-900/20';
  };

  const getStatusText = (status: string) => {
    // All tickets from this endpoint are OPEN
    return t('status.open');
  };

  const getContextColor = (contextType: ContextType) => {
    switch (contextType) {
      case 'LESSON':
        return 'text-purple-400 bg-purple-900/20';
      case 'ASSESSMENT':
        return 'text-orange-400 bg-orange-900/20';
      case 'FLASHCARD':
        return 'text-pink-400 bg-pink-900/20';
      case 'GENERAL':
        return 'text-gray-400 bg-gray-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getContextText = (contextType: ContextType) => {
    switch (contextType) {
      case 'LESSON':
        return t('context.lesson');
      case 'ASSESSMENT':
        return t('context.assessment');
      case 'FLASHCARD':
        return t('context.flashcard');
      case 'GENERAL':
        return t('context.general');
      default:
        return contextType;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale === 'it' ? 'it-IT' : 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredTickets = tickets.filter(ticket => {
    // Filter by context type
    if (contextFilter !== 'all' && ticket.contextType !== contextFilter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        ticket.student.fullName.toLowerCase().includes(search) ||
        ticket.contextTitle.toLowerCase().includes(search)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-300">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
          <p className="text-gray-400 mt-1">{t('description')}</p>
        </div>
        <button
          onClick={() => fetchTickets()}
          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <HelpCircle size={24} className="text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {tickets.length}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.open')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {tickets.filter(t => t.hasAttachments).length}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.withAttachments') || 'Com Anexos'}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <User size={24} className="text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {[...new Set(tickets.map(t => t.student.id))].length}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.uniqueStudents')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-400">
                {tickets.reduce((sum, t) => sum + t.messageCount, 0)}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.totalMessages') || 'Total de Mensagens'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">

        <div className="flex items-center gap-2">
          <Tag size={20} className="text-gray-400" />
          <select
            value={contextFilter}
            onChange={(e) => setContextFilter(e.target.value as any)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-secondary focus:outline-none"
          >
            <option value="all">{t('contextFilter.all')}</option>
            <option value="LESSON">{t('contextFilter.lesson')}</option>
            <option value="ASSESSMENT">{t('contextFilter.assessment')}</option>
            <option value="FLASHCARD">{t('contextFilter.flashcard')}</option>
            <option value="GENERAL">{t('contextFilter.general')}</option>
          </select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-secondary focus:outline-none"
          />
        </div>

        <div className="text-sm text-gray-400">
          {t('showing', { count: filteredTickets.length, total: meta?.total || 0 })}
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <HelpCircle size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">{t('noTickets')}</h3>
            <p className="text-gray-500">{t('noTicketsDescription')}</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {/* Student Avatar */}
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    {ticket.student.profileImageUrl ? (
                      <img
                        src={ticket.student.profileImageUrl}
                        alt={ticket.student.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={24} className="text-primary" />
                    )}
                  </div>

                  {/* Ticket Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {ticket.student.fullName}
                      </h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getContextColor(ticket.contextType)}`}>
                        {getContextText(ticket.contextType)}
                      </span>
                    </div>

                    {/* Context Title */}
                    {ticket.contextTitle && (
                      <p className="text-sm text-gray-400 mb-2">
                        {ticket.contextTitle}
                      </p>
                    )}

                    {/* Message Count Info */}
                    <p className="text-white mb-3">
                      {ticket.messageCount} {ticket.messageCount === 1 ? 'mensagem' : 'mensagens'} na conversa
                    </p>

                    {/* Attachments */}
                    {ticket.hasAttachments && (
                      <div className="flex items-center gap-2 mb-3">
                        <Paperclip size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {t('attachments')}
                        </span>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                      {ticket.messageCount > 1 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          <span>{ticket.messageCount} {t('messages') || 'mensagens'}</span>
                        </div>
                      )}
                      {ticket.lastMessageAt && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>Última: {formatDate(ticket.lastMessageAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setIsResponseModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  <MessageSquare size={16} />
                  <span>{t('respond')}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {t('pagination.perPage')}
            </span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-2 rounded bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              {t('pagination.first')}
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 py-2 text-white text-sm">
              {t('pagination.pageOf', { current: page, total: meta.totalPages })}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= meta.totalPages}
              className="p-2 rounded bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPage(meta.totalPages)}
              disabled={page >= meta.totalPages}
              className="p-2 rounded bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
            >
              {t('pagination.last')}
            </button>
          </div>
        </div>
      )}

      {/* Response Modal */}
      <RespondSupportTicketModal
        isOpen={isResponseModalOpen}
        onClose={() => {
          setIsResponseModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket ? {
          id: selectedTicket.id,
          contextType: selectedTicket.contextType,
          contextTitle: selectedTicket.contextTitle,
          student: {
            fullName: selectedTicket.student.fullName,
            email: selectedTicket.student.email,
          },
          messageCount: selectedTicket.messageCount,
          createdAt: selectedTicket.createdAt,
        } : null}
        onSuccess={() => {
          fetchTickets(); // Refresh the list after successful response
        }}
      />
    </div>
  );
}
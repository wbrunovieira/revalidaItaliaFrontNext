'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { CreateSupportTicketModal } from './CreateSupportTicketModal';
import { ViewTicketModal } from './ViewTicketModal';
import {
  HelpCircle,
  MessageSquare,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  ChevronRight,
  ChevronLeft,
  Clock,
  Paperclip,
  Tag,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// Types for Support Tickets
type ContextType = 'LESSON' | 'ASSESSMENT' | 'FLASHCARD' | 'GENERAL';
type TicketStatus = 'OPEN' | 'ANSWERED' | 'RESOLVED';

interface TicketListItem {
  id: string;
  status: TicketStatus;
  contextType: ContextType;
  contextId: string | null;
  contextTitle: string;
  messageCount: number;
  hasAttachments: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  tutor: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

interface TicketsResponse {
  tickets: TicketListItem[];
  meta: PaginationMeta;
}

interface StudentTicketsProps {
  locale: string;
}

export default function StudentTickets({ locale }: StudentTicketsProps) {
  const { toast } = useToast();
  const t = useTranslations('MyTickets');
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [contextFilter, setContextFilter] = useState<ContextType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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

      // Add filters
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      if (contextFilter !== 'all') {
        params.append('contextType', contextFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(
        `${apiUrl}/api/v1/support/tickets/my-tickets?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      console.log('My tickets response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const data: TicketsResponse = await response.json();
      console.log('My tickets data:', data);
      
      setTickets(data.tickets || []);
      setMeta(data.meta || {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0
      });
    } catch (error) {
      console.error('Error fetching my tickets:', error);
      
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
  }, [apiUrl, page, perPage, statusFilter, contextFilter, searchTerm, t, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'text-[#8BCAD9] bg-[#8BCAD9]/20';
      case 'ANSWERED':
        return 'text-[#79BED9] bg-[#79BED9]/20';
      case 'RESOLVED':
        return 'text-green-400 bg-green-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle size={14} />;
      case 'ANSWERED':
        return <MessageSquare size={14} />;
      case 'RESOLVED':
        return <CheckCircle size={14} />;
      default:
        return <HelpCircle size={14} />;
    }
  };

  const getStatusText = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return t('status.open');
      case 'ANSWERED':
        return t('status.answered');
      case 'RESOLVED':
        return t('status.resolved');
      default:
        return status;
    }
  };

  const getContextColor = (contextType: ContextType) => {
    switch (contextType) {
      case 'LESSON':
        return 'text-[#3887A6] bg-[#3887A6]/20';
      case 'ASSESSMENT':
        return 'text-[#79BED9] bg-[#79BED9]/20';
      case 'FLASHCARD':
        return 'text-[#8BCAD9] bg-[#8BCAD9]/20';
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

  const filteredTickets = tickets.filter(() => {
    // Context filter is already applied on the server side
    // This is just for any additional client-side filtering if needed
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

  // Count tickets by status
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const answeredCount = tickets.filter(t => t.status === 'ANSWERED').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTickets()}
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title={t('refresh')}
          >
            <RefreshCw size={20} />
          </button>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
        >
          <Plus size={20} />
          <span>{t('createNew')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-[#8BCAD9]" />
            <div>
              <p className="text-2xl font-bold text-[#8BCAD9]">
                {openCount}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.open')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-[#79BED9]" />
            <div>
              <p className="text-2xl font-bold text-[#79BED9]">
                {answeredCount}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.answered')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-400">
                {resolvedCount}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.resolved')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <HelpCircle size={24} className="text-[#3887A6]" />
            <div>
              <p className="text-2xl font-bold text-[#3887A6]">
                {meta?.total || 0}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.total')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-secondary text-primary'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {t('filter.all')}
        </button>
        <button
          onClick={() => setStatusFilter('OPEN')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'OPEN'
              ? 'bg-[#8BCAD9] text-primary'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {t('filter.open')}
        </button>
        <button
          onClick={() => setStatusFilter('ANSWERED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'ANSWERED'
              ? 'bg-[#79BED9] text-primary'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {t('filter.answered')}
        </button>
        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'RESOLVED'
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {t('filter.resolved')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <Tag size={20} className="text-gray-400" />
          <select
            value={contextFilter}
            onChange={(e) => setContextFilter(e.target.value as ContextType | 'all')}
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
            <p className="text-gray-500 mb-4">{t('noTicketsDescription')}</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
            >
              <Plus size={16} />
              <span>{t('createFirst')}</span>
            </button>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {getStatusText(ticket.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getContextColor(ticket.contextType)}`}>
                      {getContextText(ticket.contextType)}
                    </span>
                  </div>

                  {/* Context Title */}
                  {ticket.contextTitle && (
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {ticket.contextTitle}
                    </h3>
                  )}

                  {/* Message Count and Tutor Info */}
                  <div className="text-sm text-gray-400 mb-3">
                    <p>{ticket.messageCount} {ticket.messageCount === 1 ? t('message') : t('messages')}</p>
                    {ticket.tutor && (
                      <p className="mt-1">
                        {t('answeredBy')}: <span className="text-white">{ticket.tutor.fullName}</span>
                      </p>
                    )}
                  </div>

                  {/* Attachments */}
                  {ticket.hasAttachments && (
                    <div className="flex items-center gap-2 mb-3">
                      <Paperclip size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">
                        {t('hasAttachments')}
                      </span>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                    {ticket.updatedAt !== ticket.createdAt && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{t('updated')}: {formatDate(ticket.updatedAt)}</span>
                      </div>
                    )}
                    {ticket.resolvedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle size={14} className="text-green-400" />
                        <span>{t('resolved')}: {formatDate(ticket.resolvedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setIsViewModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Eye size={16} />
                  <span>{t('view')}</span>
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

      {/* Create Support Ticket Modal */}
      <CreateSupportTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          fetchTickets(); // Refresh the list after creating a new ticket
        }}
      />

      {/* View Ticket Modal */}
      <ViewTicketModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTicketId(null);
        }}
        ticketId={selectedTicketId}
        onStatusChange={() => {
          fetchTickets(); // Refresh the list after status change
        }}
        isTutor={false}
      />
    </div>
  );
}
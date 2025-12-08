// /src/components/DocumentConversations.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { ViewTicketModal } from './ViewTicketModal';
import Image from 'next/image';
import {
  FileSearch,
  MessageSquare,
  User,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  ChevronRight,
  ChevronLeft,
  Clock,
  Paperclip,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

type TicketStatus = 'OPEN' | 'ANSWERED' | 'RESOLVED';

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface TicketListItem {
  id: string;
  contextType: string;
  contextId: string | null;
  contextTitle: string;
  status: TicketStatus;
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

interface DocumentConversationsProps {
  locale: string;
}

export default function DocumentConversations({ locale }: DocumentConversationsProps) {
  const { toast } = useToast();
  const t = useTranslations('Admin.studentDocuments.conversations');
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
        contextType: 'DOCUMENT_ANALYSIS', // Only document analysis conversations
      });

      // Add status filter
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      // Add search term
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(
        `${apiUrl}/api/v1/support/tickets?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const data: TicketsResponse = await response.json();

      setTickets(data.tickets || []);
      setMeta(data.meta || {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0
      });
    } catch (error) {
      console.error('Error fetching document conversations:', error);

      setTickets([]);
      setMeta({
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0
      });

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
  }, [apiUrl, page, perPage, statusFilter, searchTerm, t, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'text-blue-400 bg-blue-900/20';
      case 'ANSWERED':
        return 'text-yellow-400 bg-yellow-900/20';
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
        return null;
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale === 'it' ? 'it-IT' : 'es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTickets = tickets.filter(ticket => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        ticket.student.fullName.toLowerCase().includes(search) ||
        ticket.contextTitle.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Count tickets by status
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const answeredCount = tickets.filter(t => t.status === 'ANSWERED').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

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
            <FileSearch size={24} className="text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {meta?.total || 0}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.total')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-blue-400">
                {openCount}
              </p>
              <p className="text-gray-400 text-sm">{t('stats.open')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} className="text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-400">
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
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'all'
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
              ? 'bg-blue-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {t('filter.open')}
        </button>
        <button
          onClick={() => setStatusFilter('ANSWERED')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'ANSWERED'
              ? 'bg-yellow-500 text-white'
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

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
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
            <FileSearch size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">{t('noConversations')}</h3>
            <p className="text-gray-500">{t('noConversationsDescription')}</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Student Avatar */}
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    {ticket.student.profileImageUrl ? (
                      <Image
                        src={ticket.student.profileImageUrl}
                        alt={ticket.student.fullName}
                        width={48}
                        height={48}
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
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {getStatusText(ticket.status)}
                      </span>
                    </div>

                    {/* Document Title */}
                    {ticket.contextTitle && (
                      <div className="flex items-center gap-2 mb-2">
                        <FileSearch size={16} className="text-purple-400" />
                        <p className="text-sm text-gray-300">
                          {ticket.contextTitle}
                        </p>
                      </div>
                    )}

                    {/* Message Count */}
                    <p className="text-white mb-3">
                      {ticket.messageCount} {ticket.messageCount === 1 ? t('message') : t('messages')}
                    </p>

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
                      {ticket.lastMessageAt && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{t('lastMessage')}: {formatDate(ticket.lastMessageAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setIsViewModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
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

      {/* View Ticket Modal */}
      <ViewTicketModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTicketId(null);
        }}
        ticketId={selectedTicketId}
        onStatusChange={() => {
          fetchTickets();
        }}
        isTutor={true}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  MessageSquare,
  FileText,
  User,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Ban,
  Shield,
} from 'lucide-react';

interface Report {
  id: string;
  type: 'POST' | 'COMMENT' | 'REPLY';
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  reason: string;
  description?: string;
  reportedBy: {
    id: string;
    name: string;
    email: string;
  };
  reportedUser?: {
    id: string;
    name: string;
    email: string;
  };
  reportedContent: {
    id: string;
    content: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: {
    id: string;
    name: string;
  };
  resolution?: string;
}

interface TutorReportsProps {
  locale: string;
}

export default function TutorReports({ locale }: TutorReportsProps) {
  const { toast } = useToast();
  const t = useTranslations('Tutor.reports');
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'POST' | 'COMMENT' | 'REPLY'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`${apiUrl}/api/v1/reports`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl, toast, t]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (reportId: string, newStatus: 'REVIEWING' | 'RESOLVED' | 'DISMISSED') => {
    try {
      setActionLoading(true);
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const body: any = { status: newStatus };
      if (newStatus === 'RESOLVED' || newStatus === 'DISMISSED') {
        body.resolution = resolution;
      }

      const response = await fetch(`${apiUrl}/api/v1/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      toast({
        title: t('success.updateTitle'),
        description: t('success.updateDescription'),
      });

      await fetchReports();
      setShowModal(false);
      setSelectedReport(null);
      setResolution('');
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: t('error.updateTitle'),
        description: t('error.updateDescription'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'REVIEWING':
        return 'text-blue-400 bg-blue-900/20';
      case 'RESOLVED':
        return 'text-green-400 bg-green-900/20';
      case 'DISMISSED':
        return 'text-gray-400 bg-gray-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'POST':
        return <FileText size={16} />;
      case 'COMMENT':
        return <MessageSquare size={16} />;
      case 'REPLY':
        return <MessageSquare size={14} />;
      default:
        return <FileText size={16} />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesStatus = filter === 'all' || report.status.toLowerCase() === filter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesSearch = 
      report.reportedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedBy.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.reportedUser?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedContent.content.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  // Stats calculation
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'PENDING').length,
    reviewing: reports.filter(r => r.status === 'REVIEWING').length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
    dismissed: reports.filter(r => r.status === 'DISMISSED').length,
  };

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-gray-400" />
            <div>
              <p className="text-2xl font-bold text-gray-300">{stats.total}</p>
              <p className="text-gray-400 text-sm">{t('stats.total')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-gray-400 text-sm">{t('stats.pending')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <Eye size={24} className="text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-blue-400">{stats.reviewing}</p>
              <p className="text-gray-400 text-sm">{t('stats.reviewing')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-green-400" />
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
              <p className="text-gray-400 text-sm">{t('stats.resolved')}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-3">
            <XCircle size={24} className="text-gray-400" />
            <div>
              <p className="text-2xl font-bold text-gray-400">{stats.dismissed}</p>
              <p className="text-gray-400 text-sm">{t('stats.dismissed')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-secondary focus:outline-none"
            >
              <option value="all">{t('filter.all')}</option>
              <option value="pending">{t('filter.pending')}</option>
              <option value="reviewing">{t('filter.reviewing')}</option>
              <option value="resolved">{t('filter.resolved')}</option>
              <option value="dismissed">{t('filter.dismissed')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Shield size={20} className="text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-secondary focus:outline-none"
            >
              <option value="all">{t('type.all')}</option>
              <option value="POST">{t('type.post')}</option>
              <option value="COMMENT">{t('type.comment')}</option>
              <option value="REPLY">{t('type.reply')}</option>
            </select>
          </div>

          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-secondary focus:outline-none w-64"
            />
          </div>
        </div>

        <button
          onClick={() => fetchReports()}
          className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <AlertTriangle size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">
              {t('noReports')}
            </h3>
            <p className="text-gray-500">{t('noReportsDescription')}</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <div key={report.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(report.type)}
                      <span className="text-sm text-gray-400">{t(`type.${report.type.toLowerCase()}`)}</span>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${getStatusColor(report.status)}`}>
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                      {t(`status.${report.status.toLowerCase()}`)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={12} />
                      {new Date(report.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Report Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{t('reason')}:</span>
                      <span className="text-sm font-medium text-white">{report.reason}</span>
                    </div>

                    {report.description && (
                      <div className="text-sm text-gray-300 bg-gray-700 p-3 rounded">
                        {report.description}
                      </div>
                    )}

                    <div className="bg-gray-700 p-3 rounded">
                      <p className="text-xs text-gray-400 mb-1">{t('reportedContent')}:</p>
                      <p className="text-sm text-gray-300 line-clamp-2">{report.reportedContent.content}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">{t('reportedBy')}:</p>
                          <p className="text-sm text-white">{report.reportedBy.name}</p>
                        </div>
                      </div>

                      {report.reportedUser && (
                        <div className="flex items-center gap-2">
                          <Ban size={14} className="text-red-400" />
                          <div>
                            <p className="text-xs text-gray-400">{t('reportedUser')}:</p>
                            <p className="text-sm text-white">{report.reportedUser.name}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {report.resolution && (
                      <div className="mt-3 p-3 bg-gray-900 rounded">
                        <p className="text-xs text-gray-400 mb-1">{t('resolution')}:</p>
                        <p className="text-sm text-gray-300">{report.resolution}</p>
                        {report.resolvedBy && (
                          <p className="text-xs text-gray-500 mt-2">
                            {t('resolvedBy')}: {report.resolvedBy.name} - {new Date(report.resolvedAt!).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex flex-col gap-2">
                  {report.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(report.id, 'REVIEWING')}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        {t('actions.review')}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowModal(true);
                        }}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                      >
                        {t('actions.resolve')}
                      </button>
                    </>
                  )}
                  
                  {report.status === 'REVIEWING' && (
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowModal(true);
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      {t('actions.complete')}
                    </button>
                  )}

                  <button
                    onClick={() => window.open(`/${locale}/community`, '_blank')}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
                  >
                    {t('actions.view')}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {t('modal.title')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('modal.resolution')}
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-secondary focus:outline-none"
                  rows={4}
                  placeholder={t('modal.resolutionPlaceholder')}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'RESOLVED')}
                  disabled={actionLoading || !resolution.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? t('modal.processing') : t('modal.resolve')}
                </button>
                
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'DISMISSED')}
                  disabled={actionLoading || !resolution.trim()}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? t('modal.processing') : t('modal.dismiss')}
                </button>
                
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedReport(null);
                    setResolution('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {t('modal.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
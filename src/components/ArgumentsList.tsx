// /src/components/ArgumentsList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  List,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Argument {
  id: string;
  title: string;
  assessmentId?: string;
  assessment?: {
    id: string;
    title: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function ArgumentsList() {
  const t = useTranslations('Admin.argumentsList');
  const { toast } = useToast();
  
  const [argumentsList, setArgumentsList] = useState<Argument[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  // Load arguments
  const loadArguments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/arguments?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load arguments');
      }

      const data = await response.json();
      setArgumentsList(data.arguments || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading arguments:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, t, toast]);

  // Load arguments when component mounts or pagination changes
  useEffect(() => {
    loadArguments();
  }, [loadArguments]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: string) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
        <p className="text-gray-400">{t('description')}</p>
      </div>

      {/* Results Count */}
      <div className="text-gray-400">
        {t('showing', { count: argumentsList.length, total: pagination.total })}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.title')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.assessment')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.createdAt')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.updatedAt')}
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary"></div>
                      {t('loading')}
                    </div>
                  </td>
                </tr>
              ) : argumentsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    {t('noArguments')}
                  </td>
                </tr>
              ) : (
                argumentsList.map((argument) => (
                  <tr key={argument.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <List size={16} className="text-green-400" />
                        <div className="text-white font-medium">{argument.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {argument.assessment ? (
                        <div className="text-sm">
                          <div>{argument.assessment.title}</div>
                          <div className="text-gray-500 text-xs">
                            {t(`types.${argument.assessment.type.toLowerCase()}`)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-500" />
                        {formatDate(argument.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-500" />
                        {formatDate(argument.updatedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            toast({
                              title: t('comingSoon'),
                              description: t('viewFeature'),
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title={t('actions.view')}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            toast({
                              title: t('comingSoon'),
                              description: t('editFeature'),
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title={t('actions.edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            toast({
                              title: t('comingSoon'),
                              description: t('deleteFeature'),
                            });
                          }}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t('actions.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-800/50 rounded-lg">
          {/* Page Info */}
          <div className="text-sm text-gray-400">
            {t('pagination.pageOf', { current: pagination.page, total: pagination.totalPages })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Limit Selector */}
            <div className="flex items-center gap-2">
              <Label className="text-gray-400 text-sm">{t('pagination.perPage')}</Label>
              <Select
                value={pagination.limit.toString()}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="w-20 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="5" className="text-white hover:bg-gray-600">5</SelectItem>
                  <SelectItem value="10" className="text-white hover:bg-gray-600">10</SelectItem>
                  <SelectItem value="20" className="text-white hover:bg-gray-600">20</SelectItem>
                  <SelectItem value="50" className="text-white hover:bg-gray-600">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrevious}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('pagination.first')}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevious}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('pagination.previous')}
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.page;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-secondary text-primary font-semibold'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {pagination.totalPages > 5 && (
                  <span className="text-gray-500 px-2">...</span>
                )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('pagination.next')}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNext}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('pagination.last')}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
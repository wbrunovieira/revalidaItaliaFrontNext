'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';

interface Transaction {
  id: string;
  externalId: string;
  provider: string;
  status: 'pending' | 'approved' | 'canceled' | 'refunded' | 'chargeback' | 'disputed';
  amount: {
    value: number;
    currency: string;
    formatted: string;
  };
  paymentMethod: string;
  installments: number;
  refundValue: {
    value: number;
    currency: string;
    formatted: string;
  } | null;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  customerPhone?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  productName: string;
  product: {
    id: string;
    name: string;
    internalCode: string;
  };
  purchaseDate: string;
  approvedDate?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function TransactionsList() {
  const t = useTranslations('Admin.transactions');
  const { token } = useAuth();
  const { toast } = useToast();

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch transactions
  const fetchTransactions = useCallback(async (page = 1) => {
    if (!token) return;

    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (searchQuery) queryParams.append('search', searchQuery);
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (providerFilter !== 'all') queryParams.append('provider', providerFilter);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/billing/transactions?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      console.log('Transactions data:', data);
      
      setTransactions(data.transactions || []);
      setPagination(data.pagination || {
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, pagination.pageSize, searchQuery, statusFilter, providerFilter, startDate, endDate, t, toast]);

  // Initial fetch
  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: t('status.pending'), className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      approved: { label: t('status.approved'), className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      canceled: { label: t('status.canceled'), className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
      refunded: { label: t('status.refunded'), className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      chargeback: { label: t('status.chargeback'), className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      disputed: { label: t('status.disputed'), className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Handle transaction click
  const handleTransactionClick = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setDetailsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('stats.total')}</p>
                <p className="text-2xl font-bold text-white">{pagination.totalCount}</p>
              </div>
              <DollarSign className="text-secondary opacity-50" size={32} />
            </div>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('stats.approved')}</p>
                <p className="text-2xl font-bold text-green-400">
                  {transactions.filter(t => t.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="text-green-400 opacity-50" size={32} />
            </div>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('stats.pending')}</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {transactions.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="text-yellow-400 opacity-50" size={32} />
            </div>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{t('stats.failed')}</p>
                <p className="text-2xl font-bold text-red-400">
                  {transactions.filter(t => ['canceled', 'refunded', 'chargeback', 'disputed'].includes(t.status)).length}
                </p>
              </div>
              <XCircle className="text-red-400 opacity-50" size={32} />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder={t('filters.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-600 text-white"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder={t('filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('status.pending')}</SelectItem>
                <SelectItem value="approved">{t('status.approved')}</SelectItem>
                <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
                <SelectItem value="refunded">{t('status.refunded')}</SelectItem>
                <SelectItem value="chargeback">{t('status.chargeback')}</SelectItem>
                <SelectItem value="disputed">{t('status.disputed')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder={t('filters.provider')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allProviders')}</SelectItem>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder={t('filters.startDate')}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-900 border-gray-600 text-white"
            />
            
            <Input
              type="date"
              placeholder={t('filters.endDate')}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-900 border-gray-600 text-white"
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setProviderFilter('all');
                setStartDate('');
                setEndDate('');
                fetchTransactions(1);
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {t('filters.clear')}
            </Button>
            <Button
              onClick={() => fetchTransactions(1)}
              className="bg-secondary text-primary-dark hover:bg-secondary/80"
            >
              <Search className="mr-2" size={16} />
              {t('filters.search')}
            </Button>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card className="bg-gray-800 border-gray-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-secondary" size={48} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
              <p className="text-gray-400">{t('noTransactions')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">{t('columns.date')}</TableHead>
                    <TableHead className="text-gray-300">{t('columns.customer')}</TableHead>
                    <TableHead className="text-gray-300">{t('columns.product')}</TableHead>
                    <TableHead className="text-gray-300">{t('columns.amount')}</TableHead>
                    <TableHead className="text-gray-300">{t('columns.status')}</TableHead>
                    <TableHead className="text-gray-300">{t('columns.provider')}</TableHead>
                    <TableHead className="text-gray-300">{t('columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id}
                      className="border-gray-700 hover:bg-primary-dark/30 transition-colors cursor-pointer"
                      onClick={() => handleTransactionClick(transaction.id)}
                    >
                      <TableCell className="text-white">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm">{formatDate(transaction.purchaseDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-white text-sm">
                          {transaction.customerName}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {transaction.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell className="text-white text-sm">
                        {transaction.product?.name || transaction.productName}
                      </TableCell>
                      <TableCell>
                        <div className="text-white font-semibold">
                          {transaction.amount.formatted}
                        </div>
                        {transaction.installments > 1 && (
                          <div className="text-gray-400 text-xs">
                            {transaction.installments}x
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-white text-sm capitalize">
                        {transaction.provider}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-secondary hover:text-secondary/80"
                        >
                          {t('actions.view')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {transactions.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {t('pagination.showing', { 
                    from: (pagination.page - 1) * pagination.pageSize + 1,
                    to: Math.min(pagination.page * pagination.pageSize, pagination.totalCount),
                    total: pagination.totalCount
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-gray-400 text-sm px-3">
                    {t('pagination.page', { current: pagination.page, total: pagination.totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Transaction Details Modal */}
      {selectedTransactionId && (
        <TransactionDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedTransactionId(null);
          }}
          transactionId={selectedTransactionId}
          token={token || ''}
        />
      )}
    </>
  );
}
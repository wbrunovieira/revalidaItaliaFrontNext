'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
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
  productName: string;
  customerName: string;
  customerEmail: string;
  customerDocument?: string;
  customerPhone?: string;
  purchaseDate: string;
  approvedDate?: string;
  canceledDate?: string;
  refundedDate?: string;
  refundValue?: {
    value: number;
    currency: string;
    formatted: string;
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  product?: {
    id: string;
    name: string;
    internalCode: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function TransactionsPage() {
  const t = useTranslations('Admin.transactions');
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'pt';
  const { user, token, isAuthenticated } = useAuth();
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Check if user is admin
  useEffect(() => {
    // Wait for auth to be loaded
    if (!isAuthenticated) {
      setIsCheckingAuth(true);
      return;
    }

    setIsCheckingAuth(false);

    if (!user || user.role !== 'admin') {
      console.log('User role check failed:', { user, role: user?.role });
      toast({
        title: t('errors.unauthorized'),
        description: t('errors.adminOnly'),
        variant: 'destructive',
      });
      router.push(`/${locale}`);
    }
  }, [user, router, t, toast, isAuthenticated, locale]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (page = 1) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (providerFilter !== 'all') params.append('provider', providerFilter);
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/billing/transactions?${params}`;
      console.log('Fetching transactions from:', url);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // If it's a 401, user is not authorized
        if (response.status === 401) {
          toast({
            title: t('errors.unauthorized'),
            description: t('errors.adminOnly'),
            variant: 'destructive',
          });
          router.push(`/${locale}`);
          return;
        }
        
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data = await response.json();
      console.log('Transactions data:', data);
      
      // Handle the response - check if it has the expected structure
      if (data.transactions) {
        setTransactions(data.transactions);
        setPagination(data.pagination || {
          page: 1,
          pageSize: 20,
          totalCount: data.transactions.length,
          totalPages: Math.ceil(data.transactions.length / 20),
        });
      } else {
        // If the API returns a different structure, adapt here
        console.warn('Unexpected API response structure:', data);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: t('errors.fetchTitle'),
        description: t('errors.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, searchQuery, statusFilter, providerFilter, startDate, endDate, pagination.pageSize, t, toast, locale, router]);

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
      minute: '2-digit',
    });
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: t('status.pending'), className: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
      approved: { label: t('status.approved'), className: 'bg-green-500/20 text-green-500 border-green-500/30' },
      canceled: { label: t('status.canceled'), className: 'bg-gray-500/20 text-gray-500 border-gray-500/30' },
      refunded: { label: t('status.refunded'), className: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
      chargeback: { label: t('status.chargeback'), className: 'bg-red-500/20 text-red-500 border-red-500/30' },
      disputed: { label: t('status.disputed'), className: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Get provider badge
  const getProviderBadge = (provider: string) => {
    const providerConfig = {
      hotmart: { label: 'Hotmart', className: 'bg-purple-500/20 text-purple-500 border-purple-500/30' },
      stripe: { label: 'Stripe', className: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30' },
      paypal: { label: 'PayPal', className: 'bg-blue-600/20 text-blue-600 border-blue-600/30' },
    };

    const config = providerConfig[provider as keyof typeof providerConfig] || 
      { label: provider, className: 'bg-gray-500/20 text-gray-500 border-gray-500/30' };
    
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

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-secondary mx-auto mb-4" size={48} />
          <p className="text-gray-400">Verificando autorização...</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-darker p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-dark/50 to-secondary/10 p-6 rounded-xl border border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <DollarSign className="text-secondary" size={32} />
                  {t('title')}
                </h1>
                <p className="text-gray-400 mt-2">{t('description')}</p>
              </div>
              <Button
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary/10"
                onClick={() => fetchTransactions(pagination.page)}
              >
                <RefreshCw size={16} className="mr-2" />
                {t('refresh')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="bg-primary-dark/50 border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-primary/50 border-gray-600 text-white"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-primary/50 border-gray-600 text-white">
                  <SelectValue placeholder={t('filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('status.pending')}</SelectItem>
                  <SelectItem value="approved">{t('status.approved')}</SelectItem>
                  <SelectItem value="canceled">{t('status.canceled')}</SelectItem>
                  <SelectItem value="refunded">{t('status.refunded')}</SelectItem>
                  <SelectItem value="chargeback">{t('status.chargeback')}</SelectItem>
                  <SelectItem value="disputed">{t('status.disputed')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Provider Filter */}
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="bg-primary/50 border-gray-600 text-white">
                  <SelectValue placeholder={t('filterByProvider')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allProviders')}</SelectItem>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-primary/50 border-gray-600 text-white"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-primary/50 border-gray-600 text-white"
                />
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{t('stats.approved')}</p>
                  <p className="text-2xl font-bold text-green-500">
                    {transactions.filter(t => t.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="text-green-500" size={24} />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{t('stats.pending')}</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {transactions.filter(t => t.status === 'pending').length}
                  </p>
                </div>
                <AlertCircle className="text-yellow-500" size={24} />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{t('stats.refunded')}</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {transactions.filter(t => t.status === 'refunded').length}
                  </p>
                </div>
                <RefreshCw className="text-blue-500" size={24} />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{t('stats.issues')}</p>
                  <p className="text-2xl font-bold text-red-500">
                    {transactions.filter(t => 
                      t.status === 'chargeback' || t.status === 'disputed'
                    ).length}
                  </p>
                </div>
                <XCircle className="text-red-500" size={24} />
              </div>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="bg-primary-dark/50 border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-secondary" size={32} />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto text-gray-500 mb-4" size={48} />
                  <p className="text-gray-400">{t('noTransactions')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-primary-dark/30">
                      <TableHead className="text-gray-300">{t('columns.date')}</TableHead>
                      <TableHead className="text-gray-300">{t('columns.customer')}</TableHead>
                      <TableHead className="text-gray-300">{t('columns.product')}</TableHead>
                      <TableHead className="text-gray-300">{t('columns.amount')}</TableHead>
                      <TableHead className="text-gray-300">{t('columns.provider')}</TableHead>
                      <TableHead className="text-gray-300">{t('columns.status')}</TableHead>
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
                          <div className="space-y-1">
                            <p className="text-white text-sm font-medium">{transaction.customerName}</p>
                            <p className="text-gray-400 text-xs">{transaction.customerEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-white text-sm">{transaction.productName}</p>
                            {transaction.product && (
                              <p className="text-gray-500 text-xs">{transaction.product.internalCode}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-white font-medium">{transaction.amount.formatted}</p>
                            {transaction.installments > 1 && (
                              <p className="text-gray-400 text-xs">
                                {transaction.installments}x
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getProviderBadge(transaction.provider)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-secondary hover:text-secondary/80"
                          >
                            {t('view')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-sm">
                    {t('showing', { 
                      from: (pagination.page - 1) * pagination.pageSize + 1,
                      to: Math.min(pagination.page * pagination.pageSize, pagination.totalCount),
                      total: pagination.totalCount 
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchTransactions(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="border-gray-600 text-white hover:bg-primary/50"
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="text-white px-3">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchTransactions(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="border-gray-600 text-white hover:bg-primary/50"
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
    </div>
  );
}
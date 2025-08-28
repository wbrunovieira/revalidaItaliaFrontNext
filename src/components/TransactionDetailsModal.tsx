'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, User, CreditCard, Package, Calendar, Globe, AlertCircle, CheckCircle, XCircle, Clock, RefreshCw, FileText, Webhook } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleDivider } from '@/components/ui/modern-divider';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  token: string;
}

interface TransactionDetails {
  transaction: {
    id: string;
    externalId: string;
    provider: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
  };
  payment: {
    amount: {
      value: number;
      currency: string;
      formatted: string;
    };
    method: string;
    installments: number;
    installmentValue: string;
    refundValue?: {
      value: number;
      currency: string;
      formatted: string;
    };
    netAmount: {
      value: number;
      currency: string;
      formatted: string;
    };
  };
  customer: {
    name: string;
    email: string;
    document?: string;
    phone?: string;
  };
  product: {
    id?: string;
    internalCode?: string;
    name?: string;
    externalId: string;
    externalName: string;
  };
  user: {
    id: string;
  };
  access?: {
    status: 'active' | 'inactive';
    startDate: string;
    endDate?: string;
    accessType: string;
  };
  timeline: {
    purchaseDate: string;
    approvedDate?: string;
    canceledDate?: string;
    refundedDate?: string;
  };
  webhookEvents: Array<{
    id: string;
    eventType: string;
    eventId: string;
    processed: boolean;
    processedAt?: string;
    createdAt: string;
  }>;
  metadata?: Record<string, unknown>;
}

export default function TransactionDetailsModal({
  isOpen,
  onClose,
  transactionId,
  token
}: TransactionDetailsModalProps) {
  const t = useTranslations('Admin.transactionDetails');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchTransactionDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/billing/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      const data = await response.json();
      setDetails(data);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [transactionId, token, t, toast]);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchTransactionDetails();
    }
  }, [isOpen, transactionId, fetchTransactionDetails]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'canceled':
      case 'refunded':
      case 'chargeback':
        return <XCircle className="text-red-500" size={20} />;
      case 'disputed':
        return <AlertCircle className="text-orange-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'canceled':
      case 'refunded':
      case 'chargeback':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'disputed':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="text-secondary" size={16} />;
      case 'pix':
        return <RefreshCw className="text-secondary" size={16} />;
      case 'boleto':
        return <FileText className="text-secondary" size={16} />;
      default:
        return <Globe className="text-secondary" size={16} />;
    }
  };

  // Function to render metadata recursively
  const renderMetadataValue = (value: unknown, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">null</span>;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      // If it's an object, render it as nested items
      return (
        <div className={`${depth > 0 ? 'ml-4 mt-1' : ''}`}>
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="py-1">
              <span className="text-gray-400">{k}: </span>
              {renderMetadataValue(v, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <span className="text-white font-mono text-sm">
          [{value.map(v => JSON.stringify(v)).join(', ')}]
        </span>
      );
    }

    // For primitive values
    return <span className="text-white font-mono text-sm">{String(value)}</span>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl text-white">
            {t('title')}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('title')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-20 w-full bg-gray-800" />
            <Skeleton className="h-40 w-full bg-gray-800" />
            <Skeleton className="h-40 w-full bg-gray-800" />
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Transaction Header */}
            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(details.transaction.status)}
                  <div>
                    <p className="text-sm text-gray-400">{t('transactionId')}</p>
                    <p className="text-white font-mono text-xs">{details.transaction.id}</p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(details.transaction.status)}`}>
                  {t(`status.${details.transaction.status}`)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">{t('externalId')}</p>
                  <p className="text-white font-mono">{details.transaction.externalId}</p>
                </div>
                <div>
                  <p className="text-gray-400">{t('provider')}</p>
                  <p className="text-white capitalize">{details.transaction.provider}</p>
                </div>
                <div>
                  <p className="text-gray-400">{t('createdAt')}</p>
                  <p className="text-white">{formatDate(details.transaction.createdAt)}</p>
                </div>
                {details.transaction.updatedAt && (
                  <div>
                    <p className="text-gray-400">{t('updatedAt')}</p>
                    <p className="text-white">{formatDate(details.transaction.updatedAt)}</p>
                  </div>
                )}
              </div>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full bg-gray-800 p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark">
                  {t('tabs.overview')}
                </TabsTrigger>
                <TabsTrigger value="payment" className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark">
                  {t('tabs.payment')}
                </TabsTrigger>
                <TabsTrigger value="customer" className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark">
                  {t('tabs.customer')}
                </TabsTrigger>
                <TabsTrigger value="timeline" className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark">
                  {t('tabs.timeline')}
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark">
                  {t('tabs.webhooks')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Payment Summary */}
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <CreditCard size={18} className="text-secondary" />
                    {t('payment.title')}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">{t('payment.amount')}</p>
                      <p className="text-2xl font-bold text-white">{details.payment.amount.formatted}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('payment.method')}</p>
                      <p className="text-white flex items-center gap-2">
                        {getPaymentMethodIcon(details.payment.method)}
                        {t(`payment.methods.${details.payment.method}`)}
                      </p>
                    </div>
                    {details.payment.installments > 1 && (
                      <div>
                        <p className="text-gray-400 text-sm">{t('payment.installments')}</p>
                        <p className="text-white">
                          {details.payment.installments}x {details.payment.installmentValue}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Product Information */}
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Package size={18} className="text-secondary" />
                    {t('product.title')}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-400 text-sm">{t('product.name')}</p>
                      <p className="text-white">{details.product.name || details.product.externalName}</p>
                    </div>
                    {details.product.internalCode && (
                      <div>
                        <p className="text-gray-400 text-sm">{t('product.code')}</p>
                        <p className="text-white font-mono">{details.product.internalCode}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Access Information */}
                {details.access && (
                  <Card className="bg-gray-800 border-gray-700 p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <User size={18} className="text-secondary" />
                      {t('access.title')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">{t('access.status')}</p>
                        <Badge className={details.access.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {t(`access.statuses.${details.access.status}`)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">{t('access.type')}</p>
                        <p className="text-white">{details.access.accessType}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">{t('access.startDate')}</p>
                        <p className="text-white">{formatDate(details.access.startDate)}</p>
                      </div>
                      {details.access.endDate && (
                        <div>
                          <p className="text-gray-400 text-sm">{t('access.endDate')}</p>
                          <p className="text-white">{formatDate(details.access.endDate)}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="payment" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h3 className="text-white font-semibold mb-4">{t('payment.details')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-700">
                      <span className="text-gray-400">{t('payment.grossAmount')}</span>
                      <span className="text-white font-semibold">{details.payment.amount.formatted}</span>
                    </div>
                    {details.payment.refundValue && (
                      <div className="flex justify-between py-2 border-b border-gray-700">
                        <span className="text-gray-400">{t('payment.refundAmount')}</span>
                        <span className="text-red-400 font-semibold">- {details.payment.refundValue.formatted}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2">
                      <span className="text-gray-400 font-semibold">{t('payment.netAmount')}</span>
                      <span className="text-white font-bold text-lg">{details.payment.netAmount.formatted}</span>
                    </div>
                  </div>
                  <SimpleDivider spacing="md" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">{t('payment.currency')}</p>
                      <p className="text-white">{details.payment.amount.currency}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('payment.valueInCents')}</p>
                      <p className="text-white font-mono">{details.payment.amount.value}</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="customer" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h3 className="text-white font-semibold mb-4">{t('customer.title')}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm">{t('customer.name')}</p>
                      <p className="text-white text-lg">{details.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('customer.email')}</p>
                      <p className="text-white">{details.customer.email}</p>
                    </div>
                    {details.customer.document && (
                      <div>
                        <p className="text-gray-400 text-sm">{t('customer.document')}</p>
                        <p className="text-white font-mono">{details.customer.document}</p>
                      </div>
                    )}
                    {details.customer.phone && (
                      <div>
                        <p className="text-gray-400 text-sm">{t('customer.phone')}</p>
                        <p className="text-white">{details.customer.phone}</p>
                      </div>
                    )}
                  </div>
                  <SimpleDivider spacing="md" />
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{t('customer.userId')}</p>
                    <p className="text-white font-mono text-xs">{details.user.id}</p>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h3 className="text-white font-semibold mb-4">{t('timeline.title')}</h3>
                  <div className="space-y-4">
                    {details.timeline.purchaseDate && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 bg-blue-500/20 rounded-full">
                          <Calendar size={16} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{t('timeline.purchase')}</p>
                          <p className="text-gray-400 text-sm">{formatDate(details.timeline.purchaseDate)}</p>
                        </div>
                      </div>
                    )}
                    {details.timeline.approvedDate && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 bg-green-500/20 rounded-full">
                          <CheckCircle size={16} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{t('timeline.approved')}</p>
                          <p className="text-gray-400 text-sm">{formatDate(details.timeline.approvedDate)}</p>
                        </div>
                      </div>
                    )}
                    {details.timeline.canceledDate && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 bg-red-500/20 rounded-full">
                          <XCircle size={16} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{t('timeline.canceled')}</p>
                          <p className="text-gray-400 text-sm">{formatDate(details.timeline.canceledDate)}</p>
                        </div>
                      </div>
                    )}
                    {details.timeline.refundedDate && (
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 bg-orange-500/20 rounded-full">
                          <RefreshCw size={16} className="text-orange-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{t('timeline.refunded')}</p>
                          <p className="text-gray-400 text-sm">{formatDate(details.timeline.refundedDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="webhooks" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Webhook size={18} className="text-secondary" />
                    {t('webhooks.title')}
                  </h3>
                  {details.webhookEvents.length > 0 ? (
                    <div className="space-y-3">
                      {details.webhookEvents.map((event) => (
                        <div key={event.id} className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white font-semibold">{event.eventType}</p>
                            <Badge className={event.processed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                              {event.processed ? t('webhooks.processed') : t('webhooks.pending')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-400">{t('webhooks.eventId')}</p>
                              <p className="text-white font-mono text-xs">{event.eventId}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">{t('webhooks.createdAt')}</p>
                              <p className="text-white text-xs">{formatDate(event.createdAt)}</p>
                            </div>
                            {event.processedAt && (
                              <div className="col-span-2">
                                <p className="text-gray-400">{t('webhooks.processedAt')}</p>
                                <p className="text-white text-xs">{formatDate(event.processedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">{t('webhooks.noEvents')}</p>
                  )}
                </Card>

                {/* Metadata */}
                {details.metadata && Object.keys(details.metadata).length > 0 && (
                  <Card className="bg-gray-800 border-gray-700 p-4">
                    <h3 className="text-white font-semibold mb-4">{t('metadata.title')}</h3>
                    <div className="space-y-2">
                      {Object.entries(details.metadata).map(([key, value]) => (
                        <div key={key} className="border-b border-gray-700 pb-2 mb-2 last:border-0">
                          <span className="text-gray-400 font-semibold">{key}:</span>
                          <div className="mt-1">
                            {renderMetadataValue(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">{t('noData')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, CheckCircle, XCircle, AlertCircle, Clock, Ban } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SimpleDivider } from '@/components/ui/modern-divider';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserAccessesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  token: string;
}

interface Access {
  id: string;
  userId: string;
  billingProductId: string;
  transactionId: string | null;
  accessType: 'FULL' | 'LIMITED' | 'TRIAL';
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';
  isActive: boolean;
  accessPeriod: {
    startDate: string;
    expirationDate: string | null;
    isActive: boolean;
    daysRemaining: number | null;
    isLifetime: boolean;
  };
  grantedCourses: string[];
  grantedPaths: string[];
  grantedModules: string[];
  suspendedInfo: {
    suspendedAt: string;
    suspendedReason: string;
  } | null;
  metadata?: {
    productName?: string;
    productInternalCode?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function UserAccessesModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  token
}: UserAccessesModalProps) {
  const t = useTranslations('Admin.userAccesses');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [includeExpired, setIncludeExpired] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUserAccesses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        includeExpired: includeExpired.toString()
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users/${userId}/accesses?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user accesses');
      }

      const data = await response.json();
      setAccesses(data.accesses || []);
      setPagination(data.pagination || {
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      });
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching user accesses:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, token, includeExpired, t, toast]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserAccesses(1);
    }
  }, [isOpen, userId, includeExpired, fetchUserAccesses]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'EXPIRED':
        return <Clock className="text-gray-500" size={20} />;
      case 'SUSPENDED':
        return <Ban className="text-orange-500" size={20} />;
      case 'REVOKED':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'EXPIRED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'SUSPENDED':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'REVOKED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'FULL':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'LIMITED':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'TRIAL':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

        {/* User Info */}
        <Card className="bg-gray-800 border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-lg">{userName}</p>
              <p className="text-gray-400 text-sm">{userEmail}</p>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {t('totalAccesses', { count: pagination.totalCount })}
            </Badge>
          </div>
        </Card>

        {/* Filter */}
        <div className="flex justify-between items-center">
          <Select value={includeExpired.toString()} onValueChange={(value) => setIncludeExpired(value === 'true')}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">{t('filters.activeOnly')}</SelectItem>
              <SelectItem value="true">{t('filters.includeExpired')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => fetchUserAccesses(1)}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {t('refresh')}
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full bg-gray-800" />
            <Skeleton className="h-32 w-full bg-gray-800" />
          </div>
        ) : accesses.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700 p-8 text-center">
            <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">{t('noAccesses')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {accesses.map((access) => (
              <Card key={access.id} className="bg-gray-800 border-gray-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(access.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(access.status)}>
                          {t(`status.${access.status}`)}
                        </Badge>
                        <Badge className={getAccessTypeColor(access.accessType)}>
                          {t(`accessType.${access.accessType}`)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {access.accessPeriod.isLifetime && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      {t('lifetime')}
                    </Badge>
                  )}
                </div>

                <SimpleDivider spacing="sm" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <p className="text-gray-400 text-sm">{t('startDate')}</p>
                    <p className="text-white">{formatDate(access.accessPeriod.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{t('expirationDate')}</p>
                    <p className="text-white">
                      {access.accessPeriod.expirationDate 
                        ? formatDate(access.accessPeriod.expirationDate)
                        : t('never')}
                    </p>
                  </div>
                  {access.accessPeriod.daysRemaining !== null && access.accessPeriod.daysRemaining > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm">{t('daysRemaining')}</p>
                      <p className="text-white font-semibold">
                        {access.accessPeriod.daysRemaining} {t('days')}
                      </p>
                    </div>
                  )}
                  {access.transactionId && (
                    <div>
                      <p className="text-gray-400 text-sm">{t('transactionId')}</p>
                      <p className="text-white font-mono text-xs">{access.transactionId}</p>
                    </div>
                  )}
                </div>

                {/* Product Information */}
                {(access.metadata?.productName || access.billingProductId) && (
                  <>
                    <SimpleDivider spacing="sm" />
                    <div className="mt-3">
                      <p className="text-gray-400 text-sm mb-1">{t('product')}</p>
                      <div className="space-y-2">
                        {access.metadata?.productName && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {access.metadata.productName}
                            </Badge>
                          </div>
                        )}
                        {access.metadata?.productInternalCode && (
                          <div className="text-gray-400 text-xs">
                            Código: {access.metadata.productInternalCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Granted Content */}
                {(access.grantedCourses.length > 0 || access.grantedPaths.length > 0 || access.grantedModules.length > 0 || access.billingProductId) && (
                  <>
                    <SimpleDivider spacing="sm" />
                    <div className="mt-3 space-y-2">
                      {access.grantedCourses.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">{t('grantedCourses')}</p>
                          <div className="flex flex-wrap gap-1">
                            {access.grantedCourses.map((courseId) => (
                              <Badge key={courseId} variant="outline" className="bg-gray-700 border-gray-600 text-gray-300 text-xs">
                                {courseId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {access.grantedPaths.length > 0 && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">{t('grantedPaths')}</p>
                          <div className="flex flex-wrap gap-1">
                            {access.grantedPaths.map((pathId) => (
                              <Badge key={pathId} variant="outline" className="bg-gray-700 border-gray-600 text-gray-300 text-xs">
                                {pathId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Suspended Info */}
                {access.suspendedInfo && (
                  <>
                    <SimpleDivider spacing="sm" />
                    <div className="mt-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <p className="text-orange-400 font-semibold mb-2">{t('suspendedInfo')}</p>
                      <p className="text-gray-300 text-sm">
                        {t('suspendedAt')}: {formatDateTime(access.suspendedInfo.suspendedAt)}
                      </p>
                      <p className="text-gray-300 text-sm">
                        {t('reason')}: {access.suspendedInfo.suspendedReason}
                      </p>
                    </div>
                  </>
                )}

                <div className="flex justify-end mt-3 text-xs text-gray-500">
                  {t('createdAt')}: {formatDateTime(access.createdAt)}
                </div>
              </Card>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUserAccesses(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  {t('previous')}
                </Button>
                <span className="text-gray-400 text-sm px-3">
                  {t('pageOf', { current: currentPage, total: pagination.totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUserAccesses(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  {t('next')}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
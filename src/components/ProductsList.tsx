'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { 
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DollarSign,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Link
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import ProductDetailsModal from '@/components/ProductDetailsModal';
import ProductContentMappingModal from '@/components/ProductContentMappingModal';

interface ProductMapping {
  provider: string;
  externalId: string;
  externalName: string | null;
  isActive: boolean;
}

interface ProductFeatures {
  hasLiveAccess?: boolean;
  hasRecordingAccess?: boolean;
  hasCertificate?: boolean;
  maxSimultaneousDevices?: number;
  allowDownloads?: boolean;
  supportPriority?: string;
  [key: string]: boolean | number | string | undefined;
}

interface Product {
  id: string;
  internalCode: string;
  name: string;
  description: string | null;
  courseIds: string[];
  pathIds: string[];
  accessDurationDays: number;
  dripContentEnabled: boolean;
  features: ProductFeatures;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  mappings?: ProductMapping[];
  courseNames?: string[];
  activeSubscriptions?: number;
  totalRevenue?: number;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export default function ProductsList() {
  const t = useTranslations('Admin.productsList');
  const { token } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [includeStats, setIncludeStats] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedProductForMapping, setSelectedProductForMapping] = useState<Product | null>(null);

  const fetchProducts = useCallback(async (page = 1) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
        includeStats: includeStats.toString(),
      });

      if (searchQuery) queryParams.append('search', searchQuery);
      if (activeFilter !== 'all') queryParams.append('isActive', activeFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/billing/products?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      console.log('Products API Response:', data); // Debug log
      
      setProducts(data.products || []);
      setPagination(data.pagination || {
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, pagination.pageSize, searchQuery, activeFilter, includeStats, t, toast]);

  useEffect(() => {
    fetchProducts(1);
  }, [searchQuery, activeFilter, includeStats, fetchProducts]);

  const toggleProductExpanded = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getAccessDurationLabel = (days: number) => {
    if (days === 0 || days >= 36500) return t('lifetime');
    if (days === 365) return t('oneYear');
    if (days === 180) return t('sixMonths');
    if (days === 90) return t('threeMonths');
    if (days === 30) return t('oneMonth');
    return t('days', { count: days });
  };

  const handleViewDetails = (productId: string) => {
    setSelectedProductId(productId);
    setDetailsModalOpen(true);
  };

  const handleOpenMappingModal = (product: Product) => {
    setSelectedProductForMapping(product);
    setMappingModalOpen(true);
  };

  const handleMappingSuccess = () => {
    fetchProducts(pagination.page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800 border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package className="text-secondary" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-white">{t('title')}</h3>
              <p className="text-sm text-gray-400">{t('description')}</p>
            </div>
          </div>
          <Badge className="bg-gray-700 text-gray-300">
            {t('totalProducts', { count: pagination.totalCount })}
          </Badge>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-600 text-white"
            />
          </div>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.all')}</SelectItem>
              <SelectItem value="true">{t('filters.active')}</SelectItem>
              <SelectItem value="false">{t('filters.inactive')}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 p-2 bg-gray-900 rounded-lg">
            <Checkbox
              id="includeStats"
              checked={includeStats}
              onCheckedChange={(checked) => setIncludeStats(checked as boolean)}
            />
            <Label htmlFor="includeStats" className="text-white cursor-pointer">
              {t('includeStats')}
            </Label>
          </div>

          <Button
            onClick={() => fetchProducts(1)}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Filter className="mr-2" size={16} />
            {t('applyFilters')}
          </Button>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="bg-gray-800 border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-secondary" size={48} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">{t('noProducts')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">{t('columns.expand')}</TableHead>
                  <TableHead className="text-gray-300">{t('columns.status')}</TableHead>
                  <TableHead className="text-gray-300">{t('columns.name')}</TableHead>
                  <TableHead className="text-gray-300">{t('columns.code')}</TableHead>
                  <TableHead className="text-gray-300">{t('columns.duration')}</TableHead>
                  <TableHead className="text-gray-300">{t('columns.courses')}</TableHead>
                  {includeStats && (
                    <>
                      <TableHead className="text-gray-300">{t('columns.subscriptions')}</TableHead>
                      <TableHead className="text-gray-300">{t('columns.revenue')}</TableHead>
                    </>
                  )}
                  <TableHead className="text-gray-300">{t('columns.createdAt')}</TableHead>
                  <TableHead className="text-gray-300">{t('columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <React.Fragment key={product.id}>
                    <TableRow 
                      className="border-gray-700 hover:bg-primary-dark/30 transition-colors"
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleProductExpanded(product.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          {expandedProducts.has(product.id) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge className={product.isActive 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                          {product.isActive ? t('active') : t('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-400 mt-1">{product.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-300">
                          {product.internalCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="text-gray-400" size={14} />
                          <span className="text-white text-sm">
                            {getAccessDurationLabel(product.accessDurationDays)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-700 text-gray-300">
                          {product.courseIds.length} {t('courses')}
                        </Badge>
                      </TableCell>
                      {includeStats && (
                        <>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="text-blue-400" size={14} />
                              <span className="text-white font-semibold">
                                {product.activeSubscriptions || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="text-green-400" size={14} />
                              <span className="text-white font-semibold">
                                {formatCurrency(product.totalRevenue || 0)}
                              </span>
                            </div>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="text-gray-400" size={14} />
                          <span className="text-gray-300 text-sm">
                            {formatDate(product.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(product.id)}
                            className="text-secondary hover:text-secondary/80"
                          >
                            <Eye className="mr-1" size={14} />
                            {t('actions.view')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMappingModal(product)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Link className="mr-1" size={14} />
                            {t('actions.link')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details */}
                    {expandedProducts.has(product.id) && (
                      <TableRow key={`${product.id}-expanded`} className="bg-gray-900/50">
                        <TableCell colSpan={includeStats ? 10 : 8} className="p-4">
                          <div className="space-y-4">
                            {/* Features */}
                            {product.features && Object.keys(product.features).length > 0 && (
                              <div>
                                <h4 className="text-white font-semibold mb-2">{t('features.title')}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {product.features.hasLiveAccess && (
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                      {t('features.hasLiveAccess')}
                                    </Badge>
                                  )}
                                  {product.features.hasRecordingAccess && (
                                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                      {t('features.hasRecordingAccess')}
                                    </Badge>
                                  )}
                                  {product.features.hasCertificate && (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                      {t('features.hasCertificate')}
                                    </Badge>
                                  )}
                                  {product.features.allowDownloads && (
                                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                      {t('features.allowDownloads')}
                                    </Badge>
                                  )}
                                  {product.features.maxSimultaneousDevices && (
                                    <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                                      {t('features.maxDevices', { count: product.features.maxSimultaneousDevices })}
                                    </Badge>
                                  )}
                                  {product.features.supportPriority && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                      {t(`features.support.${product.features.supportPriority}`)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Course Names */}
                            {product.courseNames && product.courseNames.length > 0 && (
                              <div>
                                <h4 className="text-white font-semibold mb-2">{t('includedCourses')}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {product.courseNames.map((courseName, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-gray-700 text-gray-300">
                                      {courseName}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Mappings */}
                            {product.mappings && product.mappings.length > 0 && (
                              <div>
                                <h4 className="text-white font-semibold mb-2">{t('externalMappings')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {product.mappings.map((mapping, idx) => (
                                    <div key={idx} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="text-white text-sm font-medium capitalize">{mapping.provider}</p>
                                          <p className="text-gray-400 text-xs mt-1">{mapping.externalName || mapping.externalId}</p>
                                          <code className="text-xs text-gray-500">ID: {mapping.externalId}</code>
                                        </div>
                                        {mapping.isActive ? (
                                          <CheckCircle className="text-green-400" size={16} />
                                        ) : (
                                          <XCircle className="text-red-400" size={16} />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Additional Info */}
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              {product.dripContentEnabled && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle size={14} />
                                  {t('dripContent')}
                                </div>
                              )}
                              {product.pathIds.length > 0 && (
                                <div>
                                  {t('learningPaths', { count: product.pathIds.length })}
                                </div>
                              )}
                              {product.updatedAt && (
                                <div>
                                  {t('lastUpdated')}: {formatDate(product.updatedAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {products.length > 0 && (
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
                  onClick={() => fetchProducts(pagination.page - 1)}
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
                  onClick={() => fetchProducts(pagination.page + 1)}
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

      {/* Product Details Modal */}
      {selectedProductId && (
        <ProductDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedProductId(null);
          }}
          productId={selectedProductId}
          token={token || ''}
        />
      )}

      {/* Content Mapping Modal */}
      {selectedProductForMapping && (
        <ProductContentMappingModal
          isOpen={mappingModalOpen}
          onClose={() => {
            setMappingModalOpen(false);
            setSelectedProductForMapping(null);
          }}
          product={{
            id: selectedProductForMapping.id,
            name: selectedProductForMapping.name,
            courseIds: selectedProductForMapping.courseIds,
            trackIds: selectedProductForMapping.pathIds,
          }}
          onSuccess={handleMappingSuccess}
        />
      )}
    </div>
  );
}
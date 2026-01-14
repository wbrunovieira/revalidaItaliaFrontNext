'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Package,
  BookOpen,
  Route
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  token: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
}

interface Path {
  id: string;
  name: string;
  description: string;
  slug: string;
  courseIds: string[];
}

interface ProductMapping {
  id: string;
  provider: string;
  externalId: string;
  externalName: string | null;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface ProductStats {
  activeSubscriptions: number;
  totalTransactions: number;
  totalRevenue: number;
  lastPurchaseDate: string | null;
}

interface ProductDetails {
  id: string;
  internalCode: string;
  name: string;
  description: string | null;
  content: {
    courseIds: string[];
    pathIds: string[];
    courses: Course[];
    paths: Path[];
    expandedCourseIds: string[];
  };
  accessDurationDays: number;
  dripContentEnabled: boolean;
  features: {
    hasLiveAccess?: boolean;
    hasRecordingAccess?: boolean;
    hasCertificate?: boolean;
    maxSimultaneousDevices?: number;
    allowDownloads?: boolean;
    supportPriority?: string;
  };
  mappings: ProductMapping[];
  isActive: boolean;
  stats?: ProductStats;
  createdAt: string;
  updatedAt: string | null;
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  productId,
  token,
}: ProductDetailsModalProps) {
  const t = useTranslations('Admin.productDetails');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchProductDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/billing/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }

      const data = await response.json();
      console.log('Product Details API Response:', data);
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }, [productId, token, t, toast, onClose]);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails();
    }
  }, [isOpen, productId, fetchProductDetails]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl text-white">
            <Package className="text-secondary" size={24} />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('title')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full bg-gray-800" />
            <Skeleton className="h-40 w-full bg-gray-800" />
            <Skeleton className="h-40 w-full bg-gray-800" />
          </div>
        ) : product ? (
          <div className="space-y-4">
            {/* Product Header */}
            <Card className="bg-gray-800 border-gray-700 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                    <Badge className={product.isActive 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                      {product.isActive ? t('active') : t('inactive')}
                    </Badge>
                  </div>
                  {product.description && (
                    <p className="text-gray-400 text-sm mb-3">{product.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <code className="bg-gray-900 px-2 py-0.5 rounded text-gray-400">
                        {product.internalCode}
                      </code>
                    </div>
                    {product.dripContentEnabled && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        {t('dripContent')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-2 w-full max-w-md bg-gray-800 p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark">
                  {t('tabs.overview')}
                </TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark">
                  {t('tabs.content')}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h4 className="text-white font-semibold mb-3">{t('overview.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">{t('overview.productId')}</p>
                      <p className="text-white font-mono text-xs">{product.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('overview.internalCode')}</p>
                      <p className="text-white">{product.internalCode}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{t('overview.createdAt')}</p>
                      <p className="text-white">{formatDate(product.createdAt)}</p>
                    </div>
                    {product.updatedAt && (
                      <div>
                        <p className="text-gray-400 text-sm">{t('overview.updatedAt')}</p>
                        <p className="text-white">{formatDate(product.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                {/* Courses */}
                {product.content.courses.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="text-blue-400" size={20} />
                      <h4 className="text-white font-semibold">
                        {t('content.courses')} ({product.content.courses.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {product.content.courses.map((course) => (
                        <div key={course.id} className="p-3 bg-gray-900 rounded-lg">
                          <p className="text-white font-medium">{course.title}</p>
                          {course.description && (
                            <p className="text-gray-400 text-sm mt-1">{course.description}</p>
                          )}
                          <code className="text-xs text-gray-500">/{course.slug}</code>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Paths */}
                {product.content.paths.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Route className="text-purple-400" size={20} />
                      <h4 className="text-white font-semibold">
                        {t('content.paths')} ({product.content.paths.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {product.content.paths.map((path) => (
                        <div key={path.id} className="p-3 bg-gray-900 rounded-lg">
                          <p className="text-white font-medium">{path.name}</p>
                          {path.description && (
                            <p className="text-gray-400 text-sm mt-1">{path.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-gray-700 text-gray-300">
                              {path.courseIds.length} {t('content.coursesInPath')}
                            </Badge>
                            <code className="text-xs text-gray-500">/{path.slug}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Total Content Access */}
                <Card className="bg-gray-800 border-gray-700 p-4">
                  <h4 className="text-white font-semibold mb-3">{t('content.totalAccess')}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{t('content.totalCourses')}</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {product.content.expandedCourseIds.length} {t('content.courses')}
                    </Badge>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
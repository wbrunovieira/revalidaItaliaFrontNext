'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Gift, Clock, Loader2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';

interface Product {
  id: string;
  name: string;
  internalCode: string;
  accessDurationDays: number;
  courseIds: string[];
  pathIds: string[];
}

interface GrantAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
  };
  onSuccess?: () => void;
}

export default function GrantAccessModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: GrantAccessModalProps) {
  const t = useTranslations('Admin.grantAccess');
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [customDuration, setCustomDuration] = useState(false);
  const [durationDays, setDurationDays] = useState<number | ''>('');
  const [lifetimeAccess, setLifetimeAccess] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/billing/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: t('error.fetchProductsTitle'),
        description: t('error.fetchProductsDescription'),
        variant: 'destructive',
      });
    }
  }, [t, token]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchProducts().finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, fetchProducts]);

  const handleSave = async () => {
    if (!selectedProductId) {
      toast({
        title: t('error.noProductTitle'),
        description: t('error.noProductDescription'),
        variant: 'destructive',
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: t('error.noReasonTitle'),
        description: t('error.noReasonDescription'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      interface GrantAccessBody {
        productId: string;
        reason: string;
        expirationDate?: string | null;
        durationDays?: number;
        startDate?: string;
      }
      
      const body: GrantAccessBody = {
        productId: selectedProductId,
        reason: reason.trim(),
      };

      if (lifetimeAccess) {
        body.expirationDate = null;
      } else if (customDuration && durationDays) {
        body.durationDays = Number(durationDays);
      } else if (customEndDate && endDate) {
        body.expirationDate = new Date(endDate).toISOString();
      }

      if (customStartDate && startDate) {
        body.startDate = new Date(startDate).toISOString();
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/users/${user.id}/accesses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to grant access');
      }

      toast({
        title: t('success.title'),
        description: t('success.description', { userName: user.name }),
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: t('error.saveTitle'),
        description: error instanceof Error ? error.message : t('error.saveDescription'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedProductId('');
    setReason('');
    setCustomDuration(false);
    setDurationDays('');
    setLifetimeAccess(false);
    setCustomStartDate(false);
    setStartDate('');
    setCustomEndDate(false);
    setEndDate('');
    onClose();
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const defaultDuration = selectedProduct?.accessDurationDays || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="text-secondary" size={24} />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm mt-1">
            {t('subtitle', { userName: user.name, userEmail: user.email })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-secondary" size={32} />
            <span className="ml-3 text-gray-400">{t('loading')}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product" className="text-white">
                {t('product.label')} *
              </Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder={t('product.placeholder')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {products.map((product) => (
                    <SelectItem 
                      key={product.id} 
                      value={product.id}
                      className="text-white hover:bg-gray-700"
                    >
                      {product.name} ({product.internalCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Info size={12} />
                  {t('product.defaultDuration', { days: defaultDuration })}
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-white">
                {t('reason.label')} *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reason.placeholder')}
                className="bg-gray-800 border-gray-700 text-white min-h-[80px]"
              />
              <p className="text-xs text-gray-400">{t('reason.help')}</p>
            </div>

            {/* Duration Options */}
            <div className="space-y-4 border border-gray-700 rounded-lg p-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Clock size={16} />
                {t('duration.title')}
              </h3>

              <div className="space-y-3">
                {/* Lifetime Access */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lifetime"
                    checked={lifetimeAccess}
                    onCheckedChange={(checked) => {
                      setLifetimeAccess(checked as boolean);
                      if (checked) {
                        setCustomDuration(false);
                        setCustomEndDate(false);
                      }
                    }}
                  />
                  <Label htmlFor="lifetime" className="text-white cursor-pointer">
                    {t('duration.lifetime')}
                  </Label>
                </div>

                {/* Custom Duration */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="customDuration"
                      checked={customDuration}
                      onCheckedChange={(checked) => {
                        setCustomDuration(checked as boolean);
                        if (checked) {
                          setLifetimeAccess(false);
                          setCustomEndDate(false);
                        }
                      }}
                      disabled={lifetimeAccess}
                    />
                    <Label htmlFor="customDuration" className="text-white cursor-pointer">
                      {t('duration.customDays')}
                    </Label>
                  </div>
                  {customDuration && (
                    <Input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value ? Number(e.target.value) : '')}
                      placeholder={t('duration.daysPlaceholder')}
                      className="bg-gray-800 border-gray-700 text-white ml-6 w-32"
                      min="1"
                    />
                  )}
                </div>

                {/* Custom Dates */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="customStartDate"
                      checked={customStartDate}
                      onCheckedChange={(checked) => setCustomStartDate(checked as boolean)}
                      disabled={lifetimeAccess}
                    />
                    <Label htmlFor="customStartDate" className="text-white cursor-pointer">
                      {t('duration.customStart')}
                    </Label>
                  </div>
                  {customStartDate && (
                    <Input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white ml-6"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="customEndDate"
                      checked={customEndDate}
                      onCheckedChange={(checked) => {
                        setCustomEndDate(checked as boolean);
                        if (checked) {
                          setLifetimeAccess(false);
                          setCustomDuration(false);
                        }
                      }}
                      disabled={lifetimeAccess}
                    />
                    <Label htmlFor="customEndDate" className="text-white cursor-pointer">
                      {t('duration.customEnd')}
                    </Label>
                  </div>
                  {customEndDate && (
                    <Input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white ml-6"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={saving}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !selectedProductId || !reason.trim()}
                className="bg-secondary hover:bg-secondary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    {t('granting')}
                  </>
                ) : (
                  <>
                    <Gift className="mr-2" size={16} />
                    {t('grant')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
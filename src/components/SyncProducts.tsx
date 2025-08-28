'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Package,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SimpleDivider } from '@/components/ui/modern-divider';

interface SyncResult {
  dryRun: boolean;
  provider: string;
  summary: {
    created: number;
    updated: number;
    deactivated: number;
    unchanged: number;
    errors: number;
  };
  results: Array<{
    productId: string;
    internalCode: string;
    name: string;
    action: 'created' | 'updated' | 'deactivated' | 'unchanged';
    changes: string[];
  }>;
  errors: Array<{
    externalId: string;
    error: string;
  }>;
  syncedAt: string;
}

export default function SyncProducts() {
  const t = useTranslations('Admin.syncProducts');
  const { token } = useAuth();
  const { toast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    if (!token) {
      toast({
        title: t('error.unauthorized'),
        description: t('error.unauthorizedDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    setLastSyncResult(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('dryRun', isDryRun.toString());
      if (selectedProvider !== 'all') {
        queryParams.append('provider', selectedProvider);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/billing/sync-products?${queryParams}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to sync products');
      }

      const data: SyncResult = await response.json();
      console.log('Sync Products API Response:', data); // Debug: Log completo da resposta da API
      setLastSyncResult(data);

      const { summary } = data;
      const hasChanges = summary.created > 0 || summary.updated > 0 || summary.deactivated > 0;

      if (isDryRun) {
        if (hasChanges) {
          toast({
            title: t('dryRun.hasChanges'),
            description: t('dryRun.hasChangesDesc', {
              created: summary.created,
              updated: summary.updated,
              deactivated: summary.deactivated
            }),
          });
        } else {
          toast({
            title: t('dryRun.noChanges'),
            description: t('dryRun.noChangesDesc'),
          });
        }
      } else {
        toast({
          title: t('success.title'),
          description: t('success.description', {
            created: summary.created,
            updated: summary.updated,
            deactivated: summary.deactivated
          }),
        });
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      toast({
        title: t('error.syncFailed'),
        description: t('error.syncFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{t('actions.created')}</Badge>;
      case 'updated':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{t('actions.updated')}</Badge>;
      case 'deactivated':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{t('actions.deactivated')}</Badge>;
      case 'unchanged':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{t('actions.unchanged')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800 border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Package className="text-secondary" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">{t('title')}</h2>
              <p className="text-gray-400 text-sm">{t('description')}</p>
            </div>
          </div>
        </div>

        <SimpleDivider spacing="sm" />

        {/* Sync Options */}
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Provider Selection */}
            <div>
              <Label className="text-gray-400 text-sm mb-2">{t('provider')}</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('providers.all')}</SelectItem>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dry Run Toggle */}
            <div>
              <Label className="text-gray-400 text-sm mb-2">{t('dryRunMode')}</Label>
              <div className="flex items-start space-x-2 p-3 bg-gray-900 rounded-lg">
                <Checkbox
                  id="dryRun"
                  checked={isDryRun}
                  onCheckedChange={(checked) => setIsDryRun(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label htmlFor="dryRun" className="text-white cursor-pointer">
                    {t('enableDryRun')}
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">{t('dryRunDescription')}</p>
                </div>
              </div>
            </div>

            {/* Sync Button */}
            <div className="flex items-end">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full bg-secondary text-primary-dark hover:bg-secondary/80"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    {t('syncing')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2" size={16} />
                    {isDryRun ? t('previewSync') : t('syncNow')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info Alert */}
          {isDryRun && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Info className="text-blue-400 mt-0.5" size={16} />
              <p className="text-sm text-gray-300">
                {t('dryRunInfo')}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Sync Results */}
      {lastSyncResult && (
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {lastSyncResult.dryRun ? t('previewResults') : t('syncResults')}
            </h3>
            <Badge className="bg-gray-700 text-gray-300">
              {new Date(lastSyncResult.syncedAt).toLocaleString('pt-BR')}
            </Badge>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{lastSyncResult.summary.created}</p>
              <p className="text-sm text-gray-400">{t('summary.created')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{lastSyncResult.summary.updated}</p>
              <p className="text-sm text-gray-400">{t('summary.updated')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{lastSyncResult.summary.deactivated}</p>
              <p className="text-sm text-gray-400">{t('summary.deactivated')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{lastSyncResult.summary.unchanged}</p>
              <p className="text-sm text-gray-400">{t('summary.unchanged')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{lastSyncResult.summary.errors}</p>
              <p className="text-sm text-gray-400">{t('summary.errors')}</p>
            </div>
          </div>

          <SimpleDivider spacing="sm" />

          {/* Detailed Results */}
          {lastSyncResult.results.length > 0 && (
            <div className="mt-4">
              <h4 className="text-white font-semibold mb-3">{t('detailedResults')}</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {lastSyncResult.results.map((result) => (
                  <div key={result.productId} className="p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{result.name}</span>
                          {getActionBadge(result.action)}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          {t('code')}: {result.internalCode}
                        </p>
                        {result.changes.length > 0 && (
                          <div className="text-sm text-gray-300">
                            {result.changes.map((change, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <CheckCircle className="text-green-400 mt-0.5" size={12} />
                                <span>{change}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {lastSyncResult.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="text-red-400" size={16} />
                {t('syncErrors')}
              </h4>
              <div className="space-y-2">
                {lastSyncResult.errors.map((error, idx) => (
                  <div key={idx} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="text-sm text-red-400">
                      {t('errorProduct')}: {error.externalId}
                    </p>
                    <p className="text-sm text-gray-300">{error.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Empty State */}
      {!lastSyncResult && !isSyncing && (
        <Card className="bg-gray-800 border-gray-700 p-12 text-center">
          <Package className="mx-auto text-gray-500 mb-4" size={48} />
          <p className="text-gray-400 mb-2">{t('noSyncYet')}</p>
          <p className="text-gray-500 text-sm">{t('noSyncYetDesc')}</p>
        </Card>
      )}
    </div>
  );
}
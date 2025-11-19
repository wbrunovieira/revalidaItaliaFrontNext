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
    changes?: string[];
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

    // 📊 LOGS DE PRODUÇÃO - INÍCIO
    const requestStartTime = Date.now();
    const requestTimestamp = new Date().toISOString();

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('dryRun', isDryRun.toString());
      if (selectedProvider !== 'all') {
        queryParams.append('provider', selectedProvider);
      }

      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/billing/sync-products?${queryParams}`;

      // 🔷 LOG 1: Request Configuration
      console.group('🚀 [SYNC PRODUCTS] REQUEST INICIADO');
      console.log('⏰ Timestamp:', requestTimestamp);
      console.log('🔧 Configuração:', {
        isDryRun,
        selectedProvider,
        queryString: queryParams.toString()
      });
      console.log('🌐 URL Completa:', fullUrl);
      console.log('🔑 Token presente:', !!token);
      console.log('🔑 Token prefix:', token ? `${token.substring(0, 20)}...` : 'N/A');
      console.groupEnd();

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const requestDuration = Date.now() - requestStartTime;

      // 🔷 LOG 2: Response Status
      console.group('📡 [SYNC PRODUCTS] RESPONSE RECEBIDO');
      console.log('⏱️ Tempo de resposta:', `${requestDuration}ms`);
      console.log('📊 Status:', response.status, response.statusText);
      console.log('✅ OK:', response.ok);
      console.log('🔗 Response URL:', response.url);
      console.log('📋 Headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        date: response.headers.get('date'),
      });
      console.groupEnd();

      if (!response.ok) {
        // 🔷 LOG 3: Error Response
        console.group('❌ [SYNC PRODUCTS] ERRO NA RESPOSTA');
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);

        let errorBody;
        try {
          errorBody = await response.json();
          console.error('Error Body (JSON):', errorBody);
        } catch {
          errorBody = await response.text();
          console.error('Error Body (Text):', errorBody);
        }
        console.groupEnd();

        throw new Error(`Failed to sync products: ${response.status} - ${response.statusText}`);
      }

      const data: SyncResult = await response.json();

      // 🔷 LOG 4: Response Data - Estrutura Completa
      console.group('📦 [SYNC PRODUCTS] DADOS DA RESPOSTA - ESTRUTURA COMPLETA');
      console.log('🔍 Response Object Completo:', JSON.stringify(data, null, 2));
      console.log('📐 Tipo da resposta:', typeof data);
      console.log('🗂️ Keys presentes:', Object.keys(data));
      console.groupEnd();

      // 🔷 LOG 5: Summary Analysis
      console.group('📊 [SYNC PRODUCTS] ANÁLISE DO SUMMARY');
      console.log('🎯 Summary completo:', data.summary);
      console.table({
        'Criados': data.summary?.created ?? 'N/A',
        'Atualizados': data.summary?.updated ?? 'N/A',
        'Desativados': data.summary?.deactivated ?? 'N/A',
        'Inalterados': data.summary?.unchanged ?? 'N/A',
        'Erros': data.summary?.errors ?? 'N/A',
      });

      const totalProducts = (data.summary?.created ?? 0) +
                          (data.summary?.updated ?? 0) +
                          (data.summary?.deactivated ?? 0) +
                          (data.summary?.unchanged ?? 0);
      console.log('📈 Total de produtos processados:', totalProducts);
      console.log('⚠️ Taxa de erro:', totalProducts > 0 ? `${((data.summary?.errors ?? 0) / totalProducts * 100).toFixed(2)}%` : '0%');
      console.groupEnd();

      // 🔷 LOG 6: Results Array Analysis
      console.group('📝 [SYNC PRODUCTS] ANÁLISE DOS RESULTADOS');
      console.log('📋 Total de resultados:', data.results?.length ?? 0);
      console.log('🔍 Array de resultados presente:', !!data.results);
      console.log('🔍 É um array:', Array.isArray(data.results));

      if (data.results && data.results.length > 0) {
        // Agrupa por action
        const groupedByAction = data.results.reduce((acc, result) => {
          const action = result.action || 'undefined';
          if (!acc[action]) acc[action] = [];
          acc[action].push(result);
          return acc;
        }, {} as Record<string, typeof data.results>);

        console.log('📊 Resultados agrupados por ação:');
        Object.entries(groupedByAction).forEach(([action, items]) => {
          console.group(`  ➤ ${action.toUpperCase()} (${items.length})`);
          items.forEach((item, idx) => {
            console.log(`    ${idx + 1}.`, {
              productId: item.productId,
              internalCode: item.internalCode,
              name: item.name,
              changesCount: item.changes?.length ?? 0,
              changes: item.changes
            });
          });
          console.groupEnd();
        });

        // Mostra primeiros 3 resultados completos
        console.group('🔬 PRIMEIROS 3 RESULTADOS (detalhado)');
        data.results.slice(0, 3).forEach((result, idx) => {
          console.log(`Resultado ${idx + 1}:`, result);
        });
        console.groupEnd();

        // Se houver mais de 10, mostra aviso
        if (data.results.length > 10) {
          console.warn(`⚠️ Total de ${data.results.length} resultados. Mostrando apenas primeiros 3 detalhados acima.`);
        }
      } else {
        console.warn('⚠️ Nenhum resultado no array results ou array vazio');
      }
      console.groupEnd();

      // 🔷 LOG 7: Errors Analysis
      console.group('⚠️ [SYNC PRODUCTS] ANÁLISE DE ERROS');
      console.log('🔢 Total de erros:', data.errors?.length ?? 0);
      console.log('🔍 Array de erros presente:', !!data.errors);
      console.log('🔍 É um array:', Array.isArray(data.errors));

      if (data.errors && data.errors.length > 0) {
        console.table(data.errors.map((err, idx) => ({
          Index: idx + 1,
          ExternalID: err.externalId,
          Error: err.error
        })));

        console.group('🔬 ERROS DETALHADOS');
        data.errors.forEach((error, idx) => {
          console.error(`Erro ${idx + 1}:`, error);
        });
        console.groupEnd();
      } else {
        console.log('✅ Nenhum erro encontrado');
      }
      console.groupEnd();

      // 🔷 LOG 8: Metadata & Additional Fields
      console.group('🔍 [SYNC PRODUCTS] CAMPOS ADICIONAIS E METADATA');
      console.log('🏷️ Provider:', data.provider ?? 'N/A');
      console.log('🎭 DryRun mode:', data.dryRun);
      console.log('⏰ SyncedAt:', data.syncedAt);
      console.log('📅 SyncedAt (parsed):', data.syncedAt ? new Date(data.syncedAt).toLocaleString('pt-BR') : 'N/A');

      // Verifica campos extras que não estão na interface
      const knownKeys = ['dryRun', 'provider', 'summary', 'results', 'errors', 'syncedAt'];
      const extraKeys = Object.keys(data).filter(key => !knownKeys.includes(key));

      if (extraKeys.length > 0) {
        console.warn('⚠️ Campos extras encontrados (não mapeados na interface):', extraKeys);
        extraKeys.forEach(key => {
          console.log(`  📌 ${key}:`, (data as never)[key]);
        });
      } else {
        console.log('✅ Nenhum campo extra encontrado');
      }
      console.groupEnd();

      // 🔷 LOG 9: Validação de Dados
      console.group('✔️ [SYNC PRODUCTS] VALIDAÇÃO DE DADOS');
      const validations = {
        'Summary existe': !!data.summary,
        'Summary tem todas as propriedades': !!(
          data.summary &&
          typeof data.summary.created === 'number' &&
          typeof data.summary.updated === 'number' &&
          typeof data.summary.deactivated === 'number' &&
          typeof data.summary.unchanged === 'number' &&
          typeof data.summary.errors === 'number'
        ),
        'Results é array': Array.isArray(data.results),
        'Errors é array': Array.isArray(data.errors),
        'Provider informado': !!data.provider,
        'DryRun informado': typeof data.dryRun === 'boolean',
        'SyncedAt informado': !!data.syncedAt,
        'Summary totais batem': data.summary ?
          (data.summary.created + data.summary.updated + data.summary.deactivated + data.summary.unchanged) ===
          (data.results?.length ?? 0) : false
      };

      console.table(validations);

      const failedValidations = Object.entries(validations).filter(([, value]) => !value);
      if (failedValidations.length > 0) {
        console.error('❌ Validações falharam:', failedValidations.map(([key]) => key));
      } else {
        console.log('✅ Todas as validações passaram!');
      }
      console.groupEnd();

      // 🔷 LOG 10: Resumo Final
      console.group('🎯 [SYNC PRODUCTS] RESUMO FINAL');
      console.log('✅ Sync concluído com sucesso');
      console.log('⏱️ Tempo total:', `${requestDuration}ms`);
      console.log('🎭 Modo:', isDryRun ? 'PREVIEW (Dry Run)' : 'PRODUÇÃO (Real Sync)');
      console.log('🔧 Provider:', selectedProvider);
      console.log('📊 Estatísticas:', {
        totalProcessados: totalProducts,
        criados: data.summary?.created ?? 0,
        atualizados: data.summary?.updated ?? 0,
        desativados: data.summary?.deactivated ?? 0,
        inalterados: data.summary?.unchanged ?? 0,
        erros: data.summary?.errors ?? 0,
      });
      console.groupEnd();

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
      // 🔷 LOG 11: Catch Block - Análise de Erro Completa
      const requestDuration = Date.now() - requestStartTime;

      console.group('🚨 [SYNC PRODUCTS] ERRO CAPTURADO NO CATCH');
      console.log('⏱️ Tempo até o erro:', `${requestDuration}ms`);
      console.log('⏰ Timestamp do erro:', new Date().toISOString());

      // Análise do tipo de erro
      console.log('📋 Tipo do erro:', typeof error);
      console.log('🔍 É instância de Error:', error instanceof Error);
      console.log('🔍 Constructor name:', error?.constructor?.name);

      // Detalhes do erro
      if (error instanceof Error) {
        console.error('❌ Error.name:', error.name);
        console.error('❌ Error.message:', error.message);
        console.error('❌ Error.stack:', error.stack);

        // Verifica se tem propriedades customizadas
        const errorKeys = Object.keys(error);
        if (errorKeys.length > 0) {
          console.log('📦 Propriedades do erro:', errorKeys);
          errorKeys.forEach(key => {
            console.log(`  📌 ${key}:`, (error as never)[key]);
          });
        }
      } else {
        console.error('❌ Erro (não é Error object):', error);
        console.error('❌ JSON.stringify do erro:', JSON.stringify(error, null, 2));
      }

      // Contexto do erro
      console.group('🔍 CONTEXTO DO ERRO');
      console.log('⚙️ isDryRun:', isDryRun);
      console.log('⚙️ selectedProvider:', selectedProvider);
      console.log('⚙️ Token presente:', !!token);
      console.log('⚙️ API URL:', process.env.NEXT_PUBLIC_API_URL);
      console.groupEnd();

      // Possíveis causas
      console.group('💡 DIAGNÓSTICO AUTOMÁTICO');
      const diagnostics = [];

      if (!token) {
        diagnostics.push('⚠️ Token não está presente - possível problema de autenticação');
      }

      if (!process.env.NEXT_PUBLIC_API_URL) {
        diagnostics.push('⚠️ NEXT_PUBLIC_API_URL não está definida');
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        diagnostics.push('⚠️ Possível problema de rede ou CORS');
      }

      if (error instanceof Error && error.message.includes('Failed to sync products')) {
        diagnostics.push('⚠️ Erro retornado pela API (response não OK)');
      }

      if (error instanceof SyntaxError) {
        diagnostics.push('⚠️ Erro ao fazer parse do JSON - resposta pode não ser JSON válido');
      }

      if (diagnostics.length > 0) {
        diagnostics.forEach(diag => console.warn(diag));
      } else {
        console.log('ℹ️ Nenhum diagnóstico automático aplicável');
      }
      console.groupEnd();

      console.groupEnd();

      toast({
        title: t('error.syncFailed'),
        description: t('error.syncFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);

      // 🔷 LOG 12: Finally Block
      console.log('🏁 [SYNC PRODUCTS] Finalizando operação de sync');
      console.log('🔄 isSyncing setado para:', false);
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
                        {result.changes && result.changes.length > 0 && (
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
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Send, X } from 'lucide-react';

export type ReportReason = 
  | 'INAPPROPRIATE_CONTENT'
  | 'SPAM'
  | 'OFFENSIVE_LANGUAGE'
  | 'HARASSMENT'
  | 'OTHER';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string; // ID do post ou comentário
  itemType: 'post' | 'comment';
  itemTitle?: string; // Título do post ou preview do comentário
  onSuccess?: () => void;
}

export default function ReportModal({
  isOpen,
  onClose,
  itemId,
  itemType,
  itemTitle,
  onSuccess,
}: ReportModalProps) {
  const t = useTranslations('Community');
  const { toast } = useToast();
  const [reason, setReason] = useState<ReportReason>('INAPPROPRIATE_CONTENT');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Log quando o modal muda de estado
  useEffect(() => {
    if (isOpen) {
      console.log('🎭 ========== MODAL DE DENÚNCIA ABERTO ==========');
      console.log(`📝 Tipo: ${itemType.toUpperCase()}`);
      console.log(`🆔 ID: ${itemId}`);
      console.log(`📄 Preview: ${itemTitle ? itemTitle.substring(0, 50) + '...' : 'Sem título'}`);
      console.log('🕐 Aberto em:', new Date().toISOString());
      console.log('================================================');
    } else {
      console.log('🎭 Modal de denúncia fechado');
    }
  }, [isOpen, itemId, itemType, itemTitle]);

  const handleSubmit = async () => {
    // Validate OTHER reason requires description
    if (reason === 'OTHER' && !description.trim()) {
      toast({
        title: t('report.error'),
        description: t('report.otherDescriptionRequired'),
        variant: 'destructive',
      });
      return;
    }

    // Validate description length
    if (description.length > 500) {
      toast({
        title: t('report.error'),
        description: t('report.descriptionTooLong'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log(`📝 Iniciando denúncia do ${itemType}:`, { 
        itemId, 
        itemType,
        reason, 
        hasDescription: !!description,
        descriptionLength: description.length 
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        console.error('❌ Token não encontrado nos cookies');
        throw new Error(t('report.authRequired'));
      }

      const reportPayload = {
        reason,
        description: description.trim() || undefined,
      };

      const endpoint = itemType === 'post' 
        ? `${apiUrl}/api/v1/community/posts/${itemId}/reports`
        : `${apiUrl}/api/v1/community/comments/${itemId}/reports`;

      // Log detalhado ANTES da requisição
      console.log('🚀 ========== INICIANDO DENÚNCIA ==========');
      console.log(`📝 Tipo de item: ${itemType.toUpperCase()}`);
      console.log(`🆔 ID do ${itemType}: ${itemId}`);
      console.log(`📍 Endpoint: ${endpoint}`);
      console.log('📦 Payload da requisição:', {
        reason,
        description: description || '(vazio)',
        descriptionLength: description.length
      });
      console.log(`🔑 Token presente: ${!!token ? 'SIM' : 'NÃO'}`);
      console.log(`🔑 Token (primeiros 20 chars): ${token ? token.substring(0, 20) + '...' : 'N/A'}`);
      console.log('🕐 Timestamp:', new Date().toISOString());
      console.log('==========================================');

      const response = await fetch(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(reportPayload),
        }
      );

      // Log detalhado da RESPOSTA
      console.log('📥 ========== RESPOSTA DA API ==========');
      console.log(`📊 Status HTTP: ${response.status} - ${response.statusText}`);
      console.log(`✅ Sucesso: ${response.ok ? 'SIM' : 'NÃO'}`);
      console.log('📋 Headers da resposta:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        date: response.headers.get('date'),
        server: response.headers.get('server')
      });

      let data;
      try {
        const responseText = await response.text();
        console.log('📄 Resposta bruta (texto):', responseText);
        console.log(`📏 Tamanho da resposta: ${responseText.length} caracteres`);
        
        if (responseText) {
          data = JSON.parse(responseText);
          console.log('✅ Parse JSON bem-sucedido');
        } else {
          data = {};
          console.warn('⚠️ Resposta vazia do servidor');
        }
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta:', parseError);
        data = { message: 'Erro ao processar resposta do servidor' };
      }

      console.log('📨 Dados da resposta processados:', JSON.stringify(data, null, 2));
      console.log('🕐 Timestamp da resposta:', new Date().toISOString());
      console.log('==========================================');

      if (!response.ok) {
        // Log detalhado de ERRO
        console.log('❌ ========== ERRO NA DENÚNCIA ==========');
        console.log(`🚨 Código de erro: ${response.status}`);
        console.log(`📝 Tipo de erro: ${response.statusText}`);
        console.log('📊 Detalhes do erro:', {
          message: data?.message || 'Sem mensagem de erro',
          error: data?.error || 'Sem detalhes adicionais',
          statusCode: data?.statusCode || response.status,
          type: data?.type || 'Não especificado'
        });
        console.log('==========================================');
        
        // Tratar erros específicos com mensagens amigáveis
        switch (response.status) {
          case 409:
            console.info('ℹ️ Denúncia duplicada - usuário já reportou este ' + itemType);
            toast({
              title: t('report.warning'),
              description: t('report.alreadyReported'),
              variant: 'default',
            });
            onClose(); // Fechar modal sem erro
            return; // Não lançar erro
            
          case 404:
            console.warn('⚠️ Post não encontrado no servidor');
            toast({
              title: t('report.error'),
              description: t('report.postNotFound'),
              variant: 'destructive',
            });
            onClose();
            return;
            
          case 400:
            console.warn('⚠️ Dados inválidos na requisição:', data?.message);
            // Verificar se é erro específico do OTHER
            if (data?.message?.includes('OTHER reason requires')) {
              toast({
                title: t('report.error'),
                description: t('report.otherDescriptionRequired'),
                variant: 'destructive',
              });
            } else {
              toast({
                title: t('report.error'),
                description: data?.message || t('report.invalidReason'),
                variant: 'destructive',
              });
            }
            return; // Não fechar modal para permitir correção
            
          case 401:
            console.warn('⚠️ Usuário não autenticado');
            toast({
              title: t('report.error'),
              description: t('report.authRequired'),
              variant: 'destructive',
            });
            onClose();
            // Opcionalmente redirecionar para login
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            return;
            
          default:
            console.error('❌ Erro inesperado não tratado:', {
              status: response.status,
              data
            });
            toast({
              title: t('report.error'),
              description: t('report.submitError'),
              variant: 'destructive',
            });
            return;
        }
      }

      // Log detalhado de SUCESSO
      console.log('✅ ========== DENÚNCIA BEM-SUCEDIDA ==========');
      console.log(`🎯 ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} denunciado com sucesso!`);
      console.log('📋 Detalhes do report criado:', {
        reportId: data.report?.id || 'ID não retornado',
        itemId: data.report?.postId || data.report?.commentId || itemId,
        reporterId: data.report?.reporterId || 'Não informado',
        reason: data.report?.reason || reason,
        status: data.report?.status || 'PENDING',
        createdAt: data.report?.createdAt || new Date().toISOString()
      });
      console.log('🕐 Timestamp do sucesso:', new Date().toISOString());
      console.log('=============================================');
      
      toast({
        title: t('report.success'),
        description: t('report.successDescription'),
      });

      // Reset form
      setReason('INAPPROPRIATE_CONTENT');
      setDescription('');
      
      onSuccess?.();
      onClose();
      console.log('🔄 Modal fechado após sucesso');
    } catch (error) {
      // Log detalhado de ERRO DE REDE
      console.log('🔥 ========== ERRO CRÍTICO ==========');
      console.log('💥 Tipo de erro: ERRO DE REDE OU EXCEÇÃO');
      console.log('🔍 Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        name: error instanceof Error ? error.name : 'N/A',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : 'N/A'
      });
      console.log(`🎯 Tentativa de denunciar: ${itemType} com ID ${itemId}`);
      console.log('🕐 Timestamp do erro:', new Date().toISOString());
      console.log('=====================================');
      
      toast({
        title: t('report.error'),
        description: t('report.submitError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      console.log('🔚 Processo de denúncia finalizado');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      console.log('🚪 Fechando modal de denúncia');
      setReason('INAPPROPRIATE_CONTENT');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="text-red-400" size={24} />
            {t('report.title')}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-gray-400">
              {itemTitle && (
                <div className="mb-2 p-2 bg-gray-700/50 rounded-lg">
                  <span className="text-xs text-gray-500">
                    {t(itemType === 'post' ? 'report.reportingPost' : 'report.reportingComment')}:
                  </span>
                  <p className="text-sm text-white mt-1 line-clamp-2">{itemTitle}</p>
                </div>
              )}
              <p className="text-sm">{t('report.description')}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-3">
            <Label className="text-white">{t('report.reasonLabel')}</Label>
            <RadioGroup
              value={reason}
              onValueChange={(value: string) => setReason(value as ReportReason)}
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded-lg">
                <RadioGroupItem value="INAPPROPRIATE_CONTENT" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer flex-1">
                  <div>
                    <p className="text-white">{t('report.reasons.inappropriate')}</p>
                    <p className="text-xs text-gray-400">{t('report.reasons.inappropriateDesc')}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded-lg">
                <RadioGroupItem value="SPAM" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer flex-1">
                  <div>
                    <p className="text-white">{t('report.reasons.spam')}</p>
                    <p className="text-xs text-gray-400">{t('report.reasons.spamDesc')}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded-lg">
                <RadioGroupItem value="OFFENSIVE_LANGUAGE" id="r3" />
                <Label htmlFor="r3" className="cursor-pointer flex-1">
                  <div>
                    <p className="text-white">{t('report.reasons.offensive')}</p>
                    <p className="text-xs text-gray-400">{t('report.reasons.offensiveDesc')}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded-lg">
                <RadioGroupItem value="HARASSMENT" id="r4" />
                <Label htmlFor="r4" className="cursor-pointer flex-1">
                  <div>
                    <p className="text-white">{t('report.reasons.harassment')}</p>
                    <p className="text-xs text-gray-400">{t('report.reasons.harassmentDesc')}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-2 hover:bg-gray-700/50 rounded-lg">
                <RadioGroupItem value="OTHER" id="r5" />
                <Label htmlFor="r5" className="cursor-pointer flex-1">
                  <div>
                    <p className="text-white">{t('report.reasons.other')}</p>
                    <p className="text-xs text-gray-400">{t('report.reasons.otherDesc')}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              {t('report.detailsLabel')} 
              {reason === 'OTHER' && <span className="text-red-400 ml-1">*</span>}
            </Label>
            <Textarea
              id="description"
              placeholder={t('report.detailsPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-400 text-right">
              {description.length}/500
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isSubmitting}
              className="flex-1 bg-gray-700 hover:bg-gray-600 border-gray-600 text-white"
            >
              <X size={16} className="mr-2" />
              {t('report.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (reason === 'OTHER' && !description.trim())}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t('report.submitting')}
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  {t('report.submit')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
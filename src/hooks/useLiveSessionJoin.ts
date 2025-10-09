/**
 * useLiveSessionJoin Hook
 *
 * Custom hook para gerenciar o fluxo de entrada em sessões Zoom ao vivo
 * usando tokens JWT únicos e temporais (15 minutos, one-time use).
 *
 * ⚠️ SEGURANÇA: Este hook implementa o novo fluxo de autenticação que substitui
 * o uso direto de joinUrl compartilhável.
 *
 * Fluxo:
 * 1. generateToken(sessionId) → POST /live-sessions/:id/join-token
 *    - Gera token JWT único (válido por 15 minutos)
 *    - Retorna URL frontend com token: /live-sessions/:id/join?token=xxx
 *
 * 2. joinWithToken(joinUrl) → GET /live-sessions/:id/join?token=xxx
 *    - Valida token (assinatura, expiração, one-time use)
 *    - Retorna URL única do Zoom
 *    - Invalida token após uso
 *    - Redireciona automaticamente para Zoom
 *
 * @example
 * ```tsx
 * const { generateToken, joinWithToken, isGenerating, error } = useLiveSessionJoin();
 *
 * const handleJoin = async () => {
 *   const response = await generateToken(sessionId);
 *   if (response) {
 *     await joinWithToken(response.joinUrl);
 *   }
 * };
 * ```
 *
 * @see Backend Integration Guide: Frontend Integration Guide: Live Session Join with Unique JWT Tokens
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import type {
  JoinTokenResponse,
  JoinSessionResponse,
  ApiProblemDetails,
} from '../types/live-session';

/**
 * Estados e funções retornadas pelo hook
 */
export interface UseLiveSessionJoinReturn {
  /** Indica se está gerando token JWT */
  isGenerating: boolean;
  /** Indica se está validando token e redirecionando */
  isJoining: boolean;
  /** Erro da última operação (se houver) */
  error: ApiProblemDetails | null;

  /** Gera token JWT único para entrar na sessão */
  generateToken: (sessionId: string) => Promise<JoinTokenResponse | null>;
  /** Valida token e redireciona para Zoom */
  joinWithToken: (joinUrl: string) => Promise<void>;
  /** Limpa o estado de erro */
  clearError: () => void;
}

/**
 * Hook para gerenciar entrada em sessões ao vivo com tokens únicos
 *
 * @returns Objeto com estados e funções para gerenciar entrada em sessões
 */
export function useLiveSessionJoin(): UseLiveSessionJoinReturn {
  const { token } = useAuth();
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<ApiProblemDetails | null>(null);

  /**
   * Limpa o estado de erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Passo 1: Gera token JWT único para entrar na sessão
   *
   * Validações backend:
   * - Usuário autenticado (JWT válido)
   * - Sessão existe
   * - Sessão está LIVE ou SCHEDULED
   * - Usuário tem acesso ao produto/curso da sessão
   * - Reutiliza token se ainda válido (cache Redis 20min)
   *
   * @param sessionId - UUID da sessão
   * @returns Response com token e URL, ou null em caso de erro
   */
  const generateToken = useCallback(
    async (sessionId: string): Promise<JoinTokenResponse | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        if (!token) {
          throw new Error('Usuário não autenticado');
        }

        console.log('🔐 [useLiveSessionJoin] Gerando token para sessão:', sessionId);
        console.log('📍 [useLiveSessionJoin] API_URL:', API_URL);
        console.log('🔗 [useLiveSessionJoin] URL completa:', `${API_URL}/api/v1/live-sessions/${sessionId}/join-token`);

        const response = await fetch(
          `${API_URL}/api/v1/live-sessions/${sessionId}/join-token`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('📡 [useLiveSessionJoin] Response status:', response.status);
        console.log('📡 [useLiveSessionJoin] Response ok:', response.ok);

        if (!response.ok) {
          // Clone response to read body multiple times
          const responseClone = response.clone();
          const rawText = await responseClone.text();
          console.log('📡 [useLiveSessionJoin] Raw response body:', rawText);

          let errorData: ApiProblemDetails;
          try {
            errorData = await response.json();
          } catch (parseError) {
            console.error('❌ [useLiveSessionJoin] Failed to parse error response:', parseError);
            errorData = {
              status: response.status,
              detail: `Erro ${response.status}: ${response.statusText}`,
            };
          }

          console.error('❌ [useLiveSessionJoin] Erro ao gerar token:', errorData);
          throw errorData;
        }

        const data: JoinTokenResponse = await response.json();

        console.log('✅ [useLiveSessionJoin] Token gerado com sucesso:', {
          joinUrl: data.joinUrl,
          expiresAt: data.expiresAt,
          expiresIn: data.expiresIn,
        });

        return data;
      } catch (err: unknown) {
        const apiError: ApiProblemDetails = {
          status: (err as ApiProblemDetails).status || 500,
          detail:
            (err as ApiProblemDetails).detail ||
            (err as Error).message ||
            'Erro ao gerar token de entrada',
          type: (err as ApiProblemDetails).type,
          title: (err as ApiProblemDetails).title,
        };

        setError(apiError);

        // Mostrar notificação específica por tipo de erro
        switch (apiError.status) {
          case 401:
            toast({
              title: 'Autenticação necessária',
              description: 'Você precisa estar autenticado para entrar na sessão',
              variant: 'destructive',
            });
            break;
          case 403:
            toast({
              title: 'Acesso negado',
              description:
                'Você não tem acesso a esta sessão. Verifique sua matrícula no curso.',
              variant: 'destructive',
            });
            break;
          case 404:
            console.error('❌ [useLiveSessionJoin] Erro 404 completo:', apiError);
            toast({
              title: 'Sessão não encontrada',
              description: apiError.detail || 'Esta sessão não existe ou foi removida',
              variant: 'destructive',
            });
            break;
          case 400:
            toast({
              title: 'Sessão indisponível',
              description: 'Esta sessão não está disponível para entrada no momento',
              variant: 'destructive',
            });
            break;
          case 503:
            toast({
              title: 'Serviço indisponível',
              description: 'O serviço está temporariamente indisponível. Tente novamente.',
              variant: 'destructive',
            });
            break;
          default:
            toast({
              title: 'Erro ao gerar token',
              description: apiError.detail || 'Erro ao gerar token de entrada. Tente novamente.',
              variant: 'destructive',
            });
        }

        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [token, toast]
  );

  /**
   * Passo 2: Valida token JWT e redireciona para Zoom
   *
   * ⚠️ IMPORTANTE: Esta função redireciona o navegador para outra página (Zoom)
   *
   * Validações backend:
   * - Token JWT válido (assinatura + não expirado)
   * - Token não foi usado antes (one-time use)
   * - Token não foi revogado
   * - Sessão está LIVE (não SCHEDULED/ENDED/CANCELLED)
   * - Invalida o token após uso
   *
   * @param joinUrl - URL completa do endpoint de validação (/live-sessions/:id/join?token=xxx)
   */
  const joinWithToken = useCallback(
    async (joinUrl: string): Promise<void> => {
      setIsJoining(true);
      setError(null);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        console.log('🚪 [useLiveSessionJoin] Validando token e entrando na sessão...');
        console.log('🔗 [useLiveSessionJoin] joinUrl recebido:', joinUrl);

        // Construir URL completa
        // Se joinUrl já é uma URL completa (http:// ou https://), usar diretamente
        // Se é um path relativo, concatenar com API_URL
        let fullUrl: string;
        if (joinUrl.startsWith('http://') || joinUrl.startsWith('https://')) {
          // URL absoluta - usar diretamente
          fullUrl = joinUrl;
        } else {
          // Path relativo - concatenar com API_URL
          // Garantir que joinUrl começa com / e que não há duplicação de /
          const path = joinUrl.startsWith('/') ? joinUrl : `/${joinUrl}`;
          fullUrl = `${API_URL}${path}`;
        }

        console.log('🔗 [useLiveSessionJoin] URL final construída:', fullUrl);

        // NOTA: Este endpoint é PÚBLICO (não precisa de Authorization header)
        const response = await fetch(fullUrl, {
          method: 'GET',
        });

        if (!response.ok) {
          const errorData: ApiProblemDetails = await response.json().catch(() => ({
            status: response.status,
            detail: `Erro ${response.status}: ${response.statusText}`,
          }));

          console.error('❌ [useLiveSessionJoin] Erro ao validar token:', errorData);
          throw errorData;
        }

        const data: JoinSessionResponse = await response.json();

        console.log('✅ [useLiveSessionJoin] Token validado com sucesso:', {
          sessionTitle: data.metadata.sessionTitle,
          sessionStatus: data.metadata.sessionStatus,
          joinedAt: data.metadata.joinedAt,
        });

        // Log para analytics (opcional)
        console.log('📊 [Analytics] Usuário entrando na sessão:', {
          title: data.metadata.sessionTitle,
          status: data.metadata.sessionStatus,
          timestamp: data.metadata.joinedAt,
        });

        // Mostrar notificação de sucesso
        toast({
          title: 'Entrando na sessão',
          description: `Redirecionando para: ${data.metadata.sessionTitle}`,
        });

        // Pequeno delay para usuário ver a notificação
        await new Promise((resolve) => setTimeout(resolve, 500));

        // REDIRECIONAR PARA ZOOM
        console.log('🔗 [useLiveSessionJoin] Redirecionando para Zoom:', data.redirectUrl);
        window.location.href = data.redirectUrl;
      } catch (err: unknown) {
        const apiError: ApiProblemDetails = {
          status: (err as ApiProblemDetails).status || 500,
          detail:
            (err as ApiProblemDetails).detail ||
            (err as Error).message ||
            'Erro ao entrar na sessão',
          type: (err as ApiProblemDetails).type,
          title: (err as ApiProblemDetails).title,
        };

        setError(apiError);

        // Mostrar notificação específica por tipo de erro
        if (apiError.status === 400) {
          // Pode ser: token expirado, já usado, sessão não LIVE, etc
          toast({
            title: 'Token inválido',
            description:
              'Não foi possível entrar na sessão. O link pode ter expirado ou já foi usado.',
            variant: 'destructive',
          });
        } else if (apiError.status === 404) {
          toast({
            title: 'Sessão não encontrada',
            description: 'Esta sessão não existe ou foi removida',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erro ao entrar na sessão',
            description: apiError.detail || 'Erro ao entrar na sessão. Tente novamente.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsJoining(false);
      }
    },
    [toast]
  );

  return {
    isGenerating,
    isJoining,
    error,
    generateToken,
    joinWithToken,
    clearError,
  };
}

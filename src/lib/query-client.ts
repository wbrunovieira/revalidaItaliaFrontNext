import { QueryClient } from '@tanstack/react-query'

// Log de inicialização
console.log('🚀 Inicializando QueryClient do TanStack Query...')

/**
 * Configuração global do QueryClient para TanStack Query
 * Define comportamentos padrão para cache, refetch e retry
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo que os dados são considerados "fresh" (não refetch automático)
      staleTime: 60 * 1000, // 1 minuto
      
      // Tempo que os dados permanecem em cache após componente desmontar
      gcTime: 5 * 60 * 1000, // 5 minutos (anteriormente cacheTime)
      
      // Número de tentativas em caso de erro
      retry: 3,
      
      // Delay entre tentativas (exponencial backoff)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch quando a janela volta ao foco
      refetchOnWindowFocus: true,
      
      // Refetch quando reconecta à internet
      refetchOnReconnect: true,
      
      // Não refetch quando monta o componente se os dados ainda são fresh
      refetchOnMount: true,
    },
    mutations: {
      // Configurações padrão para mutations
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
})

/**
 * Função helper para invalidar queries relacionadas
 * Útil após mutations que afetam múltiplas queries
 */
export const invalidateRelatedQueries = async (queryKeys: string[][]) => {
  await Promise.all(
    queryKeys.map((queryKey) => 
      queryClient.invalidateQueries({ queryKey })
    )
  )
}

/**
 * Função helper para prefetch de dados
 * Útil para melhorar UX com carregamento antecipado
 */
export const prefetchQuery = async (
  queryKey: string[],
  queryFn: () => Promise<unknown>,
  staleTime: number = 10 * 1000 // 10 segundos por padrão
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  })
}

/**
 * Limpar cache antigo manualmente
 * Útil para liberar memória em aplicações de longa duração
 */
export const clearOldCache = () => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  
  queryClient.removeQueries({
    predicate: (query) => {
      const lastUpdated = query.state.dataUpdatedAt
      return lastUpdated < oneDayAgo
    },
  })
}

/**
 * Resetar todo o cache
 * Útil após logout ou mudança de contexto
 */
export const resetQueryCache = () => {
  queryClient.clear()
}
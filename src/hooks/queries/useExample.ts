import { useQuery } from '@tanstack/react-query'

/**
 * Hook de exemplo para verificar funcionamento do TanStack Query
 * Será removido após validação da Fase 0
 */
export function useExampleQuery() {
  return useQuery({
    queryKey: ['example'],
    queryFn: async () => {
      // Simula uma chamada API
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        message: 'TanStack Query está funcionando!',
        timestamp: new Date().toISOString(),
      }
    },
    staleTime: 30 * 1000, // 30 segundos
  })
}
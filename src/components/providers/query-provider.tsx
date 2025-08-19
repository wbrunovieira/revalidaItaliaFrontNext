'use client'

import { QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'
import { ReactNode, useEffect } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Provider para TanStack Query
 * Fornece o QueryClient para toda a aplicação
 * Inclui DevTools em desenvolvimento
 */
export function QueryProvider({ children }: QueryProviderProps) {
  useEffect(() => {
    console.log('✅ QueryProvider inicializado com sucesso!')
    console.log('🔧 TanStack Query DevTools:', process.env.NODE_ENV === 'development' ? 'Habilitado' : 'Desabilitado')
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* ReactQueryDevtools desabilitado */}
      {/* {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )} */}
    </QueryClientProvider>
  )
}
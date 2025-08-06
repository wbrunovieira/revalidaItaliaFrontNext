'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Componente que inicializa o Auth Store ao carregar a aplicação
 * Verifica tokens existentes e restaura a sessão do usuário
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    // Inicializar auth ao montar o componente
    console.log('🔐 Inicializando Auth Store...')
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
}
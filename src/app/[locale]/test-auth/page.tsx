import { TestAuthStore } from '@/components/test-auth-store'

/**
 * Página temporária para testar o Auth Store
 * REMOVER APÓS VALIDAÇÃO DA FASE 1
 * 
 * Acesse: http://localhost:3000/pt/test-auth
 */
export default function TestAuthPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto py-8">
        <TestAuthStore />
      </div>
    </div>
  )
}
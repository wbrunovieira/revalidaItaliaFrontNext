'use client'

import { useExampleStore } from '@/stores/example.store'
import { useExampleQuery } from '@/hooks/queries/useExample'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Componente de teste para validar Zustand e TanStack Query
 * REMOVER APÓS VALIDAÇÃO DA FASE 0
 */
export function TestGlobalState() {
  // Teste Zustand
  const { count, increment, decrement, reset } = useExampleStore()
  
  // Teste TanStack Query
  const { data, isLoading, isError, refetch } = useExampleQuery()

  return (
    <div className="grid gap-4 md:grid-cols-2 p-4">
      {/* Teste Zustand */}
      <Card>
        <CardHeader>
          <CardTitle>✅ Zustand Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-2xl font-bold text-center">
              Count: {count}
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={increment} size="sm">
                +1
              </Button>
              <Button onClick={decrement} size="sm">
                -1
              </Button>
              <Button onClick={reset} variant="outline" size="sm">
                Reset
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Se o contador funciona, Zustand está OK ✅
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teste TanStack Query */}
      <Card>
        <CardHeader>
          <CardTitle>✅ TanStack Query Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading && (
              <div className="text-center">Carregando...</div>
            )}
            {isError && (
              <div className="text-center text-red-500">
                Erro ao carregar dados
              </div>
            )}
            {data && (
              <div>
                <p className="font-semibold">{data.message}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}
            <Button 
              onClick={() => refetch()} 
              size="sm" 
              className="w-full"
            >
              Refetch Data
            </Button>
            <p className="text-sm text-muted-foreground">
              Se os dados carregam, TanStack Query está OK ✅
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
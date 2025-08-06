'use client'

import { useAuth } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

/**
 * Componente de teste para validar o Auth Store
 * REMOVER APÓS VALIDAÇÃO DA FASE 1
 */
export function TestAuthStore() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isTutor,
    isStudent,
    displayName,
    roleLabel,
    login,
    logout,
    updateUser,
    initializeAuth,
    canAccessAdmin,
    canAccessTutorArea,
    clearError
  } = useAuth()

  const [email, setEmail] = useState('admin@admin.com')
  const [password, setPassword] = useState('Admin123!')

  const handleLogin = async () => {
    try {
      await login({ email, password })
    } catch (error) {
      console.error('Erro no login:', error)
    }
  }

  const handleUpdateUser = () => {
    updateUser({
      name: 'Nome Atualizado',
      phone: '+55 11 99999-9999'
    })
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-500'
      case 'tutor':
        return 'bg-gradient-to-r from-blue-500 to-amber-500'
      default:
        return 'bg-blue-400'
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">🔐 Teste do Auth Store (Zustand)</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Estado do Auth */}
        <Card>
          <CardHeader>
            <CardTitle>Estado da Autenticação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Autenticado:</span>
                <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                  {isAuthenticated ? '✅ Sim' : '❌ Não'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Loading:</span>
                <span>{isLoading ? '⏳ Carregando...' : '✅ Pronto'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Token:</span>
                <span className="text-xs truncate max-w-[150px]">
                  {token ? `${token.substring(0, 20)}...` : 'Nenhum'}
                </span>
              </div>
              
              {error && (
                <div className="p-2 bg-red-100 rounded text-red-600">
                  {error}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={clearError}
                    className="ml-2"
                  >
                    Limpar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dados do Usuário */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span className="text-xs">{user.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Nome:</span>
                  <span>{user.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="text-xs">{user.email}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {roleLabel}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Display Name:</span>
                  <span>{displayName}</span>
                </div>
                
                {user.phone && (
                  <div className="flex justify-between">
                    <span className="font-medium">Telefone:</span>
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum usuário logado</p>
            )}
          </CardContent>
        </Card>

        {/* Permissões */}
        <Card>
          <CardHeader>
            <CardTitle>Permissões Computadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isAdmin ? 'default' : 'outline'}>
                  Admin
                </Badge>
                <span className="text-sm">
                  {isAdmin ? '✅' : '❌'} isAdmin
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={isTutor ? 'default' : 'outline'}>
                  Tutor
                </Badge>
                <span className="text-sm">
                  {isTutor ? '✅' : '❌'} isTutor
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={isStudent ? 'default' : 'outline'}>
                  Student
                </Badge>
                <span className="text-sm">
                  {isStudent ? '✅' : '❌'} isStudent
                </span>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-sm">
                  <strong>canAccessAdmin():</strong> {canAccessAdmin() ? '✅' : '❌'}
                </p>
                <p className="text-sm">
                  <strong>canAccessTutorArea():</strong> {canAccessTutorArea() ? '✅' : '❌'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!isAuthenticated ? (
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                  <Button 
                    onClick={handleLogin} 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Fazendo login...' : '🔐 Login'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Use: admin@admin.com / Admin123!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button 
                    onClick={logout} 
                    variant="destructive" 
                    className="w-full"
                  >
                    🚪 Logout
                  </Button>
                  
                  <Button 
                    onClick={handleUpdateUser}
                    variant="outline"
                    className="w-full"
                  >
                    ✏️ Atualizar Nome/Telefone
                  </Button>
                  
                  <Button 
                    onClick={initializeAuth}
                    variant="outline"
                    className="w-full"
                  >
                    🔄 Re-inicializar Auth
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log de Console */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Instruções de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Faça login com as credenciais de teste</li>
            <li>Observe os dados do usuário sendo populados (nome e role)</li>
            <li>Verifique as permissões computadas (isAdmin, etc)</li>
            <li>Teste atualizar dados do usuário</li>
            <li>Faça logout e verifique se tudo é limpo</li>
            <li>Recarregue a página - o auth deve persistir!</li>
            <li>Abra o console para ver os logs de debug</li>
          </ol>
          
          <div className="mt-4 p-3 bg-green-50 rounded">
            <p className="text-sm font-medium text-green-800">
              ✅ Se tudo funcionar, o Auth Store está pronto para uso!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
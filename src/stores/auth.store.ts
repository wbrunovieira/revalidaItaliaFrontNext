import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getAuthToken,
  saveAuthToken,
  clearAuthToken,
  extractUserFromToken,
  decodeJWT,
  isTokenExpired,
  getCookie,
  setCookie,
  removeCookie
} from '@/lib/auth-utils';

/**
 * Interface do usuário com todos os campos necessários
 */
export interface User {
  id: string;
  email: string;
  name: string; // ESSENCIAL - usado em 10+ componentes
  role: 'admin' | 'student' | 'tutor'; // ESSENCIAL - controle de acesso
  profileImageUrl?: string;
  nationalId?: string; // CPF
  phone?: string;
  emailVerified?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

/**
 * Credenciais de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Resposta da API de login
 */
interface LoginResponse {
  token: string;
  user?: User;
}

/**
 * Estado e ações do Auth Store
 */
export interface AuthState {
  // Estado principal
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Computed helpers (getters derivados)
  isAdmin: boolean;
  isTutor: boolean;
  isStudent: boolean;

  // Actions principais
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;

  // Helpers de permissão
  canAccessAdmin: () => boolean;
  canAccessTutorArea: () => boolean;
  hasRole: (role: 'admin' | 'student' | 'tutor') => boolean;
  
  // Internal actions
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Auth Store com Zustand e persistência
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Computed getters (como funções, não propriedades)
      isAdmin: false,
      isTutor: false,
      isStudent: false,

      // Action: Login
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) {
            throw new Error('API URL não configurada');
          }
          const loginUrl = `${apiUrl}/api/v1/auth/login`;
          
          console.log('🔐 Tentando login em:', loginUrl);
          console.log('📧 Email:', credentials.email);
          
          // Fazer chamada para API de login
          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });
          
          console.log('📡 Response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.log('❌ Erro da API:', errorData);
            throw new Error(errorData?.message || errorData?.error || `Erro ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('📦 Resposta completa da API:', data);
          console.log('👤 Dados do user na resposta:', data.user);

          // A API pode retornar o token em diferentes formatos
          const token = data.token || data.accessToken || data.access_token;
          
          if (token) {
            saveAuthToken(token);
            
            // Usar dados do usuário retornados pela API primeiro, senão extrai do token
            const userData = data.user ? extractUserFromToken(data.user) : extractUserFromToken(token);
            console.log('🔄 Dados extraídos para salvar:', userData);
            
            set({
              token: token,
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              // Atualizar computed properties
              isAdmin: userData?.role === 'admin',
              isTutor: userData?.role === 'tutor',
              isStudent: userData?.role === 'student',
            });

            console.log('✅ Login realizado com sucesso!', {
              token: token.substring(0, 20) + '...',
              userName: userData?.name,
              userRole: userData?.role,
            });
          } else {
            throw new Error('Token não retornado pela API');
          }
        } catch (error) {
          console.error('❌ Erro no login:', error);
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro ao fazer login',
          });
          throw error;
        }
      },

      // Action: Logout
      logout: () => {
        // Limpar todos os tokens
        clearAuthToken();
        
        // Limpar localStorage do auth-storage (importante!)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          // Limpar também qualquer outro storage relacionado
          localStorage.removeItem('accessToken');
          sessionStorage.clear();
        }
        
        // Limpar cookies também
        removeCookie('auth-storage');
        removeCookie('token');
        
        // Resetar o estado
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          // Resetar computed properties
          isAdmin: false,
          isTutor: false,
          isStudent: false,
        });
        
        console.log('👋 Logout realizado - todos os dados limpos');
      },

      // Action: Update User
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ 
            user: updatedUser,
            // Atualizar computed properties se role mudou
            isAdmin: updatedUser.role === 'admin',
            isTutor: updatedUser.role === 'tutor',
            isStudent: updatedUser.role === 'student',
          });
          console.log('👤 Usuário atualizado:', updatedUser);
        }
      },

      // Action: Refresh Token
      refreshToken: async () => {
        // TODO: Implementar quando a API tiver endpoint de refresh
        console.log('⚠️ Refresh token não implementado ainda na API');
        
        // Por enquanto, apenas verifica se o token atual ainda é válido
        const currentToken = get().token;
        if (currentToken && !isTokenExpired(currentToken)) {
          console.log('✅ Token ainda válido');
        } else {
          console.log('❌ Token expirado - fazendo logout');
          get().logout();
        }
      },

      // Action: Initialize Auth (carrega token existente)
      initializeAuth: async () => {
        set({ isLoading: true });

        try {
          // Tentar obter token existente
          const existingToken = getAuthToken();

          if (existingToken && !isTokenExpired(existingToken)) {
            // Token válido encontrado - primeiro tenta extrair do JWT
            let userData = extractUserFromToken(existingToken);
            
            // Se não tiver nome, tenta buscar do localStorage do auth-storage
            if (!userData?.name) {
              try {
                const authStorage = localStorage.getItem('auth-storage');
                if (authStorage) {
                  const parsed = JSON.parse(authStorage);
                  if (parsed?.state?.user) {
                    userData = parsed.state.user;
                  }
                }
              } catch (e) {
                console.log('Não foi possível recuperar dados do usuário do storage');
              }
            }
            
            set({
              token: existingToken,
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              // Atualizar computed properties
              isAdmin: userData?.role === 'admin',
              isTutor: userData?.role === 'tutor',
              isStudent: userData?.role === 'student',
            });

            console.log('🔐 Auth inicializado do token existente:', {
              userName: userData?.name,
              userRole: userData?.role,
            });

            // TODO: Descomentar quando a API tiver endpoint de refresh
            // setTimeout(() => {
            //   get().refreshToken();
            // }, 1000);
          } else {
            // Nenhum token válido
            set({
              token: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('❌ Erro ao inicializar auth:', error);
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Action: Clear Error
      clearError: () => {
        set({ error: null });
      },

      // Helper: Can Access Admin
      canAccessAdmin: () => {
        const state = get();
        return state.isAuthenticated && state.user?.role === 'admin';
      },

      // Helper: Can Access Tutor Area
      canAccessTutorArea: () => {
        const state = get();
        return state.isAuthenticated && (state.user?.role === 'tutor' || state.user?.role === 'admin');
      },

      // Helper: Has Role
      hasRole: (role) => {
        const state = get();
        return state.isAuthenticated && state.user?.role === role;
      },

      // Internal setters
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage', // nome da chave no localStorage
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          // Tentar múltiplas fontes
          const cookieValue = getCookie('auth-storage');
          if (cookieValue) {
            try {
              return cookieValue;
            } catch {}
          }
          
          // Fallback para localStorage
          return localStorage.getItem(name);
        },
        setItem: (name, value) => {
          // Salvar em múltiplos lugares
          localStorage.setItem(name, value);
          // Também salvar em cookie para SSR
          setCookie('auth-storage', value, 7);
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
          removeCookie('auth-storage');
        },
      })),
      partialize: (state) => ({
        // Apenas persistir token e user
        token: state.token,
        user: state.user,
      }),
    }
  )
);

/**
 * Hook helper para usar o Auth Store com computed properties
 */
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    ...store,
    // Adicionar qualquer computed property adicional aqui
    displayName: store.user?.name || 'Usuário',
    roleLabel: store.user?.role === 'admin' ? 'Administrador' : 
               store.user?.role === 'tutor' ? 'Tutor' : 'Estudante',
  };
};
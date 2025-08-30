import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  getAuthToken,
  saveAuthToken,
  clearAuthToken,
  extractUserFromToken,
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
  fullName?: string; // Nome completo retornado pelo login
  role: 'admin' | 'student' | 'tutor'; // ESSENCIAL - controle de acesso
  profileImageUrl?: string;
  nationalId?: string; // CPF
  phone?: string;
  emailVerified?: boolean;
  createdAt?: string;
  lastLogin?: string;
  
  // Novos campos da API de login
  bio?: string;
  profession?: string;
  specialization?: string;
  birthDate?: string;
  communityProfileConsent?: boolean;
}

/**
 * Profile Completeness - Métricas de completude do perfil
 */
export interface ProfileCompleteness {
  percentage: number;
  completedSections: {
    basicInfo: boolean;
    documentation: boolean;
    professional: boolean;
    profileImage: boolean;
    address: boolean;
  };
  missingFields: string[];
  nextSteps: string[];
  totalFields: number;
  completedFields: number;
}

/**
 * Community Profile - Dados públicos da comunidade
 */
export interface CommunityProfile {
  communityProfileConsent: boolean;
  profession?: string;
  specialization?: string;
  city?: string;
  country?: string;
}

/**
 * Meta Information - Informações adicionais do login
 */
export interface MetaInfo {
  firstLogin: boolean;
  requiresPasswordChange: boolean;
  requiresProfileCompletion: boolean;
}

/**
 * Terms Acceptance - Dados de aceitação dos termos
 */
export interface TermsAcceptance {
  hasAccepted: boolean;
  acceptedAt: string | null;
  termsVersion: string;
  expiresAt?: string | null;
  acceptanceId?: string;
  syncedWithBackend: boolean;
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
export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'student' | 'admin' | 'tutor';
    profileImageUrl: string | null;
  };
  profileCompleteness: ProfileCompleteness;
  communityProfile: CommunityProfile;
  meta: MetaInfo;
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
  
  // Novos estados do login
  profileCompleteness: ProfileCompleteness | null;
  communityProfile: CommunityProfile | null;
  meta: MetaInfo | null;
  termsAcceptance: TermsAcceptance | null;

  // Computed helpers (getters derivados)
  isAdmin: boolean;
  isTutor: boolean;
  isStudent: boolean;

  // Actions principais
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  updateProfileCompleteness: (data: ProfileCompleteness) => void;
  updateCommunityProfile: (data: CommunityProfile) => void;
  refreshToken: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  
  // Terms actions
  acceptTerms: (termsVersion: string) => Promise<void>;
  checkTermsStatus: () => Promise<void>;
  migrateTermsFromLocalStorage: () => TermsAcceptance | null;

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
      profileCompleteness: null,
      communityProfile: null,
      meta: null,
      termsAcceptance: null,

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

          const data: LoginResponse = await response.json();
          console.log('📦 Resposta completa da API:', data);
          console.log('👤 Dados do user na resposta:', data.user);
          console.log('📊 Profile Completeness:', data.profileCompleteness);
          console.log('🌐 Community Profile:', data.communityProfile);

          // A API retorna o token como accessToken
          const token = data.accessToken;
          
          if (token) {
            saveAuthToken(token);
            
            // Processar dados do usuário - usar fullName como name para compatibilidade
            const userData: User = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.fullName, // Manter compatibilidade com componentes existentes
              fullName: data.user.fullName,
              role: data.user.role,
              profileImageUrl: data.user.profileImageUrl || undefined,
              // Adicionar campos do communityProfile se consentido
              ...(data.communityProfile.communityProfileConsent && {
                profession: data.communityProfile.profession,
                specialization: data.communityProfile.specialization,
                communityProfileConsent: true,
              }),
            };
            
            console.log('🔄 Dados processados do usuário:', userData);
            
            set({
              token: token,
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              // Novos campos
              profileCompleteness: data.profileCompleteness,
              communityProfile: data.communityProfile,
              meta: data.meta,
              termsAcceptance: null, // Will be checked separately
              // Atualizar computed properties
              isAdmin: userData.role === 'admin',
              isTutor: userData.role === 'tutor',
              isStudent: userData.role === 'student',
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
          profileCompleteness: null,
          communityProfile: null,
          meta: null,
          termsAcceptance: null,
          // Resetar computed properties
          isAdmin: false,
          isTutor: false,
          isStudent: false,
        });
        
        console.log('👋 Logout realizado - todos os dados limpos');
      },

      // Action: Update Profile Completeness
      updateProfileCompleteness: (data) => {
        set({ profileCompleteness: data });
      },
      
      // Action: Update Community Profile
      updateCommunityProfile: (data) => {
        set({ communityProfile: data });
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
            
            // Tenta buscar dados completos do localStorage do auth-storage
            let profileCompleteness = null;
            let communityProfile = null;
            let meta = null;
            let termsAcceptance = null;
            
            try {
              const authStorage = localStorage.getItem('auth-storage');
              if (authStorage) {
                const parsed = JSON.parse(authStorage);
                if (parsed?.state) {
                  // Se não tiver nome no userData, pega do storage
                  if (!userData?.name && parsed.state.user) {
                    userData = parsed.state.user;
                  }
                  // Recupera os outros dados do storage
                  profileCompleteness = parsed.state.profileCompleteness;
                  communityProfile = parsed.state.communityProfile;
                  meta = parsed.state.meta;
                  termsAcceptance = parsed.state.termsAcceptance;
                }
              }
            } catch (e) {
              console.log('Parse error:', e);
              console.log('Não foi possível recuperar dados do storage');
            }
            
            set({
              token: existingToken,
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              // Restaurar todos os dados do perfil
              profileCompleteness,
              communityProfile,
              meta,
              termsAcceptance,
              // Atualizar computed properties
              isAdmin: userData?.role === 'admin',
              isTutor: userData?.role === 'tutor',
              isStudent: userData?.role === 'student',
            });

            // Verificar se há termos para migrar do localStorage
            if (!termsAcceptance) {
              get().migrateTermsFromLocalStorage();
            }

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

      // Action: Accept Terms
      acceptTerms: async (termsVersion: string) => {
        const state = get();
        const token = state.token;
        
        if (!token) {
          throw new Error('Usuário não autenticado');
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) {
            throw new Error('API URL não configurada');
          }

          const acceptedAt = new Date().toISOString();
          const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

          console.log('📝 Aceitando termos:', { termsVersion, acceptedAt });

          const response = await fetch(`${apiUrl}/api/v1/accept-terms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              termsVersion,
              acceptedAt,
              expiresAt,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('❌ Erro ao aceitar termos:', errorData);
            throw new Error(errorData?.detail || `Erro ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('✅ Termos aceitos com sucesso:', data);

          // Atualizar o estado com os dados retornados
          const termsAcceptance: TermsAcceptance = {
            hasAccepted: true,
            acceptedAt: data.acceptedAt,
            termsVersion: data.termsVersion,
            expiresAt: data.expiresAt,
            acceptanceId: data.acceptanceId,
            syncedWithBackend: true,
          };

          set({ termsAcceptance });

          // Remover do localStorage se existir (migração)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('termsAccepted');
          }

          return data;
        } catch (error) {
          console.error('❌ Erro ao aceitar termos:', error);
          throw error;
        }
      },

      // Action: Check Terms Status
      checkTermsStatus: async () => {
        const state = get();
        const token = state.token;
        const user = state.user;
        
        if (!token || !user) {
          console.log('⚠️ Não é possível verificar termos sem autenticação');
          return;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) {
            throw new Error('API URL não configurada');
          }

          // Por enquanto, vamos verificar se há termos no localStorage para migrar
          // No futuro, implementar GET /api/v1/profile para verificar acceptedTermsOfUse
          const migratedTerms = get().migrateTermsFromLocalStorage();
          
          if (migratedTerms) {
            console.log('📋 Termos migrados do localStorage');
          } else {
            console.log('📋 Nenhum termo encontrado para migrar');
          }
        } catch (error) {
          console.error('❌ Erro ao verificar status dos termos:', error);
        }
      },

      // Action: Migrate Terms from LocalStorage
      migrateTermsFromLocalStorage: () => {
        if (typeof window === 'undefined') return null;

        const oldTermsData = localStorage.getItem('termsAccepted');
        
        if (oldTermsData && !get().termsAcceptance) {
          try {
            const parsed = JSON.parse(oldTermsData);
            console.log('🔄 Migrando termos do localStorage:', parsed);
            
            // Criar objeto de termos com dados migrados
            const termsAcceptance: TermsAcceptance = {
              hasAccepted: true,
              acceptedAt: parsed.acceptedAt || parsed.userId ? new Date().toISOString() : null,
              termsVersion: parsed.termsVersion || '1.0',
              expiresAt: parsed.expiresAt || null,
              syncedWithBackend: false, // Marca para sincronizar
            };
            
            set({ termsAcceptance });
            
            // Não remover do localStorage ainda, só após sincronizar com backend
            console.log('✅ Termos migrados para Zustand');
            
            // Tentar sincronizar com backend se estiver autenticado
            const state = get();
            if (state.token && state.user) {
              get().acceptTerms(termsAcceptance.termsVersion).catch(error => {
                console.error('⚠️ Erro ao sincronizar termos com backend:', error);
                // Manter os dados migrados mesmo se falhar a sincronização
              });
            }
            
            return termsAcceptance;
          } catch (error) {
            console.error('❌ Erro ao migrar termos do localStorage:', error);
            return null;
          }
        }
        
        return null;
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
        // Persistir todos os dados necessários
        token: state.token,
        user: state.user,
        profileCompleteness: state.profileCompleteness,
        communityProfile: state.communityProfile,
        meta: state.meta,
        termsAcceptance: state.termsAcceptance,
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
    // Helper para verificar se o perfil precisa ser completado
    needsProfileCompletion: store.meta?.requiresProfileCompletion || false,
    profilePercentage: store.profileCompleteness?.percentage || 0,
    // Helper para termos
    hasAcceptedTerms: store.termsAcceptance?.hasAccepted || false,
    termsVersion: store.termsAcceptance?.termsVersion || null,
    needsToAcceptTerms: !store.termsAcceptance?.hasAccepted,
  };
};
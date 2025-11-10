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
  
  // Campos adicionais do perfil
  curriculumUrl?: string; // URL ou caminho do currículo
  hasEuropeanCitizenship?: boolean; // Cidadania europeia
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
 * Latest Acceptance Details from API
 */
export interface LatestAcceptance {
  acceptanceId: string;
  termsVersion: string;
  acceptedAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  daysUntilExpiration: number | null;
}

/**
 * Terms Status Response from API
 */
export interface TermsStatusResponse {
  hasAcceptedTerms: boolean;
  currentTermsVersion: string;
  acceptedVersion: string | null;
  isCurrentVersionAccepted: boolean;
  latestAcceptance: LatestAcceptance | null;
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
  refreshToken: string; // 🆕 Token para renovar accessToken (7 dias)
  expiresIn: number; // 🆕 Tempo em segundos até accessToken expirar (900s = 15min)
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
  refreshToken: string | null; // 🆕 Token de renovação (7 dias de validade)
  expiresIn: number | null; // 🆕 Tempo em segundos até token expirar
  tokenExpiresAt: string | null; // 🆕 Timestamp de quando o token expira
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
  fetchUserProfile: () => Promise<void>;
  updateProfileCompleteness: (data: ProfileCompleteness) => void;
  updateCommunityProfile: (data: CommunityProfile) => void;
  refreshAccessToken: () => Promise<void>; // Renomeado para evitar conflito com o campo refreshToken
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  
  // Terms actions
  acceptTerms: (termsVersion: string) => Promise<void>;
  checkTermsStatus: () => Promise<void>;
  getTermsStatus: () => Promise<TermsStatusResponse | null>;
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
      refreshToken: null,
      expiresIn: null,
      tokenExpiresAt: null,
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
          console.log('🔑 Tokens recebidos:', {
            accessToken: data.accessToken ? data.accessToken.substring(0, 20) + '...' : 'N/A',
            refreshToken: data.refreshToken ? data.refreshToken.substring(0, 20) + '...' : 'N/A',
            expiresIn: data.expiresIn,
          });

          // A API retorna o token como accessToken
          const token = data.accessToken;
          const refreshToken = data.refreshToken;
          const expiresIn = data.expiresIn;

          // Calcular quando o token expira
          const tokenExpiresAt = expiresIn
            ? new Date(Date.now() + expiresIn * 1000).toISOString()
            : null;

          if (token) {
            saveAuthToken(token);

            // Salvar refreshToken no localStorage também
            if (refreshToken && typeof window !== 'undefined') {
              localStorage.setItem('refreshToken', refreshToken);
              console.log('💾 RefreshToken salvo no localStorage');
            }
            
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
              refreshToken: refreshToken,
              expiresIn: expiresIn,
              tokenExpiresAt: tokenExpiresAt,
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
            
            // Verificar status dos termos após login bem-sucedido
            setTimeout(() => {
              console.log('🔍 Verificando status dos termos após login...');
              get().checkTermsStatus();
            }, 100);
          } else {
            throw new Error('Token não retornado pela API');
          }
        } catch (error) {
          console.error('❌ Erro no login:', error);
          set({
            token: null,
            refreshToken: null,
            expiresIn: null,
            tokenExpiresAt: null,
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
          localStorage.removeItem('refreshToken'); // 🆕 Limpar refreshToken
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
          refreshToken: null, // 🆕 Limpar refreshToken do state
          expiresIn: null,
          tokenExpiresAt: null,
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

        console.log('👋 Logout realizado - todos os dados limpos (incluindo refreshToken)');
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

      // Action: Fetch User Profile - Busca perfil atualizado do servidor
      fetchUserProfile: async () => {
        const token = get().token;
        const currentUser = get().user;
        
        if (!token || !currentUser) {
          console.error('❌ Sem token ou usuário para buscar perfil');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          
          // Buscar dados do perfil usando o ID do usuário
          console.log('🔍 Buscando perfil:', `${apiUrl}/api/v1/users/${currentUser.id}`);
          const profileResponse = await fetch(`${apiUrl}/api/v1/users/${currentUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!profileResponse.ok) {
            console.error('❌ Resposta da API:', profileResponse.status, profileResponse.statusText);
            const errorText = await profileResponse.text();
            console.error('❌ Detalhes do erro:', errorText);
            throw new Error(`Falha ao buscar perfil: ${profileResponse.status} ${profileResponse.statusText}`);
          }

          const responseData = await profileResponse.json();
          console.log('📊 Resposta completa da API:', responseData);
          
          // A API retorna { user: {...} }
          const profileData = responseData.user || responseData;
          console.log('📊 Dados do perfil extraídos:', profileData);

          // Calcular a completude baseada nos campos preenchidos
          const fields = [
            profileData.name,
            profileData.email,
            profileData.nationalId,
            profileData.phone,
            profileData.birthDate,
            profileData.profileImageUrl,
            profileData.bio,
            profileData.profession,
            profileData.specialization,
            profileData.curriculumUrl,
            profileData.hasEuropeanCitizenship !== null,
          ];
          
          const filledFields = fields.filter(field => field).length;
          const totalFields = fields.length;
          const percentage = Math.round((filledFields / totalFields) * 100);
          
          const profileCompleteness = {
            percentage,
            completedSections: {
              basicInfo: !!(profileData.name && profileData.email && profileData.nationalId),
              documentation: !!profileData.curriculumUrl,
              professional: !!(profileData.profession || profileData.specialization),
              profileImage: !!profileData.profileImageUrl,
              address: profileData.addresses && profileData.addresses.length > 0,
            },
            missingFields: [],
            nextSteps: [],
            totalFields,
            completedFields: filledFields,
          };
          
          console.log('📈 Completude calculada:', profileCompleteness);

          // Atualizar dados do usuário no store
          const updatedUser: User = {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name || profileData.fullName || '',
            fullName: profileData.fullName || profileData.name,
            role: profileData.role,
            profileImageUrl: profileData.profileImageUrl,
            nationalId: profileData.nationalId,
            phone: profileData.phone,
            emailVerified: profileData.emailVerified,
            bio: profileData.bio,
            profession: profileData.profession,
            specialization: profileData.specialization,
            birthDate: profileData.birthDate,
            communityProfileConsent: profileData.communityProfileConsent,
            curriculumUrl: profileData.curriculumUrl,
            hasEuropeanCitizenship: profileData.hasEuropeanCitizenship,
            createdAt: profileData.createdAt,
            lastLogin: profileData.lastLogin,
          };

          set({ 
            user: updatedUser,
            profileCompleteness,
            isAdmin: updatedUser.role === 'admin',
            isTutor: updatedUser.role === 'tutor',
            isStudent: updatedUser.role === 'student',
            isLoading: false 
          });

          console.log('✅ Perfil atualizado com sucesso:', updatedUser);
        } catch (error) {
          console.error('❌ Erro ao buscar perfil:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao buscar perfil',
            isLoading: false 
          });
        }
      },

      // Action: Refresh Access Token
      refreshAccessToken: async () => {
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
            let refreshToken = null;
            let expiresIn = null;
            let tokenExpiresAt = null;
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
                  refreshToken = parsed.state.refreshToken;
                  expiresIn = parsed.state.expiresIn;
                  tokenExpiresAt = parsed.state.tokenExpiresAt;
                  profileCompleteness = parsed.state.profileCompleteness;
                  communityProfile = parsed.state.communityProfile;
                  meta = parsed.state.meta;
                  termsAcceptance = parsed.state.termsAcceptance;
                }
              }

              // Se não encontrou refreshToken no state, tenta do localStorage direto
              if (!refreshToken && typeof window !== 'undefined') {
                refreshToken = localStorage.getItem('refreshToken');
              }
            } catch (e) {
              console.log('Parse error:', e);
              console.log('Não foi possível recuperar dados do storage');
            }

            set({
              token: existingToken,
              refreshToken: refreshToken,
              expiresIn: expiresIn,
              tokenExpiresAt: tokenExpiresAt,
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

            console.log('🔐 Auth inicializado do token existente:', {
              userName: userData?.name,
              userRole: userData?.role,
            });
            
            // Verificar status dos termos após inicialização
            if (!termsAcceptance) {
              // Primeiro tenta migrar do localStorage
              get().migrateTermsFromLocalStorage();
              
              // Depois verifica com o backend
              setTimeout(() => {
                console.log('🔍 Verificando status dos termos após inicialização...');
                get().checkTermsStatus();
              }, 100);
            }

            // TODO: Descomentar quando a API tiver endpoint de refresh
            // setTimeout(() => {
            //   get().refreshAccessToken();
            // }, 1000);
          } else {
            // Nenhum token válido
            set({
              token: null,
              refreshToken: null,
              expiresIn: null,
              tokenExpiresAt: null,
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('❌ Erro ao inicializar auth:', error);
          set({
            token: null,
            refreshToken: null,
            expiresIn: null,
            tokenExpiresAt: null,
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

      // Action: Get Terms Status from API
      getTermsStatus: async (): Promise<TermsStatusResponse | null> => {
        const state = get();
        const token = state.token;
        
        if (!token) {
          console.log('⚠️ Não é possível verificar termos sem autenticação');
          return null;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) {
            throw new Error('API URL não configurada');
          }

          console.log('🔍 Verificando status dos termos no backend...');
          
          const response = await fetch(`${apiUrl}/api/v1/terms-status`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // Se der 401, o token expirou
            if (response.status === 401) {
              console.log('⚠️ Token expirado ao verificar termos');
              return null;
            }
            
            // Se der 400 (profile not found), retornar null
            if (response.status === 400) {
              console.log('⚠️ Perfil não encontrado');
              return null;
            }
            
            const errorData = await response.json().catch(() => null);
            console.error('❌ Erro ao obter status dos termos:', errorData);
            return null;
          }

          const data: TermsStatusResponse = await response.json();
          console.log('✅ Status dos termos obtido:', data);
          
          return data;
        } catch (error) {
          console.error('❌ Erro ao verificar status dos termos:', error);
          return null;
        }
      },

      // Action: Check Terms Status and Update Store
      checkTermsStatus: async () => {
        const state = get();
        const token = state.token;
        
        if (!token) {
          console.log('⚠️ Não é possível verificar termos sem autenticação');
          return;
        }

        try {
          // Primeiro tenta migrar do localStorage se necessário
          const migratedTerms = get().migrateTermsFromLocalStorage();
          
          if (migratedTerms) {
            console.log('📋 Termos migrados do localStorage');
          }
          
          // Agora busca o status atual do backend
          const termsStatus = await get().getTermsStatus();
          
          if (termsStatus && termsStatus.hasAcceptedTerms && termsStatus.latestAcceptance) {
            // Atualizar o estado com os dados do backend
            const termsAcceptance: TermsAcceptance = {
              hasAccepted: true,
              acceptedAt: termsStatus.latestAcceptance.acceptedAt,
              termsVersion: termsStatus.latestAcceptance.termsVersion,
              expiresAt: termsStatus.latestAcceptance.expiresAt,
              acceptanceId: termsStatus.latestAcceptance.acceptanceId,
              syncedWithBackend: true,
            };
            
            set({ termsAcceptance });
            console.log('✅ Estado dos termos atualizado do backend');
            
            // Se há uma nova versão dos termos, avisar
            if (!termsStatus.isCurrentVersionAccepted) {
              console.log('⚠️ Nova versão dos termos disponível:', termsStatus.currentTermsVersion);
            }
            
            // Se os termos expiraram, avisar
            if (termsStatus.latestAcceptance.isExpired) {
              console.log('⚠️ Termos expirados, necessário aceitar novamente');
            }
          } else if (!state.termsAcceptance) {
            // Usuário nunca aceitou termos
            console.log('📋 Usuário ainda não aceitou os termos');
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
        refreshToken: state.refreshToken, // 🆕 Persistir refreshToken
        expiresIn: state.expiresIn, // 🆕 Persistir expiresIn
        tokenExpiresAt: state.tokenExpiresAt, // 🆕 Persistir tokenExpiresAt
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
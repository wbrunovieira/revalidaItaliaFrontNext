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
 * Timer global para renovação automática de tokens
 * Renova a cada 28 minutos (2 min antes do token de 30 min expirar)
 */
let tokenRefreshTimer: NodeJS.Timeout | null = null;

/**
 * Interface do usuário com todos os campos necessários
 */
export interface User {
  id: string;
  email: string;
  name: string; // ESSENCIAL - usado em 10+ componentes
  fullName?: string; // Nome completo retornado pelo login
  role: 'admin' | 'student' | 'tutor' | 'document_analyst'; // ESSENCIAL - controle de acesso
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
 * Session Information - Dados da sessão retornados pelo backend
 */
export interface Session {
  id: string; // ID único da sessão
  ipAddress: string; // IP capturado pelo servidor
  createdAt: string; // Timestamp de criação (ISO string)
  expiresAt: string; // Timestamp de expiração (ISO string)
}

/**
 * Revoked Session - Informações sobre sessões anteriores revogadas
 */
export interface RevokedSession {
  deviceType: 'desktop' | 'mobile' | 'tablet' | null;
  deviceName: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | null;
  ipAddress: string;
  createdAt: string; // Quando a sessão anterior foi criada
  revokedAt: string; // Quando ela foi revogada (agora)
}

/**
 * Device Information - Dados do dispositivo capturados no frontend
 */
export interface DeviceInfo {
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser: string;
  browserVersion: string;
  os: string;
  screenResolution: string;
  timezone: string;
  language: string;
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
    role: 'student' | 'admin' | 'tutor' | 'document_analyst';
    profileImageUrl: string | null;
  };
  session?: Session; // 🆕 Informações da sessão (opcional)
  revokedSessions?: RevokedSession[]; // 🆕 Sessões anteriores revogadas (opcional)
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

  // Session e Device Info
  session: Session | null; // 🆕 Dados da sessão (do backend)
  deviceInfo: DeviceInfo | null; // 🆕 Informações do dispositivo (do frontend)
  lastRevokedSession: RevokedSession | null; // 🆕 Última sessão revogada

  // Rate Limiting
  isRateLimited: boolean; // 🆕 Indica se usuário atingiu rate limit
  rateLimitExpiresAt: string | null; // 🆕 Timestamp de quando rate limit expira

  // Novos estados do login
  profileCompleteness: ProfileCompleteness | null;
  communityProfile: CommunityProfile | null;
  meta: MetaInfo | null;
  termsAcceptance: TermsAcceptance | null;

  // Computed helpers (getters derivados)
  isAdmin: boolean;
  isTutor: boolean;
  isStudent: boolean;
  isDocumentAnalyst: boolean;

  // Actions principais
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
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
  canAccessStudentDocuments: () => boolean;
  hasRole: (role: 'admin' | 'student' | 'tutor' | 'document_analyst') => boolean;

  // Rate limit helpers
  clearRateLimit: () => void;

  // Token refresh helpers
  startTokenRefreshScheduler: () => void;
  stopTokenRefreshScheduler: () => void;

  // Internal actions
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Helper: Detectar atividade suspeita baseada em sessão revogada
 * Exportado para uso em componentes
 */
export function checkSuspiciousActivity(
  revokedSession: RevokedSession,
  currentDeviceInfo: DeviceInfo
): boolean {
  // Verificar se o dispositivo é muito diferente
  const deviceMismatch =
    revokedSession.deviceType &&
    currentDeviceInfo.deviceType !== 'unknown' &&
    revokedSession.deviceType !== currentDeviceInfo.deviceType;

  // Verificar se o browser é diferente (indica dispositivo diferente)
  const browserMismatch =
    revokedSession.deviceName &&
    currentDeviceInfo.browser !== 'Unknown' &&
    !currentDeviceInfo.browser.includes(revokedSession.deviceName);

  // Verificar se o login foi muito rápido (menos de 5 minutos desde criação da sessão anterior)
  const sessionCreatedTime = new Date(revokedSession.createdAt).getTime();
  const timeDiff = Date.now() - sessionCreatedTime;
  const tooQuick = timeDiff < 5 * 60 * 1000; // 5 minutos

  // Consideramos suspeito se:
  // 1. Browser/dispositivo diferentes E login muito rápido (possivelmente de locais diferentes)
  // 2. OU se apenas passou muito pouco tempo (menos de 1 minuto) desde a última sessão
  const veryQuick = timeDiff < 60 * 1000; // 1 minuto

  return (deviceMismatch && tooQuick) || (browserMismatch && tooQuick) || veryQuick;
}

/**
 * Helper: Capturar informações do dispositivo
 */
function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server',
      deviceType: 'unknown',
      browser: 'server',
      browserVersion: '0',
      os: 'server',
      screenResolution: '0x0',
      timezone: 'UTC',
      language: 'en',
    };
  }

  const ua = navigator.userAgent;

  // Detectar tipo de dispositivo
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  const deviceType: DeviceInfo['deviceType'] = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  // Detectar browser
  let browser = 'Unknown';
  let browserVersion = '0';

  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || '0';
  } else if (ua.includes('Edg/')) {
    browser = 'Edge';
    browserVersion = ua.split('Edg/')[1]?.split(' ')[0] || '0';
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    browser = 'Chrome';
    browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || '0';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    browser = 'Safari';
    browserVersion = ua.split('Version/')[1]?.split(' ')[0] || '0';
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browser = 'Opera';
    browserVersion = ua.split('OPR/')[1]?.split(' ')[0] || ua.split('Opera/')[1]?.split(' ')[0] || '0';
  }

  // Detectar OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return {
    userAgent: ua,
    deviceType,
    browser,
    browserVersion,
    os,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
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
      session: null,
      deviceInfo: null,
      lastRevokedSession: null,
      isRateLimited: false,
      rateLimitExpiresAt: null,
      profileCompleteness: null,
      communityProfile: null,
      meta: null,
      termsAcceptance: null,

      // Computed getters (como funções, não propriedades)
      isAdmin: false,
      isTutor: false,
      isStudent: false,
      isDocumentAnalyst: false,

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

            // 🆕 Tratamento especial para rate limiting (429)
            if (response.status === 429) {
              // Calcular quando o rate limit expira (2 minutos a partir de agora)
              const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

              set({
                isRateLimited: true,
                rateLimitExpiresAt: expiresAt,
                isLoading: false,
                error: 'rate_limit_exceeded',
              });

              // Auto-limpar rate limit após 2 minutos
              setTimeout(() => {
                get().clearRateLimit();
              }, 2 * 60 * 1000);

              throw new Error('RATE_LIMIT_EXCEEDED');
            }

            throw new Error(errorData?.message || errorData?.error || `Erro ${response.status}: ${response.statusText}`);
          }

          const data: LoginResponse = await response.json();

          console.log('═══════════════════════════════════════════════════════');
          console.log('📦 RESPOSTA COMPLETA DO BACKEND:');
          console.log('═══════════════════════════════════════════════════════');
          console.log('👤 User:', data.user);
          console.log('📊 Profile Completeness:', data.profileCompleteness);
          console.log('🌐 Community Profile:', data.communityProfile);
          console.log('🔑 Tokens:', {
            accessToken: data.accessToken ? data.accessToken.substring(0, 20) + '...' : 'N/A',
            refreshToken: data.refreshToken ? data.refreshToken.substring(0, 20) + '...' : 'N/A',
            expiresIn: data.expiresIn,
          });
          console.log('🔐 SESSION (do backend):', data.session);
          console.log('⚠️ REVOKED SESSIONS (do backend):', data.revokedSessions);
          console.log('═══════════════════════════════════════════════════════');

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

            // 🆕 Capturar informações do dispositivo
            const deviceInfo = getDeviceInfo();
            console.log('📱 Device Info capturado:', {
              deviceType: deviceInfo.deviceType,
              browser: `${deviceInfo.browser} ${deviceInfo.browserVersion}`,
              os: deviceInfo.os,
              timezone: deviceInfo.timezone,
            });

            // 🆕 Extrair dados da sessão do backend (se disponível)
            const sessionData = data.session || null;
            if (sessionData) {
              console.log('🔐 Session Info recebida:', {
                id: sessionData.id,
                ip: sessionData.ipAddress,
                createdAt: sessionData.createdAt,
                expiresAt: sessionData.expiresAt,
              });
            } else {
              console.log('ℹ️ Nenhuma informação de sessão retornada pelo backend');
            }

            // 🆕 Processar sessões revogadas (se houver)
            const revokedSessions = data.revokedSessions || null;
            const lastRevokedSession = revokedSessions && revokedSessions.length > 0 ? revokedSessions[0] : null;

            if (lastRevokedSession) {
              console.log('⚠️ Sessão anterior revogada:', {
                deviceType: lastRevokedSession.deviceType,
                deviceName: lastRevokedSession.deviceName,
                ip: lastRevokedSession.ipAddress,
                createdAt: lastRevokedSession.createdAt,
                revokedAt: lastRevokedSession.revokedAt,
              });

              // Verificar se é atividade suspeita
              const isSuspicious = checkSuspiciousActivity(lastRevokedSession, deviceInfo);
              console.log(`${isSuspicious ? '🚨' : 'ℹ️'} Atividade ${isSuspicious ? 'suspeita' : 'normal'} detectada`);
            } else {
              console.log('✅ Primeira sessão criada ou nenhuma sessão anterior');
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
              session: sessionData, // 🆕 Dados da sessão do backend
              deviceInfo: deviceInfo, // 🆕 Informações do dispositivo capturadas
              lastRevokedSession: lastRevokedSession, // 🆕 Última sessão revogada
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
              isDocumentAnalyst: userData.role === 'document_analyst',
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

            // 🆕 Iniciar scheduler de renovação automática de tokens
            get().startTokenRefreshScheduler();

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
      logout: async () => {
        // 🆕 Parar scheduler de renovação de tokens PRIMEIRO
        get().stopTokenRefreshScheduler();

        // 🆕 Chamar endpoint de logout no backend
        const currentToken = get().token;
        if (currentToken) {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            if (apiUrl) {
              console.log('📡 Chamando POST /api/v1/auth/logout...');

              const response = await fetch(`${apiUrl}/api/v1/auth/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${currentToken}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const data = await response.json();
                console.log('✅ Logout no servidor realizado:', data.loggedOutAt);
              } else {
                console.warn('⚠️ Erro ao fazer logout no servidor:', response.status);
                // Continua com logout local mesmo se API falhar
              }
            }
          } catch (error) {
            console.warn('⚠️ Erro ao chamar endpoint de logout:', error);
            // Continua com logout local mesmo se houver erro de rede
          }
        }

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
          session: null, // 🆕 Limpar session
          deviceInfo: null, // 🆕 Limpar deviceInfo
          lastRevokedSession: null, // 🆕 Limpar lastRevokedSession
          isRateLimited: false, // 🆕 Limpar rate limit
          rateLimitExpiresAt: null, // 🆕 Limpar rate limit expiration
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
          isDocumentAnalyst: false,
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
            isDocumentAnalyst: updatedUser.role === 'document_analyst',
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
            isDocumentAnalyst: updatedUser.role === 'document_analyst',
            isLoading: false,
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
        console.log('🔄 Iniciando renovação de access token...');

        try {
          const state = get();
          let refreshToken = state.refreshToken;

          // Se não tiver no state, tentar localStorage
          if (!refreshToken && typeof window !== 'undefined') {
            refreshToken = localStorage.getItem('refreshToken');
          }

          if (!refreshToken) {
            console.log('❌ Nenhum refreshToken disponível - fazendo logout');
            await get().logout();
            return;
          }

          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (!apiUrl) {
            throw new Error('API URL não configurada');
          }

          console.log('📡 Chamando /api/v1/auth/refresh...');

          const response = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            // Se refresh falhou (401, 403, etc), fazer logout
            console.log('❌ Refresh token inválido ou expirado - fazendo logout');

            if (response.status === 401) {
              // Token expirado ou revogado
              await get().logout();
            }

            throw new Error(`Refresh failed: ${response.status}`);
          }

          const data = await response.json();
          console.log('✅ Token renovado com sucesso!');

          const newAccessToken = data.accessToken;
          const expiresIn = data.expiresIn || 1800; // 30 minutos default

          // Calcular quando expira
          const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

          // Salvar novo access token
          saveAuthToken(newAccessToken);

          // Atualizar state
          set({
            token: newAccessToken,
            expiresIn: expiresIn,
            tokenExpiresAt: tokenExpiresAt,
          });

          console.log('💾 Novo access token salvo:', {
            expiresIn: `${expiresIn}s`,
            expiresAt: tokenExpiresAt,
          });

        } catch (error) {
          console.error('❌ Erro ao renovar token:', error);

          // Em caso de erro, fazer logout
          if (error instanceof Error && error.message.includes('401')) {
            await get().logout();
          }

          throw error;
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
            let session = null;
            let deviceInfo = null;
            let lastRevokedSession = null;
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
                  session = parsed.state.session; // 🆕 Restaurar session
                  deviceInfo = parsed.state.deviceInfo; // 🆕 Restaurar deviceInfo
                  lastRevokedSession = parsed.state.lastRevokedSession; // 🆕 Restaurar lastRevokedSession
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
              session: session, // 🆕 Restaurar session
              deviceInfo: deviceInfo, // 🆕 Restaurar deviceInfo
              lastRevokedSession: lastRevokedSession, // 🆕 Restaurar lastRevokedSession
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
              isDocumentAnalyst: userData?.role === 'document_analyst',
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

      // Helper: Can Access Student Documents Area
      canAccessStudentDocuments: () => {
        const state = get();
        return state.isAuthenticated && (state.user?.role === 'document_analyst' || state.user?.role === 'admin');
      },

      // Helper: Has Role
      hasRole: (role) => {
        const state = get();
        return state.isAuthenticated && state.user?.role === role;
      },

      // Helper: Clear Rate Limit
      clearRateLimit: () => {
        console.log('🔓 Rate limit limpo');
        set({
          isRateLimited: false,
          rateLimitExpiresAt: null,
          error: null,
        });
      },

      // Helper: Start Token Refresh Scheduler
      startTokenRefreshScheduler: () => {
        // Parar scheduler existente se houver
        if (tokenRefreshTimer) {
          clearInterval(tokenRefreshTimer);
        }

        // Renovar a cada 28 minutos (2 min antes do token de 30 min expirar)
        const REFRESH_INTERVAL = 28 * 60 * 1000; // 28 minutos em ms

        console.log('⏱️ Iniciando scheduler de renovação automática de tokens (a cada 28 min)');

        tokenRefreshTimer = setInterval(async () => {
          console.log('🔄 Scheduler: Hora de renovar o token automaticamente');

          const state = get();

          // Verificar se ainda tem refreshToken
          if (!state.refreshToken && typeof window !== 'undefined') {
            const storedRefreshToken = localStorage.getItem('refreshToken');
            if (!storedRefreshToken) {
              console.log('⚠️ Scheduler: Sem refreshToken, parando scheduler');
              get().stopTokenRefreshScheduler();
              return;
            }
          }

          try {
            await get().refreshAccessToken();
            console.log('✅ Scheduler: Token renovado com sucesso!');
          } catch (error) {
            console.error('❌ Scheduler: Falha ao renovar token:', error);
            get().stopTokenRefreshScheduler();
            // Logout será chamado pelo refreshAccessToken em caso de erro 401
          }
        }, REFRESH_INTERVAL);

        console.log('✅ Scheduler iniciado com sucesso');
      },

      // Helper: Stop Token Refresh Scheduler
      stopTokenRefreshScheduler: () => {
        if (tokenRefreshTimer) {
          console.log('⏹️ Parando scheduler de renovação de tokens');
          clearInterval(tokenRefreshTimer);
          tokenRefreshTimer = null;
        }
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
        session: state.session, // 🆕 Persistir session
        deviceInfo: state.deviceInfo, // 🆕 Persistir deviceInfo
        lastRevokedSession: state.lastRevokedSession, // 🆕 Persistir lastRevokedSession
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
               store.user?.role === 'tutor' ? 'Tutor' :
               store.user?.role === 'document_analyst' ? 'Analista de Documentos' : 'Estudante',
    // Helper para verificar se o perfil precisa ser completado
    needsProfileCompletion: store.meta?.requiresProfileCompletion || false,
    profilePercentage: store.profileCompleteness?.percentage || 0,
    // Helper para termos
    hasAcceptedTerms: store.termsAcceptance?.hasAccepted || false,
    termsVersion: store.termsAcceptance?.termsVersion || null,
    needsToAcceptTerms: !store.termsAcceptance?.hasAccepted,
  };
};
/**
 * Utilidades para autenticação
 * Funções helper para gerenciar cookies, tokens JWT e autenticação
 */

/**
 * Obtém um cookie pelo nome
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  
  return null;
};

/**
 * Define um cookie
 */
export const setCookie = (name: string, value: string, days: number = 7): void => {
  if (typeof document === 'undefined') return;
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
};

/**
 * Remove um cookie
 */
export const removeCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Decodifica um token JWT (sem validar assinatura)
 * Usado apenas para extrair dados do payload
 */
export const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
};

/**
 * Verifica se um token JWT está expirado
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

/**
 * Obtém o token de autenticação de múltiplas fontes
 * Prioridade: 1. Cookie, 2. localStorage, 3. sessionStorage
 */
export const getAuthToken = (): string | null => {
  // 1. Tentar cookie primeiro (mais seguro)
  const cookieToken = getCookie('token');
  if (cookieToken && !isTokenExpired(cookieToken)) {
    return cookieToken;
  }
  
  // 2. Tentar localStorage
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('accessToken');
    if (localToken && !isTokenExpired(localToken)) {
      return localToken;
    }
    
    // 3. Tentar sessionStorage
    const sessionToken = sessionStorage.getItem('accessToken');
    if (sessionToken && !isTokenExpired(sessionToken)) {
      return sessionToken;
    }
  }
  
  return null;
};

/**
 * Salva o token em múltiplos storages para redundância
 */
export const saveAuthToken = (token: string): void => {
  // Salvar em cookie (principal)
  setCookie('token', token, 7);
  
  // Salvar em localStorage (backup)
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
};

/**
 * Remove o token de todos os storages
 */
export const clearAuthToken = (): void => {
  // Remover cookie
  removeCookie('token');
  
  // Remover de localStorage e sessionStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
  }
};

/**
 * Extrai dados do usuário do token JWT ou do objeto user da API
 */
export const extractUserFromToken = (tokenOrUser: string | any) => {
  // Se for um objeto (dados do user da API), usa diretamente
  if (typeof tokenOrUser === 'object' && tokenOrUser !== null) {
    return {
      id: tokenOrUser.id || tokenOrUser.identityId || '',
      email: tokenOrUser.email || '',
      name: tokenOrUser.fullName || tokenOrUser.name || '',
      role: tokenOrUser.role || 'student',
      profileImageUrl: tokenOrUser.profileImageUrl || null,
      nationalId: tokenOrUser.nationalId || tokenOrUser.cpf,
      phone: tokenOrUser.phone,
      emailVerified: tokenOrUser.emailVerified,
      createdAt: tokenOrUser.createdAt,
      lastLogin: tokenOrUser.lastLogin,
    };
  }
  
  // Se for string (token JWT), decodifica
  const decoded = decodeJWT(tokenOrUser);
  if (!decoded) return null;
  
  return {
    id: decoded.id || decoded.sub || '',
    email: decoded.email || '',
    name: decoded.name || decoded.fullName || '',
    role: decoded.role || 'student',
    profileImageUrl: decoded.profileImageUrl || null,
    nationalId: decoded.nationalId || decoded.cpf,
    phone: decoded.phone,
    emailVerified: decoded.emailVerified,
    createdAt: decoded.createdAt,
    lastLogin: decoded.lastLogin,
  };
};
// /src/components/UserViewModal.tsx
'use client';


import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  X,
  User,
  Mail,
  CreditCard,
  Calendar,
  Shield,
  Clock,
  Copy,
  Check,
  Phone,
  MapPin,
  FileText,
  Globe,
  Languages,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

// Interface expandida com todos os campos
interface UserDetails {
  identityId: string;
  fullName: string;
  email: string;
  nationalId: string;
  role: 'admin' | 'student' | 'tutor';
  createdAt: string;
  updatedAt?: string;
  // Campos adicionais
  bio?: string | null;
  emailVerified?: boolean;
  lastLogin?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  profession?: string | null;
  profileImageUrl?: string | null;
  specialization?: string | null;
  curriculumUrl?: string | null;
  hasEuropeanCitizenship?: boolean | null;
  preferredLanguage?: string;
  timezone?: string;
  communityProfileConsent?: boolean;
  communityProfileConsentDate?: string | null;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  effectiveFrom?: string;
  effectiveUntil?: string | null;
  isActive?: boolean;
  // Autorização
  customPermissions?: Array<{
    resource: string;
    action: string;
  }>;
  restrictions?: Array<{
    resource: string;
    reason: string;
  }>;
  // Endereços
  addresses?: Array<{
    id: string;
    street: string;
    number: string;
    complement?: string | null;
    district?: string | null;
    city: string;
    state?: string | null;
    country: string;
    postalCode: string;
    isPrimary: boolean;
  }>;
}

interface UserViewModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// CORREÇÃO: Movida para fora do componente por ser uma função utilitária pura.
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2)
    return parts.pop()?.split(';').shift() || null;
  return null;
};

// CORREÇÃO: Movida para fora do componente por ser uma função utilitária pura.
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function UserViewModal({
  userId,
  isOpen,
  onClose,
}: UserViewModalProps) {
  const t = useTranslations('Admin.userView');
  const { toast } = useToast();

  const [user, setUser] = useState<UserDetails | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<
    string | null
  >(null);


  // CORREÇÃO: Função envolvida com useCallback para estabilizar sua referência.
  const fetchUserDetails = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const token =
          getCookie('token') ||
          localStorage.getItem('accessToken') ||
          sessionStorage.getItem('accessToken');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token)
          headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${id}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Acesso negado - É necessário fazer login como administrador'
              : 'Failed to fetch user details'
          );
        }

        const data = await response.json();
        // Mapear os campos do backend para a interface do frontend
        if (data.user) {
          setUser({
            identityId: data.user.id,
            fullName: data.user.name,
            email: data.user.email,
            nationalId: data.user.nationalId || data.user.cpf,
            role: data.user.role,
            createdAt: data.user.createdAt,
            updatedAt: data.user.updatedAt,
            // Campos opcionais expandidos
            bio: data.user.bio,
            emailVerified: data.user.emailVerified,
            lastLogin: data.user.lastLogin,
            phone: data.user.phone,
            birthDate: data.user.birthDate,
            profession: data.user.profession,
            profileImageUrl: data.user.profileImageUrl,
            specialization: data.user.specialization,
            curriculumUrl: data.user.curriculumUrl,
            hasEuropeanCitizenship: data.user.hasEuropeanCitizenship,
            preferredLanguage: data.user.preferredLanguage,
            timezone: data.user.timezone,
            communityProfileConsent: data.user.communityProfileConsent,
            communityProfileConsentDate: data.user.communityProfileConsentDate,
            failedLoginAttempts: data.user.failedLoginAttempts,
            lockedUntil: data.user.lockedUntil,
            effectiveFrom: data.user.effectiveFrom,
            effectiveUntil: data.user.effectiveUntil,
            isActive: data.user.isActive,
            customPermissions: data.user.customPermissions,
            restrictions: data.user.restrictions,
            addresses: data.user.addresses,
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: t('error.fetchTitle'),
          description:
            error instanceof Error
              ? error.message
              : t('error.fetchDescription'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [t, toast]
  );

  // CORREÇÃO: Função envolvida com useCallback e variável de erro ajustada.
  const copyToClipboard = useCallback(
    async (text: string, field: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast({
          title: t('copySuccess'),
          description: `${field} copiado para a área de transferência`,
        });
      } catch (_error) {
        console.error(
          'Falha ao copiar para a área de transferência:',
          _error
        );
        toast({
          title: t('copyError'),
          description:
            'Não foi possível copiar para a área de transferência',
          variant: 'destructive',
        });
      }
    },
    [t, toast]
  );

  // CORREÇÃO: Adicionadas as dependências `fetchUserDetails` e `fetchUserAddresses`.
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails(userId);
      // Removido fetchUserAddresses - não necessário no contexto de admin
    } else {
      setUser(null);
    }
  }, [
    isOpen,
    userId,
    fetchUserDetails,
  ]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // O JSX para renderização do modal permanece o mesmo.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <User size={28} className="text-secondary" />
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-700 rounded w-1/3"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="h-16 bg-gray-700 rounded"
                  ></div>
                ))}
              </div>
            </div>
          ) : user ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center overflow-hidden">
                  {user.profileImageUrl ? (
                    <Image 
                      src={user.profileImageUrl} 
                      alt={user.fullName}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : user.role === 'admin' ? (
                    <Shield
                      size={28}
                      className="text-white"
                    />
                  ) : user.role === 'tutor' ? (
                    <GraduationCap
                      size={28}
                      className="text-white"
                    />
                  ) : (
                    <User
                      size={28}
                      className="text-white"
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {user.fullName}
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 text-sm rounded-full ${
                      user.role === 'admin'
                        ? 'bg-red-900/30 text-red-400 border border-red-800'
                        : user.role === 'tutor'
                        ? 'bg-purple-900/30 text-purple-400 border border-purple-800'
                        : 'bg-blue-900/30 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {user.role === 'admin'
                      ? t('roleAdmin')
                      : user.role === 'tutor'
                      ? t('roleTutor')
                      : t('roleStudent')}
                  </span>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <User
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t('fields.id')}
                        </p>
                        <p className="text-white font-mono text-sm">
                          {user.identityId}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(user.identityId, 'ID')
                      }
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {copiedField === 'ID' ? (
                        <Check
                          size={16}
                          className="text-green-400"
                        />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Mail
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t('fields.email')}
                        </p>
                        <p className="text-white">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(user.email, 'Email')
                      }
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {copiedField === 'Email' ? (
                        <Check
                          size={16}
                          className="text-green-400"
                        />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <CreditCard
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t('fields.document')}
                        </p>
                        <p className="text-white font-mono">
                          {user.nationalId}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(user.nationalId, 'document')
                      }
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {copiedField === 'document' ? (
                        <Check
                          size={16}
                          className="text-green-400"
                        />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <Calendar
                        size={20}
                        className="text-secondary"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        {t('fields.createdAt')}
                      </p>
                      <p className="text-white">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  {user.updatedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Clock
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t('fields.updatedAt')}
                        </p>
                        <p className="text-white">
                          {formatDate(user.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Seção de Informações Pessoais */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <User size={20} className="text-secondary" />
                    {t('sections.personalInfo')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Phone size={20} className="text-secondary" />
                        <div>
                          <p className="text-sm text-gray-400">{t('fields.phone')}</p>
                          <p className="text-white">{user.phone || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-secondary" />
                        <div>
                          <p className="text-sm text-gray-400">{t('fields.birthDate')}</p>
                          <p className="text-white">
                            {user.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Briefcase size={20} className="text-secondary" />
                        <div>
                          <p className="text-sm text-gray-400">{t('fields.profession')}</p>
                          <p className="text-white">{user.profession || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <GraduationCap size={20} className="text-secondary" />
                        <div>
                          <p className="text-sm text-gray-400">{t('fields.specialization')}</p>
                          <p className="text-white">{user.specialization || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">{t('fields.bio')}</p>
                    <p className="text-white whitespace-pre-wrap">{user.bio || '-'}</p>
                  </div>
                </div>

                {/* Seção de Documentos e Cidadania */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-secondary" />
                    {t('sections.documents')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-secondary" />
                          <div>
                            <p className="text-sm text-gray-400">{t('fields.curriculum')}</p>
                            {user.curriculumUrl ? (
                              <a 
                                href={user.curriculumUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-secondary hover:text-secondary/80 underline"
                              >
                                {t('viewDocument')}
                              </a>
                            ) : (
                              <p className="text-gray-400">-</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Globe size={20} className="text-secondary" />
                        <div>
                          <p className="text-sm text-gray-400">{t('fields.europeanCitizenship')}</p>
                          <div className="flex items-center gap-2">
                            {user.hasEuropeanCitizenship === true ? (
                              <>
                                <CheckCircle size={16} className="text-green-400" />
                                <p className="text-green-400">{t('yes')}</p>
                              </>
                            ) : user.hasEuropeanCitizenship === false ? (
                              <>
                                <XCircle size={16} className="text-red-400" />
                                <p className="text-red-400">{t('no')}</p>
                              </>
                            ) : (
                              <p className="text-gray-400">-</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção de Configurações e Preferências */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Languages size={20} className="text-secondary" />
                    {t('sections.preferences')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.preferredLanguage && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Languages size={20} className="text-secondary" />
                          <div>
                            <p className="text-sm text-gray-400">{t('fields.language')}</p>
                            <p className="text-white">{user.preferredLanguage}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user.timezone && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Clock size={20} className="text-secondary" />
                          <div>
                            <p className="text-sm text-gray-400">{t('fields.timezone')}</p>
                            <p className="text-white">{user.timezone}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Shield size={20} className="text-secondary" />
                        <div>
                          <p className="text-sm text-gray-400">{t('fields.communityConsent')}</p>
                          <div className="flex items-center gap-2">
                            {user.communityProfileConsent ? (
                              <>
                                <CheckCircle size={16} className="text-green-400" />
                                <p className="text-green-400">{t('consented')}</p>
                              </>
                            ) : (
                              <>
                                <XCircle size={16} className="text-gray-400" />
                                <p className="text-gray-400">{t('notConsented')}</p>
                              </>
                            )}
                          </div>
                          {user.communityProfileConsentDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(user.communityProfileConsentDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção de Segurança */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-secondary" />
                    {t('sections.security')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        {user.emailVerified ? (
                          <CheckCircle size={20} className="text-green-400" />
                        ) : (
                          <AlertTriangle size={20} className="text-yellow-400" />
                        )}
                        <div>
                          <p className="text-sm text-gray-400">{t('fields.emailVerified')}</p>
                          <p className={user.emailVerified ? "text-green-400" : "text-yellow-400"}>
                            {user.emailVerified ? t('verified') : t('notVerified')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {user.lastLogin && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Clock size={20} className="text-secondary" />
                          <div>
                            <p className="text-sm text-gray-400">{t('fields.lastLogin')}</p>
                            <p className="text-white">{formatDate(user.lastLogin)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user.failedLoginAttempts !== undefined && user.failedLoginAttempts > 0 && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={20} className="text-yellow-400" />
                          <div>
                            <p className="text-sm text-gray-400">{t('fields.failedAttempts')}</p>
                            <p className="text-yellow-400">{user.failedLoginAttempts}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user.lockedUntil && (
                      <div className="bg-red-900/30 rounded-lg p-4 border border-red-800">
                        <div className="flex items-center gap-3">
                          <AlertTriangle size={20} className="text-red-400" />
                          <div>
                            <p className="text-sm text-red-400">{t('fields.accountLocked')}</p>
                            <p className="text-white">{formatDate(user.lockedUntil)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção de Autorização */}
                {(user.effectiveFrom || user.effectiveUntil || user.customPermissions?.length || user.restrictions?.length) && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield size={20} className="text-secondary" />
                      {t('sections.authorization')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.effectiveFrom && (
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-secondary" />
                            <div>
                              <p className="text-sm text-gray-400">{t('fields.effectiveFrom')}</p>
                              <p className="text-white">{formatDate(user.effectiveFrom)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {user.effectiveUntil && (
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-secondary" />
                            <div>
                              <p className="text-sm text-gray-400">{t('fields.effectiveUntil')}</p>
                              <p className="text-white">{formatDate(user.effectiveUntil)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {user.customPermissions && user.customPermissions.length > 0 && (
                      <div className="mt-4 bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">{t('fields.customPermissions')}</p>
                        <div className="space-y-2">
                          {user.customPermissions.map((perm, index) => (
                            <div key={index} className="flex items-center gap-2 text-green-400">
                              <CheckCircle size={16} />
                              <span className="text-sm">{perm.resource}: {perm.action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {user.restrictions && user.restrictions.length > 0 && (
                      <div className="mt-4 bg-red-900/30 rounded-lg p-4 border border-red-800">
                        <p className="text-sm text-red-400 mb-2">{t('fields.restrictions')}</p>
                        <div className="space-y-2">
                          {user.restrictions.map((restriction, index) => (
                            <div key={index} className="text-red-300">
                              <div className="flex items-start gap-2">
                                <XCircle size={16} className="text-red-400 mt-0.5" />
                                <div>
                                  <span className="text-sm font-medium">{restriction.resource}</span>
                                  <p className="text-xs text-red-300/80">{restriction.reason}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Seção de Endereços */}
                {user.addresses && user.addresses.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <MapPin size={20} className="text-secondary" />
                      {t('sections.addresses')} ({user.addresses.length})
                    </h4>
                    <div className="space-y-3">
                      {user.addresses.map((address) => (
                        <div key={address.id} className="bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-medium">
                                {address.street}, {address.number}
                                {address.complement && ` - ${address.complement}`}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {address.district && `${address.district}, `}
                                {address.city}
                                {address.state && ` - ${address.state}`}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {address.country} - {address.postalCode}
                              </p>
                            </div>
                            {address.isPrimary && (
                              <span className="px-2 py-1 text-xs bg-secondary/20 text-secondary rounded">
                                {t('primaryAddress')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <User
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-gray-400">
                {t('userNotFound')}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}

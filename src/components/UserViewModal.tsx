// /src/components/UserViewModal.tsx
'use client';


import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';

// Interfaces permanecem as mesmas
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
  profession?: string | null;
  profileImageUrl?: string | null;
  specialization?: string | null;
  isActive?: boolean;
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
            nationalId: data.user.nationalId,
            role: data.user.role,
            createdAt: data.user.createdAt,
            updatedAt: data.user.updatedAt,
            // Campos opcionais - adicionar quando disponíveis no backend
            bio: data.user.bio,
            emailVerified: data.user.emailVerified,
            lastLogin: data.user.lastLogin,
            phone: data.user.phone,
            profession: data.user.profession,
            profileImageUrl: data.user.profileImageUrl,
            specialization: data.user.specialization,
            isActive: data.user.isActive,
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
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                  {user.role === 'admin' ? (
                    <Shield
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
                        : 'bg-blue-900/30 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {user.role === 'admin'
                      ? t('roleAdmin')
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
                
                {/* Campos adicionais */}
                {(user.phone || user.profession || user.specialization || user.bio) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {user.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                          <Mail size={20} className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            {t('fields.phone')}
                          </p>
                          <p className="text-white">{user.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.profession && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                          <User size={20} className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            {t('fields.profession')}
                          </p>
                          <p className="text-white">{user.profession}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.specialization && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                          <Shield size={20} className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            {t('fields.specialization')}
                          </p>
                          <p className="text-white">{user.specialization}</p>
                        </div>
                      </div>
                    )}
                    
                    {user.lastLogin && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                          <Clock size={20} className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">
                            {t('fields.lastLogin')}
                          </p>
                          <p className="text-white">{formatDate(user.lastLogin)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {user.bio && (
                  <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">{t('fields.bio')}</p>
                    <p className="text-white">{user.bio}</p>
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

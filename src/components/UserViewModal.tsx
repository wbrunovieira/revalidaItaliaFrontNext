// /src/components/UserViewModal.tsx
'use client';

// CORREÇÃO: Adicionado 'useCallback' para memoizar funções.
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
  MapPin,
  Home,
  Building,
} from 'lucide-react';

// Interfaces permanecem as mesmas
interface UserDetails {
  id: string;
  name: string;
  email: string;
  nationalId: string;
  role: 'admin' | 'student';
  createdAt: string;
  updatedAt: string;
}

interface Address {
  id: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  createdAt: string;
  updatedAt: string;
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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] =
    useState(false);
  const [copiedField, setCopiedField] = useState<
    string | null
  >(null);

  // CORREÇÃO: Função envolvida com useCallback para estabilizar sua referência.
  const fetchUserAddresses = useCallback(
    async (userId: string) => {
      setLoadingAddresses(true);
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
          `${process.env.NEXT_PUBLIC_API_URL}/addresses?userId=${userId}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Acesso negado - É necessário fazer login como administrador'
              : 'Failed to fetch user addresses'
          );
        }

        const addressesData: Address[] =
          await response.json();
        setAddresses(addressesData);
      } catch (error) {
        console.error(error);
        toast({
          title: t('error.fetchAddressesTitle'),
          description:
            error instanceof Error
              ? error.message
              : t('error.fetchAddressesDescription'),
          variant: 'destructive',
        });
      } finally {
        setLoadingAddresses(false);
      }
    },
    [t, toast]
  );

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
        setUser(data.user);
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
      fetchUserAddresses(userId);
    } else {
      setUser(null);
      setAddresses([]);
    }
  }, [
    isOpen,
    userId,
    fetchUserDetails,
    fetchUserAddresses,
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
                    {user.name}
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
                          {user.id}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(user.id, 'ID')
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
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-700 pb-3">
                  <MapPin
                    size={24}
                    className="text-secondary"
                  />
                  <h4 className="text-xl font-bold text-white">
                    {t('addresses.title')}
                  </h4>
                </div>
                {loadingAddresses ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2].map(i => (
                      <div
                        key={i}
                        className="h-32 bg-gray-700 rounded-lg"
                      ></div>
                    ))}
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((address, index) => (
                      <div
                        key={address.id}
                        className="bg-gray-700/50 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Home
                              size={18}
                              className="text-secondary"
                            />
                            {t('addresses.address')}{' '}
                            {index + 1}
                          </h5>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `${address.street}, ${
                                  address.number
                                }${
                                  address.complement
                                    ? ', ' +
                                      address.complement
                                    : ''
                                }, ${address.district}, ${
                                  address.city
                                } - ${address.state}, ${
                                  address.country
                                }, ${address.postalCode}`,
                                `Endereço ${index + 1}`
                              )
                            }
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                          >
                            {copiedField ===
                            `Endereço ${index + 1}` ? (
                              <Check
                                size={16}
                                className="text-green-400"
                              />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400">
                              {t('addresses.street')}
                            </p>
                            <p className="text-white">
                              {address.street}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">
                              {t('addresses.number')}
                            </p>
                            <p className="text-white">
                              {address.number}
                            </p>
                          </div>
                          {address.complement && (
                            <div>
                              <p className="text-gray-400">
                                {t('addresses.complement')}
                              </p>
                              <p className="text-white">
                                {address.complement}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-400">
                              {t('addresses.district')}
                            </p>
                            <p className="text-white">
                              {address.district}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">
                              {t('addresses.city')}
                            </p>
                            <p className="text-white">
                              {address.city}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">
                              {t('addresses.state')}
                            </p>
                            <p className="text-white">
                              {address.state}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">
                              {t('addresses.country')}
                            </p>
                            <p className="text-white">
                              {address.country}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">
                              {t('addresses.postalCode')}
                            </p>
                            <p className="text-white font-mono">
                              {address.postalCode}
                            </p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-600 text-xs text-gray-500">
                          <p>
                            {t('addresses.createdAt')}:{' '}
                            {formatDate(address.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building
                      size={48}
                      className="text-gray-500 mx-auto mb-3"
                    />
                    <p className="text-gray-400">
                      {t('addresses.noAddresses')}
                    </p>
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Edit,
  Trash2,
  Eye,
  Search,
  Shield,
  User,
  Mail,
  CreditCard,
} from 'lucide-react';
import UserViewModal from './UserViewModal';

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'student';
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
  };
}

export default function UsersList() {
  const t = useTranslations('Admin.usersList');
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingUserId, setViewingUserId] = useState<
    string | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Funções para o modal de visualização
  const handleViewUser = (userId: string) => {
    setViewingUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setViewingUserId(null);
  };

  // Função para ler cookies no client-side
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
      return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // 1. fetchUsers com useCallback
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Busca o token dos cookies (como na página principal) ou localStorage como fallback
      const tokenFromCookie = getCookie('token');
      const tokenFromStorage =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken');
      const token = tokenFromCookie || tokenFromStorage;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Só adiciona Authorization se tiver token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/students`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Acesso negado - É necessário fazer login como administrador'
          );
        }
        throw new Error('Failed to fetch users');
      }
      const data: UsersResponse = await response.json();
      setUsers(data.users);
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
  }, [t, toast]);

  // 2. agora sim, inclui fetchUsers no array de deps
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      // Busca o token dos cookies (como na página principal) ou localStorage como fallback
      const tokenFromCookie = getCookie('token');
      const tokenFromStorage =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken');
      const token = tokenFromCookie || tokenFromStorage;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Só adiciona Authorization se tiver token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/students/${userId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Acesso negado - É necessário fazer login como administrador'
          );
        }
        throw new Error('Failed to delete user');
      }
      toast({
        title: t('success.deleteTitle'),
        description: t('success.deleteDescription'),
      });
      await fetchUsers(); // refetch após apagar
    } catch (error) {
      console.error(error);
      toast({
        title: t('error.deleteTitle'),
        description:
          error instanceof Error
            ? error.message
            : t('error.deleteDescription'),
        variant: 'destructive',
      });
    }
  };

  // Filtra resultados
  const filteredUsers = users.filter(user => {
    return (
      user.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.cpf.includes(searchTerm) ||
      user.role
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  // Estatísticas
  const totalUsers = users.length;
  const adminUsers = users.filter(
    user => user.role === 'admin'
  ).length;
  const studentUsers = users.filter(
    user => user.role === 'student'
  ).length;

  if (loading) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-24 bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <Users size={24} className="text-secondary" />
          {t('title')}
        </h3>
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {totalUsers}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.total')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {adminUsers}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.admins')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {studentUsers}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.students')}
          </p>
        </div>
      </div>

      {/* Lista */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-4">
          {filteredUsers.map(user => {
            return (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center flex-shrink-0">
                  {user.role === 'admin' ? (
                    <Shield
                      size={20}
                      className="text-white"
                    />
                  ) : (
                    <User
                      size={20}
                      className="text-white"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-white">
                      {user.name}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
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
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard size={12} />
                      {user.cpf}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>ID: {user.id.slice(0, 8)}…</span>
                    <span>
                      Criado:{' '}
                      {new Date(
                        user.createdAt
                      ).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewUser(user.id)}
                    title={t('actions.view')}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    title={t('actions.edit')}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    title={t('actions.delete')}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users
            size={64}
            className="text-gray-500 mx-auto mb-4"
          />
          <p className="text-gray-400">
            {searchTerm ? t('noResults') : t('noUsers')}
          </p>
        </div>
      )}

      {/* Modal de visualização */}
      <UserViewModal
        userId={viewingUserId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

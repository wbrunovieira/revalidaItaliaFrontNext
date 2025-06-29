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
  X,
} from 'lucide-react';
import UserViewModal from './UserViewModal';
import UserEditModal from './UserEditModal';

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'student';
  createdAt: string;
  updatedAt: string;
}

interface UserEditData {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'student';
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
  };
}

// Função utilitária movida para fora para evitar recriação
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2)
    return parts.pop()?.split(';').shift() || null;
  return null;
};

export default function UsersList() {
  const t = useTranslations('Admin.usersList');
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [apiSearchLoading, setApiSearchLoading] =
    useState(false);
  const [isApiSearchActive, setIsApiSearchActive] =
    useState(false);
  const [viewingUserId, setViewingUserId] = useState<
    string | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] =
    useState<UserEditData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);

  const fetchUsers = useCallback(async () => {
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
        `${process.env.NEXT_PUBLIC_API_URL}/students`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Acesso negado - É necessário fazer login como administrador'
            : 'Failed to fetch users'
        );
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

  const searchUsersAPI = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setIsApiSearchActive(false);
        return;
      }
      setApiSearchLoading(true);
      setIsApiSearchActive(true);

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

        let searchParams = '';
        const cleanQuery = searchQuery.trim();

        if (cleanQuery.includes('@')) {
          searchParams = `email=${encodeURIComponent(
            cleanQuery
          )}`;
        } else if (
          /^\d+$/.test(cleanQuery.replace(/\D/g, ''))
        ) {
          searchParams = `cpf=${encodeURIComponent(
            cleanQuery.replace(/\D/g, '')
          )}`;
        } else {
          searchParams = `name=${encodeURIComponent(
            cleanQuery
          )}`;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/students/search?${searchParams}`,
          { headers }
        );
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Acesso negado - É necessário fazer login como administrador'
              : 'Failed to search users'
          );
        }

        const data: UsersResponse = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error(error);
        toast({
          title: t('error.searchTitle'),
          description:
            error instanceof Error
              ? error.message
              : t('error.searchDescription'),
          variant: 'destructive',
        });
      } finally {
        setApiSearchLoading(false);
      }
    },
    [t, toast]
  );

  const clearApiSearch = useCallback(() => {
    setApiSearchTerm('');
    setIsApiSearchActive(false);
    fetchUsers();
  }, [fetchUsers]);

  const handleViewUser = useCallback((userId: string) => {
    setViewingUserId(userId);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setViewingUserId(null);
  }, []);

  const handleEditUser = useCallback((user: User) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      role: user.role,
    });
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  }, []);

  const handleSaveUser = useCallback(
    (updatedUser: UserEditData) => {
      setUsers(prev =>
        prev.map(user =>
          user.id === updatedUser.id
            ? { ...user, ...updatedUser }
            : user
        )
      );
    },
    []
  );

  const handleDelete = useCallback(
    async (userId: string) => {
      if (!confirm(t('deleteConfirm'))) return;

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
          `${process.env.NEXT_PUBLIC_API_URL}/students/${userId}`,
          { method: 'DELETE', headers }
        );
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Acesso negado - É necessário fazer login como administrador'
              : 'Failed to delete user'
          );
        }
        toast({
          title: t('success.deleteTitle'),
          description: t('success.deleteDescription'),
        });
        await fetchUsers();
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
    },
    [t, toast, fetchUsers]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (apiSearchTerm) {
        searchUsersAPI(apiSearchTerm);
      } else if (isApiSearchActive) {
        setIsApiSearchActive(false);
        fetchUsers();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [
    apiSearchTerm,
    searchUsersAPI,
    isApiSearchActive,
    fetchUsers,
  ]);

  const filteredUsers = !isApiSearchActive
    ? users.filter(
        user =>
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
      )
    : users;

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
        <div className="relative mb-4">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t('apiSearchPlaceholder')}
            value={apiSearchTerm}
            onChange={e => setApiSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          {apiSearchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary"></div>
            </div>
          )}
          {isApiSearchActive && !apiSearchLoading && (
            <button
              onClick={clearApiSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {isApiSearchActive && (
          <div className="mb-4 p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
            <p className="text-secondary text-sm flex items-center gap-2">
              <Search size={16} />
              {t('apiSearchActive', {
                term: apiSearchTerm,
              })}
              <button
                onClick={clearApiSearch}
                className="ml-auto text-xs bg-secondary/20 hover:bg-secondary/30 px-2 py-1 rounded"
              >
                {t('clearSearch')}
              </button>
            </p>
          </div>
        )}
        {!isApiSearchActive && (
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t('localSearchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        )}
      </div>
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
      {filteredUsers.length > 0 ? (
        <div className="space-y-4">
          {filteredUsers.map(user => (
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
                  <User size={20} className="text-white" />
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
                  onClick={() => handleEditUser(user)}
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
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users
            size={64}
            className="text-gray-500 mx-auto mb-4"
          />
          <p className="text-gray-400">
            {isApiSearchActive
              ? // CORREÇÃO: Usar a interpolação do `next-intl` em vez de `.replace()`
                t('noApiResults', { term: apiSearchTerm })
              : searchTerm
              ? t('noLocalResults')
              : t('noUsers')}
          </p>
        </div>
      )}
      <UserViewModal
        userId={viewingUserId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      <UserEditModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveUser}
      />
    </div>
  );
}

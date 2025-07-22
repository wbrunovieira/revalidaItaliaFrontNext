// /src/components/UsersList.tsx
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
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import UserViewModal from './UserViewModal';
import UserEditModal from './UserEditModal';

interface User {
  id: string;
  name: string;
  email: string;
  nationalId: string;
  role: 'admin' | 'student' | 'tutor';
  createdAt: string;
  updatedAt: string;
}

interface UserEditData {
  id: string;
  name: string;
  email: string;
  nationalId: string;
  role: 'admin' | 'student' | 'tutor';
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    total?: number;
    totalPages?: number;
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

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = useCallback(
    async (page: number = 1) => {
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
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users?page=${page}&pageSize=${pageSize}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Acesso negado - É necessário fazer login como administrador'
              : 'Failed to fetch users'
          );
        }
        const data = await response.json();
        
        // Verificar se a resposta é um array direto ou um objeto com users/pagination
        if (Array.isArray(data)) {
          setUsers(data);
          setCurrentPage(page);
          setTotalPages(1); // Se retornou array, assumir uma página
          setTotalUsers(data.length);
        } else if (data.users && data.pagination) {
          setUsers(data.users);
          setCurrentPage(data.pagination.page);
          setTotalPages(
            data.pagination.totalPages ||
              Math.ceil(data.users.length / pageSize)
          );
          setTotalUsers(
            data.pagination.total || data.users.length
          );
        } else {
          // Caso a estrutura seja diferente
          console.error('Unexpected API response structure:', data);
          setUsers([]);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalUsers(0);
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
    [t, toast, pageSize]
  );

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
          searchParams = `nationalId=${encodeURIComponent(
            cleanQuery.replace(/\D/g, '')
          )}`;
        } else {
          searchParams = `name=${encodeURIComponent(
            cleanQuery
          )}`;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/search?${searchParams}`,
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
    fetchUsers(1);
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
      nationalId: user.nationalId,
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

  // Função para deletar usuário após confirmação
  const deleteUser = useCallback(
    async (userId: string) => {
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
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${userId}`,
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
          title: 'Usuário excluído',
          description:
            'O usuário foi excluído com sucesso.',
          variant: 'success',
        });
        await fetchUsers(currentPage);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Erro ao excluir',
          description:
            error instanceof Error
              ? error.message
              : 'Ocorreu um erro ao excluir o usuário.',
          variant: 'destructive',
        });
      }
    },
    [toast, fetchUsers, currentPage]
  );

  // Função para mostrar confirmação personalizada usando toast
  const handleDelete = useCallback(
    async (userId: string, userName: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      // Toast de confirmação personalizado
      toast({
        title: t('deleteConfirmation.title'),
        description: (
          <div className="space-y-3">
            <p className="text-sm">
              {t('deleteConfirmation.message', {
                userName,
              })}
            </p>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs text-gray-300 space-y-1">
                <div>
                  📧 {t('deleteConfirmation.email')}:{' '}
                  {user.email}
                </div>
                <div>
                  🆔 {t('deleteConfirmation.cpf')}:{' '}
                  {user.nationalId}
                </div>
                <div>
                  👤 {t('deleteConfirmation.role')}:{' '}
                  {t(
                    `role${
                      user.role.charAt(0).toUpperCase() +
                      user.role.slice(1)
                    }`
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-red-300 font-medium">
              ⚠️ {t('deleteConfirmation.warning')}
            </p>
          </div>
        ),
        variant: 'destructive',
        action: (
          <div className="flex gap-2">
            <button
              onClick={() => deleteUser(userId)}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-red-600 bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              {t('deleteConfirmation.confirm')}
            </button>
          </div>
        ),
      });
    },
    [toast, deleteUser, users, t]
  );

  // Funções de paginação
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        fetchUsers(page);
      }
    },
    [totalPages, fetchUsers]
  );

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (apiSearchTerm) {
        searchUsersAPI(apiSearchTerm);
      } else if (isApiSearchActive) {
        setIsApiSearchActive(false);
        fetchUsers(1);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [
    apiSearchTerm,
    searchUsersAPI,
    isApiSearchActive,
    fetchUsers,
  ]);

  const filteredUsers = !isApiSearchActive && users
    ? users.filter(
        user =>
          user.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          user.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          user.nationalId.includes(searchTerm) ||
          user.role
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : users || [];

  // Contadores de usuários por papel
  const userCounts = {
    total: totalUsers,
    admins: users.filter(user => user.role === 'admin')
      .length,
    tutors: users.filter(user => user.role === 'tutor')
      .length,
    students: users.filter(user => user.role === 'student')
      .length,
  };

  // Função para obter ícone do papel
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield size={20} className="text-white" />;
      case 'tutor':
        return (
          <GraduationCap size={20} className="text-white" />
        );
      case 'student':
      default:
        return <User size={20} className="text-white" />;
    }
  };

  // Função para obter estilo do papel
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-900/30 text-red-400 border border-red-800';
      case 'tutor':
        return 'bg-green-900/30 text-green-400 border border-green-800';
      case 'student':
      default:
        return 'bg-blue-900/30 text-blue-400 border border-blue-800';
    }
  };

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

      {/* Estatísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {userCounts.total}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.total')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {userCounts.admins}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.admins')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {userCounts.tutors}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.tutors')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {userCounts.students}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.students')}
          </p>
        </div>
      </div>

      {filteredUsers.length > 0 ? (
        <>
          <div className="space-y-4 mb-6">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center flex-shrink-0">
                  {getRoleIcon(user.role)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-white">
                      {user.name}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getRoleStyle(
                        user.role
                      )}`}
                    >
                      {t(
                        `role${
                          user.role
                            .charAt(0)
                            .toUpperCase() +
                          user.role.slice(1)
                        }`
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard size={12} />
                      {user.nationalId}
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
                    onClick={() =>
                      handleDelete(user.id, user.name)
                    }
                    title={t('actions.delete')}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {!isApiSearchActive && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-700 pt-4">
              <div className="text-sm text-gray-400">
                {t('pagination.showing', {
                  start: (currentPage - 1) * pageSize + 1,
                  end: Math.min(
                    currentPage * pageSize,
                    totalUsers
                  ),
                  total: totalUsers,
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  {t('pagination.previous')}
                </button>

                <span className="px-3 py-2 text-sm text-gray-400">
                  {t('pagination.pageOf', {
                    current: currentPage,
                    total: totalPages,
                  })}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('pagination.next')}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Users
            size={64}
            className="text-gray-500 mx-auto mb-4"
          />
          <p className="text-gray-400">
            {isApiSearchActive
              ? t('noApiResults', { term: apiSearchTerm })
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

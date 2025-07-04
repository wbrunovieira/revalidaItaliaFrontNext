// UserEditModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  User,
  Mail,
  CreditCard,
  Shield,
  GraduationCap,
  UserIcon,
  Save,
  Loader2,
} from 'lucide-react';

// Tipos atualizados com suporte a tutor
interface UserEditData {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'student' | 'tutor'; // ✅ Adicionado 'tutor'
}

interface UserEditModalProps {
  user: UserEditData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: UserEditData) => void;
}

type UserRole = 'admin' | 'student' | 'tutor';

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onSave,
}: UserEditModalProps) {
  const t = useTranslations('Admin.userEdit');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    role: 'student' as UserRole, // ✅ Agora aceita 'tutor'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  // Função para ler cookies no client-side
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
      return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Formatação de CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/
    );
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return value;
  };

  // Validação de email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validação de CPF
  const isValidCPF = (cpf: string) => {
    return /^\d{11}$/.test(cpf.replace(/\D/g, ''));
  };

  // Função para obter ícone do papel
  const getRoleIcon = (
    role: UserRole,
    size: number = 16
  ) => {
    switch (role) {
      case 'admin':
        return (
          <Shield size={size} className="text-red-400" />
        );
      case 'tutor':
        return (
          <GraduationCap
            size={size}
            className="text-green-400"
          />
        );
      case 'student':
      default:
        return (
          <UserIcon size={size} className="text-blue-400" />
        );
    }
  };

  // Função para obter cor do papel
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'text-red-400';
      case 'tutor':
        return 'text-green-400';
      case 'student':
      default:
        return 'text-blue-400';
    }
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('errors.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('errors.emailRequired');
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = t('errors.emailInvalid');
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = t('errors.cpfRequired');
    } else if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = t('errors.cpfInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manipular mudança de CPF com formatação
  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    if (formatted.length <= 14) {
      // Permite formato XXX.XXX.XXX-XX
      setFormData(prev => ({ ...prev, cpf: formatted }));
    }
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const tokenFromCookie = getCookie('token');
      const tokenFromStorage =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken');
      const token = tokenFromCookie || tokenFromStorage;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/students/${user.id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            cpf: formData.cpf.replace(/\D/g, ''), // Remove formatação antes de enviar
            role: formData.role,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Acesso negado - É necessário fazer login como administrador'
          );
        }
        throw new Error('Failed to update user');
      }

      const data = await response.json();

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      // Chamar callback com dados atualizados incluindo CPF formatado
      const updatedUser: UserEditData = {
        id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        cpf: formData.cpf,
        role: formData.role,
      };

      onSave(updatedUser);
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: t('error.title'),
        description:
          error instanceof Error
            ? error.message
            : t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar formulário quando user mudar
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
      });
      setErrors({});
    }
  }, [user, isOpen]);

  // Close modal on escape key
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

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User size={16} className="inline mr-2" />
                {t('fields.name')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
                  errors.name
                    ? 'border-red-500'
                    : 'border-gray-600'
                }`}
                placeholder={t('placeholders.name')}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail size={16} className="inline mr-2" />
                {t('fields.email')}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
                  errors.email
                    ? 'border-red-500'
                    : 'border-gray-600'
                }`}
                placeholder={t('placeholders.email')}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <CreditCard
                  size={16}
                  className="inline mr-2"
                />
                {t('fields.cpf')}
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={e =>
                  handleCpfChange(e.target.value)
                }
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
                  errors.cpf
                    ? 'border-red-500'
                    : 'border-gray-600'
                }`}
                placeholder={t('placeholders.cpf')}
                maxLength={14} // Para formato XXX.XXX.XXX-XX
              />
              {errors.cpf && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.cpf}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getRoleIcon(formData.role)}
                <span className="ml-2">
                  {t('fields.role')}
                </span>
              </label>
              <select
                value={formData.role}
                onChange={e =>
                  setFormData({
                    ...formData,
                    role: e.target.value as UserRole,
                  })
                }
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
              >
                <option
                  value="student"
                  className="flex items-center"
                >
                  {t('roles.student')}
                </option>
                <option
                  value="tutor"
                  className="flex items-center"
                >
                  {t('roles.tutor')}
                </option>
                <option
                  value="admin"
                  className="flex items-center"
                >
                  {t('roles.admin')}
                </option>
              </select>

              {/* Indicador visual do papel selecionado */}
              <div className="mt-2 flex items-center gap-2">
                {getRoleIcon(formData.role, 20)}
                <span
                  className={`text-sm font-medium ${getRoleColor(
                    formData.role
                  )}`}
                >
                  {t(`roles.${formData.role}`)}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

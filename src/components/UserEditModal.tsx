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
  Save,
  Loader2,
} from 'lucide-react';

interface UserEditData {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'student';
}

interface UserEditModalProps {
  user: UserEditData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: UserEditData) => void;
}

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
    role: 'student' as 'admin' | 'student',
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

  // Validação de email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validação de CPF (básica)
  const isValidCPF = (cpf: string) => {
    return /^\d{11}$/.test(cpf.replace(/\D/g, ''));
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
            cpf: formData.cpf.replace(/\D/g, ''),
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

      // Chamar callback com dados atualizados
      onSave(data.user);
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
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
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
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
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
                  setFormData({
                    ...formData,
                    cpf: e.target.value,
                  })
                }
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                  errors.cpf
                    ? 'border-red-500'
                    : 'border-gray-600'
                }`}
                placeholder={t('placeholders.cpf')}
                maxLength={11}
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
                <Shield size={16} className="inline mr-2" />
                {t('fields.role')}
              </label>
              <select
                value={formData.role}
                onChange={e =>
                  setFormData({
                    ...formData,
                    role: e.target.value as
                      | 'admin'
                      | 'student',
                  })
                }
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-secondary"
              >
                <option value="student">
                  {t('roles.student')}
                </option>
                <option value="admin">
                  {t('roles.admin')}
                </option>
              </select>
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

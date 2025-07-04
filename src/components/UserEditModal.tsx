// UserEditModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Check,
  AlertCircle,
} from 'lucide-react';

// Tipos atualizados com suporte a tutor
interface UserEditData {
  id: string;
  name: string;
  email: string;
  cpf: string;
  role: 'admin' | 'student' | 'tutor';
}

interface UserEditModalProps {
  user: UserEditData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: UserEditData) => void;
}

type UserRole = 'admin' | 'student' | 'tutor';

interface FormData {
  name: string;
  email: string;
  cpf: string;
  role: UserRole;
}

interface FormErrors {
  name?: string;
  email?: string;
  cpf?: string;
  role?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onSave,
}: UserEditModalProps) {
  const t = useTranslations('Admin.userEdit');
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    cpf: '',
    role: 'student',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
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

  // Validação de CPF completa
  const validateCPF = useCallback(
    (cpf: string): boolean => {
      const cleanCPF = cpf.replace(/\D/g, '');

      if (cleanCPF.length !== 11) return false;
      if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // CPF com todos os dígitos iguais

      // Validação dos dígitos verificadores
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
      }
      let remainder = 11 - (sum % 11);
      const digit1 = remainder < 2 ? 0 : remainder;

      if (parseInt(cleanCPF.charAt(9)) !== digit1)
        return false;

      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
      }
      remainder = 11 - (sum % 11);
      const digit2 = remainder < 2 ? 0 : remainder;

      return parseInt(cleanCPF.charAt(10)) === digit2;
    },
    []
  );

  // Validação individual de campos
  const validateField = useCallback(
    (
      field: keyof FormData,
      value: string
    ): ValidationResult => {
      switch (field) {
        case 'name':
          if (!value.trim()) {
            return {
              isValid: false,
              message: t('errors.nameRequired'),
            };
          }
          if (value.trim().length < 2) {
            return {
              isValid: false,
              message: t('errors.nameMin'),
            };
          }
          if (value.trim().length > 100) {
            return {
              isValid: false,
              message: t('errors.nameMax'),
            };
          }
          if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(value.trim())) {
            return {
              isValid: false,
              message: t('errors.nameInvalid'),
            };
          }
          return { isValid: true };

        case 'email':
          if (!value.trim()) {
            return {
              isValid: false,
              message: t('errors.emailRequired'),
            };
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return {
              isValid: false,
              message: t('errors.emailInvalid'),
            };
          }
          if (value.length > 254) {
            return {
              isValid: false,
              message: t('errors.emailMax'),
            };
          }
          return { isValid: true };

        case 'cpf':
          if (!value.trim()) {
            return {
              isValid: false,
              message: t('errors.cpfRequired'),
            };
          }
          if (!validateCPF(value)) {
            return {
              isValid: false,
              message: t('errors.cpfInvalid'),
            };
          }
          return { isValid: true };

        case 'role':
          if (!value) {
            return {
              isValid: false,
              message: t('errors.roleRequired'),
            };
          }
          if (
            !['admin', 'tutor', 'student'].includes(value)
          ) {
            return {
              isValid: false,
              message: t('errors.roleInvalid'),
            };
          }
          return { isValid: true };

        default:
          return { isValid: true };
      }
    },
    [t, validateCPF]
  );

  // Validação em tempo real
  const handleFieldValidation = useCallback(
    (field: keyof FormData, value: string) => {
      if (touched[field]) {
        const validation = validateField(field, value);
        setErrors(prev => ({
          ...prev,
          [field]: validation.isValid
            ? undefined
            : validation.message,
        }));
      }
    },
    [touched, validateField]
  );

  // Formatação de CPF
  const formatCPF = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/
    );
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return value;
  }, []);

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

  // Validar formulário completo
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (
      Object.keys(formData) as Array<keyof FormData>
    ).forEach(field => {
      const validation = validateField(
        field,
        formData[field]
      );
      if (!validation.isValid) {
        newErrors[field] = validation.message;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  // Manipular mudança de inputs
  const handleInputChange = useCallback(
    (field: keyof FormData) => (value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      handleFieldValidation(field, value);
    },
    [handleFieldValidation]
  );

  const handleInputBlur = useCallback(
    (field: keyof FormData) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      handleFieldValidation(field, formData[field]);
    },
    [formData, handleFieldValidation]
  );

  // Manipular mudança de CPF com formatação
  const handleCpfChange = useCallback(
    (value: string) => {
      const formatted = formatCPF(value);
      if (formatted.length <= 14) {
        setFormData(prev => ({ ...prev, cpf: formatted }));
        handleFieldValidation('cpf', formatted);
      }
    },
    [formatCPF, handleFieldValidation]
  );

  // Função para tratamento de erros da API
  const handleApiError = useCallback(
    (error: unknown) => {
      console.error('User update error:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('409') ||
          error.message.includes('conflict')
        ) {
          toast({
            title: t('error.conflictTitle'),
            description: t('error.conflictDescription'),
            variant: 'destructive',
          });
          return;
        }

        if (error.message.includes('400')) {
          toast({
            title: t('error.validationTitle'),
            description: t('error.validationDescription'),
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: t('error.title'),
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('error.title'),
          description: t('error.description'),
          variant: 'destructive',
        });
      }
    },
    [toast, t]
  );

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    const allTouched = Object.keys(formData).reduce(
      (acc, field) => {
        acc[field as keyof FormData] = true;
        return acc;
      },
      {} as Record<keyof FormData, boolean>
    );
    setTouched(allTouched);

    if (!validateForm() || !user) {
      toast({
        title: t('error.validationTitle'),
        description: t('error.validationDescription'),
        variant: 'destructive',
      });
      return;
    }

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
            email: formData.email.trim().toLowerCase(),
            cpf: formData.cpf.replace(/\D/g, ''),
            role: formData.role,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update user: ${response.status} - ${errorText}`
        );
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      // Chamar callback com dados atualizados incluindo CPF formatado
      const updatedUser: UserEditData = {
        id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        cpf: formData.cpf,
        role: formData.role,
      };

      onSave(updatedUser);
      onClose();
    } catch (error) {
      handleApiError(error);
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
      setTouched({});
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
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  handleInputChange('name')(e.target.value)
                }
                onBlur={handleInputBlur('name')}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
                  errors.name
                    ? 'border-red-500'
                    : 'border-gray-600'
                }`}
                placeholder={t('placeholders.name')}
              />
              {errors.name && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                  <AlertCircle size={14} />
                  {errors.name}
                </div>
              )}
              {formData.name &&
                !errors.name &&
                touched.name && (
                  <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
                    <Check size={14} />
                    {t('validation.nameValid')}
                  </div>
                )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail size={16} className="inline mr-2" />
                {t('fields.email')}
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e =>
                  handleInputChange('email')(e.target.value)
                }
                onBlur={handleInputBlur('email')}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
                  errors.email
                    ? 'border-red-500'
                    : 'border-gray-600'
                }`}
                placeholder={t('placeholders.email')}
              />
              {errors.email && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                  <AlertCircle size={14} />
                  {errors.email}
                </div>
              )}
              {formData.email &&
                !errors.email &&
                touched.email && (
                  <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
                    <Check size={14} />
                    {t('validation.emailValid')}
                  </div>
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
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={e =>
                  handleCpfChange(e.target.value)
                }
                onBlur={handleInputBlur('cpf')}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
                  errors.cpf
                    ? 'border-red-500'
                    : 'border-gray-600'
                }`}
                placeholder={t('placeholders.cpf')}
                maxLength={14}
              />
              {errors.cpf && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                  <AlertCircle size={14} />
                  {errors.cpf}
                </div>
              )}
              {formData.cpf &&
                !errors.cpf &&
                touched.cpf && (
                  <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
                    <Check size={14} />
                    {t('validation.cpfValid')}
                  </div>
                )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getRoleIcon(formData.role)}
                <span className="ml-2">
                  {t('fields.role')}
                </span>
                <span className="text-red-400 ml-1">*</span>
              </label>
              <select
                value={formData.role}
                onChange={e => {
                  const value = e.target.value as UserRole;
                  setFormData(prev => ({
                    ...prev,
                    role: value,
                  }));
                  setTouched(prev => ({
                    ...prev,
                    role: true,
                  }));
                }}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-secondary transition-colors"
              >
                <option value="student">
                  {t('roles.student')}
                </option>
                <option value="tutor">
                  {t('roles.tutor')}
                </option>
                <option value="admin">
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

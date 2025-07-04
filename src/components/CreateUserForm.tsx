'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  CreditCard,
  Shield,
} from 'lucide-react';
import Image from 'next/image';

type UserRole = 'admin' | 'tutor' | 'student';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  cpf: string;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  cpf: string;
}

export default function CreateUserForm() {
  const t = useTranslations('Admin.createUser');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    cpf: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>(
    {}
  );

  // Verificação em tempo real se as senhas coincidem
  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;
  const showPasswordComparison =
    formData.password && formData.confirmPassword;

  // Função para tratamento centralizado de erros
  const handleApiError = useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);

      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
      }
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('errors.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('errors.passwordMin');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t(
        'errors.passwordMismatch'
      );
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = t('errors.cpfRequired');
    } else if (
      !/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))
    ) {
      newErrors.cpf = t('errors.cpfInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const createUser = useCallback(
    async (payload: CreateUserPayload): Promise<void> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/students`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create user: ${response.status}`
        );
      }
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      cpf: '',
    });
    setErrors({});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload: CreateUserPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        cpf: formData.cpf.replace(/\D/g, ''),
      };

      await createUser(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'User creation error');
      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
  }, []);

  const handlePasswordChange = useCallback(
    (value: string) => {
      setFormData(prev => ({ ...prev, password: value }));
    },
    []
  );

  const handleConfirmPasswordChange = useCallback(
    (value: string) => {
      setFormData(prev => ({
        ...prev,
        confirmPassword: value,
      }));
    },
    []
  );

  const handleRoleChange = useCallback(
    (value: UserRole) => {
      setFormData(prev => ({ ...prev, role: value }));
    },
    []
  );

  const handleCpfChange = useCallback(
    (value: string) => {
      const formatted = formatCPF(value);
      if (formatted.length <= 14) {
        setFormData(prev => ({ ...prev, cpf: formatted }));
      }
    },
    [formatCPF]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <UserPlus size={24} className="text-secondary" />
          {t('title')}
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Nome */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-gray-300 flex items-center gap-2"
            >
              <User size={16} />
              {t('fields.name')}
            </Label>
            <TextField
              id="name"
              placeholder={t('placeholders.name')}
              value={formData.name}
              onChange={e =>
                handleNameChange(e.target.value)
              }
              error={errors.name}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-gray-300 flex items-center gap-2"
            >
              <Mail size={16} />
              {t('fields.email')}
            </Label>
            <TextField
              id="email"
              type="email"
              placeholder={t('placeholders.email')}
              value={formData.email}
              onChange={e =>
                handleEmailChange(e.target.value)
              }
              error={errors.email}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label
              htmlFor="cpf"
              className="text-gray-300 flex items-center gap-2"
            >
              <CreditCard size={16} />
              {t('fields.cpf')}
            </Label>
            <TextField
              id="cpf"
              placeholder={t('placeholders.cpf')}
              value={formData.cpf}
              onChange={e =>
                handleCpfChange(e.target.value)
              }
              error={errors.cpf}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label
              htmlFor="role"
              className="text-gray-300 flex items-center gap-2"
            >
              <Shield size={16} />
              {t('fields.role')}
            </Label>
            <Select
              value={formData.role}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue
                  placeholder={t('placeholders.role')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem
                  value="student"
                  className="text-white hover:bg-gray-600"
                >
                  {t('roles.student')}
                </SelectItem>
                <SelectItem
                  value="tutor"
                  className="text-white hover:bg-gray-600"
                >
                  {t('roles.tutor')}
                </SelectItem>
                <SelectItem
                  value="admin"
                  className="text-white hover:bg-gray-600"
                >
                  {t('roles.admin')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-gray-300 flex items-center gap-2"
            >
              <Lock size={16} />
              {t('fields.password')}
            </Label>
            <div className="relative">
              <TextField
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('placeholders.password')}
                value={formData.password}
                onChange={e =>
                  handlePasswordChange(e.target.value)
                }
                error={errors.password}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute inset-y-0 right-3 flex items-center"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                <Image
                  src={
                    showPassword
                      ? '/icons/visionOpen.svg'
                      : '/icons/VIsionClosed.svg'
                  }
                  alt={showPassword ? 'Hide' : 'Show'}
                  width={18}
                  height={18}
                />
              </button>
            </div>
            {showPasswordComparison && (
              <div
                className={`mt-1 text-sm flex items-center gap-2 ${
                  passwordsMatch
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    passwordsMatch
                      ? 'bg-green-400'
                      : 'bg-red-400'
                  }`}
                ></span>
                {passwordsMatch
                  ? t('passwordMatch')
                  : t('errors.passwordMismatch')}
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-gray-300 flex items-center gap-2"
            >
              <Lock size={16} />
              {t('fields.confirmPassword')}
            </Label>
            <div className="relative">
              <TextField
                id="confirmPassword"
                type={
                  showConfirmPassword ? 'text' : 'password'
                }
                placeholder={t(
                  'placeholders.confirmPassword'
                )}
                value={formData.confirmPassword}
                onChange={e =>
                  handleConfirmPasswordChange(
                    e.target.value
                  )
                }
                error={errors.confirmPassword}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute inset-y-0 right-3 flex items-center"
                aria-label={
                  showConfirmPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                <Image
                  src={
                    showConfirmPassword
                      ? '/icons/visionOpen.svg'
                      : '/icons/VIsionClosed.svg'
                  }
                  alt={
                    showConfirmPassword ? 'Hide' : 'Show'
                  }
                  width={18}
                  height={18}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="bg-secondary text-primary hover:bg-secondary/90 px-6 py-3"
          >
            {loading ? t('creating') : t('create')}
          </Button>
        </div>
      </div>
    </form>
  );
}

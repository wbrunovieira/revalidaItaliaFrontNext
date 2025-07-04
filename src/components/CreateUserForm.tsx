'use client';

import { useState, useCallback, useEffect } from 'react';
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
  Check,
  X,
  AlertCircle,
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

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  cpf?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  cpf: string;
}

interface PasswordStrength {
  score: number;
  hasLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
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

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  // Verificação em tempo real se as senhas coincidem
  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  // Validação de CPF
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
      let digit1 = remainder < 2 ? 0 : remainder;

      if (parseInt(cleanCPF.charAt(9)) !== digit1)
        return false;

      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
      }
      remainder = 11 - (sum % 11);
      let digit2 = remainder < 2 ? 0 : remainder;

      return parseInt(cleanCPF.charAt(10)) === digit2;
    },
    []
  );

  // Análise de força da senha
  const analyzePasswordStrength = useCallback(
    (password: string): PasswordStrength => {
      const hasLength = password.length >= 8;
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial =
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
          password
        );

      const score = [
        hasLength,
        hasLower,
        hasUpper,
        hasNumber,
        hasSpecial,
      ].filter(Boolean).length;

      return {
        score,
        hasLength,
        hasLower,
        hasUpper,
        hasNumber,
        hasSpecial,
      };
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

        case 'password':
          if (!value) {
            return {
              isValid: false,
              message: t('errors.passwordRequired'),
            };
          }
          const strength = analyzePasswordStrength(value);
          if (!strength.hasLength) {
            return {
              isValid: false,
              message: t('errors.passwordMin'),
            };
          }
          if (strength.score < 3) {
            return {
              isValid: false,
              message: t('errors.passwordWeak'),
            };
          }
          return { isValid: true };

        case 'confirmPassword':
          if (!value) {
            return {
              isValid: false,
              message: t('errors.confirmPasswordRequired'),
            };
          }
          if (value !== formData.password) {
            return {
              isValid: false,
              message: t('errors.passwordMismatch'),
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
    [
      formData.password,
      t,
      validateCPF,
      analyzePasswordStrength,
    ]
  );

  // Validação do formulário completo
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

  // Função para tratamento centralizado de erros
  const handleApiError = useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);

      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);

        // Tratamento de erros específicos da API
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
      }

      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    },
    [toast, t]
  );

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
        const errorText = await response.text();
        throw new Error(
          `Failed to create user: ${response.status} - ${errorText}`
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
    setTouched({});
  }, []);

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

    if (!validateForm()) {
      toast({
        title: t('error.validationTitle'),
        description: t('error.validationDescription'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const payload: CreateUserPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        cpf: formData.cpf.replace(/\D/g, ''),
      };

      await createUser(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'User creation error');
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

  // Validação em tempo real das senhas
  useEffect(() => {
    if (
      touched.confirmPassword &&
      formData.confirmPassword
    ) {
      handleFieldValidation(
        'confirmPassword',
        formData.confirmPassword
      );
    }
  }, [
    formData.password,
    formData.confirmPassword,
    touched.confirmPassword,
    handleFieldValidation,
  ]);

  const passwordStrength = analyzePasswordStrength(
    formData.password
  );

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'text-red-400';
    if (score <= 3) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return t('passwordStrength.weak');
    if (score <= 3) return t('passwordStrength.medium');
    return t('passwordStrength.strong');
  };

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
              <span className="text-red-400">*</span>
            </Label>
            <TextField
              id="name"
              placeholder={t('placeholders.name')}
              value={formData.name}
              onChange={e =>
                handleInputChange('name')(e.target.value)
              }
              onBlur={handleInputBlur('name')}
              error={errors.name}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            {formData.name && !errors.name && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={14} />
                {t('validation.nameValid')}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-gray-300 flex items-center gap-2"
            >
              <Mail size={16} />
              {t('fields.email')}
              <span className="text-red-400">*</span>
            </Label>
            <TextField
              id="email"
              type="email"
              placeholder={t('placeholders.email')}
              value={formData.email}
              onChange={e =>
                handleInputChange('email')(e.target.value)
              }
              onBlur={handleInputBlur('email')}
              error={errors.email}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            {formData.email && !errors.email && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={14} />
                {t('validation.emailValid')}
              </div>
            )}
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label
              htmlFor="cpf"
              className="text-gray-300 flex items-center gap-2"
            >
              <CreditCard size={16} />
              {t('fields.cpf')}
              <span className="text-red-400">*</span>
            </Label>
            <TextField
              id="cpf"
              placeholder={t('placeholders.cpf')}
              value={formData.cpf}
              onChange={e =>
                handleCpfChange(e.target.value)
              }
              onBlur={handleInputBlur('cpf')}
              error={errors.cpf}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            {formData.cpf && !errors.cpf && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={14} />
                {t('validation.cpfValid')}
              </div>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label
              htmlFor="role"
              className="text-gray-300 flex items-center gap-2"
            >
              <Shield size={16} />
              {t('fields.role')}
              <span className="text-red-400">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) => {
                setFormData(prev => ({
                  ...prev,
                  role: value,
                }));
                setTouched(prev => ({
                  ...prev,
                  role: true,
                }));
              }}
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
              <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <TextField
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('placeholders.password')}
                value={formData.password}
                onChange={e =>
                  handleInputChange('password')(
                    e.target.value
                  )
                }
                onBlur={handleInputBlur('password')}
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

            {/* Indicador de força da senha */}
            {formData.password && (
              <div className="space-y-2">
                <div
                  className={`text-sm ${getPasswordStrengthColor(
                    passwordStrength.score
                  )}`}
                >
                  {t('passwordStrength.label')}:{' '}
                  {getPasswordStrengthText(
                    passwordStrength.score
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasLength
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasLength ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.length')}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasLower
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasLower ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.lowercase')}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasUpper
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasUpper ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.uppercase')}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasNumber
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasNumber ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.number')}
                  </div>
                  <div
                    className={`flex items-center gap-2 ${
                      passwordStrength.hasSpecial
                        ? 'text-green-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {passwordStrength.hasSpecial ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    {t('passwordRequirements.special')}
                  </div>
                </div>
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
              <span className="text-red-400">*</span>
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
                  handleInputChange('confirmPassword')(
                    e.target.value
                  )
                }
                onBlur={handleInputBlur('confirmPassword')}
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

            {/* Indicador de correspondência das senhas */}
            {formData.password &&
              formData.confirmPassword && (
                <div
                  className={`mt-1 text-sm flex items-center gap-2 ${
                    passwordsMatch
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {passwordsMatch ? (
                    <Check size={14} />
                  ) : (
                    <X size={14} />
                  )}
                  {passwordsMatch
                    ? t('passwordMatch')
                    : t('errors.passwordMismatch')}
                </div>
              )}
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

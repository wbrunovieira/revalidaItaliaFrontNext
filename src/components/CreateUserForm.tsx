// src/app/[locale]/admin/components/CreateUserForm.tsx

'use client';

import { useState } from 'react';
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

type UserRole = 'admin' | 'tutor' | 'student';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  cpf: string;
}

export default function CreateUserForm() {
  const t = useTranslations('Admin.createUser');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const validateForm = (): boolean => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/students`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            cpf: formData.cpf.replace(/\D/g, ''),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        cpf: '',
      });
      setErrors({});
    } catch (error) {
      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
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
                setFormData({
                  ...formData,
                  email: e.target.value,
                })
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
              onChange={e => {
                const formatted = formatCPF(e.target.value);
                if (formatted.length <= 14) {
                  setFormData({
                    ...formData,
                    cpf: formatted,
                  });
                }
              }}
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
              onValueChange={(value: UserRole) =>
                setFormData({ ...formData, role: value })
              }
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
            <TextField
              id="password"
              type="password"
              placeholder={t('placeholders.password')}
              value={formData.password}
              onChange={e =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
              error={errors.password}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
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
            <TextField
              id="confirmPassword"
              type="password"
              placeholder={t(
                'placeholders.confirmPassword'
              )}
              value={formData.confirmPassword}
              onChange={e =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              error={errors.confirmPassword}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
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

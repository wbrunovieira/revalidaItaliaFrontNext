'use client';

import { Badge } from '@/components/ui/badge';
import { Shield, Users, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface RoleBadgeProps {
  role: 'student' | 'admin' | 'tutor';
  className?: string;
}

const roleConfig = {
  admin: {
    icon: Shield,
    labelKey: 'admin',
    className: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
  },
  tutor: {
    icon: Users,
    labelKey: 'tutor',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  },
  student: {
    icon: GraduationCap,
    labelKey: 'student',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const t = useTranslations('Community.roles');
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs flex items-center gap-1 px-2 py-0.5 transition-colors',
        config.className,
        className
      )}
    >
      <Icon size={12} />
      {t(config.labelKey)}
    </Badge>
  );
}
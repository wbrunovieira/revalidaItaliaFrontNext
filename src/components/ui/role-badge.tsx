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
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30',
  },
  tutor: {
    icon: Users,
    labelKey: 'tutor',
    className: 'bg-gradient-to-r from-[#3887A6]/20 to-amber-500/10 text-[#3887A6] border-amber-500/40 hover:from-[#3887A6]/30 hover:to-amber-500/20',
  },
  student: {
    icon: GraduationCap,
    labelKey: 'student',
    className: 'bg-[#79BED9]/20 text-[#79BED9] border-[#79BED9]/30 hover:bg-[#79BED9]/30',
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const t = useTranslations('Community.roles');
  
  // Fallback para role inválida ou undefined
  const config = roleConfig[role] || roleConfig.student;
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
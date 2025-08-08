// src/components/Avatar.tsx
'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/stores/auth.store';

interface AvatarProps {
  asButton?: boolean;
}

export default function Avatar({ asButton = true }: AvatarProps = {}) {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1];
  const { user, profileCompleteness } = useAuth();

  const handleClick = () => {
    if (asButton) {
      router.push(`/${locale}/profile`);
    }
  };

  // Obter porcentagem de completude do perfil
  const percentage = profileCompleteness?.percentage || 0;
  
  // Determinar cor baseada na porcentagem
  const getProgressColor = () => {
    if (percentage < 30) return '#EF4444'; // red-500
    if (percentage < 100) return '#EAB308'; // yellow-500
    return '#10B981'; // green-500
  };

  const progressColor = getProgressColor();
  
  // Calcular stroke-dasharray para o círculo
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  const content = (
    <>
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-secondary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* SVG circular progress */}
      <svg 
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 48 48"
      >
        {/* Background circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/20"
        />
        {/* Progress circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth="2.5"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Avatar container */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden">
        <Image
          src={
            user?.profileImageUrl || '/icons/avatar.svg'
          }
          alt={user?.name || t('profile')}
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/0 via-secondary/20 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 -translate-x-full group-hover:translate-x-full" />
      </div>

      {/* Pulse animation on hover */}
      <div className="absolute inset-0 rounded-full border-2 border-secondary/50 opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
    </>
  );

  const className = "group relative p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary";

  if (asButton) {
    return (
      <button
        onClick={handleClick}
        className={className}
        aria-label={t('profile')}
        title={`${t('profile')} - ${percentage}% ${t('complete')}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div 
      className={className}
      title={`${t('profile')} - ${percentage}% ${t('complete')}`}
    >
      {content}
    </div>
  );
}

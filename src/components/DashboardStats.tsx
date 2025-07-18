// /src/components/DashboardStats.tsx
// src/app/[locale]/admin/components/DashboardStats.tsx

'use client';

import { useTranslations } from 'next-intl';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

export default function DashboardStats() {
  const t = useTranslations('Admin.dashboard');

  const stats = [
    {
      title: t('stats.totalUsers'),
      value: '1,234',
      icon: Users,
      change: '+12%',
      changeType: 'positive',
    },
    {
      title: t('stats.activeStudents'),
      value: '987',
      icon: GraduationCap,
      change: '+5%',
      changeType: 'positive',
    },
    {
      title: t('stats.totalCourses'),
      value: '45',
      icon: BookOpen,
      change: '+2',
      changeType: 'neutral',
    },
    {
      title: t('stats.completionRate'),
      value: '78%',
      icon: TrendingUp,
      change: '+3%',
      changeType: 'positive',
    },
  ];

  return (
    <div>
      <h3 className="mb-6 text-xl font-semibold text-white">
        {t('title')}
      </h3>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="rounded-lg bg-gray-700/50 p-6 shadow-lg transition-all hover:bg-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p
                    className={`mt-2 text-sm ${
                      stat.changeType === 'positive'
                        ? 'text-green-400'
                        : stat.changeType === 'negative'
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
                <div className="rounded-full bg-secondary/20 p-3">
                  <Icon
                    size={24}
                    className="text-secondary"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

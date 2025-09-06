'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth.store';
import { RoleBadge } from '@/components/ui/role-badge';

export default function UserDropdown() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const router = useRouter();
  const { user, logout: authLogout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // Usar o logout do Auth Store
      authLogout();

      // Redirect to login page
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfile = () => {
    router.push(`/${locale}/profile`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button with User Info */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center px-1 md:px-3 py-1 md:py-2 rounded-lg transition-all duration-200',
          'hover:bg-white/10',
          isOpen && 'bg-white/10'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t('userMenu')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center">
          <Avatar asButton={false} />

          {/* User Name and Badge - Hidden on mobile */}
          {user && (
            <div className="hidden md:flex flex-col items-start ml-2">
              <span className="text-white text-sm font-medium leading-tight">
                {user.name || user.email?.split('@')[0] || 'Usuário'}
              </span>
              {user.role && (
                <RoleBadge role={user.role} className="mt-0.5 scale-90 origin-left" />
              )}
            </div>
          )}

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
          >
            <ChevronDown
              size={14}
              className={cn(
                'text-white',
                '-ml-3.5 md:ml-1.5' // bem colado no avatar no mobile
              )}
            />
          </motion.div>
        </div>
      </motion.button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed right-4 top-20 w-56 bg-primary-dark rounded-lg shadow-xl border border-gray-700 z-50 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.3
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              y: -10,
              transition: {
                duration: 0.2,
                ease: "easeInOut"
              }
            }}
          >
            <motion.div 
              className="p-2"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.05
                  }
                }
              }}
            >
              {/* Profile Option */}
              <motion.button
                onClick={handleProfile}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md',
                  'text-gray-300 hover:bg-primary/50 hover:text-white',
                  'transition-colors duration-200'
                )}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { 
                    opacity: 1, 
                    x: 0,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }
                  }
                }}
                whileHover={{ 
                  x: 5,
                  scale: 1.02,
                  transition: { duration: 0.15 }
                }}
              >
                <User size={18} />
                <span className="text-sm font-medium">{t('profile')}</span>
              </motion.button>

              {/* Divider */}
              <motion.div 
                className="my-1 h-px bg-gray-600"
                variants={{
                  hidden: { scaleX: 0 },
                  visible: { 
                    scaleX: 1,
                    transition: { duration: 0.3 }
                  }
                }}
              />

              {/* Logout Option */}
              <motion.button
                onClick={handleLogout}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md',
                  'text-red-400 hover:bg-red-900/30 hover:text-red-300',
                  'transition-colors duration-200'
                )}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { 
                    opacity: 1, 
                    x: 0,
                    transition: {
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }
                  }
                }}
                whileHover={{ 
                  x: 5,
                  scale: 1.02,
                  transition: { duration: 0.15 }
                }}
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">{t('logout')}</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

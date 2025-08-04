'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LogOut, User, ChevronDown } from 'lucide-react';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';

export default function UserDropdown() {
  const t = useTranslations('Nav');
  const router = useRouter();
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
      // Clear the auth token cookie
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // Clear any other auth-related data from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfile = () => {
    router.push('/profile');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
          "hover:bg-white/10",
          isOpen && "bg-white/10"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t('userMenu')}
      >
        <Avatar />
        <ChevronDown 
          size={16} 
          className={cn(
            "text-white transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-56 bg-primary-dark rounded-lg shadow-xl border border-gray-700",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            "z-50"
          )}
        >
          <div className="p-2">
            {/* Profile Option */}
            <button
              onClick={handleProfile}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md",
                "text-gray-300 hover:bg-primary/50 hover:text-white",
                "transition-colors duration-200"
              )}
            >
              <User size={18} />
              <span className="text-sm font-medium">{t('profile')}</span>
            </button>

            {/* Divider */}
            <div className="my-1 h-px bg-gray-600" />

            {/* Logout Option */}
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md",
                "text-red-400 hover:bg-red-900/30 hover:text-red-300",
                "transition-colors duration-200"
              )}
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
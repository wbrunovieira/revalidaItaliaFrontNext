'use client';

import { useState } from 'react';
import { MessageCircleQuestion, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { CreateSupportTicketModal } from './CreateSupportTicketModal';

interface SupportFloatingButtonProps {
  context?: {
    type: 'LESSON' | 'ASSESSMENT' | 'FLASHCARD' | 'GENERAL';
    id?: string;
    title?: string;
  };
  className?: string;
}

export function SupportFloatingButton({ context = { type: 'GENERAL' }, className }: SupportFloatingButtonProps) {
  const t = useTranslations('Support');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(true);

  const handleClose = () => {
    setIsTooltipVisible(false);
  };

  return (
    <>
      {/* Floating Button Container */}
      <div
        className={cn('fixed bottom-48 right-6 z-40 flex items-center gap-3', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tooltip/Label */}
        <div
          className={cn(
            'transition-all duration-300 ease-out',
            isTooltipVisible || isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
          )}
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
              {t('floatingButton.helpText')}
            </p>

            {/* Close button for tooltip */}
            {isTooltipVisible && !isHovered && (
              <button
                onClick={handleClose}
                className="absolute -top-1 -right-1 bg-gray-100 dark:bg-gray-700 rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label={t('floatingButton.closeTooltip')}
              >
                <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </button>
            )}

            {/* Arrow pointing to button */}
            <div className="absolute top-1/2 -right-2 -translate-y-1/2">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-white dark:border-l-gray-800" />
            </div>
          </div>
        </div>

        {/* Main Floating Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'group relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary',
            'text-white rounded-full p-4 shadow-lg hover:shadow-xl',
            'transition-all duration-300 ease-out',
            'hover:scale-105 active:scale-95',
            'before:absolute before:inset-0 before:rounded-full',
            'before:bg-white/20 before:opacity-0 hover:before:opacity-100',
            'before:transition-opacity before:duration-300',
            'after:absolute after:inset-0 after:rounded-full',
            'after:animate-ping after:bg-primary/30',
            'after:pointer-events-none',
            isHovered && 'after:hidden'
          )}
          aria-label={t('floatingButton.ariaLabel')}
        >
          <MessageCircleQuestion
            className={cn('h-6 w-6 relative z-10', 'transition-transform duration-300', isHovered && 'rotate-12')}
          />

          {/* Ripple effect on hover */}
          <span
            className={cn(
              'absolute inset-0 rounded-full',
              'bg-white/30 scale-0 opacity-0',
              'transition-all duration-500',
              isHovered && 'scale-150 opacity-0'
            )}
          />
        </button>
      </div>

      {/* Support Ticket Modal */}
      <CreateSupportTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} context={context} />
    </>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { useParams, useRouter } from 'next/navigation';

const getCategoryColor = (category: Notification['category']) => {
  switch (category) {
    case 'SYSTEM':
      return 'bg-blue-500';
    case 'ASSESSMENTS':
      return 'bg-purple-500';
    case 'LIVE_SESSIONS':
      return 'bg-green-500';
    case 'COMMUNITY':
      return 'bg-yellow-500';
    case 'SUPPORT':
      return 'bg-orange-500';
    case 'BILLING':
      return 'bg-red-500';
    case 'COURSE_CONTENT':
      return 'bg-indigo-500';
    default:
      return 'bg-gray-500';
  }
};

const getPriorityIcon = (priority: Notification['priority']) => {
  switch (priority) {
    case 'HIGH':
      return '🔴';
    case 'MEDIUM':
      return '🟡';
    case 'LOW':
      return '🔵';
    default:
      return '';
  }
};

// Helper function to translate notification texts with dynamic keys
function translateNotification(notification: Notification, t: (key: string) => string) {
  // Translate title
  const displayTitle = notification.titleKey 
    ? t(notification.titleKey.replace('notifications.', ''))
    : notification.title;

  // Translate message with parameters
  let displayMessage = notification.message;
  if (notification.messageKey && notification.messageParams) {
    try {
      // Remove 'notifications.' prefix if present
      const key = notification.messageKey.replace('notifications.', '');
      
      // Handle nested reaction type translation
      const params = { ...notification.messageParams };
      if (params.reactionType) {
        // Translate the reaction type
        const reactionKey = params.reactionType.replace('reactions.', '');
        params.reactionType = t(`reactions.${reactionKey}`);
      }
      
      // Get the message template and replace parameters
      let messageTemplate = t(key);
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        messageTemplate = messageTemplate.replace(`{{${paramKey}}}`, paramValue);
      });
      displayMessage = messageTemplate;
    } catch {
      // Fallback to original message if translation fails
      displayMessage = notification.message;
    }
  }

  // Translate action label
  const displayActionLabel = notification.actionLabelKey
    ? t(notification.actionLabelKey.replace('notifications.', ''))
    : notification.actionLabel;

  return { displayTitle, displayMessage, displayActionLabel };
}

export default function NotificationBell() {
  const t = useTranslations('Notifications');
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string || 'pt';
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    meta,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  } = useNotifications({
    limit: 10,
    unread: selectedTab === 'unread' ? true : undefined,
    autoRefetch: true,
    refetchInterval: 30000, // 30 seconds
  });

  // Get locale for date formatting
  const getDateLocale = () => {
    switch (locale) {
      case 'pt':
        return ptBR;
      case 'it':
        return it;
      case 'es':
        return es;
      default:
        return ptBR;
    }
  };

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

  // Track if notifications were viewed
  const [hasViewedNotifications, setHasViewedNotifications] = useState(false);

  // Mark all as read when closing the modal after viewing notifications
  useEffect(() => {
    if (!isOpen && hasViewedNotifications && meta && meta.unreadCount > 0) {
      console.log('[NotificationBell] Auto-marking all notifications as read after close');
      markAllAsRead().then(success => {
        if (success) {
          console.log('[NotificationBell] Successfully marked all as read');
          refetch(); // Refresh to get updated state
        }
      });
      setHasViewedNotifications(false); // Reset flag
    }
  }, [isOpen, hasViewedNotifications, meta, markAllAsRead, refetch]);

  // Set flag when modal is opened with unread notifications
  useEffect(() => {
    if (isOpen && !isLoading && meta && meta.unreadCount > 0) {
      setHasViewedNotifications(true);
    }
  }, [isOpen, isLoading, meta]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      refetch();
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    const success = await deleteNotification(notificationId);
    if (success) {
      refetch();
    }
  };

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: getDateLocale(),
      });
    } catch {
      return date;
    }
  };

  const unreadCount = meta?.unreadCount || 0;
  const displayNotifications = selectedTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label={t('notifications')}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Animated Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed right-4 top-24 w-96 max-h-[600px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
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
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">
                {t('title')}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTab('all')}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedTab === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                )}
              >
                {t('all')} ({notifications.length})
              </button>
              <button
                onClick={() => setSelectedTab('unread')}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedTab === 'unread'
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                )}
              >
                {t('unread')} ({unreadCount})
              </button>
            </div>
          </div>

          {/* Actions Bar */}
          {unreadCount > 0 && (
            <div className="px-4 py-2 border-b border-gray-700">
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1"
              >
                <CheckCheck size={16} />
                {t('markAllAsRead')}
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-gray-400" size={32} />
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto mb-3 text-gray-600" size={48} />
                <p className="text-gray-400">
                  {selectedTab === 'unread' ? t('noUnreadNotifications') : t('noNotifications')}
                </p>
              </div>
            ) : (
              <motion.div 
                className="divide-y divide-gray-800"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.1
                    }
                  }
                }}
              >
                {displayNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-4 hover:bg-gray-800 transition-colors cursor-pointer relative',
                      !notification.isRead && 'bg-gray-800/50'
                    )}
                    variants={{
                      hidden: { 
                        opacity: 0, 
                        x: -20 
                      },
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
                      backgroundColor: 'rgba(31, 41, 55, 0.8)',
                      transition: { duration: 0.15 }
                    }}
                  >
                    {(() => {
                      const { displayTitle, displayMessage } = translateNotification(notification, t);
                      return (
                        <div className="flex gap-3">
                          {/* Category Indicator */}
                          <div className="flex-shrink-0">
                            <div className={cn(
                              'w-2 h-2 rounded-full mt-2',
                              getCategoryColor(notification.category),
                              !notification.isRead && 'animate-pulse'
                            )} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm">
                                    {getPriorityIcon(notification.priority)}
                                  </span>
                                  <h4 className={cn(
                                    'font-medium text-sm',
                                    notification.isRead ? 'text-gray-300' : 'text-white'
                                  )}>
                                    {displayTitle}
                                  </h4>
                                </div>
                                <p className={cn(
                                  'text-sm line-clamp-2 mb-2',
                                  notification.isRead ? 'text-gray-500' : 'text-gray-400'
                                )}>
                                  {displayMessage}
                                </p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-600">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                title={t('markAsRead')}
                              >
                                <Check size={16} />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                              title={t('delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Footer with View All */}
          {meta && meta.totalPages > 1 && (
            <div className="p-3 border-t border-gray-700">
              <button
                onClick={() => {
                  router.push(`/${locale}/notifications`);
                  setIsOpen(false);
                }}
                className="w-full py-2 text-sm text-center text-secondary hover:text-secondary/80 transition-colors"
              >
                {t('viewAll')} ({meta.total})
              </button>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
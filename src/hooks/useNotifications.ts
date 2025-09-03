'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCookie } from '@/lib/auth-utils';

export interface NotificationMetadata {
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  type: string;
  category: 'SYSTEM' | 'ASSESSMENTS' | 'LIVE_SESSIONS' | 'COMMUNITY' | 'SUPPORT' | 'BILLING' | 'COURSE_CONTENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  meta: NotificationMeta;
}

interface UseNotificationsParams {
  page?: number;
  limit?: number;
  unread?: boolean;
  category?: Notification['category'];
  priority?: Notification['priority'];
  autoRefetch?: boolean;
  refetchInterval?: number;
}

export function useNotifications({
  page = 1,
  limit = 20,
  unread,
  category,
  priority,
  autoRefetch = true,
  refetchInterval = 60000, // 1 minute
}: UseNotificationsParams = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<NotificationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = getCookie('token');
      if (!token) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const params = new URLSearchParams();
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (unread !== undefined) {
        params.append('unread', unread.toString());
      }
      
      if (category) {
        params.append('category', category);
      }
      
      if (priority) {
        params.append('priority', priority);
      }

      const response = await fetch(
        `${apiUrl}/api/v1/notifications?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data: NotificationsResponse = await response.json();
      setNotifications(data.notifications);
      setMeta(data.meta);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, unread, category, priority]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const token = getCookie('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/v1/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );

      // Update unread count in meta
      if (meta) {
        setMeta(prev => prev ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) } : null);
      }

      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [meta]);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = getCookie('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/v1/notifications/mark-all-read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
      );

      // Update unread count in meta
      if (meta) {
        setMeta(prev => prev ? { ...prev, unreadCount: 0 } : null);
      }

      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [meta]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const token = getCookie('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/v1/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.statusText}`);
      }

      // Update local state
      const deletedNotif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      // Update counts in meta
      if (meta && deletedNotif) {
        setMeta(prev => {
          if (!prev) return null;
          return {
            ...prev,
            total: Math.max(0, prev.total - 1),
            unreadCount: deletedNotif.isRead ? prev.unreadCount : Math.max(0, prev.unreadCount - 1),
          };
        });
      }

      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [notifications, meta]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refetch for real-time updates
  useEffect(() => {
    if (!autoRefetch) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [autoRefetch, refetchInterval, fetchNotifications]);

  return {
    notifications,
    meta,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
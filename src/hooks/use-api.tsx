'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ApiError {
  type: 'network' | 'auth' | 'server';
  message: string;
  retryable: boolean;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

const determineErrorType = (error: any): ApiError => {
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    return {
      type: 'network',
      message: 'Servidor indisponível. Verifique sua conexão.',
      retryable: true
    };
  }
  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
    return {
      type: 'auth',
      message: 'Sessão expirada. Faça login novamente.',
      retryable: false
    };
  }
  return {
    type: 'server',
    message: 'Erro interno do servidor.',
    retryable: true
  };
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export function useApi<T>(
  url: string,
  options: {
    requireAuth?: boolean;
    showToastOnError?: boolean;
    fallbackData?: T;
  } = {}
): ApiState<T> {
  const [data, setData] = useState<T | null>(options.fallbackData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (options.requireAuth) {
        const tokenFromCookie = getCookie('token');
        const tokenFromStorage = 
          localStorage.getItem('accessToken') || 
          sessionStorage.getItem('accessToken');
        const token = tokenFromCookie || tokenFromStorage;

        if (!token) {
          throw new Error('401 - No authentication token found');
        }

        headers.Authorization = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${baseUrl}${url}`, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null); // Clear any previous errors on success
    } catch (err: any) {
      const apiError = determineErrorType(err);
      setError(apiError);

      if (options.showToastOnError) {
        toast({
          title: 'Erro de Conexão',
          description: apiError.message,
          variant: 'destructive',
        });
      }

      // Fallback to provided data if available
      if (options.fallbackData) {
        setData(options.fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }, [url, options.requireAuth, options.showToastOnError, options.fallbackData, toast]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Monitor online status and refetch when coming back online
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      // Only refetch if we had a network error
      if (error?.type === 'network') {
        console.log('Connection restored, refetching data...');
        fetchData();
      }
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [error, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
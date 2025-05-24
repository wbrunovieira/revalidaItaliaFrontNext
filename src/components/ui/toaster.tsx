'use client';

import * as React from 'react';
import {
  ToastProvider,
  ToastViewport,
} from '@/components/ui/toast';

/**
 * Componente que inicializa o Provider e renderiza o Viewport
 * onde os toasts serão exibidos.
 */
export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}

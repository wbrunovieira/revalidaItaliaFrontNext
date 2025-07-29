'use client';

import { useEffect } from 'react';
import { disableReactDevTools } from '@/utils/disable-devtools';

export default function DevToolsManager() {
  useEffect(() => {
    disableReactDevTools();
  }, []);

  return null;
}
// src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Gera wrappers de Link, useRouter, usePathname etc.
export const { Link, useRouter, usePathname, getPathname } =
  createNavigation(routing);

// src/lib/utils.ts
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';

/**
 * Combina classes condicionalmente (wrapper em clsx)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}

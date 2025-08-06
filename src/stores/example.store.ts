import { create } from 'zustand'

/**
 * Store de exemplo para verificar funcionamento do Zustand
 * Será removido após validação da Fase 0
 */
interface ExampleState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useExampleStore = create<ExampleState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
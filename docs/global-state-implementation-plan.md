# 📋 Plano de Implementação - Estado Global com Zustand + TanStack Query

## 📊 Resumo Executivo

Este documento detalha o plano completo de implementação de gerenciamento de estado global para o projeto Revalida Italia, utilizando **Zustand** para estado local e **TanStack Query** para sincronização com servidor.

### Objetivos Principais
- ✅ Eliminar duplicação de código (20+ componentes com lógica de token repetida)
- ✅ Reduzir chamadas API em 70% através de cache inteligente
- ✅ Melhorar performance de navegação com prefetching
- ✅ Implementar suporte offline robusto
- ✅ Simplificar gerenciamento de estado complexo (video progress, auth)

### Stack Escolhida
- **Zustand**: Estado local/client-side (auth, UI, preferences)
- **TanStack Query v5**: Cache e sincronização de dados do servidor
- **TypeScript**: Tipagem forte para todas as stores e queries

---

## 🎯 Fase 0: Preparação e Setup (Dia 1 - Manhã)

### Tarefas de Configuração Inicial

- [ ] **0.1 - Instalar Dependências**
  ```bash
  npm install zustand @tanstack/react-query @tanstack/react-query-devtools
  ```
  - Tempo: 5 min
  - Prioridade: 🔴 Crítica

- [ ] **0.2 - Criar Estrutura de Pastas**
  ```
  src/
  ├── stores/           # Zustand stores
  │   ├── auth.store.ts
  │   ├── progress.store.ts
  │   └── ui.store.ts
  ├── hooks/
  │   └── queries/      # React Query hooks
  │       ├── useCourses.ts
  │       ├── useTracks.ts
  │       ├── useModules.ts
  │       └── useLessons.ts
  └── lib/
      └── query-client.ts
  ```
  - Tempo: 10 min
  - Prioridade: 🔴 Crítica

- [ ] **0.3 - Configurar QueryClient**
  ```typescript
  // lib/query-client.ts
  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,        // 1 minuto
        gcTime: 5 * 60 * 1000,        // 5 minutos
        retry: 3,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      }
    }
  })
  ```
  - Tempo: 15 min
  - Prioridade: 🔴 Crítica

- [ ] **0.4 - Adicionar Providers no Layout Root**
  ```typescript
  // app/[locale]/layout.tsx
  <QueryClientProvider client={queryClient}>
    {children}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
  ```
  - Tempo: 15 min
  - Prioridade: 🔴 Crítica

---

## 🔐 Fase 1: Auth Store com Zustand (Dia 1 - Tarde)

### Implementação do Store de Autenticação

- [ ] **1.1 - Criar Auth Store Base**
  ```typescript
  // stores/auth.store.ts
  interface AuthState {
    token: string | null
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (credentials: LoginCredentials) => Promise<void>
    logout: () => void
    refreshToken: () => Promise<void>
    initializeAuth: () => void
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🔴 Crítica
  - Impacto: Elimina duplicação em 20+ componentes

- [ ] **1.2 - Implementar Persistência de Token**
  - Integrar com cookies (principal)
  - Fallback para localStorage/sessionStorage
  - Sync automático entre abas
  - Tempo: 45 min
  - Prioridade: 🔴 Crítica

- [ ] **1.3 - Criar Hook useAuth**
  ```typescript
  export const useAuth = () => {
    const store = useAuthStore()
    // Add computed properties
    return {
      ...store,
      isAdmin: store.user?.role === 'admin',
      canAccessCourse: (courseId: string) => {...}
    }
  }
  ```
  - Tempo: 20 min
  - Prioridade: 🔴 Crítica

- [ ] **1.4 - Migrar Componente de Login**
  - Substituir lógica manual por useAuth
  - Testar fluxo completo de login
  - Tempo: 30 min
  - Prioridade: 🔴 Crítica

- [ ] **1.5 - Criar Middleware de Auth para API**
  ```typescript
  // lib/api-client.ts
  const apiClient = {
    get: async (url: string) => {
      const token = useAuthStore.getState().token
      return fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🔴 Crítica

- [ ] **1.6 - Migrar Todos os Componentes que Usam Token**
  - ProfileContent.tsx
  - DashboardClient.tsx
  - CourseAccessButton.tsx
  - VideoPlayer.tsx
  - FlashcardStudyPage.tsx
  - (e outros 15+ componentes)
  - Tempo: 2 horas
  - Prioridade: 🔴 Crítica

### Checklist de Validação Fase 1
- [ ] Login funciona corretamente
- [ ] Token persiste após refresh
- [ ] Logout limpa todos os estados
- [ ] Componentes não duplicam lógica de token
- [ ] Auto-refresh de token funciona

---

## 📚 Fase 2: TanStack Query para Courses/Tracks (Dia 2)

### Setup de Queries para Dados Principais

- [ ] **2.1 - Criar Hook useCourses**
  ```typescript
  // hooks/queries/useCourses.ts
  export function useCourses(options?: QueryOptions) {
    return useQuery({
      queryKey: ['courses'],
      queryFn: async () => {
        const { data } = await apiClient.get('/api/v1/courses')
        return data
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
      ...options
    })
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🔴 Crítica
  - Impacto: Elimina 6+ chamadas duplicadas

- [ ] **2.2 - Criar Hook useTracks com Relações**
  ```typescript
  export function useTracks() {
    const { data: courses } = useCourses()
    
    return useQuery({
      queryKey: ['tracks'],
      queryFn: fetchTracks,
      select: (tracks) => enrichTracksWithCourses(tracks, courses),
      enabled: !!courses, // Só busca após ter courses
    })
  }
  ```
  - Tempo: 45 min
  - Prioridade: 🔴 Crítica

- [ ] **2.3 - Implementar Prefetching**
  ```typescript
  // Prefetch no hover de links
  const prefetchCourse = (courseId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['course', courseId],
      queryFn: () => fetchCourse(courseId),
    })
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🟡 Média

- [ ] **2.4 - Criar Mutations para Updates**
  ```typescript
  export function useUpdateCourse() {
    return useMutation({
      mutationFn: updateCourse,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['courses'] })
        toast.success('Curso atualizado!')
      }
    })
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🟡 Média

- [ ] **2.5 - Migrar DashboardClient.tsx**
  - Substituir useApi por useCourses/useTracks
  - Implementar loading states com skeleton
  - Tempo: 45 min
  - Prioridade: 🔴 Crítica

- [ ] **2.6 - Migrar Páginas de Listagem**
  - CourseListPage
  - TrackListPage
  - Remover chamadas API duplicadas
  - Tempo: 1 hora
  - Prioridade: 🔴 Crítica

- [ ] **2.7 - Implementar Infinite Query para Lessons**
  ```typescript
  export function useLessonsInfinite(moduleId: string) {
    return useInfiniteQuery({
      queryKey: ['lessons', moduleId],
      queryFn: ({ pageParam = 0 }) => 
        fetchLessons(moduleId, pageParam),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    })
  }
  ```
  - Tempo: 45 min
  - Prioridade: 🟢 Baixa

### Checklist de Validação Fase 2
- [ ] Dados são compartilhados entre componentes
- [ ] Não há chamadas API duplicadas
- [ ] Cache funciona corretamente
- [ ] Navegação está mais rápida
- [ ] DevTools mostra queries corretamente

---

## 🎥 Fase 3: Video Progress Store com Zustand (Dia 3)

### Migração do Sistema de Progresso de Vídeos

- [ ] **3.1 - Criar Progress Store**
  ```typescript
  // stores/progress.store.ts
  interface ProgressState {
    videoProgress: Map<string, VideoProgress>
    lessonAccess: Map<string, LessonAccess>
    currentLesson: string | null
    
    updateVideoProgress: (lessonId: string, progress: number) => void
    setCurrentLesson: (lessonId: string | null) => void
    syncWithBackend: () => Promise<void>
    loadFromLocalStorage: () => void
  }
  ```
  - Tempo: 45 min
  - Prioridade: 🔴 Crítica
  - Impacto: Simplifica sistema complexo atual

- [ ] **3.2 - Integrar com Heartbeat Service**
  - Adaptar video-progress-heartbeat.ts
  - Usar store ao invés de localStorage direto
  - Manter backward compatibility
  - Tempo: 1 hora
  - Prioridade: 🔴 Crítica

- [ ] **3.3 - Criar Hook useVideoProgress v2**
  ```typescript
  export function useVideoProgress(lessonId: string) {
    const store = useProgressStore()
    const progress = store.videoProgress.get(lessonId)
    
    const updateProgress = useCallback((newProgress: number) => {
      store.updateVideoProgress(lessonId, newProgress)
    }, [lessonId])
    
    return { progress, updateProgress }
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🔴 Crítica

- [ ] **3.4 - Migrar VideoPlayer Component**
  - Usar novo hook useVideoProgress
  - Remover lógica de localStorage
  - Tempo: 45 min
  - Prioridade: 🔴 Crítica

- [ ] **3.5 - Implementar Sync Offline/Online**
  ```typescript
  // Detectar mudanças de conectividade
  window.addEventListener('online', () => {
    useProgressStore.getState().syncWithBackend()
  })
  ```
  - Tempo: 30 min
  - Prioridade: 🟡 Média

- [ ] **3.6 - Criar Dashboard de Progresso**
  - Visualização unificada de todo progresso
  - Estatísticas em tempo real
  - Tempo: 1 hora
  - Prioridade: 🟢 Baixa

### Checklist de Validação Fase 3
- [ ] Progresso de vídeo salva corretamente
- [ ] Heartbeat continua funcionando
- [ ] Sync com backend funciona
- [ ] Não há perda de dados de progresso
- [ ] Performance melhorou

---

## 🃏 Fase 4: Flashcards com TanStack Query (Dia 4 - Manhã)

### Implementação de Estado para Flashcards

- [ ] **4.1 - Criar Query para Flashcards**
  ```typescript
  export function useFlashcards(lessonId?: string) {
    return useQuery({
      queryKey: ['flashcards', lessonId],
      queryFn: () => fetchFlashcards(lessonId),
      staleTime: 10 * 60 * 1000, // 10 minutos
    })
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🟡 Média

- [ ] **4.2 - Implementar Mutation para Progress**
  ```typescript
  export function useFlashcardProgress() {
    return useMutation({
      mutationFn: updateFlashcardProgress,
      onMutate: async (interaction) => {
        // Optimistic update
        const key = ['flashcard-stats']
        const previous = queryClient.getQueryData(key)
        queryClient.setQueryData(key, optimisticUpdate)
        return { previous }
      }
    })
  }
  ```
  - Tempo: 45 min
  - Prioridade: 🟡 Média

- [ ] **4.3 - Criar Store para Sessão de Estudo**
  ```typescript
  interface FlashcardSessionStore {
    currentCard: number
    sessionStats: SessionStats
    queue: FlashcardQueue
    nextCard: () => void
    submitAnswer: (correct: boolean) => void
  }
  ```
  - Tempo: 45 min
  - Prioridade: 🟡 Média

- [ ] **4.4 - Migrar FlashcardStudyPage**
  - Usar novo sistema de estado
  - Implementar offline queue
  - Tempo: 1 hora
  - Prioridade: 🟡 Média

### Checklist de Validação Fase 4
- [ ] Flashcards carregam corretamente
- [ ] Progresso é salvo
- [ ] Estatísticas são calculadas corretamente
- [ ] Funciona offline

---

## 🎨 Fase 5: UI Store e Preferências (Dia 4 - Tarde)

### Estado Global para UI e Preferências

- [ ] **5.1 - Criar UI Store**
  ```typescript
  interface UIState {
    sidebarOpen: boolean
    theme: 'light' | 'dark' | 'auto'
    language: 'pt' | 'it' | 'es'
    videoQuality: 'auto' | '720p' | '1080p'
    
    toggleSidebar: () => void
    setTheme: (theme: Theme) => void
    setVideoQuality: (quality: Quality) => void
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🟢 Baixa

- [ ] **5.2 - Implementar Persistência com Zustand Persist**
  ```typescript
  import { persist } from 'zustand/middleware'
  
  export const useUIStore = create(
    persist<UIState>(
      (set) => ({...}),
      {
        name: 'ui-storage',
        partialize: (state) => ({ 
          theme: state.theme,
          videoQuality: state.videoQuality 
        })
      }
    )
  )
  ```
  - Tempo: 30 min
  - Prioridade: 🟢 Baixa

- [ ] **5.3 - Migrar Componentes de UI**
  - Sidebar
  - ThemeToggle
  - LanguageSelector
  - Tempo: 45 min
  - Prioridade: 🟢 Baixa

### Checklist de Validação Fase 5
- [ ] Preferências persistem
- [ ] UI state é consistente
- [ ] Tema muda corretamente

---

## 🔄 Fase 6: Otimizações e Performance (Dia 5)

### Melhorias de Performance e Cache

- [ ] **6.1 - Implementar Suspense Boundaries**
  ```typescript
  <Suspense fallback={<CourseSkeleton />}>
    <CourseList />
  </Suspense>
  ```
  - Tempo: 45 min
  - Prioridade: 🟡 Média

- [ ] **6.2 - Configurar Cache Strategies**
  ```typescript
  // Por tipo de dado
  const cacheStrategies = {
    courses: { staleTime: 5 * 60 * 1000 },    // 5 min
    user: { staleTime: 10 * 60 * 1000 },      // 10 min
    progress: { staleTime: 30 * 1000 },       // 30 seg
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🟡 Média

- [ ] **6.3 - Implementar Background Sync**
  ```typescript
  // Service Worker para sync em background
  self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-progress') {
      event.waitUntil(syncAllProgress())
    }
  })
  ```
  - Tempo: 1 hora
  - Prioridade: 🟢 Baixa

- [ ] **6.4 - Adicionar Métricas de Performance**
  ```typescript
  // Medir impacto das mudanças
  const measureApiCall = (queryKey: string) => {
    performance.mark(`${queryKey}-start`)
    // ... fazer chamada
    performance.mark(`${queryKey}-end`)
    performance.measure(queryKey, `${queryKey}-start`, `${queryKey}-end`)
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🟢 Baixa

- [ ] **6.5 - Implementar Garbage Collection Manual**
  ```typescript
  // Limpar cache antigo
  const cleanupOldCache = () => {
    queryClient.removeQueries({
      predicate: (query) => 
        query.state.dataUpdatedAt < Date.now() - 24 * 60 * 60 * 1000
    })
  }
  ```
  - Tempo: 30 min
  - Prioridade: 🟢 Baixa

### Checklist de Validação Fase 6
- [ ] App carrega mais rápido
- [ ] Navegação é instantânea com cache
- [ ] Sem memory leaks
- [ ] Métricas mostram melhora

---

## 🧪 Fase 7: Testes e Documentação (Dia 5 - Tarde)

### Validação e Documentação Final

- [ ] **7.1 - Testes de Integração**
  - Fluxo completo de login
  - Cache funcionando
  - Offline/online sync
  - Tempo: 1 hora
  - Prioridade: 🔴 Crítica

- [ ] **7.2 - Documentar Hooks e Stores**
  ```typescript
  /**
   * Hook para gerenciar cursos
   * @example
   * const { data: courses, isLoading } = useCourses()
   */
  ```
  - Tempo: 45 min
  - Prioridade: 🟡 Média

- [ ] **7.3 - Criar Guia de Migração**
  - Como migrar componentes existentes
  - Padrões a seguir
  - Tempo: 30 min
  - Prioridade: 🟡 Média

- [ ] **7.4 - Performance Benchmarks**
  - Medir antes/depois
  - Documentar melhorias
  - Tempo: 30 min
  - Prioridade: 🟢 Baixa

### Checklist de Validação Final
- [ ] Todos os testes passam
- [ ] Documentação está completa
- [ ] Sem regressões
- [ ] Performance melhorou

---

## 📈 Métricas de Sucesso

### KPIs para Medir Impacto

| Métrica | Antes | Meta | Como Medir |
|---------|-------|------|------------|
| Chamadas API duplicadas | 15+ por página | 1-2 por página | Network tab |
| Tempo de navegação | 800-1200ms | <200ms com cache | Performance API |
| Código duplicado (token) | 20+ arquivos | 0 | Grep search |
| Bundle size | Current | +5KB max | Build output |
| Time to Interactive | Current | -30% | Lighthouse |
| Offline capability | Básica | Completa | Manual test |

---

## 🚀 Checklist de Implementação Rápida

### Dia 1
- [ ] Morning: Setup inicial (Fase 0)
- [ ] Afternoon: Auth Store completo (Fase 1)
- [ ] Testing: Login/logout funcionando

### Dia 2
- [ ] Morning: Courses/Tracks queries (Fase 2.1-2.4)
- [ ] Afternoon: Migrar componentes (Fase 2.5-2.7)
- [ ] Testing: Cache funcionando

### Dia 3
- [ ] Morning: Video Progress Store (Fase 3.1-3.3)
- [ ] Afternoon: Migrar VideoPlayer (Fase 3.4-3.6)
- [ ] Testing: Progress salvando

### Dia 4
- [ ] Morning: Flashcards (Fase 4)
- [ ] Afternoon: UI Store (Fase 5)
- [ ] Testing: Preferências persistindo

### Dia 5
- [ ] Morning: Otimizações (Fase 6)
- [ ] Afternoon: Testes finais (Fase 7)
- [ ] Deploy: Preparar para produção

---

## 🎯 Quick Wins (Implementar Primeiro)

1. **Auth Store** - Maior impacto, elimina 20+ duplicações
2. **Courses Query** - Segunda maior redução de chamadas
3. **Video Progress** - Simplifica sistema complexo
4. **Prefetching** - UX melhorada com pouco esforço

---

## 📝 Notas de Implementação

### Configuração TypeScript Recomendada
```typescript
// tsconfig.json paths
{
  "paths": {
    "@/stores/*": ["src/stores/*"],
    "@/queries/*": ["src/hooks/queries/*"]
  }
}
```

### Padrão de Nomenclatura
- Stores: `use[Nome]Store` (useAuthStore)
- Queries: `use[Nome]` (useCourses)
- Mutations: `use[Ação][Nome]` (useUpdateCourse)

### Estrutura de QueryKeys
```typescript
// Hierárquica e consistente
['courses']                    // Lista
['courses', courseId]          // Item
['courses', courseId, 'modules'] // Relação
```

---

## 🔗 Recursos e Referências

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TanStack Query v5 Docs](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Zustand DevTools](https://github.com/pmndrs/zustand#devtools)

---

## 🎉 Resultado Esperado

Após implementação completa:
- ✅ **70% menos chamadas API**
- ✅ **Navegação 5x mais rápida**
- ✅ **Zero duplicação de código de auth**
- ✅ **Suporte offline completo**
- ✅ **Developer experience melhorada**
- ✅ **Usuários mais felizes!**

---

*Documento criado em: 2025-08-06*
*Estimativa total: 5 dias de desenvolvimento*
*ROI esperado: Altíssimo*
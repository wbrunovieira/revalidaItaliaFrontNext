# Plano: Implementar enabled/disabled em todo o codebase de Flashcards

## Contexto

A API de flashcards foi atualizada com:
- Novos campos: `enabled` (boolean) e `disabledAt` (string | null)
- Novo filtro: `enabledStatus` (enabled | disabled | all)
- **Comportamento padrão**: `enabledStatus=enabled` (apenas habilitados)

## Regra de Negócio

- **Páginas de Aluno** (`/flashcards/*`): Só mostrar flashcards habilitados
- **Páginas de Admin** (`/admin`): Mostrar todos, com indicador visual para desabilitados

---

## Arquivos a Modificar

### 1. Páginas de Aluno (NÃO mostrar desabilitados)

| Arquivo | Rota API Usada | Ação |
|---------|----------------|------|
| `src/app/[locale]/flashcards/study/page.tsx` | `/api/v1/flashcards?lessonId=X` e `/api/v1/flashcards/by-argument/X` | Adicionar `enabledStatus=enabled` explícito |
| `src/components/FlashcardsByArgument.tsx` | `/api/v1/flashcards/by-argument/${id}` | Adicionar `enabledStatus=enabled` para contagens corretas |
| `src/hooks/queries/useLessonFlashcards.ts` | `/api/v1/flashcards/${id}` | Filtrar flashcards desabilitados na resposta |
| `src/components/LessonPageContent.tsx` | Usa `useLessonFlashcards` hook | Sidebar mostra flashcards - depende do hook filtrar |

### 2. Páginas de Admin (MOSTRAR todos com indicador)

| Arquivo | Ação |
|---------|------|
| `src/components/FlashcardsList.tsx` | ✅ JÁ IMPLEMENTADO |
| `src/components/LessonViewModal.tsx` | Adicionar indicador de status para flashcards da aula |

### 3. Componentes de Stats (contar apenas habilitados)

| Arquivo | Ação |
|---------|------|
| `src/components/DashboardStats.tsx` | Verificar se stats consideram apenas habilitados |
| `src/components/TutorFlashcardStats.tsx` | Verificar se stats consideram apenas habilitados |
| `src/hooks/useFlashcardStats.ts` | Verificar se stats consideram apenas habilitados |

---

## Detalhamento por Arquivo

### 1. `src/app/[locale]/flashcards/study/page.tsx` (CRÍTICO)

**Problema**: Página de estudo do aluno pode mostrar flashcards desabilitados.

**Solução**: Adicionar `enabledStatus=enabled` nas chamadas:

```typescript
// Linha ~243: Quando busca por lessonId
url = `${API_URL}/api/v1/flashcards?lessonId=${lessonId}`;

// Linha ~236: Quando busca por argumentId
url = `${API_URL}/api/v1/flashcards/by-argument/${argumentId}`;

// Adicionar em ambos os casos:
urlWithParams.searchParams.append('enabledStatus', 'enabled');
```

**Linhas afetadas**: ~230-255, ~505-520 (reset function)

---

### 2. `src/components/FlashcardsByArgument.tsx`

**Problema**: Contagem de flashcards pode incluir desabilitados.

**Solução**: Adicionar `enabledStatus=enabled` na contagem:

```typescript
// Linha ~103
const flashcardResponse = await fetch(
  `${API_URL}/api/v1/flashcards/by-argument/${arg.id}?limit=1&includeUserInteractions=true&enabledStatus=enabled`,
  ...
);
```

**Linha afetada**: ~103-111

---

### 3. `src/hooks/queries/useLessonFlashcards.ts`

**Problema**: Busca flashcard por ID individual, não filtra por status.

**Solução**: A API de `/flashcards/:id` retorna o flashcard independente do status. Precisamos:

1. Adicionar campo `enabled` à interface `Flashcard`
2. Filtrar flashcards desabilitados no retorno

```typescript
// Interface
export interface Flashcard {
  // ... campos existentes
  enabled?: boolean;
}

// Na função fetchFlashcards, filtrar:
return flashcards.filter((f): f is Flashcard =>
  f !== null && f.enabled !== false
);
```

**Linhas afetadas**: 9-19 (interface), 59 (filtro)

---

### 4. `src/components/LessonPageContent.tsx` (PÁGINA DE AULA DO ALUNO)

**Problema**: O sidebar da aula mostra uma seção de flashcards. Se houver flashcards desabilitados, eles não devem aparecer.

**Como funciona**:
- Usa o hook `useLessonFlashcards` (linha 144-147)
- Flashcards são exibidos no sidebar em várias seções (linhas 403-425, 638-660, 845-871, 1012-1028)
- A condição `flashcards.length > 0` determina se a seção é exibida

**Solução**: A correção no hook `useLessonFlashcards` automaticamente resolve este componente.
- Quando o hook filtrar flashcards desabilitados, `flashcards.length` refletirá apenas os habilitados
- Se todos os flashcards da aula estiverem desabilitados, a seção não será exibida

**Nenhuma mudança direta necessária** - depende da correção do hook.

---

### 5. `src/components/LessonViewModal.tsx` (ADMIN)

**Problema**: Modal de admin mostra flashcards da aula sem indicar quais estão desabilitados.

**Solução**: Adicionar badge de status para flashcards desabilitados (similar ao FlashcardsList).

**Ação**: Verificar se flashcards são exibidos e adicionar indicador visual.

---

### 5. Stats Components (Verificação)

Os componentes de stats provavelmente usam endpoints específicos de stats que já consideram apenas flashcards habilitados. Verificar:

- `src/components/DashboardStats.tsx` - Usa `/api/v1/users/me/progress`
- `src/components/TutorFlashcardStats.tsx` - Usa dados passados por props
- `src/hooks/useFlashcardStats.ts` - Verificar endpoint usado

---

## Ordem de Implementação

1. **[CRÍTICO]** `useLessonFlashcards.ts` - Hook para flashcards de aula (resolve LessonPageContent automaticamente)
2. **[CRÍTICO]** `flashcards/study/page.tsx` - Página de estudo do aluno
3. **[CRÍTICO]** `FlashcardsByArgument.tsx` - Lista de argumentos com contagem
4. **[BAIXO]** `LessonViewModal.tsx` - Indicador visual no admin
5. **[VERIFICAR]** Stats components - Confirmar comportamento

---

## Testes de Aceitação

- [ ] Aluno em `/flashcards/study` não vê flashcards desabilitados
- [ ] Aluno em `/flashcards/progress` vê contagens apenas de habilitados
- [ ] Aluno na página de aula (sidebar) não vê seção de flashcards se todos estão desabilitados
- [ ] Aluno na página de aula (sidebar) vê contagem correta de flashcards habilitados
- [ ] Admin em `/admin` (FlashcardsList) vê todos com filtro e toggle ✅ FEITO
- [ ] Admin em LessonViewModal vê indicador de status
- [ ] Reset de flashcards só afeta habilitados
- [ ] Stats do dashboard contam apenas habilitados

---

## Notas

- O backend já implementou o filtro `enabledStatus` com default `enabled`
- A maioria das rotas de listagem já deve filtrar por padrão
- Rotas de detalhe (`/flashcards/:id`) retornam independente do status
- Precisamos ser explícitos em chamadas de aluno para garantir

# Plano: Simplificar Multi-Language no Frontend (v2.0)

## Resumo

Simplificar os formulários de cadastro/edição para exigir apenas 1 idioma (italiano).
O backend agora tem **auto-fill condicional** que replica traduções automaticamente.

---

## Nova Lógica do Backend

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTO-FILL CONDICIONAL                        │
├─────────────────────────────────────────────────────────────────┤
│  Se receber 1 tradução  →  Replica para os 3 locales (it,en,pt) │
│  Se receber 2 traduções →  Usa as 2 + replica 1 faltante        │
│  Se receber 3 traduções →  Usa exatamente como recebeu          │
└─────────────────────────────────────────────────────────────────┘
```

**Impacto:** Frontend pode enviar 1, 2 ou 3 traduções - backend aceita qualquer combinação.

---

## Vantagens da Nova Abordagem

| Aspecto | Antes | Agora |
|---------|-------|-------|
| Migração | Tudo de uma vez | Gradual (1 form por vez) |
| Risco | Alto (quebrar algo) | Zero (retrocompatível) |
| Rollback | Complexo | Instantâneo |
| Forms legados | Precisam mudar | Continuam funcionando |

---

## Componentes Afetados (17 total)

### Forms de Criação (8)

| Componente | Campos | Prioridade | Motivo |
|------------|--------|------------|--------|
| `CreateCourseForm.tsx` | title, description | 🔴 Alta | Mais usado |
| `CreateModuleForm.tsx` | title, description | 🔴 Alta | Muito usado |
| `CreateLessonForm.tsx` | title, description | 🔴 Alta | Muito usado |
| `CreateTrackForm.tsx` | title, description | 🟡 Média | Menos frequente |
| `CreateVideoForm.tsx` | title, description | 🟡 Média | Moderado |
| `CreateDocumentForm.tsx` | title, description | 🟢 Baixa | Pouco usado |
| `CreateEnvironment3DForm.tsx` | title, description | 🟢 Baixa | Pouco usado |
| `UploadAudioForm.tsx` | title, description | 🟢 Baixa | Pouco usado |

### Modals de Edição (7)

| Componente | Campos | Prioridade |
|------------|--------|------------|
| `CourseEditModal.tsx` | title, description | 🔴 Alta |
| `ModuleEditModal.tsx` | title, description | 🔴 Alta |
| `LessonEditModal.tsx` | title, description | 🔴 Alta |
| `TrackEditModal.tsx` | title, description | 🟡 Média |
| `EditVideoModal.tsx` | title, description | 🟡 Média |
| `DocumentEditModal.tsx` | title, description | 🟢 Baixa |
| `EditAudioModal.tsx` | title, description | 🟢 Baixa |

### Forms de Assessment (2)

| Componente | Campos | Prioridade |
|------------|--------|------------|
| `CreateQuestionForm.tsx` | explanation | 🟢 Baixa |
| `QuestionEditModal.tsx` | explanation | 🟢 Baixa |

---

## Estratégias de Implementação

### Estratégia A: Remoção Simples (Recomendada)

Remover completamente as seções de pt/es, manter apenas it.

```tsx
// ANTES: 3 seções na UI
<Section locale="pt">...</Section>
<Section locale="es">...</Section>
<Section locale="it">...</Section>

// DEPOIS: 1 seção na UI
<Section locale="it">...</Section>
```

```tsx
// ANTES: formData com 3 locales
translations: {
  pt: { locale: 'pt', title: '', description: '' },
  es: { locale: 'es', title: '', description: '' },
  it: { locale: 'it', title: '', description: '' }
}

// DEPOIS: formData com 1 locale
translations: {
  it: { locale: 'it', title: '', description: '' }
}

// PAYLOAD enviado ao backend (array com 1 item)
translations: [
  { locale: 'it', title: 'Titulo', description: 'Desc' }
]
```

**Prós:**
- UI muito mais limpa
- Menos código
- Formulários menores

**Contras:**
- Mudança mais significativa por componente

---

### Estratégia B: Toggle Avançado (Alternativa)

Esconder seções pt/es por padrão, com toggle para mostrar.

```tsx
const [showAllLanguages, setShowAllLanguages] = useState(false);

// UI
<Switch checked={showAllLanguages} onChange={setShowAllLanguages} />
<Label>Mostrar todas as traduções</Label>

{showAllLanguages ? (
  // Renderiza 3 seções
  ['pt', 'es', 'it'].map(locale => <Section locale={locale} />)
) : (
  // Renderiza apenas IT
  <Section locale="it" />
)}
```

**Prós:**
- Admin pode escolher modo completo quando necessário
- Migração mais suave

**Contras:**
- Mais código
- UI mais complexa
- Toggle pode confundir usuários

---

### Estratégia C: Híbrida (Pragmática)

- Forms de **criação**: Apenas italiano (Estratégia A)
- Modals de **edição**: Toggle avançado (Estratégia B)

**Racional:** Na criação, admin quer ser rápido. Na edição, pode querer ajustar traduções específicas.

---

## Recomendação Final

**Usar Estratégia A (Remoção Simples)** para todos os componentes.

**Motivos:**
1. Backend faz auto-fill automaticamente
2. Admin pode traduzir depois via edição (se necessário)
3. Menos código = menos bugs
4. UI mais limpa = melhor UX
5. Pode reativar multi-language no futuro facilmente

---

## Plano de Implementação por Fases

### Fase 1: Forms Principais (Alta Prioridade)

**Escopo:** Course, Module, Lesson (create + edit)
**Estimativa:** 2-3 horas
**Componentes:** 6

| Componente | Status |
|------------|--------|
| CreateCourseForm.tsx | ⬜ Pendente |
| CourseEditModal.tsx | ⬜ Pendente |
| CreateModuleForm.tsx | ⬜ Pendente |
| ModuleEditModal.tsx | ⬜ Pendente |
| CreateLessonForm.tsx | ⬜ Pendente |
| LessonEditModal.tsx | ⬜ Pendente |

**Mudanças por componente:**
1. Remover seções de tradução pt e es da UI
2. Atualizar interface `FormData` (apenas it)
3. Atualizar validação (apenas it)
4. Atualizar payload enviado (array com 1 tradução)

---

### Fase 2: Forms Secundários (Média Prioridade)

**Escopo:** Track, Video
**Estimativa:** 1-1.5 horas
**Componentes:** 4

| Componente | Status |
|------------|--------|
| CreateTrackForm.tsx | ⬜ Pendente |
| TrackEditModal.tsx | ⬜ Pendente |
| CreateVideoForm.tsx | ⬜ Pendente |
| EditVideoModal.tsx | ⬜ Pendente |

---

### Fase 3: Forms Restantes (Baixa Prioridade)

**Escopo:** Document, Environment3D, Audio, Question
**Estimativa:** 1.5-2 horas
**Componentes:** 7

| Componente | Status |
|------------|--------|
| CreateDocumentForm.tsx | ⬜ Pendente |
| DocumentEditModal.tsx | ⬜ Pendente |
| CreateEnvironment3DForm.tsx | ⬜ Pendente |
| UploadAudioForm.tsx | ⬜ Pendente |
| EditAudioModal.tsx | ⬜ Pendente |
| CreateQuestionForm.tsx | ⬜ Pendente |
| QuestionEditModal.tsx | ⬜ Pendente |

---

## Exemplo de Mudança (CreateCourseForm)

### Antes (3 seções):

```tsx
// FormData
const [formData, setFormData] = useState({
  translations: {
    pt: { locale: 'pt', title: '', description: '' },
    es: { locale: 'es', title: '', description: '' },
    it: { locale: 'it', title: '', description: '' }
  }
});

// Validação
const validateTranslations = () => {
  for (const locale of ['pt', 'es', 'it']) {
    if (!formData.translations[locale].title) return false;
  }
  return true;
};

// UI - 3 seções
{['pt', 'es', 'it'].map(locale => (
  <div key={locale}>
    <h3>{locale.toUpperCase()}</h3>
    <Input value={formData.translations[locale].title} />
    <Textarea value={formData.translations[locale].description} />
  </div>
))}
```

### Depois (1 seção):

```tsx
// FormData simplificado
const [formData, setFormData] = useState({
  title: '',
  description: ''
});

// Validação simplificada
const validateForm = () => {
  return formData.title.length >= 3;
};

// Payload para API
const payload = {
  translations: [
    { locale: 'it', title: formData.title, description: formData.description }
  ]
};

// UI - campos diretos (sem seções de idioma)
<div>
  <Label>Título</Label>
  <Input value={formData.title} />

  <Label>Descrição</Label>
  <Textarea value={formData.description} />
</div>
```

---

## Estimativa Total

| Fase | Componentes | Tempo |
|------|-------------|-------|
| Fase 1 (Principal) | 6 | 2-3h |
| Fase 2 (Secundário) | 4 | 1-1.5h |
| Fase 3 (Restante) | 7 | 1.5-2h |
| **Total** | **17** | **4.5-6.5h** |

**Nota:** Pode ser feito gradualmente. Cada fase é independente.

---

## Checklist de Implementação

### Pré-requisitos
- [x] Backend com auto-fill condicional implementado
- [ ] Testar endpoint aceitando 1 tradução (validar antes de começar)

### Fase 1
- [ ] CreateCourseForm.tsx
- [ ] CourseEditModal.tsx
- [ ] CreateModuleForm.tsx
- [ ] ModuleEditModal.tsx
- [ ] CreateLessonForm.tsx
- [ ] LessonEditModal.tsx
- [ ] Testar criação/edição de Course, Module, Lesson

### Fase 2
- [ ] CreateTrackForm.tsx
- [ ] TrackEditModal.tsx
- [ ] CreateVideoForm.tsx
- [ ] EditVideoModal.tsx
- [ ] Testar criação/edição de Track, Video

### Fase 3
- [ ] CreateDocumentForm.tsx
- [ ] DocumentEditModal.tsx
- [ ] CreateEnvironment3DForm.tsx
- [ ] UploadAudioForm.tsx
- [ ] EditAudioModal.tsx
- [ ] CreateQuestionForm.tsx
- [ ] QuestionEditModal.tsx
- [ ] Testar criação/edição de Document, Environment3D, Audio, Question

### Finalização
- [ ] Atualizar traduções i18n (remover labels de pt/es)
- [ ] Build sem erros
- [ ] Testar em staging
- [ ] Deploy produção

---

## Reversibilidade

**Para reativar multi-language no futuro:**

1. Restaurar seções de tradução pt/es nos formulários
2. Atualizar validações para exigir 3 idiomas
3. Backend já aceita 3 traduções (zero mudança necessária)

**Tempo estimado para reverter:** 4-6 horas (mesmo que implementação)

---

## Notas Finais

- ✅ **Retrocompatível:** Forms não migrados continuam funcionando
- ✅ **Migração gradual:** Pode fazer 1 componente por vez
- ✅ **Zero risco:** Backend aceita qualquer combinação
- ✅ **Locale principal:** Italiano (it)
- ✅ **Dados existentes:** Não são afetados

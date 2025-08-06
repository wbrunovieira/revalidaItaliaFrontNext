---
description: Atualiza documento de sprint com tarefas completadas
allowed-tools: FileEditor, Bash(git:*)
---

# Atualizar Documento de Sprint

## Prompt para atualizacao automatica

Use este comando apos completar qualquer tarefa:

```
Por favor, atualize o documento de sprint em /docs/sprint5-tracking.md com a tarefa que acabamos de completar.

1. Analise o contexto da conversa para identificar:
   - O que foi implementado tecnicamente
   - Qual beneficio foi entregue ao usuario/negocio
   - Se houve commits relacionados

2. Adicione a entrada na data de hoje (a data atual aparece no contexto da conversa como "Today's date: YYYY-MM-DD")

3. Use o formato padrao:
   **Nome da Feature/Correcao**
   - [Tecnico] Descricao tecnica do que foi implementado
   - [Beneficio] Valor entregue para usuario ou negocio
   - [Commit] Mensagem do commit (se houver)

4. Escolha a secao apropriada:
   - ✅ Features Implementadas
   - 🔧 Melhorias e Ajustes
   - 🐛 Bugs Corrigidos
   - 📚 Documentacoes Criadas
   - 🧪 Testes Adicionados
```

## Exemplo de uso rapido

Simplesmente diga:
"atualize o sprint doc com a tarefa que completamos"

## Formato esperado no documento

### Para Features:
```markdown
### 06/08/2025

**Sistema de Comentarios em Aulas**
- [Tecnico] Implementacao de modal para criar comentarios e respostas em posts de aulas
- [Beneficio] Permite discussoes contextualizadas dentro de cada aula
- [Commit] feat: implement lesson comment system with reply functionality
```

### Para Correcoes:
```markdown
**Correcao de Hidratacao no PostCard**
- [Tecnico] Resolvido erro de botao aninhado dentro de link no componente PostCard
- [Beneficio] Elimina warnings de console e melhora compatibilidade com React
- [Commit] fix: resolve nested button hydration error in PostCard
```

### Para Melhorias:
```markdown
**Otimizacao de Performance em Listas**
- [Tecnico] Implementacao de virtualizacao para listas longas usando react-window
- [Beneficio] Reduz uso de memoria e melhora FPS em listas com 1000+ itens
- [Commit] refactor: add list virtualization for better performance
```

## Dicas importantes

- Mantenha descricoes concisas mas informativas
- Foque no valor entregue, nao apenas na implementacao
- Se multiplas tarefas relacionadas foram feitas, agrupe sob um unico nome
- Use portugues para as descricoes no documento
- Commits devem estar em ingles (Conventional Commits)
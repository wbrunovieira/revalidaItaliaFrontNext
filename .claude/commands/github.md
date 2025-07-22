---
description: Regras e padrões para commits no projeto
---

# Regras de Commit e Git

## ⚠️ REGRA CRÍTICA: Atribuição

### NUNCA adicione estas linhas nos commits ou arquivos:

❌ PROIBIDO: 🤖 Generated with Claude Code
(https://claude.ai/code) Co-Authored-By: Claude
noreply@anthropic.com

### Por quê?

- O código é propriedade do projeto/empresa
- Evita poluição no histórico do git
- Mantém profissionalismo nos commits

## Padrão de Commits (Conventional Commits)

### Formato OBRIGATÓRIO:

```bash
<tipo>: <descrição em inglês, imperativo, concisa>
```

### Tipos Permitidos:

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Apenas documentação
- **style**: Formatação (sem mudança de código)
- **refactor**: Refatoração sem mudança funcional
- **perf**: Melhoria de performance
- **test**: Adição/correção de testes
- **chore**: Manutenção, dependências
- **build**: Mudanças no build system

### Exemplos Corretos:

```bash
# Feature
git commit -m "feat: add password recovery form"
git commit -m "feat: implement JWT refresh token"
git commit -m "feat: add video edit modal with read-only provider fields"

# Fix
git commit -m "fix: resolve form state not clearing after submit"
git commit -m "fix: correct module ordering logic"
git commit -m "fix: prevent duplicate password validation messages"

# Refactor
git commit -m "refactor: simplify course fetching logic"
git commit -m "refactor: extract shared modal logic"

# Style
git commit -m "style: improve spacing in course cards"
git commit -m "style: align buttons consistently"

# Docs
git commit -m "docs: update API integration guide"
git commit -m "docs: add setup instructions"
```
## Workflow de Commit PADRÃO

### 1. Verificar mudanças:
```bash
git status
git diff
```

### 2. Adicionar arquivos específicos:
```bash
# SEMPRE adicione arquivos específicos
git add src/components/NewComponent.tsx
git add src/components/UpdatedComponent.tsx
git add messages/pt.json messages/es.json messages/it.json

# EVITE git add . para prevenir commits acidentais
```

### 3. Commit com Conventional Commits:
```bash
# Formato: tipo: descrição concisa em inglês
git commit -m "feat: add course enrollment animation"
git commit -m "fix: resolve navigation issue in mobile view"
git commit -m "refactor: simplify video fetching logic"
```

### 4. Push para o repositório:
```bash
git push origin main
```
## Regras OBRIGATÓRIAS do Projeto

### 1. SEMPRE em inglês
```bash
✅ git commit -m "fix: resolve navigation issue"
❌ git commit -m "fix: corrigir problema de navegação"
```

### 2. Mensagem CONCISA (máximo 72 caracteres)
```bash
✅ git commit -m "feat: add course completion badge"
❌ git commit -m "feat: add a new badge that shows when user completes all modules in a course successfully"
```

### IMPORTANTE: Sempre use mensagens resumidas
- NÃO ofereça alternativas mais detalhadas
- SEMPRE siga o formato conciso
- Máximo 72 caracteres na primeira linha

### 3. Use IMPERATIVO
```bash
✅ git commit -m "feat: add loading state" (NÃO "added" ou "adding")
✅ git commit -m "fix: resolve memory leak" (NÃO "fixed" ou "fixing")
```

### 4. Seja ESPECÍFICO
```bash
✅ git commit -m "fix: prevent form double submission"
✅ git commit -m "feat: add video edit modal with read-only provider fields"
❌ git commit -m "fix: bug fix"
❌ git commit -m "update files"
❌ git commit -m "changes"
```

### 5. NUNCA adicione atribuições automáticas
```bash
❌ NUNCA: "🤖 Generated with Claude Code"
❌ NUNCA: "Co-Authored-By: Claude <noreply@anthropic.com>"
```
Commits Multi-line (quando necessário)
Para mudanças complexas:
bashgit commit -m "feat: implement course recommendation system

- Add recommendation algorithm based on user progress
- Create new API endpoint for recommendations
- Add UI component to display suggestions
- Include A/B testing framework

Closes #123"
Corrigindo Commits
Alterar último commit:
bash# Mudar mensagem apenas
git commit --amend -m "feat: correct message"

# Adicionar arquivos esquecidos
git add arquivo-esquecido.tsx
git commit --amend --no-edit
Squash commits antes do push:
bash# Últimos 3 commits
git rebase -i HEAD~3
Git Aliases Úteis
Adicione ao .gitconfig:
bash[alias]
    # Atalhos para comandos comuns
    st = status
    co = checkout
    br = branch

    # Commit semântico rápido
    feat = "!f() { git commit -m \"feat: $@\"; }; f"
    fix = "!f() { git commit -m \"fix: $@\"; }; f"
    docs = "!f() { git commit -m \"docs: $@\"; }; f"
    style = "!f() { git commit -m \"style: $@\"; }; f"
    refactor = "!f() { git commit -m \"refactor: $@\"; }; f"

    # Log bonito
    lg = log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
Uso:
bashgit feat "add user authentication"
git fix "resolve memory leak in course list"
Checklist Antes do Commit

 Código está funcionando (testado manualmente)
 Sem console.log ou código de debug
 Formatação correta (Prettier/ESLint)
 Arquivos desnecessários removidos
 Mensagem de commit segue o padrão
 Sem informações sensíveis (tokens, passwords)
 Sem atribuições automáticas do Claude

## Exemplo de Sessão Completa

```bash
# 1. Implementar feature
🔍 Analisando: estrutura existente do projeto
🛠️ Implementando: modal de edição de vídeos

# 2. Verificar mudanças
git status
# Output: 5 arquivos modificados/criados

# 3. Adicionar arquivos específicos
git add src/components/EditVideoModal.tsx
git add src/components/VideosList.tsx
git add messages/pt.json messages/es.json messages/it.json

# 4. Commit com Conventional Commits
git commit -m "feat: add video edit modal with read-only provider fields"

# 5. Push
git push origin main

✅ Concluído: feature implementada e versionada
```

## Padrão para Este Projeto

### Commits DEVEM seguir este formato:
```bash
# Features
git commit -m "feat: add [componente/funcionalidade específica]"

# Correções
git commit -m "fix: resolve [problema específico]"

# Refatorações
git commit -m "refactor: [o que foi refatorado]"
```

### SEMPRE:
1. Use Conventional Commits
2. Escreva em inglês
3. Seja conciso e específico
4. Use tom imperativo
5. Adicione arquivos específicos (não use git add .)
6. NUNCA adicione atribuições automáticas do Claude

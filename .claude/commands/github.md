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

### Formato:

```bash
<tipo>(<escopo opcional>): <descrição>

[corpo opcional]

[rodapé opcional]
Tipos Permitidos:

feat: Nova funcionalidade
fix: Correção de bug
docs: Apenas documentação
style: Formatação (sem mudança de código)
refactor: Refatoração sem mudança funcional
perf: Melhoria de performance
test: Adição/correção de testes
chore: Manutenção, dependências
build: Mudanças no build system

Exemplos Corretos:
bash# Feature
git commit -m "feat: add password recovery form"
git commit -m "feat(auth): implement JWT refresh token"

# Fix
git commit -m "fix: resolve form state not clearing after submit"
git commit -m "fix(courses): correct module ordering logic"

# Refactor
git commit -m "refactor: simplify course fetching logic"
git commit -m "refactor(components): extract shared modal logic"

# Style
git commit -m "style: improve spacing in course cards"
git commit -m "style(ui): align buttons consistently"

# Docs
git commit -m "docs: update API integration guide"
git commit -m "docs(readme): add setup instructions"
Workflow de Commit
1. Verificar mudanças:
bashgit status
git diff
2. Adicionar arquivos:
bash# Específicos
git add src/components/NewComponent.tsx
git add src/styles/component.css

# Todos (use com cuidado)
git add .

# Interativo (recomendado)
git add -p
3. Commit com mensagem apropriada:
bashgit commit -m "feat: add course enrollment animation"
4. Push para o repositório:
bashgit push origin main
# ou
git push origin feature/nome-da-feature
Regras Específicas do Projeto
1. Sempre em inglês
bash✅ git commit -m "fix: resolve navigation issue"
❌ git commit -m "fix: corrigir problema de navegação"
2. Mensagem concisa (50-72 caracteres)
bash✅ git commit -m "feat: add course completion badge"
❌ git commit -m "feat: add a new badge that shows when user completes all modules in a course successfully"
3. Use imperativo
bash✅ git commit -m "add loading state" (não "added" ou "adding")
✅ git commit -m "fix memory leak" (não "fixed" ou "fixing")
4. Seja específico
bash✅ git commit -m "fix: prevent form double submission"
❌ git commit -m "fix: bug fix"
❌ git commit -m "update files"
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

Exemplo de Sessão Completa
bash# 1. Criar feature
🔍 Analisando: estrutura de componentes de formulário
🛠️ Implementando: componente de recuperação de senha

# 2. Verificar mudanças
git status
git diff

# 3. Adicionar arquivos
git add src/components/PasswordResetForm.tsx
git add src/components/PasswordResetForm.module.css

# 4. Commit
git commit -m "feat(auth): add password reset form component"

# 5. Push
git push origin main

✅ Concluído: feature implementada e versionada
```

# 🚀 Sprint 5 - Features e Melhorias Implementadas

## 📅 Período: 06/08/2025 - 19/08/2025

---

## ✅ Features Implementadas

_Para cada feature, incluir: [Técnico] O que foi implementado | [Benefício] Valor para o usuário/negócio_

### 06/08/2025

**Integração de Badges de Role na Comunidade**
- [Técnico] Atualização da página de comunidade para usar o campo role diretamente da API, removendo sistema desnecessário de busca separada de roles
- [Benefício] Melhora performance eliminando múltiplas chamadas à API e permite identificação visual imediata do tipo de usuário (admin, tutor, aluno) em posts e comentários
- [Commit] fix: use role field directly from API response

**Sistema de Rastreamento de Progresso de Vídeo e Continue Learning**
- [Técnico] Implementação completa do heartbeat service para enviar progresso de vídeo ao backend, correção de parsing de cookies, tratamento de erros 404, e ajuste de payload para conformidade com DTO do backend
- [Benefício] Permite aos usuários continuar assistindo vídeos de onde pararam, mostrando card na home com progresso salvo e tempo restante
- [Commit] fix: video progress tracking and continue learning functionality

**Rastreamento de Acesso a Lições sem Vídeo**
- [Técnico] Implementação de sistema híbrido usando localStorage para rastrear acesso a lições sem vídeo, com comparação de timestamps entre backend e localStorage para mostrar sempre a atividade mais recente
- [Benefício] Permite que o card "Continue de onde parou" funcione para todos os tipos de conteúdo (documentos, flashcards, avaliações), não apenas vídeos, melhorando a experiência de navegação
- [Commit] feat: add lesson access tracking for non-video content

### 07/08/2025

-

### 08/08/2025

-

### 09/08/2025

-

### 12/08/2025

-

### 13/08/2025

-

### 14/08/2025

-

### 15/08/2025

-

### 16/08/2025

-

### 19/08/2025

-

---

## 🔧 Melhorias e Ajustes

### 06/08/2025

**Ajuste Visual do Card "Nenhum Vídeo Disponível"**
- [Técnico] Redução do tamanho do card de aviso quando lição não possui vídeo, adicionando max-width e centralizando com margens automáticas
- [Benefício] Melhora a experiência visual em lições sem vídeo, evitando que o card ocupe toda a largura da tela desnecessariamente
- [Commit] fix: reduce no video card size in lesson page

---

## 🐛 Bugs Corrigidos

### 06/08/2025

**Reorganização da Posição dos Comentários em Lições**
- [Problema] Comentários apareciam no final da página quando havia muitos assessments, dificultando o acesso
- [Solução] Criação de layouts diferentes para lições com e sem vídeo - com vídeo: comentários abaixo do player; sem vídeo: comentários em área dedicada após o conteúdo
- [Commit] fix: reorganize lesson comments position for pages with and without video

---

## 📚 Documentações Criadas

**Exemplo de Documentação**
- [Arquivo] README.md atualizado com instruções de deploy
- [Conteúdo] Passo a passo para configuração em produção

---

## 🧪 Testes Adicionados

**Exemplo de Teste**
- [Componente] UserProfile.test.tsx
- [Cobertura] 85% de cobertura no componente UserProfile

---

_Atualizar este documento sempre que completar uma tarefa_
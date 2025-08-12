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

**Fundação do Gerenciamento de Estado Global (Fase 0)**
- [Técnico] Instalação e configuração do Zustand v5.0.7 e TanStack Query v5.84.1, criação de estrutura de pastas para stores e queries, configuração do QueryClient com cache otimizado e setup dos providers no layout root
- [Benefício] Estabelece base para eliminar duplicação de código em 20+ componentes e reduzir chamadas API em 70% através de cache inteligente, preparando o sistema para melhor performance e manutenibilidade
- [Commit] feat: implement global state management foundation

**Store de Autenticação com Zustand (Fase 1)**
- [Técnico] Implementação completa do Auth Store com Zustand incluindo interface User completa (nome, role, email), actions de login/logout, helpers de permissão (isAdmin, isTutor, isStudent), persistência com cookies/localStorage, e inicialização automática ao carregar a aplicação
- [Benefício] Elimina duplicação de lógica de autenticação em 20+ componentes, centraliza controle de permissões, melhora performance evitando decodificação repetida de JWT, e simplifica manutenção com fonte única de verdade para dados do usuário
- [Commit] feat: implement auth store with Zustand (Phase 1)

### 06/08/2025 (Continuação)

**Integração do Login com Auth Store e Exibição de Dados do Usuário**
- [Técnico] Migração do LoginForm para usar Auth Store ao invés de fetch direto, integração com resposta completa da API incluindo fullName e profileImageUrl, atualização do Avatar e UserDropdown para usar dados do store
- [Benefício] Nome e badge de role do usuário aparecem imediatamente na navegação após login, foto de perfil é exibida quando disponível, elimina chamadas API duplicadas para buscar dados do usuário
- [Commit] fix: integrate login with Auth Store and display user data in navigation

**Sistema de Respostas Aninhadas em Comentários da Comunidade**
- [Técnico] Implementação de respostas a comentários usando endpoint /community/comments/:id/reply, suporte a renderização recursiva de replies com limite de 2 níveis, atualização do CreateCommentModal para diferenciar entre comentários e respostas
- [Benefício] Permite discussões mais organizadas e contextualizadas na comunidade, usuários podem responder diretamente a comentários específicos criando threads de conversação
- [Commit] feat: implement nested comment replies in community page

### 07/08/2025

**Sistema de Respostas Aninhadas para Comentários em Lições**
- [Técnico] Extensão do sistema de replies para páginas de lições (/lessons), implementação de handleReplyToComment no LessonComments, suporte a respostas de até 2 níveis de profundidade
- [Benefício] Permite discussões contextualizadas dentro de cada aula específica, facilitando o esclarecimento de dúvidas entre alunos e tutores
- [Commit] feat: implement reply functionality for lesson comments

**Suporte a Badges de Role em Comentários e Respostas**
- [Técnico] Adição dos campos role e profileImageUrl em todas as interfaces Author, atualização do mapeamento de dados da API para incluir os novos campos, priorização de profileImageUrl sobre avatar em todos os componentes
- [Benefício] Badges de identificação (admin, tutor, student) agora aparecem em todos os comentários e respostas, melhorando a credibilidade e contexto das interações
- [Commit] fix: add role and profileImageUrl fields to support user badges in comments

**Sistema de Moderação com Confirmações**
- [Técnico] Implementação de ModerationControls component com capacidade de editar títulos (posts apenas) e bloquear/desbloquear conteúdo, adição de dialog de confirmação antes de ações de moderação, visibilidade baseada em roles (students não veem conteúdo bloqueado, moderadores veem com 50% opacidade)
- [Benefício] Permite que administradores e tutores moderem conteúdo inadequado protegendo a comunidade, sistema de confirmação previne ações acidentais, transparência para moderadores sobre conteúdo bloqueado
- [Commit] feat: add moderation system with confirmation dialogs

**Tratamento de Lições Deletadas no Continue Learning**
- [Técnico] Implementação de validação de existência de lição antes de exibir no card, limpeza automática do localStorage quando lição retorna 404 ou 403, retry logic com 3 tentativas antes de desistir, tratamento diferenciado para erros de rede vs lições inexistentes
- [Benefício] Evita exibição de cards quebrados quando lições são removidas ou usuário perde acesso, melhora robustez do sistema em ambientes de desenvolvimento onde banco é limpo frequentemente, experiência suave mesmo com mudanças no conteúdo disponível
- [Commit] fix: handle deleted lessons in continue learning component

**Sistema de Remoção de Reações com Toggle**
- [Técnico] Implementação de toggle para remover reações (clicar na mesma reação remove), indicadores visuais com anel azul e animação pulse para reação ativa, tooltip "Remover" em vermelho ao hover, animações customizadas de add/remove no CSS global
- [Benefício] UX intuitivo seguindo padrão conhecido (Facebook/LinkedIn), usuários podem facilmente mudar de opinião sobre reações, feedback visual claro sobre qual reação está ativa, menos cliques para gerenciar reações
- [Commit] feat: implement reaction removal with toggle functionality

**Integração com API DELETE para Remoção de Reações**
- [Técnico] Implementação de chamadas DELETE para endpoints `/community/posts/:postId/reactions` e `/community/comments/:commentId/reactions`, tratamento específico de erros 404 (reaction-not-found vs post-not-found), lógica condicional para usar DELETE na remoção e POST na adição/mudança
- [Benefício] Integração completa com backend para remoção de reações, tratamento robusto de casos de erro, logs detalhados para debug em produção, suporte tanto para posts quanto comentários
- [Commit] feat: implement DELETE endpoint for removing reactions

### 08/08/2025

**Atualização Completa da Página de Perfil com Novos Campos da API**
- [Técnico] Refatoração da página de perfil para suportar todos os campos do GET /users/:id incluindo bio, profession, specialization, community consent, permissions, restrictions e endereços múltiplos, reorganização visual com seções agrupadas (Informações Básicas, Documentação, Perfil Profissional, Status da Comunidade)
- [Benefício] Interface mais profissional e organizada, visualização clara de todos os dados do usuário, indicador visual de consentimento da comunidade, suporte para múltiplos endereços com indicação de principal
- [Commit] feat: enhance profile page with new API fields and improved UX

**Sistema de Upload de Imagem no Formulário de Perfil**
- [Técnico] Substituição do campo de URL por upload direto de arquivo usando API route /api/upload, criação de diretório public/uploads/images/profiles, preview em tempo real da imagem, validação de tipo (JPG, PNG, GIF, WebP) e tamanho (max 5MB)
- [Benefício] Experiência mais intuitiva para atualizar foto de perfil, elimina necessidade de URLs externas, preview instantâneo antes de salvar, feedback visual durante upload
- [Commit] feat: replace URL field with image upload in profile edit form

**Atualização Automática do Avatar após Upload**
- [Técnico] Integração do EditProfileForm com Auth Store para atualizar profileImageUrl globalmente após upload bem-sucedido
- [Benefício] Avatar atualizado imediatamente em toda a aplicação (Nav, UserDropdown, comentários) sem necessidade de recarregar página
- [Commit] fix: update auth store with new profile image after upload

**Refatoração do Auth Store para Nova API de Login**
- [Técnico] Adição de interfaces ProfileCompleteness, CommunityProfile e MetaInfo ao Auth Store, processamento completo da resposta do POST /auth/login incluindo profileCompleteness (percentage, completedSections, missingFields), communityProfile (profession, specialization, city, country) e meta (firstLogin, requiresPasswordChange, requiresProfileCompletion)
- [Benefício] Sistema agora rastreia completude do perfil (0-100%), pode mostrar próximos passos para completar perfil, acesso a dados profissionais quando consentido, preparado para notificar necessidade de trocar senha
- [Commit] feat: update auth store to support new login API response with profile completeness

### 09/08/2025

**Indicador Visual de Completude do Perfil no Avatar**
- [Técnico] Implementação de círculo SVG ao redor do avatar mostrando porcentagem de completude do perfil, com cores dinâmicas baseadas na porcentagem (vermelho <30%, amarelo 50-99%, verde 100%), animação suave de transição, tooltip mostrando porcentagem exata ao passar o mouse
- [Benefício] Feedback visual imediato sobre o status do perfil, incentiva usuários a completar informações faltantes, melhora engajamento ao gamificar o processo de completar o perfil, indicação clara de próximos passos necessários
- [Commit] feat: add visual profile completeness indicator around user avatar

**Sistema de Criação e Atualização de Endereços com Refresh Automático**
- [Técnico] Correção do mapeamento de dados do formulário de endereço, busca dados atualizados do usuário após criar endereço via GET /users/:id, remoção de parâmetros desnecessários (userId), adição de logs para debug da resposta da API
- [Benefício] Endereços criados aparecem imediatamente na tela sem necessidade de refresh manual, melhor experiência do usuário ao gerenciar múltiplos endereços, feedback visual instantâneo após ações
- [Commit] feat: add profile completeness indicator and fix address creation

**Botão Flutuante de Novo Post na Comunidade**
- [Técnico] Implementação de botão fixo no canto superior direito da página de comunidade com ícone Plus rotativo, z-index alto para ficar sempre visível, tooltip explicativo ao passar o mouse
- [Benefício] Usuários podem criar posts a qualquer momento sem precisar voltar ao topo da página, melhora acessibilidade em dispositivos móveis, facilita engajamento na comunidade
- [Commit] feat: add floating fixed create post button on community page

**Exibição de Dados Profissionais em Posts e Comentários da Comunidade**
- [Técnico] Mapeamento completo dos campos bio, specialization, profession, city e country vindos da API nos componentes PostCard e ReplyCard, tooltip interativo ao passar mouse sobre avatar mostrando bio e especialização, correção de z-index para tooltips aparecerem sobre outros elementos
- [Benefício] Usuários podem conhecer melhor outros membros da comunidade vendo suas profissões e especializações, tooltips com bio criam conexões mais pessoais, respeita privacidade mostrando dados apenas de quem consentiu
- [Commit] feat: add user profile data to community posts and comments

**Correção do Botão de Argumento na Aba de Avaliações**
- [Técnico] Remoção do botão "Novo Argumento" mal posicionado na aba de criar avaliações do painel admin, ajuste do grid de 3 para 2 colunas mantendo apenas botões de Nova Avaliação e Nova Questão
- [Benefício] Interface mais limpa e organizada no painel administrativo, elimina confusão sobre onde criar argumentos, melhora a experiência de navegação dos administradores
- [Commit] fix: remove misplaced argument button from assessments tab

**Sistema de Denúncia de Posts na Comunidade**
- [Técnico] Implementação completa do modal ReportModal com seleção de motivo via radio buttons, integração com endpoint POST /community/posts/:postId/reports, tratamento específico para cada código de erro HTTP (409, 404, 400, 401), componente radio-group criado com Radix UI, logs apropriados usando console.info/warn/error conforme o caso
- [Benefício] Permite que usuários denunciem conteúdo inadequado mantendo a comunidade segura, denúncias anônimas protegem a privacidade do denunciante, feedback claro sobre denúncias duplicadas ou posts já removidos, modal permanece aberto em erros de validação para correção
- [Commit] feat: implement post reporting functionality with modal

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

### 08/08/2025

**Melhorias Visuais na Página de Perfil**
- [Técnico] Ajuste de espaçamento entre título "Informações Pessoais" e botão editar, adição de descrição subtítulo, linha divisória decorativa, botão com estilo mais sutil (borda ao invés de fundo sólido)
- [Benefício] Interface mais limpa e profissional, melhor hierarquia visual, espaçamento adequado entre elementos
- [Commit] Incluído nos commits de perfil acima

---

## 🐛 Bugs Corrigidos

### 06/08/2025

**Reorganização da Posição dos Comentários em Lições**
- [Problema] Comentários apareciam no final da página quando havia muitos assessments, dificultando o acesso
- [Solução] Criação de layouts diferentes para lições com e sem vídeo - com vídeo: comentários abaixo do player; sem vídeo: comentários em área dedicada após o conteúdo
- [Commit] fix: reorganize lesson comments position for pages with and without video

**Atualização das Cores dos Badges de Role**
- [Técnico] Redesign dos badges de role usando cores harmônicas do projeto - admin: dourado/amber (autoridade), tutor: gradiente azul-dourado (destaque especial), student: azul accent (#79BED9)
- [Benefício] Melhora a consistência visual com a identidade da marca, remove conotações negativas e cria hierarquia visual clara entre os papéis
- [Commit] feat: update role badge colors with harmonized design

### 09/08/2025

**Correção de Erros de Build e Linting**
- [Problema] Build falhando com erros de TypeScript e ESLint - variáveis não utilizadas, imports desnecessários, tipos incorretos
- [Solução] Remoção de variáveis não utilizadas (userId, imageFile, Upload, SimpleDivider), correção de tipos any para tipos específicos, limpeza de imports
- [Commit] fix: resolve build errors and remove unused variables

**Remoção do Sistema de Monitoramento de Conexão**
- [Problema] Faixa amarela piscando rapidamente ao trocar de páginas devido a verificação constante de conexão
- [Solução] Remoção completa do sistema de monitoramento de conexão (isOnline, banners de status), confiando apenas em erros reais das chamadas API
- [Commit] fix: remove connection monitoring system to prevent yellow stripe flashing

**Persistência de Dados de Completude do Perfil**
- [Problema] Círculo de progresso do perfil voltava para 0% vermelho após refresh da página
- [Solução] Configuração do Zustand para persistir profileCompleteness, communityProfile e meta no localStorage, restauração desses dados ao inicializar a aplicação
- [Commit] fix: persist profile completeness data to prevent loss on page refresh

**Sistema de Denúncia de Comentários e Respostas**
- [Técnico] Adaptação do ReportModal para suportar posts e comentários, integração com endpoint POST /community/comments/:commentId/reports, adição de botão de denúncia no ReplyCard, logs detalhados antes e depois das requisições para debug
- [Benefício] Permite denunciar comentários inadequados mantendo discussões saudáveis, mesma experiência unificada para denunciar posts e comentários, rastreamento completo de denúncias para moderação
- [Commit] feat: add comment and reply reporting system with detailed logging

### 10/08/2025

**Sistema de Suporte Flutuante para Dúvidas de Alunos**
- [Técnico] Implementação de botão flutuante discreto com tooltip, modal para criação de tickets de suporte com anexos (até 5 arquivos), integração com endpoint POST /api/v1/support/tickets, suporte a contextos (LESSON, ASSESSMENT, FLASHCARD, GENERAL)
- [Benefício] Permite aos alunos tirarem dúvidas contextualizadas diretamente de qualquer página, professores recebem perguntas organizadas com contexto específico, sistema de anexos facilita envio de prints e documentos
- [Commit] feat: add support floating button for student questions

### 11/08/2025

**Sistema Completo de Gerenciamento de Tickets de Suporte para Tutores**
- [Técnico] Implementação de aba Support no dashboard do tutor com componente TutorSupport, listagem de tickets pendentes via GET /api/v1/support/tickets/pending com paginação, modal RespondSupportTicketModal para responder tickets com validação e anexos drag-and-drop, integração com POST /api/v1/support/tickets/:ticketId/messages
- [Benefício] Tutores têm visão centralizada de todas as dúvidas pendentes com estatísticas (tickets abertos, com anexos, alunos únicos), podem responder diretamente com texto e arquivos anexados, status do ticket muda automaticamente para ANSWERED após resposta
- [Commit] feat: add support tab to tutor dashboard + feat: implement support ticket response modal for tutors

### 12/08/2025

**Filtros de Status na Aba Support do Painel do Tutor**
- [Técnico] Adição de botões de filtro para status (Pendentes, Abertos, Respondidos, Resolvidos) na aba Support, integração condicional com endpoints /pending para tickets pendentes e /api/v1/support/tickets com parâmetro status para outros filtros, atualização de badges visuais por status (azul para OPEN, amarelo para ANSWERED, verde para RESOLVED)
- [Benefício] Tutores podem alternar rapidamente entre diferentes status de tickets para priorizar atendimentos, visão clara do pipeline de suporte com cores distintas para cada estado, botão Responder oculto automaticamente para tickets já resolvidos
- [Commit] feat: add status filter buttons to support tab in tutor dashboard

**Página Meus Tickets para Acompanhamento de Suporte pelos Alunos**
- [Técnico] Criação de página My Tickets com layout NavSidebar, implementação do componente StudentTickets com listagem completa de tickets próprios via GET /api/v1/support/tickets/my-tickets, filtros por status e contexto, busca textual, cards de estatísticas, paginação e integração com modal de criação
- [Benefício] Alunos têm visão centralizada de todas suas dúvidas e respostas dos tutores, podem filtrar por status para ver tickets pendentes ou resolvidos, acompanham histórico completo de interações com indicação visual de tutor responsável pela resposta
- [Commit] feat: add My Tickets page for students to track support tickets

---

## 📚 Documentações Criadas

### 06/08/2025

**Plano de Implementação do Estado Global**
- [Arquivo] docs/global-state-implementation-plan.md
- [Conteúdo] Documento detalhado com 7 fases de implementação, incluindo tarefas específicas, estimativas de tempo, exemplos de código e métricas de sucesso para migração completa para Zustand + TanStack Query

---

## 🧪 Testes Adicionados

**Exemplo de Teste**
- [Componente] UserProfile.test.tsx
- [Cobertura] 85% de cobertura no componente UserProfile

---

_Atualizar este documento sempre que completar uma tarefa_
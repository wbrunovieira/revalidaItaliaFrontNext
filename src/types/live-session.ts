/**
 * Live Session Types
 *
 * Types para integração com o sistema de tokens JWT únicos
 * para entrada em sessões Zoom ao vivo.
 *
 * @see Backend Integration Guide: Frontend Integration Guide: Live Session Join with Unique JWT Tokens
 */

/**
 * Status possíveis de uma sessão
 */
export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

/**
 * Tipo de sessão
 */
export type SessionType = 'MEETING' | 'WEBINAR';

/**
 * Response do POST /live-sessions/:id/join-token
 * Retorna token JWT único e URL para entrar na sessão
 */
export interface JoinTokenResponse {
  /** JWT único para entrar na sessão (válido por 15 minutos, one-time use) */
  joinToken: string;
  /** URL do frontend para validar token: /live-sessions/:id/join?token=xxx */
  joinUrl: string;
  /** Data/hora de expiração do token (ISO 8601) */
  expiresAt: string;
  /** Tempo em segundos até expirar (900 = 15 minutos) */
  expiresIn: number;
}

/**
 * Response do GET /live-sessions/:id/join?token=xxx
 * Retorna URL do Zoom após validar token
 */
export interface JoinSessionResponse {
  /** URL única do Zoom para redirecionar usuário */
  redirectUrl: string;
  /** Metadados da sessão para exibição */
  metadata: {
    /** Título da sessão */
    sessionTitle: string;
    /** Status atual da sessão */
    sessionStatus: string;
    /** Data/hora que usuário entrou (ISO 8601) */
    joinedAt: string;
  };
}

/**
 * Erro da API (RFC 7807 Problem Details)
 * Formato padrão de erros retornados pelo backend
 */
export interface ApiProblemDetails {
  /** URI que identifica o tipo de erro */
  type?: string;
  /** Título curto e legível do erro */
  title?: string;
  /** Status HTTP do erro */
  status: number;
  /** Descrição detalhada do erro */
  detail: string;
  /** URI da instância específica do erro */
  instance?: string;
  /** Mensagem adicional (fallback) */
  message?: string;
}

/**
 * Informações do host da sessão
 */
export interface Host {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
}

/**
 * Informações de um co-host
 */
export interface CoHost {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
}

/**
 * Informações de uma lição associada
 */
export interface Lesson {
  id: string;
  title: string;
  slug: string;
}

/**
 * Informações de um argumento associado
 */
export interface Argument {
  id: string;
  title: string;
  slug: string;
}

/**
 * Configurações da sessão
 */
export interface SessionSettings {
  maxParticipants: number;
  recordingEnabled: boolean;
  waitingRoomEnabled: boolean;
  chatEnabled: boolean;
  qnaEnabled: boolean;
  autoStartRecording: boolean;
  muteParticipantsOnEntry: boolean;
  allowParticipantsUnmute: boolean;
  allowRaiseHand: boolean;
  allowParticipantScreenShare: boolean;
}

/**
 * Detalhes completos de uma sessão ao vivo
 *
 * ⚠️ IMPORTANTE: Os campos joinUrl e passcode não existem mais no novo fluxo!
 * Use o hook useLiveSessionJoin para gerar tokens únicos.
 *
 * Response do GET /live-sessions/:id
 */
export interface LiveSessionDetails {
  /** ID único da sessão */
  sessionId: string;
  /** Título da sessão */
  title: string;
  /** Descrição detalhada (opcional) */
  description: string | null;
  /** Status atual da sessão */
  status: SessionStatus;
  /** Tipo da sessão */
  sessionType: SessionType;

  /** Informações do host (anfitrião) */
  host: Host;
  /** Lista de co-hosts */
  coHosts: CoHost[];

  /** Lição associada (opcional) */
  lesson?: Lesson;
  /** Argumento associado (opcional) */
  argument?: Argument;

  /** Data/hora agendada de início (ISO 8601) */
  scheduledStartTime: string;
  /** Data/hora agendada de término (ISO 8601) */
  scheduledEndTime: string;
  /** Data/hora real de início (ISO 8601) */
  actualStartTime?: string;
  /** Data/hora real de término (ISO 8601) */
  actualEndTime?: string;

  /** Número máximo de participantes */
  maxParticipants: number;
  /** Gravação habilitada */
  recordingEnabled: boolean;
  /** Sala de espera habilitada */
  waitingRoomEnabled: boolean;
  /** Chat habilitado */
  chatEnabled: boolean;
  /** Q&A habilitado */
  qnaEnabled: boolean;
  /** Auto-iniciar gravação */
  autoStartRecording: boolean;
  /** Silenciar participantes ao entrar */
  muteParticipantsOnEntry: boolean;
  /** Permitir que participantes se desmutém */
  allowParticipantsUnmute: boolean;
  /** Permitir levantar a mão */
  allowRaiseHand: boolean;
  /** Permitir compartilhamento de tela de participantes */
  allowParticipantScreenShare: boolean;

  /**
   * ⚠️ DEPRECATED: Não use mais este campo!
   * Use o hook useLiveSessionJoin para gerar token único
   * @deprecated
   */
  joinUrl?: string | null;

  /**
   * ⚠️ DEPRECATED: Não use mais este campo!
   * Passcode agora é gerado por token único
   * @deprecated
   */
  passcode?: string | null;

  /** Número atual de participantes */
  participantCount: number;
  /** Data de criação da sessão (ISO 8601) */
  createdAt: string;
  /** Data de última atualização (ISO 8601) */
  updatedAt: string;
}

/**
 * Response da listagem de sessões com paginação
 */
export interface LiveSessionsListResponse {
  sessions: LiveSessionDetails[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// src/types/moderation.ts

export interface ModeratedPost {
  id: string;
  title: string;
  originalTitle?: string;     // Título original antes da edição
  wasTitleEdited?: boolean;   // Se o título foi editado
  titleEditedBy?: string;      // ID do moderador que editou
  titleEditedAt?: Date;        // Data da edição do título
  content: string;             // Conteúdo não é editável
  isBlocked?: boolean;
  blockedAt?: Date;
  blockedBy?: string;
  blockedByRole?: 'admin' | 'tutor';
}

export interface ModeratedComment {
  id: string;
  content: string;             // Conteúdo não é editável
  isBlocked?: boolean;
  blockedAt?: Date;
  blockedBy?: string;
  blockedByRole?: 'admin' | 'tutor';
}

export interface ModerationPermissions {
  canEditTitle: boolean;       // true apenas para posts
  canBlockContent: boolean;    // true para posts e comentários
  canViewBlocked: boolean;     // true para admin/tutor, false para students
}

export const getModerationPermissions = (
  userRole: string | undefined,
  contentType: 'post' | 'comment' | 'reply'
): ModerationPermissions => {
  const isModerator = userRole === 'admin' || userRole === 'tutor';

  return {
    canEditTitle: isModerator && contentType === 'post',
    canBlockContent: isModerator,
    canViewBlocked: isModerator
  };
};

export interface ModerationLog {
  id: string;
  action: 'edit_title' | 'block' | 'unblock';
  targetId: string;
  targetType: 'post' | 'comment' | 'reply';
  performedBy: string;
  performedByRole: 'admin' | 'tutor';
  performedAt: Date;
  details?: {
    oldTitle?: string;
    newTitle?: string;
  };
}
// src/utils/moderation-handlers.ts

export const moderationHandlers = {
  // Editar APENAS TÍTULO do post
  editPostTitle: async (postId: string, title: string, userId: string, userRole: string) => {
    console.log('📝 API CALL - Edit Post Title:', {
      endpoint: `/api/v1/community/posts/${postId}/title`,
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer [token]' },
      payload: {
        title,
        editedBy: userId,
        editedByRole: userRole,
        editedAt: new Date().toISOString()
      },
      expectedResponse: {
        success: true,
        post: {
          id: postId,
          title,
          wasTitleEdited: true,
          titleEditedBy: userId,
          titleEditedAt: new Date().toISOString()
        }
      }
    });
    // TODO: return api.patch(`/api/v1/community/posts/${postId}/title`, { title });
  },

  // Bloquear/Desbloquear POST
  toggleBlockPost: async (postId: string, isBlocked: boolean, userId: string, userRole: string) => {
    console.log('🔒 API CALL - Toggle Block Post:', {
      endpoint: `/api/v1/community/posts/${postId}/block`,
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer [token]' },
      payload: {
        isBlocked: !isBlocked,
        blockedBy: userId,
        blockedByRole: userRole,
        blockedAt: new Date().toISOString()
      },
      expectedResponse: {
        success: true,
        post: { id: postId, isBlocked: !isBlocked }
      }
    });
    // TODO: return api.patch(`/api/v1/community/posts/${postId}/block`, { isBlocked: !isBlocked });
  },

  // Bloquear/Desbloquear COMENTÁRIO
  toggleBlockComment: async (commentId: string, isBlocked: boolean, userId: string, userRole: string) => {
    console.log('🔒 API CALL - Toggle Block Comment:', {
      endpoint: `/api/v1/community/comments/${commentId}/block`,
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer [token]' },
      payload: {
        isBlocked: !isBlocked,
        blockedBy: userId,
        blockedByRole: userRole,
        blockedAt: new Date().toISOString()
      },
      expectedResponse: {
        success: true,
        comment: { id: commentId, isBlocked: !isBlocked }
      }
    });
    // TODO: return api.patch(`/api/v1/community/comments/${commentId}/block`, { isBlocked: !isBlocked });
  },

  // Buscar conteúdo bloqueado (para dashboard de moderação)
  fetchModerationContent: async (userRole: string) => {
    console.log('📊 API CALL - Fetch Moderation Content:', {
      endpoint: `/api/v1/community/moderation/content`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer [token]' },
      params: {
        includeBlocked: true,
        moderatorView: true,
        role: userRole
      },
      expectedResponse: {
        posts: [
          {
            id: '1',
            title: 'Título original',
            originalTitle: 'Título problemático',
            wasTitleEdited: true,
            isBlocked: false
          }
        ],
        blockedPosts: [
          { id: '2', title: 'Post bloqueado', isBlocked: true }
        ],
        blockedComments: [
          { id: '1', content: 'Comentário bloqueado', isBlocked: true }
        ]
      }
    });
    // TODO: return api.get(`/api/v1/community/moderation/content`);
  }
};
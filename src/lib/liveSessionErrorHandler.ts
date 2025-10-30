/**
 * Live Session Error Handler
 *
 * Handles errors from POST /api/v1/live-sessions endpoint and maps them
 * to user-friendly translation keys.
 *
 * Error Types Handled:
 * - 400 Bad Request (Validation, Permission, Time, Settings)
 * - 404 Not Found (Resources)
 * - 503 Service Unavailable (Zoom, Infrastructure)
 * - Network Errors
 */

export interface ApiErrorResponse {
  statusCode?: number;
  status?: number;
  message?: string;
  detail?: string;
  error?: string;
  type?: string;
  title?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
  };
}

export interface ErrorHandlerResult {
  /** Translation key for title */
  titleKey: string;
  /** Translation key for description */
  descriptionKey: string;
  /** Whether this is a field validation error */
  isFieldError: boolean;
  /** Field-specific errors (if any) */
  fieldErrors?: Record<string, string[]>;
}

/**
 * Handles errors from Live Session creation API
 *
 * @param error - Error response from API
 * @returns Error handler result with translation keys
 */
export function handleLiveSessionError(error: unknown): ErrorHandlerResult {
  // Default error for unexpected cases
  const defaultError: ErrorHandlerResult = {
    titleKey: 'Admin.CreateLiveSession.error.title',
    descriptionKey: 'Admin.CreateLiveSession.error.description',
    isFieldError: false,
  };

  // Handle network errors (fetch failed)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.network.title',
      descriptionKey: 'Admin.CreateLiveSession.error.network.description',
      isFieldError: false,
    };
  }

  // Parse API error response
  const apiError = error as ApiErrorResponse;
  const statusCode = apiError.statusCode || apiError.status;
  const message = apiError.message || apiError.detail || '';

  if (!statusCode) {
    return defaultError;
  }

  // Handle 400 Bad Request errors
  if (statusCode === 400) {
    return handle400Error(apiError, message);
  }

  // Handle 404 Not Found errors
  if (statusCode === 404) {
    return handle404Error(message);
  }

  // Handle 503 Service Unavailable errors
  if (statusCode === 503) {
    return handle503Error(message);
  }

  return defaultError;
}

/**
 * Handle 400 Bad Request errors
 */
function handle400Error(apiError: ApiErrorResponse, message: string): ErrorHandlerResult {
  // 1. Validation Errors (Zod)
  if (apiError.error === 'VALIDATION_ERROR' && apiError.details?.fieldErrors) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.validation.title',
      descriptionKey: 'Admin.CreateLiveSession.error.validation.description',
      isFieldError: true,
      fieldErrors: apiError.details.fieldErrors,
    };
  }

  // 2. Permission Errors
  if (message.includes('Only tutors and admins')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.permission.title',
      descriptionKey: 'Admin.CreateLiveSession.error.permission.description',
      isFieldError: false,
    };
  }

  // 3. Time Errors
  if (message.includes('cannot be scheduled in the past')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.time.pastSession',
      isFieldError: false,
    };
  }

  if (message.includes('End time must be after start time')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.time.endBeforeStart',
      isFieldError: false,
    };
  }

  if (message.includes('must be at least 15 minutes')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.time.tooShort',
      isFieldError: false,
    };
  }

  if (message.includes('cannot exceed 480 minutes') || message.includes('cannot exceed') && message.includes('8 hours')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.time.tooLong',
      isFieldError: false,
    };
  }

  // 4. Settings Errors
  if (message.includes('Host cannot be added as co-host')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.settings.hostAsCoHost',
      isFieldError: false,
    };
  }

  if (message.includes('does not belong to course')) {
    if (message.includes('Module')) {
      return {
        titleKey: 'Admin.CreateLiveSession.error.title',
        descriptionKey: 'Admin.CreateLiveSession.error.settings.moduleNotInCourse',
        isFieldError: false,
      };
    }
    if (message.includes('Lesson')) {
      return {
        titleKey: 'Admin.CreateLiveSession.error.title',
        descriptionKey: 'Admin.CreateLiveSession.error.settings.lessonNotInCourse',
        isFieldError: false,
      };
    }
  }

  // 5. Related Lesson Different Course
  if (message.includes('Related lesson belongs to a different course')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.relatedLessonDifferentCourse',
      isFieldError: false,
    };
  }

  // Fallback for other 400 errors
  return {
    titleKey: 'Admin.CreateLiveSession.error.title',
    descriptionKey: 'Admin.CreateLiveSession.error.description',
    isFieldError: false,
  };
}

/**
 * Handle 404 Not Found errors
 */
function handle404Error(message: string): ErrorHandlerResult {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('host')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.notFound.host',
      isFieldError: false,
    };
  }

  if (lowerMessage.includes('course')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.notFound.course',
      isFieldError: false,
    };
  }

  if (lowerMessage.includes('module')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.notFound.module',
      isFieldError: false,
    };
  }

  if (lowerMessage.includes('lesson')) {
    if (lowerMessage.includes('related')) {
      return {
        titleKey: 'Admin.CreateLiveSession.error.title',
        descriptionKey: 'Admin.CreateLiveSession.error.notFound.relatedLesson',
        isFieldError: false,
      };
    }
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.notFound.lesson',
      isFieldError: false,
    };
  }

  if (lowerMessage.includes('argument')) {
    return {
      titleKey: 'Admin.CreateLiveSession.error.title',
      descriptionKey: 'Admin.CreateLiveSession.error.notFound.argument',
      isFieldError: false,
    };
  }

  // Fallback for other 404 errors
  return {
    titleKey: 'Admin.CreateLiveSession.error.title',
    descriptionKey: 'Admin.CreateLiveSession.error.description',
    isFieldError: false,
  };
}

/**
 * Handle 503 Service Unavailable errors
 */
function handle503Error(message: string): ErrorHandlerResult {
  const lowerMessage = message.toLowerCase();

  // Zoom API Errors
  if (lowerMessage.includes('zoom')) {
    if (lowerMessage.includes('rate limit')) {
      return {
        titleKey: 'Admin.CreateLiveSession.error.title',
        descriptionKey: 'Admin.CreateLiveSession.error.zoom.rateLimit',
        isFieldError: false,
      };
    }

    if (lowerMessage.includes('authenticate') || lowerMessage.includes('auth')) {
      return {
        titleKey: 'Admin.CreateLiveSession.error.title',
        descriptionKey: 'Admin.CreateLiveSession.error.zoom.authFailed',
        isFieldError: false,
      };
    }

    if (lowerMessage.includes('failed to create')) {
      return {
        titleKey: 'Admin.CreateLiveSession.error.title',
        descriptionKey: 'Admin.CreateLiveSession.error.zoom.createFailed',
        isFieldError: false,
      };
    }
  }

  // Generic service unavailable
  return {
    titleKey: 'Admin.CreateLiveSession.error.title',
    descriptionKey: 'Admin.CreateLiveSession.error.service.unavailable',
    isFieldError: false,
  };
}

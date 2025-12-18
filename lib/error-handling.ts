import { ErrorType, ErrorCode, AppError } from "./error-types"

/**
 * Normalizes an error into a standard format
 */
export function normalizeError(error: unknown): {
  message: string
  type: ErrorType
  code: ErrorCode
  originalError?: unknown
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      type: error.type,
      code: error.code,
      originalError: error.originalError
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    let type = ErrorType.UNKNOWN
    let code = ErrorCode.SERVER_ERROR

    // Classify error based on message patterns
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection")
    ) {
      type = ErrorType.NETWORK
      code = ErrorCode.NETWORK_ERROR
    } else if (
      message.includes("unauthorized") ||
      message.includes("authentication") ||
      message.includes("auth")
    ) {
      type = ErrorType.AUTH
      code = ErrorCode.UNAUTHORIZED
    } else if (
      message.includes("not found") ||
      message.includes("does not exist")
    ) {
      type = ErrorType.NOT_FOUND
      code = ErrorCode.DRAWING_NOT_FOUND
    } else if (
      message.includes("permission") ||
      message.includes("forbidden") ||
      message.includes("access denied")
    ) {
      type = ErrorType.PERMISSION
      code = ErrorCode.UNAUTHORIZED
    } else if (
      message.includes("invalid") ||
      message.includes("validation") ||
      message.includes("required")
    ) {
      type = ErrorType.VALIDATION
      code = ErrorCode.INVALID_INPUT
    }

    return {
      message: error.message,
      type,
      code,
      originalError: error
    }
  }

  if (typeof error === "string") {
    return {
      message: error,
      type: ErrorType.UNKNOWN,
      code: ErrorCode.SERVER_ERROR,
      originalError: error
    }
  }

  return {
    message: "An unexpected error occurred",
    type: ErrorType.UNKNOWN,
    code: ErrorCode.SERVER_ERROR,
    originalError: error
  }
}

/**
 * Gets a user-friendly error message from an error
 */
export function getUserFriendlyMessage(error: unknown): string {
  const normalized = normalizeError(error)

  switch (normalized.type) {
    case ErrorType.NETWORK:
      return "Network error. Please check your connection and try again."
    case ErrorType.AUTH:
      return "Authentication required. Please sign in and try again."
    case ErrorType.NOT_FOUND:
      return "The requested resource was not found."
    case ErrorType.PERMISSION:
      return "You don't have permission to perform this action."
    case ErrorType.VALIDATION:
      return (
        normalized.message ||
        "Invalid input. Please check your data and try again."
      )
    case ErrorType.SERVER:
      return "Server error. Please try again later."
    default:
      return (
        normalized.message || "An unexpected error occurred. Please try again."
      )
  }
}

/**
 * Maps Convex error messages to user-friendly messages
 */
export function getConvexErrorMessage(error: unknown): string {
  const normalized = normalizeError(error)
  const message = normalized.message.toLowerCase()

  if (message.includes("user not found")) {
    return "No user with that email was found."
  }
  if (message.includes("already a collaborator")) {
    return "That user is already a collaborator."
  }
  if (message.includes("only the owner")) {
    return "Only the owner can perform this action."
  }
  if (message.includes("share with yourself")) {
    return "You already own this resource."
  }
  if (message.includes("unauthorized")) {
    return "You need permission to perform this action."
  }
  if (
    message.includes("drawing not found") ||
    message.includes("folder not found")
  ) {
    return "The requested item was not found."
  }

  return getUserFriendlyMessage(error)
}

/**
 * Reports an error to error tracking service (if configured)
 */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const normalized = normalizeError(error)

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error reported:", {
      message: normalized.message,
      type: normalized.type,
      code: normalized.code,
      context,
      originalError: normalized.originalError
    })
  }

  // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context })
  // }
}

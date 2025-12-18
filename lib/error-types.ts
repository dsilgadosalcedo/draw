/**
 * Error type classification for better error handling
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTH = "AUTH",
  NOT_FOUND = "NOT_FOUND",
  PERMISSION = "PERMISSION",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN"
}

/**
 * Error codes for client-side error handling
 */
export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  DRAWING_NOT_FOUND = "DRAWING_NOT_FOUND",
  FOLDER_NOT_FOUND = "FOLDER_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  ALREADY_COLLABORATOR = "ALREADY_COLLABORATOR",
  INVALID_INPUT = "INVALID_INPUT",
  NETWORK_ERROR = "NETWORK_ERROR",
  SERVER_ERROR = "SERVER_ERROR"
}

/**
 * Typed error class for application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly type: ErrorType,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = "AppError"
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorCode.NETWORK_ERROR, ErrorType.NETWORK, originalError)
    this.name = "NetworkError"
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorCode.INVALID_INPUT, ErrorType.VALIDATION, originalError)
    this.name = "ValidationError"
  }
}

/**
 * Authentication error class
 */
export class AuthError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorCode.UNAUTHORIZED, ErrorType.AUTH, originalError)
    this.name = "AuthError"
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.DRAWING_NOT_FOUND,
    originalError?: unknown
  ) {
    super(message, code, ErrorType.NOT_FOUND, originalError)
    this.name = "NotFoundError"
  }
}

/**
 * Permission error class
 */
export class PermissionError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, ErrorCode.UNAUTHORIZED, ErrorType.PERMISSION, originalError)
    this.name = "PermissionError"
  }
}

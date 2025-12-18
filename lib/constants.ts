/**
 * Application-wide constants
 */

/**
 * API timeout values in milliseconds
 */
export const API_TIMEOUTS = {
  SHORT: 5000, // 5 seconds
  MEDIUM: 15000, // 15 seconds
  LONG: 30000 // 30 seconds
} as const

/**
 * Validation rules
 */
export const VALIDATION = {
  DRAWING_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100
  },
  FOLDER_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50
  },
  EMAIL: {
    MAX_LENGTH: 255
  }
} as const

/**
 * Storage limits
 */
export const STORAGE = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TOTAL_SIZE: 100 * 1024 * 1024 // 100MB
} as const

/**
 * Retry configuration
 */
export const RETRY = {
  MAX_ATTEMPTS: 3,
  DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2
} as const

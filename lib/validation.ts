/**
 * Input validation and sanitization utilities
 */

import { VALIDATION } from "./constants"

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets to prevent XSS
    .replace(/\0/g, "") // Remove null bytes
}

/**
 * Validates and sanitizes a drawing name
 */
export function validateDrawingName(name: string): {
  valid: boolean
  sanitized: string
  error?: string
} {
  const sanitized = sanitizeString(name)

  if (sanitized.length < VALIDATION.DRAWING_NAME.MIN_LENGTH) {
    return {
      valid: false,
      sanitized,
      error: `Drawing name must be at least ${VALIDATION.DRAWING_NAME.MIN_LENGTH} character(s)`
    }
  }

  if (sanitized.length > VALIDATION.DRAWING_NAME.MAX_LENGTH) {
    return {
      valid: false,
      sanitized,
      error: `Drawing name must be at most ${VALIDATION.DRAWING_NAME.MAX_LENGTH} characters`
    }
  }

  return { valid: true, sanitized }
}

/**
 * Validates and sanitizes a folder name
 */
export function validateFolderName(name: string): {
  valid: boolean
  sanitized: string
  error?: string
} {
  const sanitized = sanitizeString(name)

  if (sanitized.length < VALIDATION.FOLDER_NAME.MIN_LENGTH) {
    return {
      valid: false,
      sanitized,
      error: `Folder name must be at least ${VALIDATION.FOLDER_NAME.MIN_LENGTH} character(s)`
    }
  }

  if (sanitized.length > VALIDATION.FOLDER_NAME.MAX_LENGTH) {
    return {
      valid: false,
      sanitized,
      error: `Folder name must be at most ${VALIDATION.FOLDER_NAME.MAX_LENGTH} characters`
    }
  }

  return { valid: true, sanitized }
}

/**
 * Validates an email address format
 */
export function validateEmail(email: string): {
  valid: boolean
  sanitized: string
  error?: string
} {
  const sanitized = email.trim().toLowerCase()

  if (sanitized.length > VALIDATION.EMAIL.MAX_LENGTH) {
    return {
      valid: false,
      sanitized,
      error: `Email must be at most ${VALIDATION.EMAIL.MAX_LENGTH} characters`
    }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      error: "Please enter a valid email address"
    }
  }

  return { valid: true, sanitized }
}

/**
 * Sanitizes HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "")
}

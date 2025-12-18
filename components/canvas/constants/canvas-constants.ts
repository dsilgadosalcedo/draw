/**
 * Canvas-related constants
 */

/**
 * Fade transition duration in milliseconds
 */
export const FADE_DURATION_MS = 500

/**
 * Auto-save debounce delay in milliseconds
 */
export const AUTO_SAVE_DEBOUNCE_MS = 1000

/**
 * Name save debounce delay in milliseconds
 */
export const NAME_SAVE_DEBOUNCE_MS = 600

/**
 * Z-index values for canvas layers
 */
export const Z_INDEX = {
  BEHIND: 10,
  FRONT: 20,
  NAME_BADGE: 30
} as const

/**
 * Default canvas theme
 */
export const DEFAULT_CANVAS_THEME: "light" | "dark" = "dark"

/**
 * Theme color values
 */
export const THEME_COLORS = {
  LIGHT_TEXT: "#1B1B1F",
  DARK_TEXT: "#E3E3E8"
} as const

import { type AuthFlow } from "../types"

export function getUserFriendlyError(error: unknown, flow: AuthFlow): string {
  // Try to extract error message from various possible formats
  let errorMessage = ""

  if (error instanceof Error) {
    errorMessage = error.message
    // Check if error has a data property (common in Convex errors)
    if ("data" in error && typeof error.data === "string") {
      errorMessage = error.data
    }
    // Check if error has a cause property
    if (error.cause instanceof Error) {
      errorMessage = error.cause.message
    }
  } else if (typeof error === "object" && error !== null) {
    // Handle Convex error objects
    if ("message" in error && typeof error.message === "string") {
      errorMessage = error.message
    }
    if ("data" in error && typeof error.data === "string") {
      errorMessage = error.data
    }
    // Convert to string as fallback
    errorMessage = String(error)
  } else {
    errorMessage = String(error)
  }

  // Normalize error message for case-insensitive matching
  const normalizedMessage = errorMessage.toLowerCase()

  // Check for specific error patterns
  if (
    normalizedMessage.includes("invalidaccountid") ||
    normalizedMessage.includes("invalid account id")
  ) {
    return flow === "signIn"
      ? "Invalid username or password. Please check your credentials and try again."
      : "An account with this username already exists. Please sign in instead."
  }

  if (
    normalizedMessage.includes("invalid credentials") ||
    normalizedMessage.includes("invalid email") ||
    normalizedMessage.includes("invalid password")
  ) {
    return "Invalid username or password. Please check your credentials and try again."
  }

  if (
    normalizedMessage.includes("user already exists") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("account already exists")
  ) {
    return "An account with this username already exists. Please sign in instead."
  }

  if (
    normalizedMessage.includes("user not found") ||
    normalizedMessage.includes("not found") ||
    normalizedMessage.includes("account not found")
  ) {
    return flow === "signIn"
      ? "No account found with this username. Please sign up first."
      : "An error occurred. Please try again."
  }

  if (
    (normalizedMessage.includes("password") &&
      normalizedMessage.includes("incorrect")) ||
    normalizedMessage.includes("wrong password")
  ) {
    return "Incorrect password. Please try again."
  }

  if (normalizedMessage.includes("email")) {
    return "Please enter a valid username."
  }

  // Generic fallback
  return "An error occurred during authentication. Please try again."
}

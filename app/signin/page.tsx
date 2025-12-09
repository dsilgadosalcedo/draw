"use client"

import { useAuthActions } from "@convex-dev/auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function getUserFriendlyError(
  error: unknown,
  flow: "signIn" | "signUp"
): string {
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

export default function SignIn() {
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background image with format fallback */}
      <picture className="absolute inset-0 w-full h-full">
        <source srcSet="/golden-ratio.avif" type="image/avif" />
        <img
          src="/golden-ratio.jpg"
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
      </picture>
      {/* Optional overlay for better readability */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
      {/* Content */}
      <div className="relative grid place-items-center z-10 w-full max-w-lg mx-auto h-full justify-center items-center px-4">
        <div className="backdrop-blur-sm flex flex-col max-w-100 min-w-100 gap-8 p-8 rounded-4xl bg-white/30 shadow-2xl">
          <div className="text-center flex flex-col items-center gap-4">
            <Image src="/app.svg" alt="App Logo" width={90} height={90} />
          </div>
          <form
            className="flex flex-col gap-4 w-full"
            onSubmit={async (e) => {
              e.preventDefault()
              setLoading(true)
              setError(null)
              const formData = new FormData(e.target as HTMLFormElement)
              formData.set("flow", flow)
              try {
                await signIn("password", formData)
                // Redirect to home, which will auto-redirect to latest drawing
                router.push("/")
              } catch (error) {
                console.error("Authentication error:", error)
                setError(getUserFriendlyError(error, flow))
                setLoading(false)
              }
            }}
          >
            <Input
              type="text"
              name="email"
              placeholder="Username"
              required
              className="px-5 py-6 text-lg rounded-2xl"
            />
            <div className="flex flex-col gap-1">
              <Input
                type="password"
                name="password"
                placeholder="Password"
                minLength={8}
                required
                className="px-5 py-6 text-lg rounded-2xl"
              />
              {flow === "signUp" && (
                <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
                  Password must be at least 8 characters
                </p>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="default"
              className="w-full rounded-lg"
            >
              {loading
                ? "Loading..."
                : flow === "signIn"
                  ? "Sign in"
                  : "Sign up"}
            </Button>
            <div className="flex flex-row gap-2 text-sm justify-center">
              <span className="text-slate-600 dark:text-slate-400">
                {flow === "signIn"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </span>
              <span
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium underline decoration-2 underline-offset-2 hover:no-underline cursor-pointer transition-colors"
                onClick={() => {
                  setFlow(flow === "signIn" ? "signUp" : "signIn")
                  setError(null)
                }}
              >
                {flow === "signIn" ? "Sign up" : "Sign in"}
              </span>
            </div>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 dark:border-rose-500/50 rounded-lg p-4">
                <p className="text-rose-700 dark:text-rose-300 font-medium text-sm">
                  {error}
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

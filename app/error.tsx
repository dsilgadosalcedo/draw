"use client"

import { useEffect } from "react"
import { reportError, getUserFriendlyMessage } from "@/lib/error-handling"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Next.js error page component
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Report error to tracking service
    reportError(error, {
      digest: error.digest
    })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full bg-destructive/10 border border-destructive/30 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-destructive mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          {getUserFriendlyMessage(error)}
        </p>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Go home
          </button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Error details
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

"use client"

interface ErrorMessageProps {
  error: string
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <div className="bg-rose-500/10 border border-rose-500/30 dark:border-rose-500/50 rounded-lg p-4">
      <p className="text-rose-700 dark:text-rose-300 font-medium text-sm">
        {error}
      </p>
    </div>
  )
}

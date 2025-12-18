"use client"

import { type AuthFlow } from "../types"

interface FlowToggleProps {
  flow: AuthFlow
  onToggle: () => void
}

export function FlowToggle({ flow, onToggle }: FlowToggleProps) {
  return (
    <div className="flex flex-row gap-2 text-sm justify-center">
      <span className="text-slate-600 dark:text-slate-400">
        {flow === "signIn"
          ? "Don't have an account?"
          : "Already have an account?"}
      </span>
      <span
        className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium hover:underline decoration-2 underline-offset-2 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        {flow === "signIn" ? "Sign up" : "Sign in"}
      </span>
    </div>
  )
}

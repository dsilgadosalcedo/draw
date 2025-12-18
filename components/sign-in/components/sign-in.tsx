"use client"

import Figures from "@/components/figures"
import { useSignInForm } from "../hooks/use-sign-in-form"
import { SignInHeader } from "./sign-in-header"
import { SignInForm } from "./sign-in-form"

export function SignIn() {
  const { flow, error, loading, handleSubmit, toggleFlow } = useSignInForm()

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Figures />
      {/* Content */}
      <div className="relative grid place-items-center z-10 w-full max-w-lg mx-auto h-full justify-center items-center px-4">
        <div className="backdrop-blur-sm flex flex-col max-w-100 min-w-100 gap-8 p-8 rounded-4xl bg shadow-2xl border bg-muted/30 shadow-muted/70">
          <SignInHeader />
          <SignInForm
            flow={flow}
            error={error}
            loading={loading}
            onSubmit={handleSubmit}
            onToggleFlow={toggleFlow}
          />
        </div>
      </div>
    </div>
  )
}

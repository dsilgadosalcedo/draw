"use client"

import { Button } from "@/components/ui/button"
import { Loader2Icon } from "lucide-react"
import { type AuthFlow } from "../types"
import { SignInFormFields } from "./sign-in-form-fields"
import { FlowToggle } from "./flow-toggle"
import { TermsAndPrivacy } from "./terms-and-privacy"
import { ErrorMessage } from "./error-message"

interface SignInFormProps {
  flow: AuthFlow
  error: string | null
  loading: boolean
  onSubmit: (formData: FormData) => void
  onToggleFlow: () => void
}

export function SignInForm({
  flow,
  error,
  loading,
  onSubmit,
  onToggleFlow
}: SignInFormProps) {
  return (
    <form
      className="flex flex-col gap-4 w-full"
      onSubmit={async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        onSubmit(formData)
      }}
    >
      <SignInFormFields flow={flow} />
      <Button
        type="submit"
        disabled={loading}
        variant="outline"
        className="w-full rounded-lg mt-2"
      >
        {loading ? (
          <>
            <Loader2Icon className="animate-spin" />
            Loading
          </>
        ) : flow === "signIn" ? (
          "Sign in"
        ) : (
          "Sign up"
        )}
      </Button>
      <FlowToggle flow={flow} onToggle={onToggleFlow} />
      <TermsAndPrivacy />
      {error && <ErrorMessage error={error} />}
    </form>
  )
}

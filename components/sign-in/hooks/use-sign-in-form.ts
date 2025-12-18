"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import { type AuthFlow } from "../types"
import { getUserFriendlyError } from "../utils/get-user-friendly-error"

export function useSignInForm() {
  const { signIn } = useAuthActions()
  const router = useRouter()
  const [flow, setFlow] = useState<AuthFlow>("signIn")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    formData.set("flow", flow)

    try {
      await signIn("password", formData)
      router.push("/")
    } catch (error) {
      console.error("Authentication error:", error)
      setError(getUserFriendlyError(error, flow))
      setLoading(false)
    }
  }

  const toggleFlow = () => {
    setFlow(flow === "signIn" ? "signUp" : "signIn")
    setError(null)
  }

  return {
    flow,
    error,
    loading,
    handleSubmit,
    toggleFlow
  }
}

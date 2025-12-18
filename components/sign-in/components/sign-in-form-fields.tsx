"use client"

import { Input } from "@/components/ui/input"
import { type AuthFlow } from "../types"
import { MIN_PASSWORD_LENGTH } from "../constants/sign-in-constants"

interface SignInFormFieldsProps {
  flow: AuthFlow
}

export function SignInFormFields({ flow }: SignInFormFieldsProps) {
  return (
    <>
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
          minLength={MIN_PASSWORD_LENGTH}
          required
          className="px-5 py-6 text-lg rounded-2xl"
        />
        {flow === "signUp" && (
          <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
            Password must be at least {MIN_PASSWORD_LENGTH} characters
          </p>
        )}
      </div>
    </>
  )
}
